import { redirect } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import TicketForm from './TicketForm';

export const metadata = { title: 'Soporte — Fideliza' };

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

export default async function SoportePage() {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();

  // Pro-only
  if (effectivePlan !== 'pro' && effectivePlan !== 'enterprise') {
    redirect('/dashboard/settings');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  const { data: tickets } = await db
    .from('support_tickets')
    .select('id, subject, message, status, admin_reply, replied_at, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50) as {
      data: Array<{
        id: string;
        subject: string;
        message: string;
        status: string;
        admin_reply: string | null;
        replied_at: string | null;
        created_at: string;
      }> | null;
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Soporte prioritario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Envíanos un mensaje y te responderemos directamente.
        </p>
      </div>

      {/* Submit form */}
      <section className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nuevo ticket</h2>
        <TicketForm />
      </section>

      {/* Ticket history */}
      {(tickets?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2538]">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Historial de tickets</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#1e2538]">
            {tickets!.map((ticket) => (
              <div key={ticket.id} className="px-6 py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[ticket.status] ?? ''}`}>
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{ticket.message}</p>
                {ticket.admin_reply && (
                  <div className="mt-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-3 space-y-1">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Respuesta del equipo Fideliza</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.admin_reply}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
