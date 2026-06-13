import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { listActivePrograms } from '@/modules/rewards';
import PortalCard from '@/components/dashboard/PortalCard';

export const metadata = { title: 'Resumen — Fideliza+' };

export default async function DashboardPage() {
  const { tenantId, tenant, settings, planLimits, effectivePlan } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  // ── Date boundaries ──────────────────────────────────────────────
  const now              = new Date();
  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const dow              = now.getDay();
  const startOfThisWeek  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow).toISOString();
  const startOfLastWeek  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow - 7).toISOString();

  const [
    { count: customerCount },
    programs,
    { count: txTodayCount },
    { count: pendingVoucherCount },
    // Trend queries
    { count: newCustomersThisMonth },
    { count: newCustomersLastMonth },
    { count: txYesterdayCount },
    { count: redemptionsThisWeek },
    { count: redemptionsLastWeek },
    { count: newProgramsThisMonth },
  ] = await Promise.all([
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
    listActivePrograms(tenantId),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfToday),
    db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending'),
    // New customers this month
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfThisMonth),
    // New customers last month
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfLastMonth).lt('created_at', startOfThisMonth),
    // Transactions yesterday
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfYesterday).lt('created_at', startOfToday),
    // Redemptions this week
    db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfThisWeek),
    // Redemptions last week
    db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfLastWeek).lt('created_at', startOfThisWeek),
    // New programs this month
    db.from('reward_programs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', startOfThisMonth),
  ]);

  const { data: recentTx } = await db
    .from('transactions')
    .select('id, type, points_delta, note, created_at, customers(name), reward_programs(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(7);

  const isPastDue    = tenant.subscription_status === 'past_due' || tenant.subscription_status === 'unpaid';
  const isDowngraded = tenant.plan !== 'free' && effectivePlan === 'free';
  const shortName    = tenant.name.split(' ')[0];

  // ── Trend helpers ────────────────────────────────────────────────
  function pctChange(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
  }

  const customerPct    = pctChange(newCustomersThisMonth ?? 0, newCustomersLastMonth ?? 0);
  const txPct          = pctChange(txTodayCount ?? 0, txYesterdayCount ?? 0);
  const redemptionPct  = pctChange(redemptionsThisWeek ?? 0, redemptionsLastWeek ?? 0);
  const newProgramsDelta = newProgramsThisMonth ?? 0;

  const stats = [
    {
      label: 'Clientes activos',
      value: customerCount ?? 0,
      href: '/dashboard/customers',
      icon: <CustomersIcon />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      sparkColor: '#818cf8',
      sparkPoints: '0,40 20,35 40,30 60,20 80,25 100,10 120,5',
      trend: customerPct !== null
        ? { value: `${customerPct >= 0 ? '+' : ''}${customerPct}%`, context: 'mes ant.', positive: customerPct >= 0 }
        : null,
    },
    {
      label: 'Programas activos',
      value: programs.length,
      href: '/dashboard/programs',
      icon: <ProgramsIcon />,
      iconBg: 'bg-violet-100 dark:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      sparkColor: '#a78bfa',
      sparkPoints: '0,38 20,35 40,38 60,30 80,22 100,18 120,10',
      trend: newProgramsDelta > 0
        ? { value: `+${newProgramsDelta}`, context: 'este mes', positive: true }
        : { value: '—', context: 'este mes', positive: true },
    },
    {
      label: 'Transacciones hoy',
      value: txTodayCount ?? 0,
      href: '/dashboard/customers',
      icon: <TransactionsIcon />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparkColor: '#34d399',
      sparkPoints: '0,35 20,30 40,33 60,22 80,18 100,20 120,8',
      trend: txPct !== null
        ? { value: `${txPct >= 0 ? '+' : ''}${txPct}%`, context: 'vs. ayer', positive: txPct >= 0 }
        : null,

    },
    {
      label: 'Recompensas canjeadas',
      value: pendingVoucherCount ?? 0,
      href: '/dashboard/customers',
      icon: <RewardsIcon />,
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sparkColor: '#fbbf24',
      sparkPoints: '0,10 20,15 40,12 60,20 80,25 100,22 120,30',
      trend: redemptionPct !== null
        ? { value: `${redemptionPct >= 0 ? '+' : ''}${redemptionPct}%`, context: 'semana', positive: redemptionPct >= 0 }
        : null,
    },
  ];

  return (
    <>
    <div className="space-y-6">
      {/* Banners */}
      {isPastDue && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Pago pendiente — acceso limitado</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              Hay un problema con tu método de pago. Actualiza tu tarjeta para restaurar el acceso completo.
            </p>
          </div>
          <a href="/dashboard/settings" className="shrink-0 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">
            Resolver
          </a>
        </div>
      )}
      {isDowngraded && !isPastDue && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Suscripción inactiva</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Tu suscripción no está activa. Estás en modo Gratis hasta que se reactive.
            </p>
          </div>
          <a href="/dashboard/settings" className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition">
            Ver facturación
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            <HomeSmallIcon className="h-3.5 w-3.5" />
            Panel
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Hola de nuevo, {shortName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Esto es lo que pasó en tu programa de fidelización hoy.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/analytics" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition">
            <BarIcon className="h-4 w-4" />
            Analíticas
          </Link>
          <Link href="/dashboard/quick" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition">
            <BoltSmallIcon className="h-4 w-4" />
            Registro rápido
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="relative rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-4 overflow-hidden transition hover:shadow-md dark:hover:border-[#2a3147]"
          >
            {/* Icon + label */}
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor}`}>
                {s.icon}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{s.label}</p>
            </div>

            {/* Value */}
            <p className="mt-2.5 text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
              {s.value}
            </p>

            {/* Trend + sparkline */}
            <div className="mt-2.5 flex items-end justify-between gap-3">
              {s.trend ? (
                <div className="flex items-center gap-1">
                  {s.trend.positive ? (
                    <TrendUpIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <TrendDownIcon className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold shrink-0 ${s.trend.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                    {s.trend.value}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{s.trend.context}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
              )}
              <svg viewBox="0 0 120 40" className="h-9 w-24 shrink-0" preserveAspectRatio="none">
                <polyline
                  points={s.sparkPoints}
                  fill="none"
                  stroke={s.sparkColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Recent activity */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Actividad reciente</h2>
            <Link href="/dashboard/customers" className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Ver clientes
            </Link>
          </div>
          {!recentTx?.length ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin transacciones aún</p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
              {(recentTx as unknown as Record<string, unknown>[]).map((tx) => {
                const cust     = tx['customers'] as { name: string } | null;
                const prog     = tx['reward_programs'] as { name: string } | null;
                const delta    = tx['points_delta'] as number;
                const date     = new Date(tx['created_at'] as string);
                const ago      = formatAgo(date);
                const isPositive = delta > 0;
                return (
                  <li key={tx['id'] as string} className="flex items-start gap-3 px-5 py-3.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold mt-0.5 ${
                      isPositive
                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400'
                    }`}>
                      {isPositive ? '+' : '↩'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{cust?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{describeTransaction(tx)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{ago} · {prog?.name ?? '—'}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {isPositive ? `+${delta} pts` : `${delta} pts`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Programs */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Programas</h2>
              <Link href="/dashboard/programs" className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Gestionar
              </Link>
            </div>
            {!programs.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Sin programas activos.</p>
                <Link href="/dashboard/programs" className="mt-1 inline-block text-sm text-indigo-500 hover:underline">Crear uno</Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                {programs.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.name}</p>
                      <p className="text-xs capitalize text-gray-400 dark:text-gray-500">{p.type}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      Activo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PortalCard subdomain={tenant.subdomain} />
        </div>
      </div>
    </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function formatAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

function describeTransaction(tx: Record<string, unknown>): string {
  const type  = tx['type'] as string;
  const delta = tx['points_delta'] as number;
  if (type === 'earn')   return `ganó ${delta} puntos`;
  if (type === 'redeem') return `canjeó ${Math.abs(delta)} puntos`;
  if (type === 'stamp')  return `sumó un sello`;
  if (type === 'join')   return `se registró`;
  return `realizó una transacción`;
}

// ── Icons ─────────────────────────────────────────────────────────

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 11 L6 7 L9 9.5 L14 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 4 L14 4 L14 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 5 L6 9 L9 6.5 L14 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 12 L14 12 L14 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HomeSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
    </svg>
  );
}

function BarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function BoltSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function ProgramsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
}

