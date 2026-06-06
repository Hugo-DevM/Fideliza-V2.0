'use client';

import { useState, useTransition } from 'react';
import { loadMoreProgramTransactions, type ProgramTxRow } from './actions';
import { useDashboardI18n } from '@/lib/i18n/dashboard-context';
import { formatDateTime } from '@/lib/utils/date';

const AVATAR_COLORS = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];

export default function TransactionList({
  programId,
  programLabel,
  initialRows,
  initialHasMore,
}: {
  programId: string;
  programLabel: string;
  initialRows: ProgramTxRow[];
  initialHasMore: boolean;
}) {
  const { timezone, locale } = useDashboardI18n();
  const [rows, setRows] = useState(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const result = await loadMoreProgramTransactions(programId, rows.length);
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
          const initials = tx.customerName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
          const color = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
          const action = isPos
            ? `ganó ${tx.points_delta} ${programLabel}`
            : tx.note ? `canjeó ${tx.note}` : `canjeó ${Math.abs(tx.points_delta)} pts`;

          return (
            <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-100">
                  <span className="font-semibold">{tx.customerName}</span>{' '}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">{action}</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(tx.created_at, timezone, locale)}</p>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${isPos ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {isPos ? `+${tx.points_delta}` : tx.points_delta} pts
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
