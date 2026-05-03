import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { listCustomers } from '@/modules/customers';
import NewCustomerModal from './NewCustomerModal';

export const metadata = { title: 'Customers — Fideliza+' };

const LIMIT = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { tenantId } = await getAuthenticatedTenant();
  const { page: pageStr, q } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));

  const { customers, total } = await listCustomers(tenantId, page, LIMIT);

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
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <NewCustomerModal />
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, phone, or code…"
          className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Search
        </button>
        {q && (
          <Link href="/dashboard/customers" className="rounded-lg border px-3 py-2 text-sm text-gray-400 hover:bg-gray-50">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {!filtered.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">
              {q ? `No customers match "${q}"` : 'No customers yet. Add your first one!'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                {['Name', 'Access code', 'Email / Phone', 'Status', 'Joined', ''].map((h) => (
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
                    {c.email ?? c.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
                    }`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/customers/${c.id}`}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      View →
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
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="rounded border px-3 py-1 hover:bg-gray-50"
              >← Prev</Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="rounded border px-3 py-1 hover:bg-gray-50"
              >Next →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
