'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProgramStatusAction } from './actions';
import type { ProgramStatus } from '@/lib/types';

interface Props {
  programId: string;
  currentStatus: ProgramStatus;
}

// Allowed transitions
const TRANSITIONS: Record<ProgramStatus, { label: string; next: ProgramStatus; style: string }[]> = {
  draft:    [{ label: 'Activar',   next: 'active',   style: 'bg-green-600 text-white hover:bg-green-700' }],
  active:   [{ label: 'Pausar',    next: 'paused',   style: 'bg-yellow-500 text-white hover:bg-yellow-600' },
             { label: 'Archivar',  next: 'archived', style: 'border border-red-300 text-red-600 hover:bg-red-50' }],
  paused:   [{ label: 'Reanudar', next: 'active',   style: 'bg-green-600 text-white hover:bg-green-700' },
             { label: 'Archivar', next: 'archived', style: 'border border-red-300 text-red-600 hover:bg-red-50' }],
  archived: [],
};

export default function ProgramStatusButtons({ programId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (!transitions.length) return <span className="text-sm text-gray-400">Archivado — solo lectura</span>;

  return (
    <div className="flex gap-2">
      {transitions.map((t) => (
        <button
          key={t.next}
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateProgramStatusAction(programId, t.next);
              router.refresh();
            });
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${t.style}`}
        >
          {isPending ? '…' : t.label}
        </button>
      ))}
    </div>
  );
}
