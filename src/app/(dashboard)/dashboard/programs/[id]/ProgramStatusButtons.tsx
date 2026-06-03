'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProgramStatusAction } from './actions';
import type { ProgramStatus } from '@/lib/types';

interface Props {
  programId:       string;
  currentStatus:   ProgramStatus;
  plan:            string;
  enrollmentCount: number;
}

const TRANSITIONS: Record<ProgramStatus, { label: string; next: ProgramStatus; style: string }[]> = {
  draft:    [{ label: 'Activar',   next: 'active',   style: 'rounded-xl bg-emerald-600 text-white hover:bg-emerald-700' }],
  active:   [{ label: 'Pausar',   next: 'paused',   style: 'rounded-xl border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30' },
             { label: 'Archivar', next: 'archived', style: 'rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' }],
  paused:   [{ label: 'Reanudar', next: 'active',   style: 'rounded-xl bg-emerald-600 text-white hover:bg-emerald-700' },
             { label: 'Archivar', next: 'archived', style: 'rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' }],
  archived: [{ label: 'Reactivar', next: 'active', style: 'rounded-xl bg-emerald-600 text-white hover:bg-emerald-700' }],
};

export default function ProgramStatusButtons({ programId, currentStatus, plan, enrollmentCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const router = useRouter();

  const allTransitions = TRANSITIONS[currentStatus] ?? [];
  const transitions = (plan === 'free' || plan === 'starter')
    ? allTransitions.filter((t) => t.next !== 'archived')
    : allTransitions;

  function runTransition(next: ProgramStatus) {
    startTransition(async () => {
      await updateProgramStatusAction(programId, next);
      router.refresh();
    });
  }

  if (!transitions.length) return null;

  return (
    <>
      <div className="flex gap-2">
        {transitions.map((t) => (
          <button
            key={t.next}
            disabled={isPending}
            onClick={() => t.next === 'archived' ? setShowArchiveModal(true) : runTransition(t.next)}
            className={`px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${t.style}`}
          >
            {isPending ? '…' : t.label}
          </button>
        ))}
      </div>

      {/* Archive confirmation modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl">

            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <h2 className="text-center text-base font-bold text-gray-900 dark:text-white">¿Archivar este programa?</h2>

            <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 p-4 space-y-2 text-sm text-red-700 dark:text-red-400">
              <p className="font-semibold">Esto afectará a tus clientes de inmediato:</p>
              <ul className="space-y-1.5 text-red-600 dark:text-red-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span><strong>{enrollmentCount} cliente{enrollmentCount !== 1 ? 's' : ''}</strong> inscritos perderán acceso al programa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>No se podrán sumar ni canjear puntos, sellos o visitas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>Los puntos acumulados se conservan pero los clientes no podrán verlos.</span>
                </li>
              </ul>
            </div>

            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">Esta acción no se puede deshacer desde el panel.</p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={() => { setShowArchiveModal(false); runTransition('archived'); }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Archivando…' : 'Sí, archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
