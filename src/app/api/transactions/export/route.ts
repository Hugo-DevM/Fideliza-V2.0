/**
 * GET /api/transactions/export — Export all transactions as CSV (Pro plan only).
 * Uses the dashboard Supabase session — no subdomain header required.
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { tenantId, planLimits } = await getAuthenticatedTenant();

  if (!planLimits.exportCSV) {
    return NextResponse.json({ error: 'El plan Pro es requerido para exportar.' }, { status: 403 });
  }

  const db = createServiceRoleClient();
  const url = new URL(request.url);
  const programId  = url.searchParams.get('program_id')  ?? undefined;
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
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (programId)  builder = builder.eq('program_id', programId);
  if (customerId) builder = builder.eq('customer_id', customerId);

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json({ error: `Error al obtener transacciones: ${error.message}` }, { status: 500 });
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

  const TYPE_LABELS: Record<string, string> = {
    earn: 'Ganar', redeem: 'Canjear', adjustment: 'Ajuste', expire: 'Expirar', refund: 'Reembolso',
  };

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
        TYPE_LABELS[r.type] ?? r.type,
        r.points_delta,
        r.balance_after,
        csvField(r.note ?? ''),
      ].join(',')
    ),
  ];

  const csv = '\uFEFF' + csvLines.join('\n'); // BOM for Excel UTF-8 compatibility
  const filename = `transacciones_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function csvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
