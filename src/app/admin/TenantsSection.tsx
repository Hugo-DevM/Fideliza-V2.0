/**
 * Listado de negocios dados de alta — sección de /admin.
 *
 * Server component: carga sus propios datos y filtra en memoria. Los filtros
 * se aplican en JS y no en la consulta porque "sin clientes" depende de un
 * conteo que solo existe después de traer las filas, y partir el filtrado
 * entre base y memoria daría totales que no cuadran con la lista.
 */

import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getEffectivePlan } from '@/lib/config/plans';
import TenantHelpForm from './TenantHelpForm';

/** Tope de seguridad: el panel es una vista de operación, no un export. */
const TENANT_LIMIT = 500;

/**
 * Filas por página. Se traen las 500 y se pagina el render, no la consulta:
 * las métricas de arriba y el "sin clientes" se calculan sobre el total, así
 * que recortar en la base daría números distintos en cada página.
 */
const PAGE_SIZE = 25;

const TENANT_COLUMNS =
  'id, name, subdomain, email, plan, subscription_status, is_active, deleted_at, created_at';

const PLAN_LABELS: Record<string, string> = {
  free:       'Gratis',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  free:       'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  starter:    'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  pro:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active:   'activa',
  trialing: 'en prueba',
  past_due: 'pago vencido',
  canceled: 'cancelada',
  unpaid:   'sin pagar',
  incomplete: 'incompleta',
};

interface TenantRow {
  id:                  string;
  name:                string;
  subdomain:           string;
  email:               string;
  plan:                string;
  subscription_status: string | null;
  is_active:           boolean;
  deleted_at:          string | null;
  created_at:          string;
  customers?:          Array<{ count: number }> | null;
  reward_programs?:    Array<{ count: number }> | null;
  transactions?:       Array<{ created_at: string }> | null;
}

export interface TenantFilters {
  q:    string;
  plan: string;
  uso:  string;
  /** 1-indexada. El formulario de filtros no la envía, así que filtrar reinicia a 1. */
  page: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function relativeDays(iso: string): string {
  const d = daysAgo(iso);
  if (d <= 0) return 'hoy';
  if (d === 1) return 'ayer';
  return `hace ${d} d`;
}

export default async function TenantsSection({ filters }: { filters: TenantFilters }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // Conteos y última transacción vienen embebidos en la misma consulta —
  // hacerlos por negocio serían 3 viajes a la base por fila.
  const withUsage = await db
    .from('tenants')
    .select(`${TENANT_COLUMNS}, customers(count), reward_programs(count), transactions(created_at)`)
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: false, referencedTable: 'transactions' })
    .limit(1, { referencedTable: 'transactions' })
    .limit(TENANT_LIMIT) as { data: TenantRow[] | null; error: { message: string } | null };

  // Si el proyecto no admite agregados embebidos, la lista sigue siendo útil
  // sin las métricas de uso: mejor eso que una página rota.
  const usageAvailable = !withUsage.error;
  const rows = usageAvailable
    ? withUsage.data
    : ((await db
        .from('tenants')
        .select(TENANT_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(TENANT_LIMIT)) as { data: TenantRow[] | null }).data;

  const tenants = (rows ?? []).map((t) => ({
    ...t,
    effectivePlan: getEffectivePlan(t.plan, t.subscription_status),
    customerCount: t.customers?.[0]?.count ?? 0,
    programCount:  t.reward_programs?.[0]?.count ?? 0,
    lastActivity:  t.transactions?.[0]?.created_at ?? null,
  }));

  // ── Métricas (sobre cuentas vivas — las eliminadas no son clientela) ──
  const live      = tenants.filter((t) => !t.deleted_at);
  const last30    = live.filter((t) => daysAgo(t.created_at) <= 30).length;
  const byPlan    = live.reduce<Record<string, number>>((acc, t) => {
    acc[t.effectivePlan] = (acc[t.effectivePlan] ?? 0) + 1;
    return acc;
  }, {});
  const paying    = (byPlan.starter ?? 0) + (byPlan.pro ?? 0) + (byPlan.enterprise ?? 0);
  const sinUsar   = usageAvailable ? live.filter((t) => t.customerCount === 0).length : null;

  // ── Filtros ───────────────────────────────────────────────────────────
  const q = filters.q.toLowerCase();
  const filtered = tenants.filter((t) => {
    if (q && !(
      t.name.toLowerCase().includes(q) ||
      t.subdomain.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    )) return false;

    if (filters.plan !== 'todos' && t.effectivePlan !== filters.plan) return false;

    if (filters.uso === 'sin-clientes' && t.customerCount > 0) return false;
    if (filters.uso === 'activos'      && t.customerCount === 0) return false;
    if (filters.uso !== 'eliminados'   && t.deleted_at) return false;
    if (filters.uso === 'eliminados'   && !t.deleted_at) return false;

    return true;
  });

  // ── Paginación ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Se acota en vez de dar 404: cambiar de filtro estando en la página 7
  // dejaría la URL apuntando a una página que ya no existe.
  const page    = Math.min(Math.max(filters.page, 1), totalPages);
  const start   = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  /** Conserva los filtros al cambiar de página; omite lo que está en su valor por defecto. */
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (filters.q)              params.set('q', filters.q);
    if (filters.plan !== 'todos') params.set('plan', filters.plan);
    if (filters.uso  !== 'todos') params.set('uso',  filters.uso);
    if (n > 1)                    params.set('p',    String(n));
    const qs = params.toString();
    return qs ? `/admin?${qs}` : '/admin';
  };

  const inputClass =
    'rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400';

  return (
    <>
      {/* ── Métricas ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric value={live.length}      label="Negocios registrados" />
        <Metric value={last30}           label="Altas últimos 30 días" />
        <Metric value={paying}           label="Con plan de pago" accent />
        <Metric
          value={sinUsar ?? '—'}
          label="Sin ningún cliente"
          warn={typeof sinUsar === 'number' && sinUsar > 0}
        />
      </div>

      <section className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2538] space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Negocios</h2>
            <span className="text-xs text-gray-400">
              {totalPages > 1
                ? `${start + 1}–${start + visible.length} de ${filtered.length}`
                : `${filtered.length} ${filtered.length === 1 ? 'negocio' : 'negocios'}`}
              {filtered.length !== tenants.length && ` · ${tenants.length} en total`}
              {tenants.length >= TENANT_LIMIT && ` · tope ${TENANT_LIMIT}`}
            </span>
          </div>

          {/* GET puro: los filtros viven en la URL y funcionan sin JS */}
          <form method="get" action="/admin" className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Buscar nombre, subdominio o correo…"
              className={`${inputClass} min-w-[220px] flex-1`}
            />
            <select name="plan" defaultValue={filters.plan} className={inputClass}>
              <option value="todos">Todos los planes</option>
              <option value="free">Gratis</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select name="uso" defaultValue={filters.uso} className={inputClass}>
              <option value="todos">Todo el uso</option>
              <option value="sin-clientes">Sin clientes</option>
              <option value="activos">Con clientes</option>
              <option value="eliminados">Cuentas eliminadas</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Filtrar
            </button>
          </form>

          {!usageAvailable && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No se pudieron leer los conteos de uso; se muestran solo los datos de la cuenta.
            </p>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">
            {tenants.length === 0 ? 'Aún no hay negocios registrados.' : 'Ningún negocio coincide con el filtro.'}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1e2538]">
            {visible.map((t) => (
              <div key={t.id} className="px-6 py-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                      {t.name}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PLAN_COLORS[t.effectivePlan] ?? PLAN_COLORS.free}`}>
                        {PLAN_LABELS[t.effectivePlan] ?? t.effectivePlan}
                      </span>
                      {t.plan !== 'free' && t.effectivePlan === 'free' && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                          {PLAN_LABELS[t.plan] ?? t.plan} · {SUBSCRIPTION_LABELS[t.subscription_status ?? ''] ?? 'sin suscripción'}
                        </span>
                      )}
                      {t.deleted_at && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-600/30 dark:text-gray-300">
                          eliminada
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="text-indigo-500">{t.subdomain}</span> · {t.email}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-gray-400">Alta {formatDate(t.created_at)}</p>
                </div>

                {usageAvailable && (
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      <strong className="text-gray-900 dark:text-white">{t.customerCount}</strong> clientes
                    </span>
                    <span>
                      <strong className="text-gray-900 dark:text-white">{t.programCount}</strong> programas
                    </span>
                    <span>
                      Última actividad:{' '}
                      <strong className="text-gray-900 dark:text-white">
                        {t.lastActivity ? relativeDays(t.lastActivity) : 'nunca'}
                      </strong>
                    </span>
                    {t.customerCount === 0 && !t.deleted_at && (
                      <span className="text-amber-600 dark:text-amber-400">· se registró y no ha usado el sistema</span>
                    )}
                  </div>
                )}

                {!t.deleted_at && (
                  <TenantHelpForm tenantId={t.id} tenantName={t.name} tenantEmail={t.email} />
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 dark:border-[#1e2538] px-6 py-3">
            <PageLink href={pageHref(page - 1)} disabled={page === 1}>← Anteriores</PageLink>
            <span className="text-xs text-gray-400">Página {page} de {totalPages}</span>
            <PageLink href={pageHref(page + 1)} disabled={page === totalPages}>Siguientes →</PageLink>
          </div>
        )}
      </section>
    </>
  );
}

/** En el extremo se renderiza como <span>: un enlace muerto no debe ser enfocable. */
function PageLink({
  href, disabled, children,
}: {
  href:     string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const base = 'rounded-lg border px-3 py-1.5 text-xs font-semibold transition';

  if (disabled) {
    return (
      <span className={`${base} border-gray-100 dark:border-[#1e2538] text-gray-300 dark:text-gray-600`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} border-gray-200 dark:border-[#2a3147] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161b2e] hover:text-gray-900 dark:hover:text-white`}
    >
      {children}
    </Link>
  );
}

function Metric({
  value, label, accent = false, warn = false,
}: {
  value: number | string;
  label: string;
  accent?: boolean;
  warn?: boolean;
}) {
  const color = warn
    ? 'text-amber-600 dark:text-amber-400'
    : accent
      ? 'text-indigo-600 dark:text-indigo-400'
      : 'text-gray-900 dark:text-white';

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
