import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { getCustomerPoints } from '@/modules/customers';
import { getCustomerTransactionHistory } from '@/modules/transactions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ToggleStatusButton from './ToggleStatusButton';
import { NotFoundError } from '@/lib/middleware/errors';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId, settings } = await getAuthenticatedTenant();

  try {
    const [{ customer, enrollments }, { transactions }] = await Promise.all([
      getCustomerPoints(tenantId, id),
      getCustomerTransactionHistory(tenantId, id, undefined, 1, 20),
    ]);

    // Pending vouchers
    const db = createServiceRoleClient();
    const { data: vouchers } = await db
      .from('customer_reward_redemptions')
      .select('id, redemption_code, status, expires_at, created_at, rewards(name)')
      .eq('tenant_id', tenantId)
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    const typeLabel: Record<string, string> = {
      earn: 'Ganar', redeem: 'Canjear', adjustment: 'Ajuste', expire: 'Expirar', refund: 'Reembolso',
    };

    return (
      <div className="space-y-5">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400">
          <Link href="/dashboard/customers" className="hover:text-gray-600">Clientes</Link>
          {' / '}
          <span className="text-gray-700 font-medium">{customer.name}</span>
        </nav>

        {/* Customer header */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  customer.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                }`}>
                  {customer.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-sm text-indigo-600">{customer.access_code}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                {customer.phone && <span>📞 {customer.phone}</span>}
                <span>Miembro desde {new Date(customer.created_at).toLocaleDateString('es')}</span>
              </div>
              {customer.notes && (
                <p className="mt-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700 border border-yellow-100">
                  📝 {customer.notes}
                </p>
              )}
            </div>
            <ToggleStatusButton
              customerId={customer.id}
              isActive={customer.is_active}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Enrollments */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Saldos de programas</h2>
            {!enrollments.length ? (
              <p className="text-sm text-gray-400">Sin inscripción en ningún programa aún.</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((e) => (
                  <div key={e.program_id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{e.program_name}</p>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 capitalize">
                        {e.program_type}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span><strong className="text-gray-800">{e.current_points}</strong> {settings.program_label}</span>
                      {e.program_type === 'stamp' && <span><strong>{e.stamp_count}</strong> sellos</span>}
                      {e.program_type === 'visit' && <span><strong>{e.visit_count}</strong> visitas</span>}
                      <span className="text-gray-300">{e.lifetime_points} total histórico</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vouchers */}
        {vouchers && vouchers.length > 0 && (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Vouchers</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {['Código', 'Recompensa', 'Estado', 'Vence', 'Emitido'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(vouchers as unknown as Record<string, unknown>[]).map((v) => {
                  const reward = v['rewards'] as { name: string } | null;
                  const status = v['status'] as string;
                  return (
                    <tr key={v['id'] as string}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{v['redemption_code'] as string}</td>
                      <td className="px-4 py-2 text-gray-600">{reward?.name ?? '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === 'pending'  ? 'bg-yellow-50 text-yellow-700' :
                          status === 'used'     ? 'bg-green-50 text-green-700' :
                          status === 'expired'  ? 'bg-gray-100 text-gray-400' :
                          'bg-red-50 text-red-500'
                        }`}>{status}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {v['expires_at'] ? new Date(v['expires_at'] as string).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {new Date(v['created_at'] as string).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction history */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Historial de transacciones</h2>
          </div>
          {!transactions.length ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Sin transacciones aún.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {['Tipo', 'Delta', 'Saldo tras', 'Nota', 'Fecha'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.type === 'earn'   ? 'bg-green-50 text-green-700' :
                        tx.type === 'redeem' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{typeLabel[tx.type] ?? tx.type}</span>
                    </td>
                    <td className={`px-4 py-2 font-mono font-semibold ${tx.points_delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.points_delta > 0 ? '+' : ''}{tx.points_delta}
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-500">{tx.balance_after}</td>
                    <td className="px-4 py-2 text-gray-500 max-w-xs truncate">{tx.note ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
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
