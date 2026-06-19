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

  // Get cheapest unreached reward for this program
  const { data: reward } = await db
    .from('rewards')
    .select('name, points_required')
    .eq('program_id', programId)
    .eq('is_active', true)
    .gt('points_required', enrollment.current_points)
    .order('points_required', { ascending: true })
    .limit(1)
    .single();

  if (!reward) return { error: 'No hay recompensas disponibles para recordar.' };

  const pointsNeeded = reward.points_required - enrollment.current_points;

  void sendBalanceReminder(
    customerId,
    tenantId,
    customer.name,
    settings.program_label ?? 'Fideliza',
    customer.phone,
    enrollment.current_points,
    pointsNeeded,
    reward.name,
  );

  return { success: true };
}
