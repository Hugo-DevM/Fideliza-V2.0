'use client';

import { useState, useTransition } from 'react';
import { addMissionProgressAction } from './actions';

interface MissionProgress {
  challengeId: string;
  title: string;
  description: string | null;
  target: number;
  bonusPoints: number;
  progress: number;
  completedAt: string | null;
  endsAt: string | null;
}

interface Props {
  customerId: string;
  missions: MissionProgress[];
}

export default function MissionsCard({ customerId, missions }: Props) {
  const active    = missions.filter((m) => !m.completedAt);
  const completed = missions.filter((m) => !!m.completedAt);

  if (missions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-orange-100 dark:border-orange-500/20">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
          <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Misiones</h2>
        {active.length > 0 && (
          <span className="ml-auto rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:text-orange-400">
            {active.length} activa{active.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50 dark:divide-[#1e2438]">
        {active.map((m) => (
          <MissionRow key={m.challengeId} mission={m} customerId={customerId} />
        ))}

        {completed.map((m) => (
          <div key={m.challengeId} className="flex items-center gap-3 px-5 py-3.5 opacity-60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate line-through">{m.title}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Completada · +{m.bonusPoints} pts
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionRow({ mission: m, customerId }: { mission: MissionProgress; customerId: string }) {
  const [progress, setProgress] = useState(m.progress);
  const [completed, setCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<'success' | 'complete' | null>(null);

  const pct = Math.min(100, Math.round((progress / m.target) * 100));

  function handleAdd() {
    startTransition(async () => {
      const res = await addMissionProgressAction(customerId, m.challengeId);
      if ('success' in res && res.success) {
        setProgress(res.progress);
        if (res.completed) {
          setCompleted(true);
          setFlash('complete');
        } else {
          setFlash('success');
        }
        setTimeout(() => setFlash(null), 2000);
      }
    });
  }

  if (completed) {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
          <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">¡Misión completada!</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">+{m.bonusPoints} pts acreditados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{m.title}</p>
          {m.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.description}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {progress} / {m.target} · <span className="text-orange-600 dark:text-orange-400 font-medium">+{m.bonusPoints} pts al completar</span>
            {m.endsAt && (
              <> · hasta {new Date(m.endsAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className={[
            'shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
            flash === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30',
            isPending ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {flash === 'success' ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Listo
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              +1 progreso
            </>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-400 dark:bg-orange-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
