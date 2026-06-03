'use client';

import { useState, useTransition } from 'react';
import { loadMoreProgramTransactions, type ProgramTxRow } from './transactions/actions';

const AVATAR_COLORS = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

export default function ProgramTransactionsCard({
  programId,
  programLabel,
  txTotal,
  initialRows,
  initialHasMore,
}: {
  programId: string;
  programLabel: string;
  txTotal: number;
  initialRows: ProgramTxRow[];
  initialHasMore: boolean;
}) {
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

  return (
    <div className="min-h-[220px] rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Transacciones recientes</h2>
        {txTotal > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{txTotal} en total</span>
        )}
      </div>

      {!rows.length ? (
        <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin transacciones aún.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
            {rows.map((tx) => {
              const isPos    = tx.points_delta > 0;
              const initials = tx.customerName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              const color    = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
              const action   = isPos
                ? `ganó ${tx.points_delta} ${programLabel}`
                : tx.note ? `canjeó ${tx.note}` : `canjeó ${Math.abs(tx.points_delta)} pts`;

              return (
                <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-100">
                      <span className="font-semibold">{tx.customerName}</span>{' '}
                      <span className="text-gray-500 dark:text-gray-400 font-normal">{action}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatAgo(tx.created_at)}</p>
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
      )}
    </div>
  );
}
