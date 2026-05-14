import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ExportPanel from './ExportPanel';
import DailyChart from './DailyChart';

export const metadata = { title: 'Analíticas — Fideliza+' };

// ── Helpers ─────────────────────────────────────────────────────────────────

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function pct(num: number, denom: number): number {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 100);
}


function HBar({
  label,
  value,
  max,
  colorClass = 'bg-indigo-400',
  sublabel,
}: {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
  sublabel?: string;
}) {
  const w = Math.max(pct(value, max), value > 0 ? 2 : 0);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-gray-600 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className={`h-3 rounded-full ${colorClass}`} style={{ width: `${w}%` }} />
      </div>
      <span className="w-16 text-xs text-gray-500 tabular-nums">
        {value} {sublabel && <span className="text-gray-400">({sublabel})</span>}
      </span>
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent = 'text-indigo-600',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold sm:text-3xl ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const { tenantId, planLimits } = await getAuthenticatedTenant();

  if (!planLimits.analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="rounded-full bg-indigo-50 p-5">
          <svg className="h-10 w-10 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Analíticas — Plan Pro</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Obtén métricas de retención, frecuencia de visitas y clientes en riesgo. Disponible en el plan Pro.
        </p>
        <Link
          href="/dashboard/settings"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Actualizar a Pro →
        </Link>
      </div>
    );
  }

  const db = createServiceRoleClient();

  const now = new Date();
  const thirtyDaysAgo  = daysAgoIso(30);
  const fourteenDaysAgo = daysAgoIso(14);
  const sevenDaysAgo   = daysAgoIso(7);

  // ── Parallel queries ──────────────────────────────────────────────────────
  const [
    { data: last30Tx },
    { data: last14Tx },
    { count: activeCustomerCount },
    { data: allActiveCustomers },
    { count: pendingRedemptionCount },
    { count: totalRedemptionCount },
  ] = await Promise.all([
    // All transactions last 30d (for retention, frequency, top customers)
    db.from('transactions')
      .select('created_at, customer_id, type')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo),

    // Transactions last 14d (for daily activity chart)
    db.from('transactions')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', fourteenDaysAgo),

    // Total active customers
    db.from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),

    // Active customers with their name + last transaction for at-risk
    db.from('customers')
      .select('id, name, created_at')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),

    // Pending redemptions
    db.from('customer_reward_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending'),

    // Total redemptions
    db.from('customer_reward_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ]);

  // ── Compute metrics ───────────────────────────────────────────────────────

  const txList      = last30Tx ?? [];
  const tx14List    = last14Tx ?? [];
  const customers   = allActiveCustomers ?? [];

  // Unique customers who transacted in last 30d
  const activeInLast30 = new Set(txList.map((t) => t.customer_id));
  const retentionRate  = pct(activeInLast30.size, activeCustomerCount ?? 1);

  // Transactions last 7 days
  const sevenDaysAgoMs = Date.now() - 7 * 86_400_000;
  const txLast7 = txList.filter((t) => new Date(t.created_at).getTime() >= sevenDaysAgoMs).length;

  // ── Daily activity counts (last 14 days, keyed by UTC date) ─────────────
  // Range generation and local-date labelling happen client-side in DailyChart
  // so the user always sees their local date, not the server's UTC date.
  const dailyCounts: Record<string, number> = {};
  for (const t of tx14List) {
    const key = toDateKey(t.created_at); // "YYYY-MM-DD" UTC
    dailyCounts[key] = (dailyCounts[key] ?? 0) + 1;
  }

  // ── Visit frequency distribution (last 30d) ───────────────────────────────
  const visitCounts: Record<string, number> = {};
  for (const t of txList) {
    if (t.customer_id) visitCounts[t.customer_id] = (visitCounts[t.customer_id] ?? 0) + 1;
  }
  const freqBuckets = { '1 vez': 0, '2-5 veces': 0, '6-10 veces': 0, '11+ veces': 0 };
  for (const count of Object.values(visitCounts)) {
    if (count === 1)        freqBuckets['1 vez']++;
    else if (count <= 5)    freqBuckets['2-5 veces']++;
    else if (count <= 10)   freqBuckets['6-10 veces']++;
    else                    freqBuckets['11+ veces']++;
  }
  const maxFreq = Math.max(...Object.values(freqBuckets), 1);

  // ── Top 5 most active customers (last 30d) ────────────────────────────────
  const topCustomerIds = Object.entries(visitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));

  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  // ── At-risk customers (active, no transaction in last 30d) ───────────────
  // Fetch last transaction date per customer to show "X days ago"
  const { data: lastTxPerCustomer } = await db
    .from('transactions')
    .select('customer_id, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  const lastTxMap = new Map<string, string>();
  for (const t of lastTxPerCustomer ?? []) {
    if (!lastTxMap.has(t.customer_id)) lastTxMap.set(t.customer_id, t.created_at);
  }

  const atRisk = customers
    .filter((c) => !activeInLast30.has(c.id))
    .map((c) => {
      const lastTx = lastTxMap.get(c.id);
      const daysSince = lastTx
        ? Math.floor((Date.now() - new Date(lastTx).getTime()) / 86_400_000)
        : null;
      return { id: c.id, name: c.name, daysSince };
    })
    .sort((a, b) => {
      // Sort: customers with known last tx by days desc, then customers with no tx ever
      if (a.daysSince === null && b.daysSince === null) return 0;
      if (a.daysSince === null) return 1;
      if (b.daysSince === null) return -1;
      return b.daysSince - a.daysSince;
    })
    .slice(0, 5);

  const freqColors = ['bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700'];

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-gray-900">Analíticas</h1>
        <span className="text-sm font-semibold text-gray-400">{now.getFullYear()}</span>
      </div>

      {/* Export panel */}
      <ExportPanel />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Tasa de retención"
          value={`${retentionRate}%`}
          sub={`${activeInLast30.size} de ${activeCustomerCount ?? 0} clientes activos`}
          accent="text-indigo-600"
        />
        <KpiCard
          label="Clientes activos (30d)"
          value={activeInLast30.size}
          sub="Con al menos 1 transacción"
          accent="text-green-600"
        />
        <KpiCard
          label="Transacciones (7d)"
          value={txLast7}
          sub="Últimos 7 días"
          accent="text-blue-600"
        />
        <KpiCard
          label="Canjes pendientes"
          value={pendingRedemptionCount ?? 0}
          sub={`${totalRedemptionCount ?? 0} canjes en total`}
          accent="text-orange-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">

        {/* Daily activity chart */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Actividad diaria — últimas 2 semanas</h2>
          <DailyChart txCounts={dailyCounts} />
          {tx14List.length === 0 && (
            <p className="mt-3 text-center text-xs text-gray-400">Sin transacciones en este período</p>
          )}
        </div>

        {/* Frequency distribution */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Frecuencia de visitas (30d)</h2>
          <p className="text-xs text-gray-400 mb-4">¿Cuántas veces visitaron tus clientes activos?</p>
          <div className="space-y-3">
            {Object.entries(freqBuckets).map(([label, count], i) => (
              <HBar
                key={label}
                label={label}
                value={count}
                max={maxFreq}
                colorClass={freqColors[i]}
                sublabel={count > 0 ? `${pct(count, activeInLast30.size || 1)}%` : undefined}
              />
            ))}
          </div>
          {activeInLast30.size === 0 && (
            <p className="mt-4 text-center text-xs text-gray-400">Sin clientes activos en este período</p>
          )}
        </div>

        {/* Top 5 customers */}
        <div className="rounded-xl border bg-white shadow-sm self-start">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Top 5 clientes más activos</h2>
            <p className="text-xs text-gray-400">Por número de transacciones en 30 días</p>
          </div>
          {topCustomerIds.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Sin actividad en los últimos 30 días</p>
          ) : (
            <ul className="divide-y">
              {topCustomerIds.map(({ id, count }, idx) => (
                <li key={id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-5 shrink-0 text-sm font-bold text-gray-300">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {customerMap.get(id) ?? 'Cliente desconocido'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {count} tx
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* At-risk customers */}
        <div className="rounded-xl border bg-white shadow-sm self-start">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Clientes en riesgo</h2>
            <p className="text-xs text-gray-400">Sin actividad en los últimos 30 días</p>
          </div>
          {atRisk.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              Todos tus clientes activos han visitado en los últimos 30 días
            </p>
          ) : (
            <ul className="divide-y">
              {atRisk.map(({ id, name, daysSince }) => (
                <li key={id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    daysSince === null
                      ? 'bg-gray-100 text-gray-400'
                      : daysSince > 60
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600'
                  }`}>
                    {daysSince === null ? 'Sin visitas' : `${daysSince}d sin visitar`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {atRisk.length > 0 && (
            <p className="px-5 py-2 text-xs text-gray-400 border-t">
              Mostrando hasta 5 · {(activeCustomerCount ?? 0) - activeInLast30.size} clientes en riesgo en total
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
