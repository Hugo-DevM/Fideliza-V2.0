import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { listCustomers } from '@/modules/customers';
import NewCustomerModal from './NewCustomerModal';
import CustomerSearchInput from './CustomerSearchInput';
import CopyCodeButton from './CopyCodeButton';

export const metadata = { title: 'Clientes — Fideliza+' };

const LIMIT = 10;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { tenantId, settings, planLimits, effectivePlan } = await getAuthenticatedTenant();
  const { page: pageStr, q, status } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  const statusFilter = status === 'active' ? 'active' : status === 'inactive' ? 'inactive' : 'all';

  const db = createServiceRoleClient();

  const [
    { customers: filtered, total },
    { count: activeCount },
  ] = await Promise.all([
    listCustomers(tenantId, page, LIMIT, q || undefined, statusFilter !== 'all' ? statusFilter : undefined),
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
  ]);

  const atCustomerLimit = planLimits.maxCustomers !== null && total >= planLimits.maxCustomers;
  const totalPages = Math.ceil(total / LIMIT);

  const planLabel =
    effectivePlan === 'free'       ? 'Plan Gratis'      :
    effectivePlan === 'starter'    ? 'Plan Starter'     :
    effectivePlan === 'pro'        ? 'Plan Pro'         :
    effectivePlan === 'enterprise' ? 'Plan Enterprise'  : 'Plan';

  const limitLabel = planLimits.maxCustomers !== null
    ? `máx. ${planLimits.maxCustomers}`
    : 'ilimitado';

  return (
    <div className="space-y-6">

      {/* Limit banner */}
      {atCustomerLimit && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Límite de clientes alcanzado ({total}/{planLimits.maxCustomers})
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Has llegado al máximo de tu plan actual. Actualiza para agregar más.
            </p>
          </div>
          <a href="/dashboard/settings"
            className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition">
            Actualizar plan
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            <UsersSmallIcon className="h-3.5 w-3.5" />
            Base de clientes
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total} registrados · {activeCount ?? 0} activos · {planLabel} ({limitLabel})
          </p>
        </div>
        {!atCustomerLimit && <div className="sm:shrink-0"><NewCustomerModal phonePrefix={settings.phone_prefix ?? null} plan={effectivePlan} /></div>}
      </div>

      {/* Search + filter */}
      <CustomerSearchInput defaultValue={q} defaultStatus={statusFilter} />

      {/* Empty state */}
      {!filtered.length && (
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#1e2438] mx-auto mb-3">
            <UsersSmallIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {q || statusFilter !== 'all'
              ? 'Sin clientes que coincidan con el filtro.'
              : 'Sin clientes aún. ¡Agrega el primero!'}
          </p>
        </div>
      )}

      {/* Mobile cards */}
      {!!filtered.length && (
        <div className="sm:hidden space-y-2">
          {filtered.map((c) => {
            const initials = c.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
            const color = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
            return (
              <Link
                key={c.id}
                href={`/dashboard/customers/${c.id}`}
                className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-4 py-3 shadow-sm active:bg-gray-50 dark:active:bg-[#1a1f35] transition block"
              >
                {/* Row 1: name + status */}
                <div className="flex items-center gap-3">
                  <p className="flex-1 font-semibold text-gray-900 dark:text-white leading-snug">{c.name}</p>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    c.is_active
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-[#1e2438] text-gray-500 dark:text-gray-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {/* Row 2: code + phone + date */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CopyCodeButton code={c.access_code} />
                  {c.phone && <span className="text-xs text-gray-500 dark:text-gray-400">{formatPhone(c.phone)}</span>}
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {new Date(c.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop table */}
      {!!filtered.length && (
        <div className="hidden sm:block rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1e2438]">
                  {['Cliente', 'Código', 'Teléfono', 'Estado', 'Registro', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                {filtered.map((c) => {
                  const initials = c.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                  const color = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
                  return (
                    <tr key={c.id} className="group hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                            {initials}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <CopyCodeButton code={c.access_code} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                        {c.phone ? formatPhone(c.phone) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          c.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-[#1e2438] text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-400'}`} />
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs">
                        {new Date(c.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/customers/${c.id}`}
                          className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition opacity-0 group-hover:opacity-100"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 dark:text-gray-500">
            Página {page} de {totalPages} · {total} clientes
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${q ? `&q=${q}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}
                className="rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${q ? `&q=${q}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}
                className="rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return phone;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500',   'bg-cyan-500',
];

// ── Icons ─────────────────────────────────────────────────────────

function UsersSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}
