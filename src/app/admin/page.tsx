/**
 * Admin panel — /admin
 *
 * Only accessible to the email set in ADMIN_EMAIL env var.
 * Shows support tickets from all tenants (Pro first — priority support)
 * + pending bonus credits overview.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getEffectivePlan } from '@/lib/config/plans';
import TicketReplyForm from './TicketReplyForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Fideliza' };

const STATUS_LABELS: Record<string, string> = {
  open:        'Abierto',
  in_progress: 'En proceso',
  resolved:    'Resuelto',
};

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  resolved:    'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
};

export default async function AdminPage() {
  // ── Auth guard ────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect('/auth/login?next=/admin');
  }

  // ── Second factor: clave secreta ─────────────────────────────────────
  const jar = await cookies();
  const verified = jar.get('admin_verified')?.value;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || verified !== adminSecret) {
    redirect('/admin/verify');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // ── Tickets ───────────────────────────────────────────────────────────
  const { data: tickets } = await db
    .from('support_tickets')
    .select('id, tenant_id, tenant_name, subject, message, status, admin_reply, replied_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200) as {
      data: Array<{
        id: string;
        tenant_id: string;
        tenant_name: string;
        subject: string;
        message: string;
        status: string;
        admin_reply: string | null;
        replied_at: string | null;
        created_at: string;
      }> | null;
    };

  // ── Plan per tenant (Pro = soporte prioritario, se atiende primero) ───
  const tenantIds = [...new Set((tickets ?? []).map((t) => t.tenant_id))];
  const { data: tenantRows } = tenantIds.length > 0
    ? await db
        .from('tenants')
        .select('id, plan, subscription_status')
        .in('id', tenantIds) as {
          data: Array<{ id: string; plan: string; subscription_status: string | null }> | null;
        }
    : { data: [] };

  const planByTenant = new Map(
    (tenantRows ?? []).map((r) => [r.id, getEffectivePlan(r.plan, r.subscription_status)])
  );
  const isPriorityPlan = (p: string | undefined) => p === 'pro' || p === 'enterprise';

  // Priority tickets first, then newest first (list already comes date-desc)
  const sortedTickets = [...(tickets ?? [])].sort((a, b) => {
    const prioA = isPriorityPlan(planByTenant.get(a.tenant_id)) ? 1 : 0;
    const prioB = isPriorityPlan(planByTenant.get(b.tenant_id)) ? 1 : 0;
    return prioB - prioA;
  });

  const openTickets = tickets?.filter((t) => t.status !== 'resolved').length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#07090f] p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de administración</h1>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] p-4 w-fit">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{openTickets}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tickets abiertos</p>
        </div>

        {/* Tickets */}
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2538]">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tickets de soporte</h2>
          </div>

          {(tickets?.length ?? 0) === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Sin tickets.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#1e2538]">
              {sortedTickets.map((ticket) => {
                const plan = planByTenant.get(ticket.tenant_id) ?? 'free';
                const priority = isPriorityPlan(plan);
                return (
                <div key={ticket.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.subject}</p>
                      <p className="text-xs text-indigo-500">
                        {ticket.tenant_name}
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          priority
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400'
                        }`}>
                          {priority ? `${plan} · prioritario` : plan}
                        </span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[ticket.status] ?? ''}`}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ticket.message}</p>
                  {ticket.admin_reply && (
                    <p className="text-xs italic text-gray-400">Respuesta actual: {ticket.admin_reply}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(ticket.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <TicketReplyForm
                    ticketId={ticket.id}
                    currentStatus={ticket.status}
                    currentReply={ticket.admin_reply}
                  />
                </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
