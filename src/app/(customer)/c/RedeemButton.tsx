'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { redeemPortalRewardAction } from './actions';

interface RedeemButtonProps {
  tenantId: string;
  customerId: string;
  rewardId: string;
  enrollmentId: string;
  primaryColor: string;
}

export default function RedeemButton({
  tenantId,
  customerId,
  rewardId,
  enrollmentId,
  primaryColor,
}: RedeemButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [code, setCode]   = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleRedeem() {
    setError(null);
    startTransition(async () => {
      const result = await redeemPortalRewardAction(tenantId, customerId, rewardId, enrollmentId);
      if ('error' in result) {
        setError(result.error);
      } else {
        setCode(result.redemptionCode);
        router.refresh(); // reload so the Points tab shows the new voucher
      }
    });
  }

  // After successful redemption — show the code
  if (code) {
    return (
      <div
        className="mt-3 rounded-xl border-2 p-4 text-center"
        style={{ borderColor: primaryColor, borderStyle: 'dashed' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
          Tu código de canje
        </p>
        <p className="font-mono text-xl font-bold tracking-widest text-gray-900">{code}</p>
        <p className="mt-2 text-xs text-gray-400">Muéstraselo al empleado para recibir tu premio</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
      <button
        onClick={handleRedeem}
        disabled={isPending}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {isPending ? 'Procesando…' : 'Canjear premio'}
      </button>
    </div>
  );
}
