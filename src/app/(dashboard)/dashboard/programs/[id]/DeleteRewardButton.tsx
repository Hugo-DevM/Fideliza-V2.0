'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteRewardAction } from './actions';

export default function DeleteRewardButton({
  programId,
  rewardId,
  rewardName,
}: {
  programId: string;
  rewardId: string;
  rewardName: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteRewardAction(programId, rewardId);
      setShowConfirm(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="shrink-0 rounded-lg border border-gray-200 dark:border-[#2a3147] px-2.5 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:border-red-200 dark:hover:border-red-900/50 hover:text-red-500 dark:hover:text-red-400 transition"
      >
        Eliminar
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar recompensa?</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{rewardName}</span> ya no estará
              disponible para nuevos canjes. El historial existente se conserva.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
