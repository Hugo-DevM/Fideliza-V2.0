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
      className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${
        isActive
          ? 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
          : 'border-green-200 text-green-600 hover:bg-green-50'
      }`}
    >
      {isPending ? '…' : isActive ? 'Desactivar' : 'Activar'}
    </button>
  );
}
