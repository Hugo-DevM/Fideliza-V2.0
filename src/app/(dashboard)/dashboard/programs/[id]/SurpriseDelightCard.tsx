'use client';

import { useState, useTransition } from 'react';
import { updateSurpriseDelightAction } from './actions';

const PROBABILITY_OPTIONS = [
  { label: '5%',  value: 0.05 },
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.20 },
];

const MULTIPLIER_OPTIONS = [
  { label: '1.5×', value: 1.5 },
  { label: '2×',   value: 2   },
  { label: '3×',   value: 3   },
];

interface SurpriseDelightCardProps {
  programId: string;
  plan:      string;
  config:    Record<string, unknown>;
}

export default function SurpriseDelightCard({ programId, plan, config }: SurpriseDelightCardProps) {
  const isPro = plan === 'pro' || plan === 'enterprise';

  const [enabled,     setEnabled]     = useState(Boolean(config.surprise_enabled));
  const [probability, setProbability] = useState(Number(config.surprise_probability ?? 0.10));
  const [multiplier,  setMultiplier]  = useState(Number(config.surprise_multiplier  ?? 2));

  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError('');
    startTransition(async () => {
      const res = await updateSurpriseDelightAction(programId, {
        surprise_enabled:     enabled,
        surprise_probability: probability,
        surprise_multiplier:  multiplier,
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <DiceIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Sorpresa Especial</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Puntos extra en visitas aleatorias</p>
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
              enabled ? 'bg-violet-500' : 'bg-gray-200 dark:bg-[#2a3147]'
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
            Sorpresa Especial está disponible en el plan <span className="font-semibold text-gray-700 dark:text-gray-200">Pro</span>.
          </p>
          <a href="/dashboard/settings" className="mt-2 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Actualizar plan →
          </a>
        </div>
      ) : (
        <div className={`space-y-4 px-5 py-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            En cada earn, hay una probabilidad de que el cliente reciba puntos extra como sorpresa.
            El cliente no sabe cuándo ocurrirá — eso es lo que lo hace efectivo.
          </p>

          {/* Probability */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Probabilidad por visita
            </label>
            <div className="flex gap-2">
              {PROBABILITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setProbability(p.value)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                    probability === p.value
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400'
                      : 'border-gray-200 dark:border-[#2a3147] text-gray-500 dark:text-gray-400 hover:border-violet-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Multiplicador de puntos
            </label>
            <div className="flex gap-2">
              {MULTIPLIER_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMultiplier(m.value)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                    multiplier === m.value
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400'
                      : 'border-gray-200 dark:border-[#2a3147] text-gray-500 dark:text-gray-400 hover:border-violet-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 px-4 py-3">
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Con estas opciones, <strong>1 de cada {Math.round(1 / probability)} visitas</strong> dará{' '}
              <strong>{multiplier}× puntos</strong> como sorpresa.
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
            className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-50 transition"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
      <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.202 7.616.592a.75.75 0 0 1 .634.74Zm-7.5 2.418a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Zm3-.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm-7.5.75a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z" clipRule="evenodd" />
    </svg>
  );
}
