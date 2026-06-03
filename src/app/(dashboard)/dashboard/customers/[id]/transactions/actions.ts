'use server';

import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type CustomerTxRow = {
  id: string;
  type: string;
  points_delta: number;
  note: string | null;
  created_at: string;
  program_id: string;
  programName: string;
};

export async function loadMoreCustomerTransactions(
  customerId: string,
  offset: number,
): Promise<{ rows: CustomerTxRow[]; hasMore: boolean }> {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const LIMIT = 10;

  const { data } = await db
    .from('transactions')
    .select('id, type, points_delta, note, created_at, program_id')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + LIMIT); // fetch LIMIT+1 to detect hasMore

  const rows = (data ?? []) as CustomerTxRow[];
  const hasMore = rows.length > LIMIT;
  const slice = hasMore ? rows.slice(0, LIMIT) : rows;

  // Resolve program names
  const programIds = [...new Set(slice.map((r) => r.program_id).filter(Boolean))];
  const { data: programs } = programIds.length
    ? await db.from('reward_programs').select('id, name').in('id', programIds)
    : { data: [] };
  const nameMap = new Map((programs ?? []).map((p) => [p.id, p.name as string]));

  return {
    rows: slice.map((r) => ({ ...r, programName: nameMap.get(r.program_id) ?? '—' })),
    hasMore,
  };
}
