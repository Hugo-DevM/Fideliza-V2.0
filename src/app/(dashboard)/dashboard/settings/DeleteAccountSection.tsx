'use client';

import { useState, useTransition } from 'react';
import { deleteAccountAction } from './actions';

export default function DeleteAccountSection({ subdomain }: { subdomain: string }) {
  const [open, setOpen]                 = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason]             = useState('');
  const [error, setError]               = useState('');
  const [isPending, startTransition]    = useTransition();

  const confirmed = confirmation === subdomain;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await deleteAccountAction(data);
      if (result && 'error' in result) setError(result.error);
    });
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setConfirmation('');
    setReason('');
    setError('');
  }

  return (
    <>
      {/* ── Danger zone card ── */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 bg-gray-50">
          <svg className="h-3.5 w-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-red-600">Zona de peligro</h2>
        </div>

        <div className="flex items-center justify-between gap-6 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Eliminar esta cuenta</p>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed max-w-sm">
              Una vez eliminada, tu cuenta y todos sus datos quedarán permanentemente inaccesibles. Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            Eliminar cuenta
          </button>
        </div>
      </section>

      {/* ── Confirmation modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="bg-red-600 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Eliminar cuenta</h3>
                    <p className="text-xs text-red-200 mt-0.5">Esta acción es permanente e irreversible</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-full p-1 text-red-200 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Consequences */}
              <div className="rounded-lg border border-red-100 bg-red-50 divide-y divide-red-100">
                {[
                  { icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', text: 'Tu sesión se cerrará de inmediato' },
                  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'No podrás volver a iniciar sesión con esta cuenta' },
                  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', text: 'Tus clientes perderán acceso al portal de lealtad' },
                  { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', text: 'No se realizará ningún reembolso prorrateado' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 px-3 py-2.5">
                    <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    <span className="text-xs text-red-700">{text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="confirmation" value={confirmation} />
                <input type="hidden" name="reason" value={reason} />

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Motivo <span className="font-normal normal-case text-gray-400">(opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="¿Por qué eliminas tu cuenta?"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>

                {/* Subdomain confirmation */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Confirmar eliminación
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Escribe <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{subdomain}</span> para continuar
                  </p>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^[a-z0-9-]*$/.test(raw)) setConfirmation(raw);
                    }}
                    placeholder={subdomain}
                    autoComplete="off"
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                      confirmed
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-red-300 focus:ring-red-100'
                    }`}
                  />
                  {/* Progress indicator */}
                  <div className="mt-1.5 h-0.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (confirmation.length / subdomain.length) * 100)}%` }}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!confirmed || isPending}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Eliminando…
                      </span>
                    ) : 'Eliminar permanentemente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
