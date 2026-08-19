'use server';

import { cookies } from 'next/headers';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth/admin-session';

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
