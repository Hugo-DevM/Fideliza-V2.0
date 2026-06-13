import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ExportPanel from './ExportPanel';
import PeriodSelector from './PeriodSelector';

export const metadata = { title: 'Analíticas — Fideliza+' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
function pct(num: number, denom: number) {
  return denom === 0 ? 0 : Math.round((num / denom) * 100);
}
function trendLabel(curr: number, prev: number) {
  if (prev === 0) return null;
  const diff = curr - prev;
  const p = Math.round(Math.abs(diff / prev) * 100);
  return { up: diff >= 0, label: `${diff >= 0 ? '+' : '-'}${p}%` };
}
function trendDelta(curr: number, prev: number, suffix = '') {
  if (curr === 0 && prev === 0) return null;
  const diff = Math.round((curr - prev) * 10) / 10;
  return { up: diff >= 0, label: `${diff >= 0 ? '+' : ''}${diff}${suffix}` };
}
function monthKey(iso: string) {
  return iso.slice(0, 7); // "YYYY-MM"
}
function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es', { month: 'short' });
}

type Granularity = 'day' | 'week' | 'month';

const MS_PER_WEEK = 7 * 24 * 3600 * 1000;

function toChartKey(iso: string, gran: Granularity): string {
  if (gran === 'month') return iso.slice(0, 7);
  if (gran === 'day')   return iso.slice(0, 10);
  // week: UTC week number since epoch — always consistent, no timezone ambiguity
  return `w${Math.floor(new Date(iso).getTime() / MS_PER_WEEK)}`;
}

function toChartLabel(key: string, gran: Granularity): string {
  if (gran === 'month') return monthLabel(key);
  if (gran === 'day') {
    const d = new Date(key + 'T12:00:00Z');
    return d.toLocaleDateString('es', { weekday: 'short', timeZone: 'UTC' });
  }
  // week: show start-of-week date
  const weekNum = parseInt(key.slice(1));
  const d = new Date(weekNum * MS_PER_WEEK);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function generateChartKeys(gran: Granularity, now: Date): string[] {
  const keys: string[] = [];
  if (gran === 'day') {
    for (let i = 6; i >= 0; i--) {
      const ms = now.getTime() - i * 24 * 3600 * 1000;
      keys.push(new Date(ms).toISOString().slice(0, 10));
    }
  } else if (gran === 'week') {
    const currentWeek = Math.floor(now.getTime() / MS_PER_WEEK);
    for (let i = 4; i >= 0; i--) keys.push(`w${currentWeek - i}`);
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      keys.push(d.toISOString().slice(0, 7));
    }
  }
  return keys;
}

const AVATAR_COLORS = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod === '7' ? '7' : rawPeriod === 'year' ? 'year' : '30';

  const { tenantId, planLimits } = await getAuthenticatedTenant();
  const now = new Date();

  if (!planLimits.analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 p-5">
          <ChartBarIcon className="h-10 w-10 text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analíticas — Plan Pro</h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Obtén métricas de retención, canjes mensuales y distribución de clientes. Disponible en el plan Pro.
        </p>
        <Link href="/dashboard/settings"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">
          Actualizar a Pro
        </Link>
      </div>
    );
  }

  const db = createServiceRoleClient();

  const periodDays   = period === '7' ? 7 : period === 'year' ? 365 : 30;
  const compDays     = periodDays * 2;
  const granularity: Granularity = period === '7' ? 'day' : period === 'year' ? 'month' : 'week';
  const chartKeys    = generateChartKeys(granularity, now);

  const thirtyDaysAgo = daysAgoIso(periodDays);
  const sixtyDaysAgo  = daysAgoIso(compDays);

  const [
    { data: last30Tx },
    { data: prev30Tx },
    { count: activeCustomerCount },
    { data: allActiveCustomers },
    { data: last6mRedemptions },
    { data: enrollments },
    { data: enrollments6m },
    { count: baseEnrollmentCount },
    { data: tx6m },
  ] = await Promise.all([
    db.from('transactions').select('customer_id, created_at, points_delta').eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    db.from('transactions').select('customer_id, points_delta').eq('tenant_id', tenantId).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
    db.from('customers').select('id, name').eq('tenant_id', tenantId).eq('is_active', true),
    db.from('customer_reward_redemptions').select('created_at').eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    db.from('customer_program_enrollments').select('customer_id, lifetime_points, visit_count').eq('tenant_id', tenantId),
    db.from('customer_program_enrollments').select('enrolled_at').eq('tenant_id', tenantId).gte('enrolled_at', thirtyDaysAgo),
    db.from('customer_program_enrollments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).lt('enrolled_at', thirtyDaysAgo),
    db.from('transactions').select('created_at').eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
  ]);

  // ── Metrics ───────────────────────────────────────────────────────────────

  const txList    = last30Tx ?? [];
  const prevTxList = prev30Tx ?? [];
  const customers = allActiveCustomers ?? [];

  // Retention
  const activeInLast30  = new Set(txList.map((t) => t.customer_id));
  const activeInPrev30  = new Set(prevTxList.map((t) => t.customer_id));
  const retentionRate   = pct(activeInLast30.size, activeCustomerCount ?? 1);
  const prevRetention   = pct(activeInPrev30.size, activeCustomerCount ?? 1);
  const retentionDiff   = retentionRate - prevRetention;
  const retentionTrend  = retentionRate === 0 && prevRetention === 0 ? null : {
    up: retentionDiff >= 0,
    label: `${retentionDiff >= 0 ? '+' : ''}${retentionDiff}pts`,
  };

  // Visita promedio / cliente
  const avgVisitsCurr = activeInLast30.size > 0 ? Math.round((txList.length / activeInLast30.size) * 10) / 10 : 0;
  const avgVisitsPrev = activeInPrev30.size > 0 ? Math.round((prevTxList.length / activeInPrev30.size) * 10) / 10 : 0;
  const avgVisitsTrend = trendDelta(avgVisitsCurr, avgVisitsPrev);

  // Valor por canje (avg abs points of redemption transactions)
  const redemptionsTx     = txList.filter((t) => (t.points_delta ?? 0) < 0);
  const prevRedemptionsTx = prevTxList.filter((t) => (t.points_delta ?? 0) < 0);
  const avgCanjeCurr = redemptionsTx.length > 0
    ? Math.round(redemptionsTx.reduce((s, t) => s + Math.abs(t.points_delta ?? 0), 0) / redemptionsTx.length * 10) / 10
    : 0;
  const avgCanjePrev = prevRedemptionsTx.length > 0
    ? Math.round(prevRedemptionsTx.reduce((s, t) => s + Math.abs(t.points_delta ?? 0), 0) / prevRedemptionsTx.length * 10) / 10
    : 0;
  const canjeTrend = trendDelta(avgCanjeCurr, avgCanjePrev, ' pts');

  // ── Chart data (period-aware) ─────────────────────────────────────────────

  const redemptionsByKey: Record<string, number> = {};
  for (const r of last6mRedemptions ?? []) {
    const k = toChartKey(r.created_at, granularity);
    redemptionsByKey[k] = (redemptionsByKey[k] ?? 0) + 1;
  }
  const monthData = chartKeys.map((k) => ({ key: k, label: toChartLabel(k, granularity), value: redemptionsByKey[k] ?? 0 }));
  const maxCanjes = Math.max(...monthData.map((m) => m.value), 1);

  const enrollmentsByKey: Record<string, number> = {};
  for (const e of enrollments6m ?? []) {
    const k = toChartKey(e.enrolled_at, granularity);
    enrollmentsByKey[k] = (enrollmentsByKey[k] ?? 0) + 1;
  }
  const txCountByKey: Record<string, number> = {};
  for (const t of tx6m ?? []) {
    const k = toChartKey(t.created_at, granularity);
    txCountByKey[k] = (txCountByKey[k] ?? 0) + 1;
  }

  let cumulativeBase = baseEnrollmentCount ?? 0;
  const growthData = chartKeys.map((k) => {
    cumulativeBase += enrollmentsByKey[k] ?? 0;
    return { key: k, label: toChartLabel(k, granularity), inscritos: cumulativeBase, tx: txCountByKey[k] ?? 0 };
  });

  // ── Top 5 customers ───────────────────────────────────────────────────────

  const visitsByCustomer  = new Map<string, number>();
  const lifetimeForTop    = new Map<string, number>();
  for (const e of enrollments ?? []) {
    visitsByCustomer.set(e.customer_id, (visitsByCustomer.get(e.customer_id) ?? 0) + (e.visit_count ?? 0));
    lifetimeForTop.set(e.customer_id, (lifetimeForTop.get(e.customer_id) ?? 0) + (e.lifetime_points ?? 0));
  }
  const customerNameMap = new Map(customers.map((c) => [c.id, c.name]));

  const topCustomers = [...lifetimeForTop.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, pts]) => ({
      id, name: customerNameMap.get(id) ?? '—', lifetime: pts, visits: visitsByCustomer.get(id) ?? 0,
    }));

  const atRiskTotal     = (activeCustomerCount ?? 0) - activeInLast30.size;
  const prevAtRiskTotal = (activeCustomerCount ?? 0) - activeInPrev30.size;
  const atRiskRawTrend  = trendDelta(atRiskTotal, prevAtRiskTotal);
  const atRiskTrend     = atRiskRawTrend ? { ...atRiskRawTrend, up: !atRiskRawTrend.up } : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            <ChartBarIcon className="h-3.5 w-3.5" />
            Insights
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Analíticas <span className="text-gray-300 dark:text-gray-600">{now.getFullYear()}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Exporta tus datos y revisa cómo se comporta tu base de clientes.
          </p>
          <div className="mt-3 sm:hidden">
            <PeriodSelector current={period} />
          </div>
        </div>
        <div className="hidden sm:block">
          <PeriodSelector current={period} />
        </div>
      </div>

      {/* Export panel */}
      <ExportPanel isPro={planLimits.exportCSV} />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<RetentionIcon className="h-4 w-4" />}
          iconBg="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
          label="Tasa de retención"
          value={`${retentionRate}%`}
          valueColor="text-indigo-600 dark:text-indigo-400"
          trend={retentionTrend}
          sub={`${activeInLast30.size} de ${activeCustomerCount ?? 0} activos`}
        />
        <KpiCard
          icon={<UsersIcon className="h-4 w-4" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          label="Visita promedio / cliente"
          value={avgVisitsCurr}
          valueColor="text-emerald-600 dark:text-emerald-400"
          trend={avgVisitsTrend}
          sub={`sobre ${activeInLast30.size} clientes activos`}
        />
        <KpiCard
          icon={<ActivityIcon className="h-4 w-4" />}
          iconBg="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
          label="Valor por canje"
          value={avgCanjeCurr > 0 ? `${avgCanjeCurr} pts` : '—'}
          valueColor="text-blue-600 dark:text-blue-400"
          trend={canjeTrend}
          sub="promedio por canje"
        />
        <KpiCard
          icon={<WarningIcon className="h-4 w-4" />}
          iconBg="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
          label="Clientes en riesgo"
          value={atRiskTotal}
          valueColor="text-rose-600 dark:text-rose-400"
          trend={atRiskTrend}
          sub={`sin actividad en ${periodDays}d`}
        />
      </div>

      {/* Crecimiento de clientes — line chart */}
      <GrowthChart data={growthData} period={period} />

      {/* Bottom row: Canjes por mes + Mejores clientes */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Canjes por mes */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
            {period === '7' ? 'Canjes por día' : period === 'year' ? 'Canjes por mes' : 'Canjes por semana'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            {period === '7' ? 'Últimos 7 días' : period === 'year' ? 'Últimos 12 meses' : 'Últimas 5 semanas'}
          </p>
          {monthData.every((m) => m.value === 0) ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin canjes en este período</p>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {monthData.map((m) => {
                const heightPct = Math.max(pct(m.value, maxCanjes), m.value > 0 ? 4 : 0);
                return (
                  <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                    {m.value > 0 && (
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{m.value}</span>
                    )}
                    <div className="w-full rounded-t-lg bg-indigo-100 dark:bg-indigo-500/20 overflow-hidden" style={{ height: '100%', maxHeight: '96px' }}>
                      <div
                        className="w-full rounded-t-lg bg-indigo-500 dark:bg-indigo-400"
                        style={{ height: `${heightPct}%`, minHeight: m.value > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mejores clientes */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Mejores clientes</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Por puntos de por vida</p>
            </div>
            <Link href="/dashboard/customers" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition">
              Ver todos
            </Link>
          </div>
          {topCustomers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-[#1e2438]">
                    {['#', 'Cliente', 'Visitas', 'Pts de por vida'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                  {topCustomers.slice(0, 5).map((c, i) => {
                    const initials = c.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                    const color = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition">
                        <td className="px-4 py-3 text-sm font-bold text-gray-300 dark:text-gray-600">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                              {initials}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[120px]">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.visits}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{c.lifetime} <span className="text-xs font-normal text-gray-400">pts</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Growth line chart ─────────────────────────────────────────────────────────

type GrowthPoint = { key: string; label: string; inscritos: number; tx: number };

function GrowthChart({ data, period }: { data: GrowthPoint[]; period: string }) {
  const n = data.length;
  // Fixed viewBox — points always fill the same space regardless of count
  const W = 680, H = 200;
  const PAD = { top: 24, right: 20, bottom: 32, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.inscritos, d.tx)), 1);
  // Round up to nice tick
  const tickCount = 4;
  const niceMax = Math.ceil(maxVal / tickCount) * tickCount;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((niceMax / tickCount) * i));

  const xPos = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
  const yPos = (v: number) => PAD.top + chartH - (v / niceMax) * chartH;

  const linePoints = (key: 'inscritos' | 'tx') =>
    data.map((d, i) => `${xPos(i)},${yPos(d[key])}`).join(' ');

  const areaPath = (key: 'inscritos' | 'tx') => {
    const pts = data.map((d, i) => `${xPos(i)},${yPos(d[key])}`).join(' L ');
    const last = `${xPos(data.length - 1)},${PAD.top + chartH}`;
    const first = `${xPos(0)},${PAD.top + chartH}`;
    return `M ${pts} L ${last} L ${first} Z`;
  };

  const lastInscritos = data[data.length - 1]?.inscritos ?? 0;
  const lastTx = data[data.length - 1]?.tx ?? 0;
  const txDelta = lastTx - (data[data.length - 2]?.tx ?? 0);

  const hasData = data.some((d) => d.inscritos > 0 || d.tx > 0);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Crecimiento de clientes</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {period === '7' ? 'Últimos 7 días · por día' : period === 'year' ? 'Últimos 12 meses · por mes' : 'Últimas 5 semanas · por semana'}
            {' — inscritos acumulados vs. transacciones'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Inscritos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Transacc.{txDelta > 0 ? ` (+${txDelta})` : ''}
          </span>
        </div>
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos aún</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <linearGradient id="grad-inscritos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines + labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left} y1={yPos(t)} x2={PAD.left + chartW} y2={yPos(t)}
                stroke="currentColor" strokeWidth={0.5}
                className="text-gray-100 dark:text-[#1e2438]"
              />
              <text
                x={PAD.left - 6} y={yPos(t) + 4}
                textAnchor="end" fontSize={9}
                className="fill-gray-300 dark:fill-[#2a3147]"
              >{t}</text>
            </g>
          ))}

          {/* Area fill under inscritos line */}
          <path d={areaPath('inscritos')} fill="url(#grad-inscritos)" />

          {/* Inscritos line */}
          <polyline
            points={linePoints('inscritos')}
            fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Transacciones line (dashed) */}
          <polyline
            points={linePoints('tx')}
            fill="none" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 3"
            strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Data points — inscritos */}
          {data.map((d, i) => (
            <circle key={i} cx={xPos(i)} cy={yPos(d.inscritos)} r={3}
              fill="white" stroke="#6366f1" strokeWidth={2} />
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text key={d.key} x={xPos(i)} y={H - 4}
              textAnchor="middle" fontSize={9}
              className="fill-gray-400 dark:fill-gray-500 capitalize"
            >{d.label}</text>
          ))}
        </svg>
      )}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon, iconBg, label, value, valueColor, trend, sub,
}: {
  icon: React.ReactNode; iconBg: string;
  label: string; value: string | number; valueColor: string;
  trend: { up: boolean; label: string } | null;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
      {/* Icon + label */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
      </div>
      {/* Value */}
      <p className={`text-4xl font-bold leading-none tracking-tight ${valueColor}`}>{value}</p>
      {/* Sub */}
      {sub && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
      {/* Trend */}
      {trend ? (
        <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${
          trend.up
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-500 dark:text-red-400'
        }`}>
          <span>{trend.up ? '↗' : '↘'}</span>
          <span>{trend.label} vs. periodo anterior</span>
        </p>
      ) : (
        <p className="mt-3 text-xs text-gray-300 dark:text-gray-600">Sin datos previos</p>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
function RetentionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}
function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}
