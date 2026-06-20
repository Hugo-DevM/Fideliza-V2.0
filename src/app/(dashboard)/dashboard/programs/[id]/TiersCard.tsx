'use client';

import { useState, useTransition } from 'react';
import { updateTiersAction } from './actions';
import { DEFAULT_TIERS, TIER_STYLES } from '@/lib/utils/tiers';
import type { TierConfig } from '@/lib/utils/tiers';

interface TiersCardProps {
  programId:   string;
  plan:        string;
  programType: string;
  config:      Record<string, unknown>;
}

const LIFETIME_LABEL: Record<string, string> = {
  points:   'Puntos de por vida mínimos',
  stamp:    'Sellos acumulados mínimos',
  visit:    'Visitas acumuladas mínimas',
  cashback: 'Cashback acumulado mínimo',
};

const MULTIPLIER_HINT: Record<string, string> = {
  points:   'El cliente gana más puntos por earn a mayor nivel de lealtad.',
  stamp:    'El cliente acumula más sellos por visita a mayor nivel de lealtad.',
  visit:    'El cliente acumula más visitas registradas a mayor nivel de lealtad.',
  cashback: 'El cliente recibe más cashback por compra a mayor nivel de lealtad.',
};

const MULTIPLIER_OPTIONS = [
  { label: '1×',   value: 1   },
  { label: '1.5×', value: 1.5 },
  { label: '2×',   value: 2   },
  { label: '3×',   value: 3   },
];

export default function TiersCard({ programId, plan, programType, config }: TiersCardProps) {
  const lifetimeLabel  = LIFETIME_LABEL[programType]  ?? LIFETIME_LABEL.points;
  const multiplierHint = MULTIPLIER_HINT[programType] ?? MULTIPLIER_HINT.points;
  const isPro = plan === 'pro' || plan === 'enterprise';

  const [enabled, setEnabled] = useState(Boolean(config.tiers_enabled));
  const [tiers, setTiers]     = useState<TierConfig[]>(
    Array.isArray(config.tiers) && (config.tiers as unknown[]).length > 0
      ? (config.tiers as TierConfig[])
      : DEFAULT_TIERS,
  );

  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [isPending, startTransition] = useTransition();

  function updateTier(index: number, patch: Partial<TierConfig>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function handleSave() {
    setError('');
    // Validate thresholds are increasing
    for (let i = 1; i < tiers.length; i++) {
      if (tiers[i].min_lifetime <= tiers[i - 1].min_lifetime) {
        setError('Los umbrales deben ser crecientes de nivel en nivel.');
        return;
      }
    }
    startTransition(async () => {
      const res = await updateTiersAction(programId, { tiers_enabled: enabled, tiers });
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-500/20">
            <TierIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Tiers VIP</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Multiplicador de puntos por lealtad acumulada</p>
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
              enabled ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-[#2a3147]'
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
            Tiers VIP está disponible en el plan <span className="font-semibold text-gray-700 dark:text-gray-200">Pro</span>.
          </p>
          <a href="/dashboard/settings" className="mt-2 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Actualizar plan →
          </a>
        </div>
      ) : (
        <div className={`space-y-3 px-5 py-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {multiplierHint} El umbral se basa en el acumulado histórico (nunca se decrementa).
          </p>

          {tiers.map((tier, i) => {
            const style = TIER_STYLES[tier.color] ?? TIER_STYLES.bronze;
            return (
              <div
                key={i}
                className={`rounded-xl border px-4 py-3 space-y-3 ${style.bg} ${style.border}`}
              >
                {/* Tier row header */}
                <div className="flex items-center gap-3">
                  <TierBadgeInline tier={tier} />
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) => updateTier(i, { label: e.target.value })}
                    maxLength={20}
                    className={`flex-1 rounded-lg border bg-white dark:bg-[#0d0f17] px-2.5 py-1.5 text-sm font-semibold outline-none transition ${style.border} ${style.text} focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-700`}
                  />
                </div>

                {/* Threshold + multiplier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      {lifetimeLabel}
                    </label>
                    {i === 0 ? (
                      <div className="flex items-center rounded-lg border border-gray-200 dark:border-[#2a3147] bg-gray-100 dark:bg-[#1a1f35] px-2.5 py-1.5">
                        <span className="text-sm text-gray-400 dark:text-gray-500">0 (base)</span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        value={tier.min_lifetime}
                        onChange={(e) => updateTier(i, { min_lifetime: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-2.5 py-1.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-700 text-gray-800 dark:text-gray-200"
                      />
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Multiplicador</label>
                    <div className="flex gap-1">
                      {MULTIPLIER_OPTIONS.filter((m) => i === 0 ? m.value === 1 : m.value >= 1).map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          disabled={i === 0}
                          onClick={() => updateTier(i, { multiplier: m.value })}
                          className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition disabled:cursor-default ${
                            tier.multiplier === m.value
                              ? `${style.bg} ${style.border} ${style.text}`
                              : 'border-gray-200 dark:border-[#2a3147] text-gray-400 dark:text-gray-500 hover:border-yellow-300'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            El nivel base (Bronce) aplica a todos los clientes desde el primero acumulado.
          </p>
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
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50 transition"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

function TierBadgeInline({ tier }: { tier: TierConfig }) {
  const style = TIER_STYLES[tier.color] ?? TIER_STYLES.bronze;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${style.bg} ${style.border} ${style.text}`}>
      <TierDot color={tier.color} />
      {tier.color === 'bronze' ? '🥉' : tier.color === 'silver' ? '🥈' : '🥇'}
    </span>
  );
}

function TierDot({ color }: { color: string }) {
  const colors: Record<string, string> = {
    bronze: 'bg-amber-500',
    silver: 'bg-slate-400',
    gold:   'bg-yellow-400',
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${colors[color] ?? 'bg-gray-400'}`} />;
}

function TierIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
  );
}
