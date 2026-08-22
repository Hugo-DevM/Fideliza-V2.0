/**
 * Admin panel — /admin
 *
 * Only accessible to the email set in ADMIN_EMAIL env var.
 * Dos pestañas en una sola vista: negocios dados de alta (plan, uso y correo
 * de ayuda por negocio) y tickets de soporte.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdminPage } from './guard';
import AdminHeader from './AdminHeader';
import AdminTabs from './AdminTabs';
import TenantsSection from './TenantsSection';
import TicketsSection from './TicketsSection';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Fideliza' };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; uso?: string; p?: string; tab?: string }>;
}) {
  await requireAdminPage('/admin');

  const sp = await searchParams;
  const filters = {
    q:    (sp.q ?? '').trim().slice(0, 60),
    plan: sp.plan ?? 'todos',
    uso:  sp.uso  ?? 'todos',
    // NaN de un ?p=abc cae en 1; TenantsSection la acota al total de páginas.
    page: Math.max(1, Number.parseInt(sp.p ?? '1', 10) || 1),
  };

  // Conteo suelto para la insignia de la pestaña: TicketsSection carga la lista
  // completa, pero el número tiene que estar antes de decidir qué pestaña se ve.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { count } = await db
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'resolved') as { count: number | null };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#07090f] p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminHeader />

        {/* Los dos paneles se renderizan en el servidor y se pasan como slots;
            AdminTabs solo elige cuál se muestra. */}
        <AdminTabs
          initialTab={sp.tab ?? 'negocios'}
          openTickets={count ?? 0}
          negocios={<TenantsSection filters={filters} />}
          tickets={<TicketsSection />}
        />
      </div>
    </div>
  );
}
