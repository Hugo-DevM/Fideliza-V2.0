'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { processTransaction } from '@/modules/transactions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog, AuditEvent } from '@/lib/utils/audit';

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
