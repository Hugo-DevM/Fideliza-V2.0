/**
 * GET /api/export — Generate .xlsx reports (Pro plan only).
 *
 * Query params:
 *   type  = transactions | customers | redemptions  (default: transactions)
 *   from  = YYYY-MM-DD  (default: 30 days ago)
 *   to    = YYYY-MM-DD  (default: today)
 */
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitExceededResponse } from '@/lib/middleware/rate-limit';
import { getClientIp, rateLimitKey } from '@/lib/middleware/api-context';

// ── Styling constants ────────────────────────────────────────────────────────
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEef2ff' }, // indigo-50
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FF4338CA' } }; // indigo-700
const BORDER_STYLE: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFe0e7ff' } };
const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: BORDER_STYLE, left: BORDER_STYLE, bottom: BORDER_STYLE, right: BORDER_STYLE,
};

function styleHeaderRow(ws: ExcelJS.Worksheet) {
  ws.getRow(1).eachCell((cell) => {
    cell.fill  = HEADER_FILL;
    cell.font  = HEADER_FONT;
    cell.border = CELL_BORDER;
    cell.alignment = { vertical: 'middle', wrapText: false };
  });
  ws.getRow(1).height = 20;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateOnly(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { tenantId, planLimits, tenant } = await getAuthenticatedTenant();

  // ── Rate limit ──────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = await rateLimiters.exportReport(rateLimitKey.byTenantAndIp(tenantId, ip, 'GET:/api/export'));
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  if (!planLimits.analytics) {
    return NextResponse.json({ error: 'El plan Pro es requerido para exportar.' }, { status: 403 });
  }

  const url    = new URL(request.url);
  const type   = url.searchParams.get('type') ?? 'transactions';
  const fromParam = url.searchParams.get('from');
  const toParam   = url.searchParams.get('to');

  // Default: last 30 days
  const toDate   = toParam   ? new Date(toParam   + 'T23:59:59Z') : new Date();
  const fromDate = fromParam ? new Date(fromParam + 'T00:00:00Z') : new Date(Date.now() - 30 * 86_400_000);

  const db = createServiceRoleClient();
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Fideliza+';
  wb.created  = new Date();
  wb.modified = new Date();

  let sheetName = 'Reporte';
  let filename  = 'reporte';

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  if (type === 'transactions') {
    sheetName = 'Transacciones';
    filename  = `transacciones_${tenant.subdomain}_${fromDate.toISOString().slice(0,10)}_${toDate.toISOString().slice(0,10)}`;

    const { data, error } = await db
      .from('transactions')
      .select(`
        id, type, points_delta, balance_after, note, created_at,
        customers(name, phone, access_code),
        reward_programs(name, type)
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const TYPE_LABELS: Record<string, string> = {
      earn: 'Ganar', redeem: 'Canjear', adjustment: 'Ajuste', expire: 'Expirar', refund: 'Reembolso',
    };
    const PROG_TYPE_LABELS: Record<string, string> = {
      points: 'Puntos', stamp: 'Sellos', visit: 'Visitas', cashback: 'Cashback',
    };

    const ws = wb.addWorksheet(sheetName);
    ws.columns = [
      { header: 'Fecha',             key: 'fecha',        width: 20 },
      { header: 'Cliente',           key: 'cliente',      width: 25 },
      { header: 'Teléfono',          key: 'telefono',     width: 16 },
      { header: 'Código de acceso',  key: 'codigo',       width: 16 },
      { header: 'Programa',          key: 'programa',     width: 22 },
      { header: 'Tipo de programa',  key: 'tipo_prog',    width: 16 },
      { header: 'Tipo',              key: 'tipo',         width: 14 },
      { header: 'Delta puntos',      key: 'delta',        width: 14 },
      { header: 'Saldo tras',        key: 'saldo',        width: 12 },
      { header: 'Nota',              key: 'nota',         width: 30 },
    ];

    styleHeaderRow(ws);

    type TxRow = {
      id: string; type: string; points_delta: number; balance_after: number;
      note: string | null; created_at: string;
      customers: { name: string; phone: string | null; access_code: string } | null;
      reward_programs: { name: string; type: string } | null;
    };

    let totalEarned = 0;
    let totalRedeemed = 0;

    for (const r of (data ?? []) as unknown as TxRow[]) {
      const row = ws.addRow({
        fecha:    fmtDate(r.created_at),
        cliente:  r.customers?.name ?? '',
        telefono: r.customers?.phone ?? '',
        codigo:   r.customers?.access_code ?? '',
        programa: r.reward_programs?.name ?? '',
        tipo_prog: PROG_TYPE_LABELS[r.reward_programs?.type ?? ''] ?? '',
        tipo:     TYPE_LABELS[r.type] ?? r.type,
        delta:    r.points_delta,
        saldo:    r.balance_after,
        nota:     r.note ?? '',
      });
      // Colour delta cell
      const deltaCell = row.getCell('delta');
      deltaCell.font = { color: { argb: r.points_delta >= 0 ? 'FF16A34A' : 'FFDC2626' } };

      if (r.points_delta > 0) totalEarned   += r.points_delta;
      if (r.points_delta < 0) totalRedeemed += Math.abs(r.points_delta);
    }

    // Totals row
    const totalsRow = ws.addRow({
      fecha: 'TOTALES', delta: totalEarned, saldo: -totalRedeemed,
    });
    totalsRow.font = { bold: true };
    totalsRow.getCell('delta').font = { bold: true, color: { argb: 'FF16A34A' } };
    totalsRow.getCell('saldo').font = { bold: true, color: { argb: 'FFDC2626' } };
    totalsRow.getCell('saldo').value = -totalRedeemed;
    // Re-label saldo header meaning in totals
    totalsRow.getCell('fecha').value = `TOTALES (${data?.length ?? 0} transacciones)`;

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────
  } else if (type === 'customers') {
    sheetName = 'Clientes';
    filename  = `clientes_${tenant.subdomain}_${new Date().toISOString().slice(0,10)}`;

    const [{ data: customers }, { data: enrollments }] = await Promise.all([
      db.from('customers')
        .select('id, name, phone, email, access_code, is_active, notes, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      db.from('customer_program_enrollments')
        .select('customer_id, current_points, lifetime_points, last_activity_at, reward_programs(name, type)')
        .eq('tenant_id', tenantId),
    ]);

    type CustRow = {
      id: string; name: string; phone: string | null; email: string | null;
      access_code: string; is_active: boolean; notes: string | null; created_at: string;
    };
    type EnrollRow = {
      customer_id: string; current_points: number; lifetime_points: number;
      last_activity_at: string; reward_programs: { name: string; type: string } | null;
    };

    // Build per-customer aggregates from enrollments
    const enrollMap = new Map<string, { points: number; lifetime: number; lastActivity: string; programs: string[] }>();
    for (const e of (enrollments ?? []) as unknown as EnrollRow[]) {
      const existing = enrollMap.get(e.customer_id);
      const progName = e.reward_programs?.name ?? '—';
      if (!existing) {
        enrollMap.set(e.customer_id, {
          points: e.current_points,
          lifetime: e.lifetime_points,
          lastActivity: e.last_activity_at,
          programs: [progName],
        });
      } else {
        existing.points      += e.current_points;
        existing.lifetime    += e.lifetime_points;
        existing.programs.push(progName);
        if (new Date(e.last_activity_at) > new Date(existing.lastActivity)) {
          existing.lastActivity = e.last_activity_at;
        }
      }
    }

    const ws = wb.addWorksheet(sheetName);
    ws.columns = [
      { header: 'Nombre',             key: 'nombre',      width: 25 },
      { header: 'Teléfono',           key: 'telefono',    width: 16 },
      { header: 'Email',              key: 'email',       width: 28 },
      { header: 'Código de acceso',   key: 'codigo',      width: 16 },
      { header: 'Estado',             key: 'estado',      width: 10 },
      { header: 'Registro',           key: 'registro',    width: 18 },
      { header: 'Última actividad',   key: 'actividad',   width: 18 },
      { header: 'Pts. actuales',      key: 'pts',         width: 14 },
      { header: 'Pts. históricos',    key: 'lifetime',    width: 14 },
      { header: 'Programas inscritos',key: 'programas',   width: 30 },
      { header: 'Notas internas',     key: 'notas',       width: 30 },
    ];

    styleHeaderRow(ws);

    for (const c of (customers ?? []) as unknown as CustRow[]) {
      const agg = enrollMap.get(c.id);
      const row = ws.addRow({
        nombre:    c.name,
        telefono:  c.phone ?? '',
        email:     c.email ?? '',
        codigo:    c.access_code,
        estado:    c.is_active ? 'Activo' : 'Inactivo',
        registro:  fmtDateOnly(c.created_at),
        actividad: agg ? fmtDateOnly(agg.lastActivity) : '—',
        pts:       agg?.points   ?? 0,
        lifetime:  agg?.lifetime ?? 0,
        programas: agg?.programs.join(', ') ?? '—',
        notas:     c.notes ?? '',
      });

      const estadoCell = row.getCell('estado');
      estadoCell.font = {
        color: { argb: c.is_active ? 'FF16A34A' : 'FFDC2626' },
        bold: true,
      };
    }

  // ── REDEMPTIONS ───────────────────────────────────────────────────────────
  } else if (type === 'redemptions') {
    sheetName = 'Canjes';
    filename  = `canjes_${tenant.subdomain}_${fromDate.toISOString().slice(0,10)}_${toDate.toISOString().slice(0,10)}`;

    const { data, error } = await db
      .from('customer_reward_redemptions')
      .select(`
        id, redemption_code, status, created_at, used_at, expires_at, cancelled_at,
        customers(name, phone),
        rewards(name, cost_points, reward_programs(name))
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const STATUS_LABELS: Record<string, string> = {
      pending: 'Pendiente', used: 'Usado', expired: 'Expirado', cancelled: 'Cancelado',
    };

    type RedRow = {
      id: string; redemption_code: string; status: string;
      created_at: string; used_at: string | null; expires_at: string | null; cancelled_at: string | null;
      customers: { name: string; phone: string | null } | null;
      rewards: { name: string; cost_points: number; reward_programs: { name: string } | null } | null;
    };

    const ws = wb.addWorksheet(sheetName);
    ws.columns = [
      { header: 'Código de canje',  key: 'codigo',    width: 16 },
      { header: 'Fecha',            key: 'fecha',     width: 20 },
      { header: 'Cliente',          key: 'cliente',   width: 25 },
      { header: 'Teléfono',         key: 'telefono',  width: 16 },
      { header: 'Recompensa',       key: 'reward',    width: 25 },
      { header: 'Programa',         key: 'programa',  width: 22 },
      { header: 'Pts. canjeados',   key: 'puntos',    width: 14 },
      { header: 'Estado',           key: 'estado',    width: 12 },
      { header: 'Fecha de uso',     key: 'usado',     width: 20 },
      { header: 'Vence',            key: 'vence',     width: 20 },
    ];

    styleHeaderRow(ws);

    const STATUS_COLORS: Record<string, string> = {
      pending: 'FFD97706', used: 'FF16A34A', expired: 'FF6B7280', cancelled: 'FFDC2626',
    };

    for (const r of (data ?? []) as unknown as RedRow[]) {
      const row = ws.addRow({
        codigo:   r.redemption_code,
        fecha:    fmtDate(r.created_at),
        cliente:  r.customers?.name ?? '',
        telefono: r.customers?.phone ?? '',
        reward:   r.rewards?.name ?? '',
        programa: r.rewards?.reward_programs?.name ?? '',
        puntos:   r.rewards?.cost_points ?? 0,
        estado:   STATUS_LABELS[r.status] ?? r.status,
        usado:    r.used_at ? fmtDate(r.used_at) : '—',
        vence:    r.expires_at ? fmtDate(r.expires_at) : 'Sin vencimiento',
      });

      row.getCell('estado').font = {
        bold: true,
        color: { argb: STATUS_COLORS[r.status] ?? 'FF374151' },
      };
    }

    // Summary
    const rows = (data ?? []) as unknown as RedRow[];
    const used      = rows.filter((r) => r.status === 'used').length;
    const pending   = rows.filter((r) => r.status === 'pending').length;
    const cancelled = rows.filter((r) => r.status === 'cancelled').length;
    ws.addRow({});
    const summaryRow = ws.addRow({
      codigo: `Total: ${rows.length}  |  Usados: ${used}  |  Pendientes: ${pending}  |  Cancelados: ${cancelled}`,
    });
    summaryRow.font = { bold: true, color: { argb: 'FF4338CA' } };
  }

  // ── Generate buffer & return ─────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    },
  });
}
