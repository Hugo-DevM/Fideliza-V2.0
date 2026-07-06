import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { listCustomers } from '@/modules/customers';
import NewCustomerModal from './NewCustomerModal';
import CustomerSearchInput from './CustomerSearchInput';
import CopyCodeButton from './CopyCodeButton';
import PromotionBlastButton from './PromotionBlastButton';
import { TIER_STYLES } from '@/lib/utils/tiers';

export const metadata = { title: 'Clientes — Fideliza+' };

const LIMIT = 10;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; tier?: string }>;
}) {
  const { tenantId, settings, planLimits, effectivePlan } = await getAuthenticatedTenant();
  const { page: pageStr, q, status, tier: tierParam } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  const statusFilter = status === 'active' ? 'active' : status === 'inactive' ? 'inactive' : 'all';
  const hasTiers = planLimits.universalTiers;
  const tierFilter = hasTiers && (tierParam === 'bronze' || tierParam === 'silver' || tierParam === 'gold')
    ? tierParam
    : undefined;

  const db = createServiceRoleClient();

  const [
    { customers: filtered, total },
    { count: activeCount },
  ] = await Promise.all([
    listCustomers(tenantId, page, LIMIT, q || undefined, statusFilter !== 'all' ? statusFilter : undefined, tierFilter),
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
  ]);

  // Fetch tier from the universal loyalty score cache on customers (Starter+)
  type TierRow = { id: string; tier_label: string; tier_color: string };
  const tierMap = new Map<string, { tier_label: string; tier_color: string }>();
  if (hasTiers && filtered.length > 0) {
    const customerIds = filtered.map((c) => c.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tierRows } = await (db.from('customers') as any)
      .select('id, tier_label, tier_color')
      .eq('tenant_id', tenantId)
      .in('id', customerIds)
      .not('tier_color', 'is', null) as { data: TierRow[] | null };

    for (const row of (tierRows ?? [])) {
      tierMap.set(row.id, { tier_label: row.tier_label, tier_color: row.tier_color });
    }
  }

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
        <div className="flex items-center gap-2 sm:shrink-0">
          {effectivePlan !== 'free' && <PromotionBlastButton />}
          {!atCustomerLimit && <NewCustomerModal phonePrefix={settings.phone_prefix ?? null} plan={effectivePlan} />}
        </div>
      </div>

      {/* Search + filter */}
      <CustomerSearchInput
        defaultValue={q}
        defaultStatus={statusFilter}
        defaultTier={(tierFilter ?? 'all') as 'all' | 'bronze' | 'silver' | 'gold'}
        showTierFilter={hasTiers}
      />

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
            const customerTier = tierMap.get(c.id);
            return (
              <Link
                key={c.id}
                href={`/dashboard/customers/${c.id}`}
                className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-4 py-3 shadow-sm active:bg-gray-50 dark:active:bg-[#1a1f35] transition block"
              >
                {/* Row 1: name + tier + status */}
                <div className="flex items-center gap-3">
                  <p className="flex-1 font-semibold text-gray-900 dark:text-white leading-snug">{c.name}</p>
                  {customerTier && (() => {
                    const s = TIER_STYLES[customerTier.tier_color] ?? TIER_STYLES.bronze;
                    const emoji = customerTier.tier_color === 'gold' ? '🥇' : customerTier.tier_color === 'silver' ? '🥈' : '🥉';
                    return (
                      <span className={`shrink-0 inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${s.bg} ${s.border} ${s.text}`}>
                        {emoji} {customerTier.tier_label}
                      </span>
                    );
                  })()}
                  {c.whatsapp_opt_in && (
                    <span title="WhatsApp activo">
                      <WhatsAppSmallIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    </span>
                  )}
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
                  const customerTier = tierMap.get(c.id);
                  return (
                    <tr key={c.id} className="group hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                            {initials}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
                          {customerTier && (() => {
                            const s = TIER_STYLES[customerTier.tier_color] ?? TIER_STYLES.bronze;
                            const emoji = customerTier.tier_color === 'gold' ? '🥇' : customerTier.tier_color === 'silver' ? '🥈' : '🥉';
                            return (
                              <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${s.bg} ${s.border} ${s.text}`}>
                                {emoji} {customerTier.tier_label}
                              </span>
                            );
                          })()}
                          {c.whatsapp_opt_in && <WhatsAppSmallIcon className="h-3.5 w-3.5 text-green-500 shrink-0" title="WhatsApp activo" />}
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
                href={`?page=${page - 1}${q ? `&q=${q}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}${tierFilter ? `&tier=${tierFilter}` : ''}`}
                className="rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${q ? `&q=${q}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}${tierFilter ? `&tier=${tierFilter}` : ''}`}
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

function WhatsAppSmallIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-label={title}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
