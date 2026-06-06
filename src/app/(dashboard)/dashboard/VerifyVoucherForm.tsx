'use client';

import { useState, useTransition, useRef } from 'react';
import { verifyVoucherAction } from './programs/[id]/actions';
import { useDashboardI18n } from '@/lib/i18n/dashboard-context';
import { formatTimeOnly } from '@/lib/utils/date';

interface RedemptionInfo {
  redemptionCode: string;
  customerName: string | null;
  rewardName: string | null;
  rewardDesc: string | null;
  usedAt: string;
}

export default function VerifyVoucherForm() {
  const { timezone, locale } = useDashboardI18n();
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

  const usedTime = info ? formatTimeOnly(info.usedAt, timezone, locale) : '';

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Canjear recompensa</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <TicketIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="P. EJ. BREW-XK3-72F"
            className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] pl-9 pr-3 py-2.5 font-mono text-sm uppercase text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            maxLength={20}
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#1e2438] hover:bg-gray-50 dark:hover:bg-[#252f4a] disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition"
        >
          <ScanIcon className="h-4 w-4" />
          {isPending ? '…' : 'Verificar'}
        </button>
      </form>

      {error && (
        <p className="mt-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Success modal */}
      {info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161b2e] shadow-2xl overflow-hidden">

            {/* Green header */}
            <div className="bg-emerald-500 px-6 pt-7 pb-5 text-center text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 mx-auto mb-3">
                <CheckIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-bold">¡Recompensa entregada!</h2>
              <p className="mt-0.5 text-sm opacity-85">Voucher verificado a las {usedTime}</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Cliente</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {info.customerName ?? 'Desconocido'}
                  </p>
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <GiftIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Recompensa entregada</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {info.rewardName ?? 'Premio'}
                  </p>
                  {info.rewardDesc && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{info.rewardDesc}</p>
                  )}
                </div>
              </div>

              {/* Code */}
              <div className="rounded-2xl bg-gray-50 dark:bg-[#0d0f17] border border-gray-100 dark:border-[#2a3147] px-4 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Código</p>
                <p className="font-mono text-sm font-bold tracking-widest text-gray-700 dark:text-gray-200">
                  {info.redemptionCode}
                </p>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Entrega la recompensa al cliente y cierra esta ventana.
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleClose}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
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

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 18.75h.75v.75h-.75v-.75ZM18.75 13.5h.75v.75h-.75v-.75ZM18.75 18.75h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}
