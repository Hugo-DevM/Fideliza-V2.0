import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewProgramModal from './NewProgramModal';

export const metadata = { title: 'Programs — Fideliza+' };

const TYPE_BADGES: Record<string, string> = {
  points:   'bg-blue-50 text-blue-700',
  stamp:    'bg-purple-50 text-purple-700',
  visit:    'bg-green-50 text-green-700',
  cashback: 'bg-orange-50 text-orange-700',
};

const STATUS_BADGES: Record<string, string> = {
  active:   'bg-green-50 text-green-700',
  draft:    'bg-gray-100 text-gray-500',
  paused:   'bg-yellow-50 text-yellow-700',
  archived: 'bg-red-50 text-red-400',
};

export default async function ProgramsPage() {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const { data: programs } = await db
    .from('reward_programs')
    .select(`
      id, name, type, status, description, created_at,
      rewards(count),
      customer_program_enrollments(count)
    `)
    .eq('tenant_id', tenantId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  type ProgramRow = {
    id: string; name: string; type: string; status: string;
    description: string | null; created_at: string;
    rewards: { count: number }[];
    customer_program_enrollments: { count: number }[];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500">{programs?.length ?? 0} programs</p>
        </div>
        <NewProgramModal />
      </div>

      {!programs?.length ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <p className="text-3xl mb-2">🎁</p>
          <p className="font-semibold text-gray-700">No programs yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Create your first loyalty program to start rewarding customers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(programs as unknown as ProgramRow[]).map((p) => {
            const rewardCount     = p.rewards?.[0]?.count ?? 0;
            const enrollmentCount = p.customer_program_enrollments?.[0]?.count ?? 0;

            return (
              <Link
                key={p.id}
                href={`/dashboard/programs/${p.id}`}
                className="flex flex-col rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">{p.name}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </span>
                </div>

                {p.description && (
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">{p.description}</p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_BADGES[p.type] ?? ''}`}>
                    {p.type}
                  </span>
                </div>

                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span>{enrollmentCount} enrolled</span>
                  <span>{rewardCount} reward{rewardCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
