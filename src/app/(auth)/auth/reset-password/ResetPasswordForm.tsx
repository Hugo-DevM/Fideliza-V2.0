'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Status = 'idle' | 'loading' | 'error' | 'success';

const REQUIREMENTS = [
  { label: 'Mínimo 8 caracteres',  test: (p: string) => p.length >= 8 },
  { label: 'Letra mayúscula',       test: (p: string) => /[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/.test(p) },
  { label: 'Letra minúscula',       test: (p: string) => /[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(p) },
  { label: 'Un número (0-9)',        test: (p: string) => /[0-9]/.test(p) },
  { label: 'Un símbolo (!@#…)',      test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export default function ResetPasswordForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const token         = searchParams.get('token');

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [status,          setStatus]          = useState<Status>('idle');
  const [error,           setError]           = useState('');

  const allRequirementsMet = REQUIREMENTS.every(({ test }) => test(password));
  const passwordsMatch     = password === confirmPassword;
  const canSubmit          = allRequirementsMet && passwordsMatch && confirmPassword.length > 0;

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
          <svg className="h-7 w-7 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Enlace inválido</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Este enlace de recuperación no es válido o ya fue utilizado.
          </p>
        </div>
        <a
          href="/auth/forgot-password"
          className="inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Solicitar un nuevo enlace
        </a>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
          <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">¡Contraseña actualizada!</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.
          </p>
        </div>
        <a
          href="/auth/login"
          className="inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Ir al inicio de sesión
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'No se pudo actualizar la contraseña. Intenta de nuevo.');
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => router.push('/auth/login'), 2500);
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === 'error' && (
        <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {password.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {REQUIREMENTS.map(({ label, test }) => {
              const ok = test(password);
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${ok ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={`text-xs transition-colors ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirmar contraseña
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            className={`${inputCls} ${
              confirmPassword.length > 0 && !passwordsMatch
                ? 'border-red-300 dark:border-red-500/60 focus:border-red-400 dark:focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20'
                : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">Las contraseñas no coinciden.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || status === 'loading'}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-4 py-2.5 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';
