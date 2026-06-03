'use client';

import { useState, useTransition } from 'react';
import { loadMoreCustomerTransactions, type CustomerTxRow } from './actions';

const TX_TYPE_LABELS: Record<string, string> = {
  earn: 'Compra', redeem: 'Canje de recompensa', adjustment: 'Ajuste',
  expire: 'Puntos expirados', refund: 'Reembolso', stamp: 'Sello agregado', visit: 'Visita registrada',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TransactionList({
  customerId,
  initialRows,
  initialHasMore,
}: {
  customerId: string;
  initialRows: CustomerTxRow[];
  initialHasMore: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const result = await loadMoreCustomerTransactions(customerId, rows.length);
      setRows((prev) => [...prev, ...result.rows]);
      setHasMore(result.hasMore);
    });
  }

  if (!rows.length) {
    return <p className="px-5 py-16 text-center text-sm text-gray-400 dark:text-gray-500">Sin transacciones aún.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
        {rows.map((tx) => {
          const isPos = tx.points_delta > 0;
          const desc = tx.note ?? TX_TYPE_LABELS[tx.type] ?? tx.type;
          const delta =
            tx.type === 'stamp' ? '+1 sello' :
            tx.type === 'visit' ? '+1 visita' :
            `${isPos ? '+' : ''}${tx.points_delta} pts`;

          return (
            <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isPos
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
              }`}>
                {isPos ? <PlusIcon /> : <ArrowIcon />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{desc}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.created_at)} · {tx.programName}</p>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${isPos ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {delta}
              </span>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="border-t border-gray-100 dark:border-[#1e2438] px-5 py-3 text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition"
          >
            {isPending ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 15-6 6m0 0-6-6m6 6V9a6 6 0 0 1 12 0v3" />
    </svg>
  );
}
