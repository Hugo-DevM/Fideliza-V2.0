import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { getProgramById, listRewardsByProgram } from '@/modules/rewards';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewRewardForm from './NewRewardForm';
import VerifyVoucherForm from './VerifyVoucherForm';
import ProgramStatusButtons from './ProgramStatusButtons';
import ToggleRewardButton from './ToggleRewardButton';
import { NotFoundError } from '@/lib/middleware/errors';
import type { ProgramStatus } from '@/lib/types';

const STATUS_BADGES: Record<string, string> = {
  active:   'bg-green-50 text-green-700',
  draft:    'bg-gray-100 text-gray-500',
  paused:   'bg-yellow-50 text-yellow-700',
  archived: 'bg-red-50 text-red-400',
};

const TYPE_BADGES: Record<string, string> = {
  points:   'bg-blue-50 text-blue-700',
  stamp:    'bg-purple-50 text-purple-700',
  visit:    'bg-green-50 text-green-700',
  cashback: 'bg-orange-50 text-orange-700',
};

function configLabel(type: string, config: Record<string, unknown>): string {
  if (type === 'points')   return `${config.points_per_dollar ?? 0} pts per $1 · min redeem: ${config.min_redeem ?? 0} pts`;
  if (type === 'stamp')    return `${config.stamps_needed ?? 0} stamps per card`;
  if (type === 'visit')    return `Reward after ${config.visits_needed ?? 0} visits`;
  if (type === 'cashback') return `${config.cashback_percent ?? 0}% cashback · min $${((Number(config.min_purchase_cents) || 0) / 100).toFixed(2)}`;
  return '';
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId, settings } = await getAuthenticatedTenant();

  try {
    const [program, rewards] = await Promise.all([
      getProgramById(tenantId, id),
      listRewardsByProgram(tenantId, id),
    ]);

    const db = createServiceRoleClient();

    const [{ count: enrollmentCount }, { data: recentTx }] = await Promise.all([
      db.from('customer_program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', id).eq('tenant_id', tenantId),
      db.from('transactions')
        .select('id, type, points_delta, balance_after, note, created_at, customers(name)')
        .eq('program_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const typeLabel: Record<string, string> = { earn: 'Earn', redeem: 'Redeem', adjustment: 'Adjust', expire: 'Expire', refund: 'Refund' };

    return (
      <div className="space-y-5">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400">
          <Link href="/dashboard/programs" className="hover:text-gray-600">Programs</Link>
          {' / '}
          <span className="text-gray-700 font-medium">{program.name}</span>
        </nav>

        {/* Header */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{program.name}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_BADGES[program.type] ?? ''}`}>
                  {program.type}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[program.status] ?? ''}`}>
                  {program.status}
                </span>
              </div>
              {program.description && (
                <p className="mt-1 text-sm text-gray-500">{program.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">{configLabel(program.type, program.config as unknown as Record<string, unknown>)}</p>
              <p className="mt-1 text-xs text-gray-400">{enrollmentCount ?? 0} customers enrolled</p>
            </div>
            <ProgramStatusButtons programId={program.id} currentStatus={program.status as ProgramStatus} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Rewards */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Rewards</h2>
            </div>
            <div className="p-4 space-y-2">
              {!rewards.length && !program.status.includes('archived') && (
                <p className="text-sm text-gray-400 mb-3">No rewards yet — add the first one.</p>
              )}
              {rewards.map((r) => (
                <div key={r.id} className={`flex items-center justify-between rounded-lg border p-3 ${!r.is_active ? 'opacity-50' : ''}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{r.cost_points} {settings.program_label}</span>
                      {r.stock !== null && <span>Stock: {r.stock}</span>}
                      {r.expiry_days && <span>Expires in {r.expiry_days}d</span>}
                      <span>{r.redeemed_count} redeemed</span>
                    </div>
                  </div>
                  <ToggleRewardButton
                    programId={program.id}
                    rewardId={r.id}
                    isActive={r.is_active}
                  />
                </div>
              ))}
              {program.status !== 'archived' && (
                <div className="pt-1">
                  <NewRewardForm programId={program.id} />
                </div>
              )}
            </div>
          </div>

          {/* Verify voucher */}
          <div className="space-y-4">
            <VerifyVoucherForm />

            {/* Program date window */}
            {(program.starts_at || program.ends_at) && (
              <div className="rounded-xl border bg-white p-4 shadow-sm text-sm text-gray-500">
                {program.starts_at && <p>Starts: {new Date(program.starts_at).toLocaleDateString()}</p>}
                {program.ends_at   && <p>Ends: {new Date(program.ends_at).toLocaleDateString()}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent transactions</h2>
          </div>
          {!recentTx?.length ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {['Customer', 'Type', 'Delta', 'Balance after', 'Note', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(recentTx as unknown as Record<string, unknown>[]).map((tx) => {
                  const cust  = tx['customers'] as { name: string } | null;
                  const delta = tx['points_delta'] as number;
                  const type  = tx['type'] as string;
                  return (
                    <tr key={tx['id'] as string}>
                      <td className="px-4 py-2 font-medium text-gray-800">{cust?.name ?? '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          type === 'earn' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}>{typeLabel[type] ?? type}</span>
                      </td>
                      <td className={`px-4 py-2 font-mono font-semibold ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {delta > 0 ? '+' : ''}{delta}
                      </td>
                      <td className="px-4 py-2 font-mono text-gray-500">{tx['balance_after'] as number}</td>
                      <td className="px-4 py-2 text-gray-400 truncate max-w-xs">{(tx['note'] as string | null) ?? '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-400">
                        {new Date(tx['created_at'] as string).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}
