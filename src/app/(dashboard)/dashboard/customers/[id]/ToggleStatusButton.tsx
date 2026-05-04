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
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        isActive
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-green-200 text-green-600 hover:bg-green-50'
      }`}
    >
      {isPending ? '…' : isActive ? 'Desactivar' : 'Reactivar'}
    </button>
  );
}
