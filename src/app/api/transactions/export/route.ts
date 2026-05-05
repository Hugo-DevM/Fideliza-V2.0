/**
 * GET /api/transactions/export — Export all transactions as CSV (Pro plan only).
 */
import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { enforceExportCSV } from '@/lib/middleware/plan-limits';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const GET = withTenantContext(async (request, _ctx, tenant) => {
  await enforceExportCSV(tenant.tenantId);

  const db = createServiceRoleClient();
  const url = new URL(request.url);
  const programId = url.searchParams.get('program_id') ?? undefined;
  const customerId = url.searchParams.get('customer_id') ?? undefined;

  let builder = db
    .from('transactions')
    .select(`
      id,
      type,
      points_delta,
      balance_after,
      note,
      created_at,
      customers(name, access_code),
      reward_programs(name)
    `)
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false });

  if (programId)  builder = builder.eq('program_id', programId);
  if (customerId) builder = builder.eq('customer_id', customerId);

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json(
      { data: null, error: `Failed to fetch transactions: ${error.message}` },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    type: string;
    points_delta: number;
    balance_after: number;
    note: string | null;
    created_at: string;
    customers: { name: string; access_code: string } | null;
    reward_programs: { name: string } | null;
  }>;

  const header = ['id', 'fecha', 'cliente', 'codigo_acceso', 'programa', 'tipo', 'delta', 'saldo_tras', 'nota'];
  const csvLines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.created_at,
        csvField(r.customers?.name ?? ''),
        csvField(r.customers?.access_code ?? ''),
        csvField(r.reward_programs?.name ?? ''),
        r.type,
        r.points_delta,
        r.balance_after,
        csvField(r.note ?? ''),
      ].join(',')
    ),
  ];

  const csv = csvLines.join('\n');
  const filename = `transacciones_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}, { limiter: 'publicRead', endpoint: 'GET:/api/transactions/export' });

function csvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
