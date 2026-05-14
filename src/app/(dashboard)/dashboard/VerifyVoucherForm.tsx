'use client';

import { useState, useTransition, useRef } from 'react';
import { verifyVoucherAction } from './programs/[id]/actions';

interface RedemptionInfo {
  redemptionCode: string;
  customerName: string | null;
  rewardName: string | null;
  rewardDesc: string | null;
  usedAt: string;
}

export default function VerifyVoucherForm() {
  const [code, setCode]               = useState('');
  const [error, setError]             = useState('');
  const [info, setInfo]               = useState<RedemptionInfo | null>(null);
  const [isPending, startTransition]  = useTransition();
  const inputRef                      = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setInfo(null);

    startTransition(async () => {
      const result = await verifyVoucherAction(code);
      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('success' in result) {
        setInfo({
          redemptionCode: result.redemptionCode ?? code.toUpperCase(),
          customerName:   result.customerName ?? null,
          rewardName:     result.rewardName ?? null,
          rewardDesc:     result.rewardDesc ?? null,
          usedAt:         result.usedAt ?? new Date().toISOString(),
        });
        setCode('');
      }
    });
  }

  function handleClose() {
    setInfo(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const usedTime = info
    ? new Date(info.usedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Canjear recompensa</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. BREW-XK3-72F"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm uppercase placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          maxLength={20}
        />
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? '…' : 'Verificar'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Success modal */}
      {info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">

            {/* Green header */}
            <div className="bg-green-500 px-6 pt-7 pb-5 text-center text-white">
              <p className="text-4xl mb-2">✅</p>
              <h2 className="text-lg font-bold">¡Recompensa entregada!</h2>
              <p className="mt-0.5 text-sm opacity-85">Voucher verificado a las {usedTime}</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-base">
                  👤
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Cliente</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {info.customerName ?? 'Desconocido'}
                  </p>
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-base">
                  🎁
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Recompensa entregada</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {info.rewardName ?? 'Premio'}
                  </p>
                  {info.rewardDesc && (
                    <p className="text-xs text-gray-400 mt-0.5">{info.rewardDesc}</p>
                  )}
                </div>
              </div>

              {/* Code */}
              <div className="rounded-xl bg-gray-50 border px-4 py-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Código</p>
                <p className="font-mono text-sm font-bold tracking-widest text-gray-700">
                  {info.redemptionCode}
                </p>
              </div>

              {/* Action hint */}
              <p className="text-xs text-gray-400 text-center">
                Entrega la recompensa al cliente y cierra esta ventana.
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleClose}
                className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white hover:bg-green-600 transition active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
