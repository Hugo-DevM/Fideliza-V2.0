'use server';

import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type ProgramTxRow = {
  id: string;
  type: string;
  points_delta: number;
  note: string | null;
  created_at: string;
  customerName: string;
};

export async function loadMoreProgramTransactions(
  programId: string,
  offset: number,
): Promise<{ rows: ProgramTxRow[]; hasMore: boolean }> {
  const { tenantId, planLimits } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const LIMIT = 10;

  // Plan cap: FREE only sees the most recent N transactions
  const historyCap = planLimits.transactionHistoryLimit;
  if (historyCap !== null && offset >= historyCap) return { rows: [], hasMore: false };
  const end = historyCap !== null
    ? Math.min(offset + LIMIT, historyCap - 1) // inclusive range end, capped at plan limit
    : offset + LIMIT;

  const { data } = await db
    .from('transactions')
    .select('id, type, points_delta, note, created_at, customers(name)')
    .eq('tenant_id', tenantId)
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .range(offset, end);

  const raw = (data ?? []) as Record<string, unknown>[];
  const hasMore = raw.length > LIMIT && (historyCap === null || offset + LIMIT < historyCap);
  const slice = raw.length > LIMIT ? raw.slice(0, LIMIT) : raw;

  return {
    rows: slice.map((r) => ({
      id: r['id'] as string,
      type: r['type'] as string,
      points_delta: r['points_delta'] as number,
      note: r['note'] as string | null,
      created_at: r['created_at'] as string,
      customerName: (r['customers'] as { name: string } | null)?.name ?? '—',
    })),
    hasMore,
  };
}
