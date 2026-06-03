'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'sent' | 'error';

export default function ForgotPasswordForm() {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error,  setError]  = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'No se pudo enviar el correo. Inténtalo de nuevo.');
        setStatus('error');
      } else {
        setStatus('sent');
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
          <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Revisa tu correo</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Si{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>{' '}
            está registrado, recibirás un enlace de recuperación en breve.
            El enlace expira en 15 minutos.
          </p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          ¿No llegó?{' '}
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Reintentar
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => {
            const raw = e.target.value;
            if (/^[a-zA-Z0-9._%+\-@]*$/.test(raw)) setEmail(raw);
          }}
          placeholder="tu@negocio.com"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando…
          </span>
        ) : 'Enviar enlace de recuperación'}
      </button>
    </form>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-4 py-2.5 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';
