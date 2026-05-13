'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

type Status = 'idle' | 'loading' | 'error';

const REQUIREMENTS = [
  { label: 'Mínimo 8 caracteres',  test: (p: string) => p.length >= 8 },
  { label: 'Letra mayúscula',       test: (p: string) => /[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/.test(p) },
  { label: 'Letra minúscula',       test: (p: string) => /[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(p) },
  { label: 'Número o símbolo',      test: (p: string) => /[\d\W_]/.test(p) },
];

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [status,          setStatus]          = useState<Status>('idle');
  const [error,           setError]           = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const allRequirementsMet = REQUIREMENTS.every(({ test }) => test(password));
  const passwordsMatch     = password === confirmPassword;
  const canSubmit          = allRequirementsMet && passwordsMatch && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    setError('');

    const { error: sbError } = await supabase.auth.updateUser({ password });

    if (sbError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
      setStatus('error');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nueva contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Requirements checklist */}
        {password.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {REQUIREMENTS.map(({ label, test }) => {
              const ok = test(password);
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${ok ? 'text-green-500' : 'text-gray-300'}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={`text-xs transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar contraseña
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
              confirmPassword.length > 0 && !passwordsMatch
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || status === 'loading'}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando…
          </span>
        ) : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
}
