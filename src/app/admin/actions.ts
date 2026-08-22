'use server';

import { cookies } from 'next/headers';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth/admin-session';
import { sendAdminHelpEmail } from '@/lib/email/resend';

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    throw new Error('Unauthorized');
  }

  // Server Actions are directly invocable, so the second factor has to be
  // enforced here too — checking it only in /admin/page.tsx would make it a
  // UI gate that any POST to this action bypasses.
  const jar = await cookies();
  if (!verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value, process.env.ADMIN_SECRET)) {
    throw new Error('Unauthorized');
  }
}

export async function updateTicketAction(formData: FormData) {
  await verifyAdmin();

  const ticketId   = (formData.get('ticket_id')   as string | null)?.trim() ?? '';
  const status     = (formData.get('status')       as string | null)?.trim() ?? '';
  const adminReply = (formData.get('admin_reply')  as string | null)?.trim() || null;

  if (!ticketId || !['open', 'in_progress', 'resolved'].includes(status)) {
    return { error: 'Datos inválidos.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { error } = await db
    .from('support_tickets')
    .update({
      status,
      admin_reply: adminReply,
      replied_at:  adminReply ? new Date().toISOString() : null,
    })
    .eq('id', ticketId);

  if (error) return { error: 'No se pudo actualizar el ticket.' };
  return { success: true };
}

const SUBJECT_MAX = 150;
const MESSAGE_MAX = 4000;

/**
 * Envía un correo de ayuda a un negocio desde el panel.
 *
 * El destinatario NO viaja en el formulario: llega solo el tenant_id y el
 * correo se lee de la base. Aceptar una dirección desde el cliente convertiría
 * esta acción en un relay de correo con el dominio verificado de Fideliza.
 */
export async function sendHelpEmailAction(formData: FormData) {
  await verifyAdmin();

  const tenantId = (formData.get('tenant_id') as string | null)?.trim() ?? '';
  const subject  = (formData.get('subject')   as string | null)?.trim() ?? '';
  const message  = (formData.get('message')   as string | null)?.trim() ?? '';

  if (!tenantId) return { error: 'Negocio no válido.' };
  if (subject.length < 3 || subject.length > SUBJECT_MAX) {
    return { error: `El asunto debe tener entre 3 y ${SUBJECT_MAX} caracteres.` };
  }
  if (message.length < 10 || message.length > MESSAGE_MAX) {
    return { error: `El mensaje debe tener entre 10 y ${MESSAGE_MAX} caracteres.` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { data: tenant } = await db
    .from('tenants')
    .select('name, email')
    .eq('id', tenantId)
    .maybeSingle() as { data: { name: string; email: string } | null };

  if (!tenant) return { error: 'No se encontró el negocio.' };

  try {
    await sendAdminHelpEmail(tenant.email, tenant.name, subject, message);
  } catch (err) {
    console.error('[admin] Failed to send help email:', err);
    return { error: 'No se pudo enviar el correo. Revisa la configuración de Resend.' };
  }

  return { success: true, sentTo: tenant.email };
}
