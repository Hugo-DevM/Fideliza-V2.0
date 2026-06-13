'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleCustomerStatusAction } from './actions';

export default function ToggleStatusButton({
  customerId,
  isActive,
}: {
  customerId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await toggleCustomerStatusAction(customerId, !isActive);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`w-full rounded-xl border px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        isActive
          ? 'border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
      }`}
    >
      {isPending ? '…' : isActive ? 'Desactivar' : 'Reactivar'}
    </button>
  );
}
