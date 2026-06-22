'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateWhatsappSenderAction } from './actions';

export default function WhatsappSenderSection({
  currentFrom,
  plan,
}: {
  currentFrom: string | null;
  plan: string;
}) {
  const isPro = plan === 'pro';

  // Strip "whatsapp:" prefix for display in the input
  const initial = currentFrom ? currentFrom.replace('whatsapp:', '') : '';
  const [phone, setPhone] = useState(initial);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isDirty = phone !== initial;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateWhatsappSenderAction(data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        setSuccess('Número guardado correctamente.');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="h-4 w-4 text-green-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Número de WhatsApp Business
                </h2>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  Pro
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Usa tu propio número de WhatsApp para enviar mensajes a tus clientes.
              </p>
            </div>
          </div>
        </div>

        {/* Plan gate */}
        {!isPro && (
          <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-3">
            <svg className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Disponible en el <span className="font-semibold">Plan Pro</span>. En el Plan Starter los mensajes se envían desde el número compartido de Fideliza.
            </p>
          </div>
        )}

        {/* Current state */}
        {isPro && (
          <>
            <div className="rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-4 py-3 flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${currentFrom ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {currentFrom
                  ? <>Enviando desde <span className="font-mono font-semibold">{currentFrom.replace('whatsapp:', '')}</span></>
                  : 'Usando el número compartido de Fideliza'}
              </p>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tu número de WhatsApp Business
              </label>
              <input
                name="whatsapp_from"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+521234567890"
                className="w-full max-w-xs rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2.5 text-sm font-mono text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Formato E.164 — incluye el código de país (ej. +52 para México). Déjalo vacío para volver al número de Fideliza.
              </p>
            </div>

            {/* Feedback */}
            {error   && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && <p className="rounded-xl bg-green-50 dark:bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">{success} ✓</p>}

            {/* Save */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || !isDirty}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Guardando…' : 'Guardar número'}
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
