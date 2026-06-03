'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleRewardAction } from './actions';

export default function ToggleRewardButton({
  programId, rewardId, isActive,
}: {
  programId: string; rewardId: string; isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await toggleRewardAction(programId, rewardId, !isActive);
        router.refresh();
      })}
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
        isActive
          ? 'border-gray-200 dark:border-[#2a3147] text-gray-400 dark:text-gray-500 hover:border-red-200 dark:hover:border-red-900/50 hover:text-red-500 dark:hover:text-red-400'
          : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
      }`}
    >
      {isPending ? '…' : isActive ? 'Desactivar' : 'Activar'}
    </button>
  );
}
