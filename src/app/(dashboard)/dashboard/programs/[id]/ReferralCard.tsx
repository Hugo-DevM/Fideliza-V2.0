'use client';

import { useState, useTransition } from 'react';
import { updateReferralAction } from './actions';

interface ReferralCardProps {
  programId: string;
  plan:      string;
  config:    Record<string, unknown>;
}

export default function ReferralCard({ programId, plan, config }: ReferralCardProps) {
  const isPro = plan === 'pro' || plan === 'enterprise';

  const [enabled,       setEnabled]       = useState(Boolean(config.referral_enabled));
  const [referrerBonus, setReferrerBonus] = useState(Number(config.referrer_bonus ?? 100));
  const [referredBonus, setReferredBonus] = useState(Number(config.referred_bonus ?? 50));

  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError('');
    if (referrerBonus < 1 || referredBonus < 1) {
      setError('Los bonos deben ser mayores a 0.');
      return;
    }
    startTransition(async () => {
      const res = await updateReferralAction(programId, {
        referral_enabled: enabled,
        referrer_bonus:   referrerBonus,
        referred_bonus:   referredBonus,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
            <ReferralIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Programa de Referidos</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Los clientes invitan amigos y ganan bonos</p>
          </div>
        </div>

        {!isPro ? (
          <span className="rounded-full bg-violet-100 dark:bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
            Pro
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#2a3147]'
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        )}
      </div>

      {/* Body */}
      {!isPro ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El programa de referidos está disponible en el plan{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">Pro</span>.
          </p>
          <a href="/dashboard/settings" className="mt-2 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Actualizar plan →
          </a>
        </div>
      ) : (
        <div className={`max-w-2xl space-y-4 px-5 py-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Cada cliente tiene un código de referido único (su código de acceso).
            Cuando un amigo se registra con ese código y completa su primera visita,
            ambos reciben puntos de bono automáticamente.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Referrer bonus */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Bono para quien refiere
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5">
                <input
                  type="number"
                  min={1}
                  value={referrerBonus}
                  onChange={(e) => setReferrerBonus(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none"
                />
                <span className="shrink-0 text-xs text-gray-400">pts</span>
              </div>
            </div>

            {/* Referred bonus */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Bono para el referido
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5">
                <input
                  type="number"
                  min={1}
                  value={referredBonus}
                  onChange={(e) => setReferredBonus(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-white outline-none"
                />
                <span className="shrink-0 text-xs text-gray-400">pts</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Cómo funciona</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              1. El cliente comparte su código de acceso con un amigo.
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              2. El amigo se registra en el portal del negocio con ese código.
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              3. Al completar su primera visita, ambos reciben sus puntos.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      {isPro && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#1e2438] px-5 py-3">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : saved ? (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Guardado</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

function ReferralIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}
