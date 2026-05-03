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
  // balance from enrollment (null if not yet enrolled)
  current_points: number | null;
  stamp_count: number | null;
  visit_count: number | null;
}

export interface QuickCustomer {
  id: string;
  name: string;
  access_code: string;
  phone: string | null;
  programs: QuickProgram[];
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

  // All active tenant programs
  const { data: programRows } = await db
    .from('reward_programs')
    .select('id, name, type')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('name');

  // Customer enrollments (balance per program)
  const { data: enrollRows } = await db
    .from('customer_program_enrollments')
    .select('program_id, current_points, stamp_count, visit_count')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerData.id);

  type EnrollRow = Pick<CustomerProgramEnrollment, 'program_id' | 'current_points' | 'stamp_count' | 'visit_count'>;
  const enrollMap = new Map<string, EnrollRow>();
  for (const e of ((enrollRows ?? []) as unknown as EnrollRow[])) {
    enrollMap.set(e.program_id, e);
  }

  const programs: QuickProgram[] = ((programRows ?? []) as unknown as Pick<RewardProgram, 'id' | 'name' | 'type'>[])
    .map((p) => {
      const enroll = enrollMap.get(p.id);
      return {
        id:             p.id,
        name:           p.name,
        type:           p.type,
        current_points: enroll?.current_points ?? null,
        stamp_count:    enroll?.stamp_count    ?? null,
        visit_count:    enroll?.visit_count    ?? null,
      };
    });

  return {
    customer: {
      id:          customerData.id,
      name:        customerData.name,
      access_code: customerData.access_code,
      phone:       customerData.phone,
      programs,
    },
  };
}

export async function quickTransactionAction(formData: FormData): Promise<
  { success: true; delta: number } | { error: string }
> {
  const { tenantId } = await getAuthenticatedTenant();

  const customerId   = formData.get('customer_id') as string;
  const programId    = formData.get('program_id')  as string;
  const deltaStr     = formData.get('points_delta') as string;

  const points_delta = parseInt(deltaStr, 10);
  if (!customerId || !programId || isNaN(points_delta) || points_delta === 0) {
    return { error: 'Ingresa una cantidad válida' };
  }

  try {
    await processTransaction(tenantId, {
      customer_id: customerId,
      program_id:  programId,
      type:        'earn',
      points_delta,
      note:        null,
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
    return { error: err instanceof Error ? err.message : 'Transaction failed' };
  }
}
