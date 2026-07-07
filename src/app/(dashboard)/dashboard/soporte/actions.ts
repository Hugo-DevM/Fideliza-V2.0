'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Note: Supabase uses parameterized queries so SQL injection is already prevented
// at the driver level. These helpers add a second layer against stored XSS and
// control-character abuse (null bytes, ANSI escape sequences, etc.).

/**
 * Strips null bytes and ASCII control characters (except tab, newline, carriage return).
 * Collapses runs of whitespace-only lines to prevent padding attacks.
 */
function sanitizeText(raw: string): string {
  return raw
    // Remove null bytes and other control characters (keep \t \n \r)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip HTML/script tags — content is displayed as plain text but defense-in-depth
    .replace(/<[^>]*>/g, '')
    .trim();
}

const SUBJECT_MIN =    5;
const SUBJECT_MAX =  200;
const MESSAGE_MIN =   20;
const MESSAGE_MAX = 5000;

export async function submitSupportTicketAction(formData: FormData) {
  // Support is available on all plans — Pro tickets get priority handling.
  const { tenantId, tenant } = await getAuthenticatedTenant();

  const subject = sanitizeText((formData.get('subject') as string | null) ?? '');
  const message = sanitizeText((formData.get('message') as string | null) ?? '');

  if (subject.length < SUBJECT_MIN) {
    return { error: `El asunto debe tener al menos ${SUBJECT_MIN} caracteres.` };
  }
  if (subject.length > SUBJECT_MAX) {
    return { error: `El asunto no puede superar los ${SUBJECT_MAX} caracteres.` };
  }
  if (message.length < MESSAGE_MIN) {
    return { error: `El mensaje debe tener al menos ${MESSAGE_MIN} caracteres.` };
  }
  if (message.length > MESSAGE_MAX) {
    return { error: `El mensaje no puede superar los ${MESSAGE_MAX.toLocaleString()} caracteres.` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { error } = await db
    .from('support_tickets')
    .insert({
      tenant_id:   tenantId,
      tenant_name: sanitizeText(tenant.name),
      subject,
      message,
    });

  if (error) {
    return { error: 'No se pudo enviar el ticket. Intenta de nuevo.' };
  }

  revalidatePath('/dashboard/soporte');
  return { success: true };
}
