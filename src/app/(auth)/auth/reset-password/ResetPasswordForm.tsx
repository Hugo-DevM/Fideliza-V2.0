'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Status = 'idle' | 'loading' | 'sent' | 'error';

export default function ResetPasswordForm() {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error,  setError]  = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setError('');

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password/update`,
    });

    if (sbError) {
      setError('No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.');
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  if (status === 'sent') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Revisa tu correo</p>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Enviamos un enlace de recuperación a{' '}
            <span className="font-medium text-gray-700">{email}</span>.
            Expira en 1 hora.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          ¿No llegó?{' '}
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-indigo-500 hover:underline font-medium"
          >
            Reenviar
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
