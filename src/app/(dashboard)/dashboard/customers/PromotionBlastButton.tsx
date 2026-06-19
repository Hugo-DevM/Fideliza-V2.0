'use client';

import { useState, useTransition } from 'react';
import { sendPromotionBlastAction } from './actions';

export default function PromotionBlastButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ queued?: number; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await sendPromotionBlastAction();
      setResult(res);
      setShowConfirm(false);
      setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 px-3.5 py-2 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 transition"
      >
        <WhatsAppIcon className="h-4 w-4 shrink-0" />
        Enviar promoción
      </button>

      {result && (
        <p className={`text-xs font-medium ${result.error ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
          {result.error ?? `${result.queued} mensaje${result.queued !== 1 ? 's' : ''} encolado${result.queued !== 1 ? 's' : ''}`}
        </p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/40">
                <WhatsAppIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Enviar promoción</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">A todos los clientes con WhatsApp activo</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Se enviará el mensaje <span className="font-semibold">fideliza_promotion_v1</span> a todos tus clientes que tienen WhatsApp activo. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Enviando…' : 'Confirmar envío'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
