import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/middleware/errors';
import { loadMoreCustomerTransactions } from './actions';
import TransactionList from './TransactionList';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const { data } = await db.from('customers').select('name').eq('tenant_id', tenantId).eq('id', id).single();
  return { title: `${data?.name ?? 'Cliente'} · Transacciones — Fideliza+` };
}

export default async function CustomerTransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getAuthenticatedTenant();

  try {
    const db = createServiceRoleClient();
    const { data: customer } = await db
      .from('customers').select('name').eq('tenant_id', tenantId).eq('id', id).single();
    if (!customer) notFound();

    const { rows: initialRows, hasMore } = await loadMoreCustomerTransactions(id, 0);

    return (
      <div className="space-y-5">
        <Link href={`/dashboard/customers/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {(customer as { name: string }).name}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Transacciones</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{(customer as { name: string }).name}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <TransactionList
            customerId={id}
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
