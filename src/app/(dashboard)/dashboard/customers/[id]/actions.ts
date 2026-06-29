'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { processTransaction } from '@/modules/transactions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog, AuditEvent } from '@/lib/utils/audit';
import { sendBalanceReminder } from '@/modules/whatsapp/whatsapp.service';

export async function assignPointsAction(formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();

  const customerId  = formData.get('customer_id') as string;
  const programId   = formData.get('program_id')  as string;
  const deltaStr    = formData.get('points_delta') as string;
  const note        = (formData.get('note') as string | null)?.trim() || null;

  const points_delta = parseInt(deltaStr, 10);
  if (!customerId || !programId || isNaN(points_delta) || points_delta === 0) {
    return { error: 'Datos inválidos.' };
  }

  const type = points_delta > 0 ? 'earn' : 'adjustment';

  try {
    await processTransaction(tenantId, { customer_id: customerId, program_id: programId, type, points_delta, note });

    await auditLog({
      tenantId,
      eventType: type === 'earn' ? AuditEvent.TRANSACTION_EARN : AuditEvent.TRANSACTION_ADJUSTMENT,
      resourceType: 'customer',
      resourceId: customerId,
      metadata: { points_delta, program_id: programId, note },
    });

    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'La transacción falló.' };
  }
}

export async function toggleCustomerStatusAction(customerId: string, isActive: boolean) {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const { error } = await db
    .from('customers')
    .update({ is_active: isActive })
    .eq('id', customerId)
    .eq('tenant_id', tenantId);

  if (error) return { error: error.message };

  await auditLog({
    tenantId,
    eventType: isActive ? AuditEvent.CUSTOMER_REACTIVATED : AuditEvent.CUSTOMER_DEACTIVATED,
    resourceType: 'customer',
    resourceId: customerId,
    metadata: { is_active: isActive },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath('/dashboard/customers');
  return { success: true };
}

export async function toggleWhatsAppOptInAction(customerId: string, optIn: boolean) {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const { error } = await db
    .from('customers')
    .update({
      whatsapp_opt_in: optIn,
      whatsapp_opted_in_at: optIn ? new Date().toISOString() : null,
    } as never)
    .eq('id', customerId)
    .eq('tenant_id', tenantId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath('/dashboard/customers');
  return { success: true };
}

export async function addMissionProgressAction(customerId: string, challengeId: string) {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  // Fetch challenge
  const { data: challenge } = await (db as any)
    .from('challenges')
    .select('id, title, target, bonus_points, program_id, is_active, ends_at')
    .eq('id', challengeId)
    .eq('tenant_id', tenantId)
    .single() as { data: { id: string; title: string; target: number; bonus_points: number; program_id: string; is_active: boolean; ends_at: string | null } | null };

  if (!challenge || !challenge.is_active) return { error: 'Misión no disponible.' };

  const now = new Date().toISOString();
  if (challenge.ends_at && challenge.ends_at < now) return { error: 'La misión ya expiró.' };

  // Fetch existing progress
  const { data: existing } = await (db as any)
    .from('customer_challenge_progress')
    .select('id, progress, completed_at')
    .eq('customer_id', customerId)
    .eq('challenge_id', challengeId)
    .maybeSingle() as { data: { id: string; progress: number; completed_at: string | null } | null };

  if (existing?.completed_at) return { error: 'La misión ya fue completada.' };

  const newProgress = (existing?.progress ?? 0) + 1;

  if (existing) {
    await (db as any)
      .from('customer_challenge_progress')
      .update({ progress: newProgress })
      .eq('id', existing.id);
  } else {
    await (db as any)
      .from('customer_challenge_progress')
      .insert({ tenant_id: tenantId, customer_id: customerId, challenge_id: challengeId, progress: newProgress });
  }

  let completed = false;
  if (newProgress >= challenge.target) {
    await (db as any)
      .from('customer_challenge_progress')
      .update({ completed_at: now })
      .eq('customer_id', customerId)
      .eq('challenge_id', challengeId);

    await (db as any).rpc('rpc_earn_points', {
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

export async function sendBalanceReminderAction(customerId: string, programId: string) {
  const { tenantId, settings } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  // Get customer
  const { data: customer } = await (db
    .from('customers')
    .select('name, phone, whatsapp_opt_in')
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .single() as unknown as Promise<{ data: { name: string; phone: string | null; whatsapp_opt_in: boolean } | null }>);

  if (!customer) return { error: 'Cliente no encontrado.' };
  if (!customer.whatsapp_opt_in) return { error: 'El cliente no tiene WhatsApp activado.' };
  if (!customer.phone) return { error: 'El cliente no tiene teléfono registrado.' };

  // Get enrollment
  const { data: enrollment } = await db
    .from('customer_program_enrollments')
    .select('current_points')
    .eq('customer_id', customerId)
    .eq('program_id', programId)
    .single();

  if (!enrollment) return { error: 'El cliente no está inscrito en este programa.' };

  const typedEnrollment = enrollment as unknown as { current_points: number };

  // Get cheapest unreached reward for this program
  const { data: reward } = await (db
    .from('rewards')
    .select('name, points_required')
    .eq('program_id', programId)
    .eq('is_active', true)
    .gt('points_required', typedEnrollment.current_points)
    .order('points_required', { ascending: true })
    .limit(1)
    .single() as unknown as Promise<{ data: { name: string; points_required: number } | null }>);

  if (!reward) return { error: 'No hay recompensas disponibles para recordar.' };
  const pointsNeeded = reward.points_required - typedEnrollment.current_points;

  void sendBalanceReminder(
    customerId,
    tenantId,
    customer.name,
    settings.program_label ?? 'Fideliza',
    customer.phone,
    typedEnrollment.current_points,
    pointsNeeded,
    reward.name,
  );

  return { success: true };
}
