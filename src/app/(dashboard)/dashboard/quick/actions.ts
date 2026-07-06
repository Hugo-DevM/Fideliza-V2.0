'use server';

import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { processTransaction } from '@/modules/transactions';
import { auditLog, AuditEvent } from '@/lib/utils/audit';
import { revalidatePath } from 'next/cache';
import type { RewardProgram, CustomerProgramEnrollment } from '@/lib/types';

export interface QuickProgram {
  id: string;
  name: string;
  type: RewardProgram['type'];
  config: Record<string, unknown>;
  // balance from enrollment (null if not yet enrolled)
  current_points:  number | null;
  lifetime_points: number | null;
  stamp_count:     number | null;
  visit_count:     number | null;
}

export interface QuickMission {
  challengeId:  string;
  title:        string;
  description:  string | null;
  target:       number;
  bonusPoints:  number;
  programType:  string;
  progress:     number;
  completedAt:  string | null;
  endsAt:       string | null;
}

export interface QuickCustomer {
  id: string;
  name: string;
  access_code: string;
  phone: string | null;
  programs: QuickProgram[];
  missions: QuickMission[];
}

export async function lookupCustomerAction(query: string): Promise<
  { customer: QuickCustomer } | { error: string }
> {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const q = query.trim().toUpperCase();

  type CustomerRow = { id: string; name: string; access_code: string; phone: string | null };

  // Try access code first, then phone
  let customerData: CustomerRow | null = null;

  const { data: byCode } = await db
    .from('customers')
    .select('id, name, access_code, phone')
    .eq('tenant_id', tenantId)
    .eq('access_code', q)
    .eq('is_active', true)
    .single();

  if (byCode) {
    customerData = byCode as unknown as CustomerRow;
  } else {
    const { data: byPhone } = await db
      .from('customers')
      .select('id, name, access_code, phone')
      .eq('tenant_id', tenantId)
      .eq('phone', query.trim())
      .eq('is_active', true)
      .single();

    if (byPhone) customerData = byPhone as unknown as CustomerRow;
  }

  if (!customerData) {
    return { error: 'Cliente no encontrado. Revisa el código de acceso o teléfono.' };
  }

  const now = new Date().toISOString();

  // All active tenant programs + enrollments + missions in parallel
  const [{ data: programRows }, { data: enrollRows }, { data: missionRows }] = await Promise.all([
    db.from('reward_programs').select('id, name, type, config').eq('tenant_id', tenantId).eq('status', 'active').order('name'),
    db.from('customer_program_enrollments').select('program_id, current_points, lifetime_points, stamp_count, visit_count').eq('tenant_id', tenantId).eq('customer_id', customerData.id),
    db
      .from('challenges')
      .select(`id, title, description, target, bonus_points, ends_at,
        reward_programs!inner(type),
        customer_challenge_progress!left(progress, completed_at, customer_id)`)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .or(`ends_at.is.null,ends_at.gte.${now}`) as unknown as Promise<{ data: Array<{
        id: string; title: string; description: string | null;
        target: number; bonus_points: number; ends_at: string | null;
        reward_programs: { type: string };
        customer_challenge_progress: Array<{ progress: number; completed_at: string | null; customer_id: string }>;
      }> | null }>,
  ]);

  type EnrollRow = Pick<CustomerProgramEnrollment, 'program_id' | 'current_points' | 'lifetime_points' | 'stamp_count' | 'visit_count'>;
  const enrollMap = new Map<string, EnrollRow>();
  for (const e of ((enrollRows ?? []) as unknown as EnrollRow[])) {
    enrollMap.set(e.program_id, e);
  }

  const programs: QuickProgram[] = ((programRows ?? []) as unknown as Pick<RewardProgram, 'id' | 'name' | 'type' | 'config'>[])
    .map((p) => {
      const enroll = enrollMap.get(p.id);
      return {
        id:             p.id,
        name:           p.name,
        type:           p.type,
        config:         (p.config as unknown as Record<string, unknown>) ?? {},
        current_points:  enroll?.current_points  ?? null,
        lifetime_points: enroll?.lifetime_points ?? null,
        stamp_count:     enroll?.stamp_count     ?? null,
        visit_count:     enroll?.visit_count     ?? null,
      };
    });

  const missions: QuickMission[] = (missionRows ?? []).map((c) => {
    const prog = c.customer_challenge_progress?.find((p) => p.customer_id === customerData!.id);
    return {
      challengeId: c.id,
      title:       c.title,
      description: c.description,
      target:      c.target,
      bonusPoints: c.bonus_points,
      programType: c.reward_programs?.type ?? 'points',
      endsAt:      c.ends_at,
      progress:    prog?.progress ?? 0,
      completedAt: prog?.completed_at ?? null,
    };
  });

  return {
    customer: {
      id:          customerData.id,
      name:        customerData.name,
      access_code: customerData.access_code,
      phone:       customerData.phone,
      programs,
      missions,
    },
  };
}

export async function quickMissionProgressAction(
  customerId: string,
  challengeId: string,
): Promise<{ success: true; progress: number; target: number; completed: boolean } | { error: string }> {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const { data: challenge } = await db
    .from('challenges')
    .select('id, title, target, bonus_points, program_id, ends_at')
    .eq('id', challengeId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (!challenge) return { error: 'Misión no disponible.' };

  const now = new Date().toISOString();
  if (challenge.ends_at && challenge.ends_at < now) return { error: 'La misión ya expiró.' };

  const { data: existing } = await db
    .from('customer_challenge_progress')
    .select('id, progress, completed_at')
    .eq('customer_id', customerId)
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (existing?.completed_at) return { error: 'La misión ya fue completada.' };

  const newProgress = (existing?.progress ?? 0) + 1;

  if (existing) {
    await db.from('customer_challenge_progress').update({ progress: newProgress }).eq('id', existing.id);
  } else {
    await db.from('customer_challenge_progress').insert({ tenant_id: tenantId, customer_id: customerId, challenge_id: challengeId, progress: newProgress });
  }

  let completed = false;
  if (newProgress >= challenge.target) {
    await db.from('customer_challenge_progress').update({ completed_at: now }).eq('customer_id', customerId).eq('challenge_id', challengeId);
    await db.rpc('rpc_earn_points', {
      p_tenant_id:    tenantId,
      p_customer_id:  customerId,
      p_program_id:   challenge.program_id,
      p_points_delta: challenge.bonus_points,
      p_note:         `Misión completada: ${challenge.title}`,
    });
    completed = true;
  }

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true, progress: newProgress, target: challenge.target, completed };
}

export async function quickTransactionAction(formData: FormData): Promise<
  { success: true; delta: number } | { error: string }
> {
  const { tenantId } = await getAuthenticatedTenant();

  const customerId      = formData.get('customer_id')    as string;
  const programId       = formData.get('program_id')     as string;
  const deltaStr        = formData.get('points_delta')   as string;
  const purchaseAmtStr  = formData.get('purchase_amount') as string | null;
  const currencyCode    = formData.get('currency')        as string | null;

  const points_delta = parseInt(deltaStr, 10);
  if (!customerId || !programId || isNaN(points_delta) || points_delta === 0) {
    return { error: 'Ingresa una cantidad válida' };
  }

  // Build note for cashback: "150.00 MXN"
  let note: string | null = null;
  if (purchaseAmtStr && currencyCode) {
    const amount = parseFloat(purchaseAmtStr);
    if (amount > 0) note = `${amount.toFixed(2)} ${currencyCode}`;
  }

  try {
    await processTransaction(tenantId, {
      customer_id: customerId,
      program_id:  programId,
      type:        'earn',
      points_delta,
      note,
    });

    await auditLog({
      tenantId,
      eventType:    AuditEvent.TRANSACTION_EARN,
      resourceType: 'customer',
      resourceId:   customerId,
      metadata:     { points_delta, program_id: programId, source: 'quick_register' },
    });

    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath('/dashboard');
    return { success: true, delta: points_delta };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'La transacción falló.' };
  }
}
