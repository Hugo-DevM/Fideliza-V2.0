import { notFound } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/middleware/errors';
import { getProgramById } from '@/modules/rewards';
import { loadMoreProgramTransactions } from './actions';
import TransactionList from './TransactionList';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const { data } = await db.from('reward_programs').select('name').eq('tenant_id', tenantId).eq('id', id).single();
  return { title: `${data?.name ?? 'Programa'} · Transacciones — Fideliza+` };
}

export default async function ProgramTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId, settings } = await getAuthenticatedTenant();

  try {
    const program = await getProgramById(tenantId, id);
    const { rows: initialRows, hasMore } = await loadMoreProgramTransactions(id, 0);

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Transacciones</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{program.name}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <TransactionList
            programId={id}
            programLabel={settings.program_label}
            initialRows={initialRows}
            initialHasMore={hasMore}
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}
