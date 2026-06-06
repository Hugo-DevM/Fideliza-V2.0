import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { getCustomerPoints } from '@/modules/customers';
import { getCustomerTransactionHistory } from '@/modules/transactions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ToggleStatusButton from './ToggleStatusButton';
import EditCustomerModal from './EditCustomerModal';
import { NotFoundError } from '@/lib/middleware/errors';
import type { ProgramConfig } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const { data } = await db.from('customers').select('name').eq('tenant_id', tenantId).eq('id', id).single();
  return { title: `${data?.name ?? 'Cliente'} — Fideliza+` };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId, settings } = await getAuthenticatedTenant();

  try {
    const db = createServiceRoleClient();

    const [{ customer, enrollments }, { transactions }, { count: txTotal }, { data: vouchers }] = await Promise.all([
      getCustomerPoints(tenantId, id),
      getCustomerTransactionHistory(tenantId, id, undefined, 1, 8),
      db.from('transactions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('customer_id', id),
      db.from('customer_reward_redemptions')
        .select('id, redemption_code, status, expires_at, created_at, rewards(name)')
        .eq('tenant_id', tenantId)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const { data: programs } = enrollments.length
      ? await db.from('reward_programs').select('id, type, config').in('id', enrollments.map((e) => e.program_id))
      : { data: [] };

    // Build program config map
    const programConfigMap = new Map<string, { type: string; config: ProgramConfig }>(
      (programs ?? []).map((p) => [p.id, { type: p.type, config: p.config as unknown as ProgramConfig }])
    );

    // Build program name map for transactions
    const programNameMap = new Map(enrollments.map((e) => [e.program_id, e.program_name]));

    // Aggregate stats
    const totalPoints    = enrollments.reduce((s, e) => s + e.current_points, 0);
    const totalVisits    = enrollments.reduce((s, e) => s + (e.visit_count ?? 0), 0);
    const totalLifetime  = enrollments.reduce((s, e) => s + e.lifetime_points, 0);

    const initials = customer.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
    const avatarColor = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];

    return (
      <div className="space-y-5">

        {/* Customer hero card */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white ${avatarColor}`}>
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${customer.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {customer.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-block rounded-lg border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] px-2.5 py-1 font-mono text-xs text-gray-600 dark:text-gray-300">
                    {customer.access_code}
                  </span>
                  {customer.phone && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {formatPhone(customer.phone)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Miembro desde {new Date(customer.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {customer.notes && (
                  <p className="mt-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    {customer.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <EditCustomerModal
                customerId={customer.id}
                initialName={customer.name}
                initialPhone={customer.phone ?? null}
                initialNotes={customer.notes ?? null}
                phonePrefix={settings.phone_prefix ?? null}
              />
              <ToggleStatusButton customerId={customer.id} isActive={customer.is_active} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <PointsIcon className="h-4 w-4" />, iconBg: 'bg-indigo-100 dark:bg-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400', label: 'Saldo de puntos', value: totalPoints, sub: settings.program_label },
            { icon: <VisitIcon className="h-4 w-4" />,  iconBg: 'bg-emerald-100 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400', label: 'Visitas totales', value: totalVisits, sub: 'registradas' },
            { icon: <TrendIcon className="h-4 w-4" />,  iconBg: 'bg-violet-100 dark:bg-violet-500/20', iconColor: 'text-violet-600 dark:text-violet-400', label: 'Puntos de por vida', value: totalLifetime, sub: 'acumulados' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{s.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{s.value}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Enrollments */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Saldos por programa</h2>
            </div>
            {!enrollments.length ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin inscripciones aún.</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                {enrollments.map((e) => {
                  const prog = programConfigMap.get(e.program_id);
                  const isStamp = e.program_type === 'stamp';
                  const isVisit = e.program_type === 'visit';
                  const isPoints = e.program_type === 'points';
                  const isCashback = e.program_type === 'cashback';

                  const stampsNeeded = isStamp && prog ? (prog.config as { stamps_needed?: number }).stamps_needed ?? 10 : 10;
                  const visitsNeeded = isVisit && prog ? (prog.config as { visits_needed?: number }).visits_needed ?? 10 : 10;
                  const minRedeem   = isPoints && prog ? (prog.config as { min_redeem?: number }).min_redeem ?? 100 : 100;

                  const progressPct = isPoints
                    ? Math.min(100, Math.round((e.current_points / minRedeem) * 100))
                    : 0;

                  return (
                    <div key={e.program_id} className="px-5 py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                            <ProgramTypeIcon type={e.program_type} className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{e.program_name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">
                              {PROGRAM_TYPE_LABELS[e.program_type] ?? e.program_type}
                              {isPoints && ` · lifetime ${e.lifetime_points}`}
                              {isStamp && ` · ${stampsNeeded - e.stamp_count} para premio`}
                              {isVisit && ` · ${visitsNeeded - e.visit_count} para premio`}
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white shrink-0">
                          {isStamp ? `${e.stamp_count}/${stampsNeeded}` :
                           isVisit ? `${e.visit_count}/${visitsNeeded}` :
                           e.current_points}
                        </p>
                      </div>

                      {/* Points progress bar */}
                      {isPoints && (
                        <>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#2a3147] overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {Math.max(0, minRedeem - e.current_points)} pts para el próximo premio
                          </p>
                        </>
                      )}

                      {/* Stamp grid */}
                      {isStamp && (
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: stampsNeeded }).map((_, i) => (
                            <div key={i} className={[
                              'flex h-8 w-8 items-center justify-center rounded-full transition',
                              i < e.stamp_count
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                                : 'border-2 border-dashed border-gray-200 dark:border-[#2a3147] text-gray-300 dark:text-gray-600',
                            ].join(' ')}>
                              {i < e.stamp_count
                                ? <CheckSmallIcon className="h-3.5 w-3.5" />
                                : <span className="h-1 w-1 rounded-full bg-current" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Visit dots */}
                      {isVisit && (
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: visitsNeeded }).map((_, i) => (
                            <div key={i} className={[
                              'h-8 w-8 rounded-full transition',
                              i < e.visit_count
                                ? 'bg-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                                : 'border-2 border-dashed border-gray-200 dark:border-[#2a3147]',
                            ].join(' ')} />
                          ))}
                        </div>
                      )}

                      {isCashback && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{e.current_points} pts de cashback disponibles</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction history */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Historial de transacciones</h2>
              {(txTotal ?? 0) > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{txTotal} en total</span>
              )}
            </div>
            {!transactions.length ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin transacciones aún.</p>
            ) : (
              <>
                <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                  {transactions.map((tx) => {
                    const isPositive = tx.points_delta > 0;
                    const progName = programNameMap.get(tx.program_id) ?? '—';
                    const timeStr = formatTxTime(new Date(tx.created_at), settings.timezone ?? 'America/Mexico_City');
                    const desc = tx.note ?? TX_TYPE_LABELS[tx.type] ?? tx.type;
                    const txType = tx.type as string;
                    const deltaLabel =
                      txType === 'stamp' ? '+1 sello' :
                      txType === 'visit' ? '+1 visita' :
                      `${isPositive ? '+' : ''}${tx.points_delta} pts`;

                    return (
                      <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs ${
                          isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        }`}>
                          {isPositive ? <PlusSmallIcon className="h-4 w-4" /> : <ArrowReturnIcon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{desc}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{timeStr} · {progName}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                          {deltaLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {(txTotal ?? 0) > 8 && (
                  <div className="border-t border-gray-100 dark:border-[#1e2438] px-5 py-3">
                    <Link
                      href={`/dashboard/customers/${id}/transactions`}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                    >
                      Ver todas las transacciones →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Vouchers */}
        {vouchers && vouchers.length > 0 && (
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Vouchers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#1e2438]">
                    {['Código', 'Recompensa', 'Estado', 'Vence', 'Emitido'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                  {(vouchers as unknown as Record<string, unknown>[]).map((v) => {
                    const reward = v['rewards'] as { name: string } | null;
                    const vstatus = v['status'] as string;
                    return (
                      <tr key={v['id'] as string} className="hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{v['redemption_code'] as string}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{reward?.name ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${VOUCHER_STATUS_STYLES[vstatus] ?? 'bg-gray-100 text-gray-500'}`}>
                            {VOUCHER_STATUS_LABELS[vstatus] ?? vstatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                          {v['expires_at'] ? new Date(v['expires_at'] as string).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '—'}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(v['created_at'] as string).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return phone;
}

function formatTxTime(date: Date, timezone: string): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs     = Math.floor(mins / 60);
  const timeStr = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  if (hrs < 24)  return `Hoy · ${timeStr}`;
  if (hrs < 48)  return `Ayer · ${timeStr}`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: timezone });
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  points: 'Puntos', stamp: 'Sellos', visit: 'Visitas', cashback: 'Cashback',
};

const TX_TYPE_LABELS: Record<string, string> = {
  earn: 'Compra', redeem: 'Canje de recompensa', adjustment: 'Ajuste',
  expire: 'Puntos expirados', refund: 'Reembolso', stamp: 'Sello agregado', visit: 'Visita registrada',
};

const VOUCHER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', used: 'Usado', expired: 'Expirado', cancelled: 'Cancelado',
};

const VOUCHER_STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
  used:      'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
  expired:   'bg-gray-100 dark:bg-[#1e2438] text-gray-400 dark:text-gray-500',
  cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400',
};

// ── Icons ─────────────────────────────────────────────────────────

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function PointsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
}

function VisitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

function PlusSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ArrowReturnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 15-6 6m0 0-6-6m6 6V9a6 6 0 0 1 12 0v3" />
    </svg>
  );
}

function CheckSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ProgramTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'stamp') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
  if (type === 'visit') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
  if (type === 'cashback') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
  // points (default)
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}
