import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { listCustomers } from '@/modules/customers';
import NewCustomerModal from './NewCustomerModal';

export const metadata = { title: 'Clientes — Fideliza+' };

const LIMIT = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { tenantId, planLimits } = await getAuthenticatedTenant();
  const { page: pageStr, q } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));

  const { customers, total } = await listCustomers(tenantId, page, LIMIT);
  const atCustomerLimit = planLimits.maxCustomers !== null && total >= planLimits.maxCustomers;

  // Client-side search note: search is applied to the already-fetched list.
  // For large datasets this should move to the DB query.
  const filtered = q
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.phone?.includes(q) ||
        c.access_code.toLowerCase().includes(q.toLowerCase())
      )
    : customers;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Upgrade banner when at customer limit */}
      {atCustomerLimit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Límite de clientes alcanzado ({total}/{planLimits.maxCustomers})
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Has llegado al máximo de clientes de tu plan actual. Actualiza para agregar más.
            </p>
          </div>
          <a
            href="/dashboard/settings"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
          >
            Actualizar plan →
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{total} en total{planLimits.maxCustomers !== null ? ` · máx. ${planLimits.maxCustomers}` : ''}</p>
        </div>
        {!atCustomerLimit && <NewCustomerModal />}
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono o código…"
          className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Buscar
        </button>
        {q && (
          <Link href="/dashboard/customers" className="rounded-lg border px-3 py-2 text-sm text-gray-400 hover:bg-gray-50">
            Limpiar
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        {!filtered.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">
              {q ? `Sin clientes que coincidan con "${q}"` : 'Sin clientes aún. ¡Agrega el primero!'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                {['Nombre', 'Código de acceso', 'Email / Teléfono', 'Estado', 'Registro', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{c.access_code}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                    }`}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/customers/${c.id}`}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="rounded border px-3 py-1 hover:bg-gray-50"
              >← Ant</Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="rounded border px-3 py-1 hover:bg-gray-50"
              >Sig →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
