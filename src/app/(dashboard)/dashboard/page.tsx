import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { listActivePrograms } from '@/modules/rewards';

export const metadata = { title: 'Overview — Fideliza+' };

export default async function DashboardPage() {
  const { tenantId, tenant, settings } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const [
    { count: customerCount },
    programs,
    { count: txTodayCount },
    { count: pendingVoucherCount },
  ] = await Promise.all([
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
    listActivePrograms(tenantId),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending'),
  ]);

  const { data: recentTx } = await db
    .from('transactions')
    .select('id, type, points_delta, note, created_at, customers(name), reward_programs(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(8);

  const stats = [
    { label: 'Active customers',    value: customerCount ?? 0,      href: '/dashboard/customers', accent: 'text-blue-600' },
    { label: 'Active programs',     value: programs.length,          href: '/dashboard/programs',  accent: 'text-purple-600' },
    { label: 'Transactions today',  value: txTodayCount ?? 0,        href: '/dashboard/customers', accent: 'text-green-600' },
    { label: 'Pending vouchers',    value: pendingVoucherCount ?? 0, href: '/dashboard/customers', accent: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Overview</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Welcome back — <span className="font-medium">{tenant.name}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.accent}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
          </div>
          {!recentTx?.length ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet</p>
          ) : (
            <ul className="divide-y">
              {(recentTx as unknown as Record<string, unknown>[]).map((tx) => {
                const cust  = tx['customers'] as { name: string } | null;
                const prog  = tx['reward_programs'] as { name: string } | null;
                const delta = tx['points_delta'] as number;
                const type  = tx['type'] as string;
                const date  = new Date(tx['created_at'] as string);
                return (
                  <li key={tx['id'] as string} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{cust?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{prog?.name} · {date.toLocaleDateString()}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      delta > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Programs */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Programs</h2>
            <Link href="/dashboard/programs" className="text-xs text-indigo-600 hover:underline">Manage →</Link>
          </div>
          {!programs.length ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No active programs.</p>
              <Link href="/dashboard/programs" className="mt-1 inline-block text-sm text-indigo-600 hover:underline">
                Create one →
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {programs.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs capitalize text-gray-400">{p.type}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">active</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Portal URL hint */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm font-semibold text-indigo-800">Customer portal</p>
        <p className="mt-1 font-mono text-xs text-indigo-600">
          https://{tenant.subdomain}.fideliza.app/c
        </p>
        <p className="mt-1 text-xs text-indigo-500">
          Share this with customers · portal currency label: <strong>{settings.program_label}</strong>
        </p>
      </div>
    </div>
  );
}
