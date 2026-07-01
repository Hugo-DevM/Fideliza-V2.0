'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';

export async function submitSupportTicketAction(formData: FormData) {
  const { tenantId, tenant, effectivePlan } = await getAuthenticatedTenant();

  if (!getPlanLimits(effectivePlan).prioritySupport) {
    return { error: 'El soporte prioritario está disponible en el plan Pro.' };
  }

  const subject = (formData.get('subject') as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';

  if (!subject || subject.length < 5) {
    return { error: 'El asunto debe tener al menos 5 caracteres.' };
  }
  if (!message || message.length < 20) {
    return { error: 'El mensaje debe tener al menos 20 caracteres.' };
  }
  if (subject.length > 200) {
    return { error: 'El asunto no puede superar los 200 caracteres.' };
  }
  if (message.length > 5000) {
    return { error: 'El mensaje no puede superar los 5,000 caracteres.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { error } = await db
    .from('support_tickets')
    .insert({
      tenant_id:   tenantId,
      tenant_name: tenant.name,
      subject,
      message,
    });

  if (error) {
    return { error: 'No se pudo enviar el ticket. Intenta de nuevo.' };
  }

  revalidatePath('/dashboard/soporte');
  return { success: true };
}
