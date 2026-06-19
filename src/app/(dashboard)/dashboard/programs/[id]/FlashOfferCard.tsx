'use client';

import { useState, useTransition } from 'react';
import { updateFlashOfferAction } from './actions';

const DAYS = [
  { label: 'D', value: 0 },
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
];

const MULTIPLIERS = [
  { label: '1.5×', value: 1.5 },
  { label: '2×',   value: 2   },
  { label: '3×',   value: 3   },
];

interface FlashOfferCardProps {
  programId:  string;
  plan:       string;
  config:     Record<string, unknown>;
}

export default function FlashOfferCard({ programId, plan, config }: FlashOfferCardProps) {
  const isFree = plan === 'free';

  const [enabled,    setEnabled]    = useState(Boolean(config.flash_enabled));
  const [multiplier, setMultiplier] = useState(Number(config.flash_multiplier ?? 2));
  const [startHour,  setStartHour]  = useState(Number(config.flash_start_hour ?? 14));
  const [endHour,    setEndHour]    = useState(Number(config.flash_end_hour   ?? 17));
  const [days,       setDays]       = useState<number[]>(
    Array.isArray(config.flash_days) ? (config.flash_days as number[]) : [1, 2, 3, 4, 5],
  );

  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [isPending, startTransition] = useTransition();

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function handleSave() {
    setError('');
    startTransition(async () => {
      const res = await updateFlashOfferAction(programId, {
        flash_enabled:    enabled,
        flash_multiplier: multiplier,
        flash_start_hour: startHour,
        flash_end_hour:   endHour,
        flash_days:       days,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <FlashIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Flash Offer</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Puntos dobles en horas específicas</p>
          </div>
        </div>

        {isFree ? (
          <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Starter+
          </span>
        ) : (
          /* Toggle switch */
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              enabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-[#2a3147]'
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
      {isFree ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Flash Offers está disponible en el plan <span className="font-semibold text-gray-700 dark:text-gray-200">Starter</span> y <span className="font-semibold text-gray-700 dark:text-gray-200">Pro</span>.
          </p>
          <a href="/dashboard/settings" className="mt-2 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Actualizar plan →
          </a>
        </div>
      ) : (
        <div className={`space-y-4 px-5 py-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          {/* Multiplier */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">Multiplicador</label>
            <div className="flex gap-2">
              {MULTIPLIERS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMultiplier(m.value)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                    multiplier === m.value
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'border-gray-200 dark:border-[#2a3147] text-gray-500 dark:text-gray-400 hover:border-amber-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Desde (hora)</label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Hasta (hora)</label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">Días activos</label>
            <div className="flex gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition ${
                    days.includes(d.value)
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-[#1e2438] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a3147]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Hora en tiempo de Ciudad de México (UTC-6). El multiplicador se aplica automáticamente en cada earn.
          </p>
        </div>
      )}

      {/* Footer */}
      {!isFree && (
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
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

function FlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.818a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .845-.143Z" clipRule="evenodd" />
    </svg>
  );
}
