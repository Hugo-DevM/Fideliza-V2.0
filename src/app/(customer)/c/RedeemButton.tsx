'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { redeemPortalRewardAction } from './actions';

interface RedeemButtonProps {
  tenantId: string;
  customerId: string;
  rewardId: string;
  enrollmentId: string;
  primaryColor: string;
  rewardName: string;
}

export default function RedeemButton({
  tenantId,
  customerId,
  rewardId,
  enrollmentId,
  primaryColor,
  rewardName,
}: RedeemButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [code, setCode]   = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('code') ?? '';

  function handleRedeem() {
    setError(null);
    startTransition(async () => {
      const result = await redeemPortalRewardAction(tenantId, customerId, rewardId, enrollmentId);
      if ('error' in result) {
        setError(result.error);
      } else {
        setCode(result.redemptionCode);
      }
    });
  }

  function handleClose() {
    router.push(`?code=${accessCode}&tab=points`);
    router.refresh();
  }

  return (
    <div className="mt-3">
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <button
        onClick={handleRedeem}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
        {isPending ? 'Procesando…' : 'Canjear premio'}
      </button>

      {/* Success overlay */}
      {code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-gray-900">¡Premio canjeado!</h2>
            <p className="mt-1 text-sm text-gray-500">{rewardName}</p>

            <div
              className="mt-5 rounded-2xl border-2 border-dashed px-4 py-4"
              style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}0D` }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
                Tu código de canje
              </p>
              <p className="font-mono text-2xl font-bold tracking-widest text-gray-900">{code}</p>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Muéstraselo al empleado para recibir tu premio
            </p>

            <button
              onClick={handleClose}
              className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              Ver en mis Puntos →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
