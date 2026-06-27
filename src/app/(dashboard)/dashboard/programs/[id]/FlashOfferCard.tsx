'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
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
        <div className={`max-w-2xl space-y-4 px-5 py-4 ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
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
              <HourPicker value={startHour} onChange={setStartHour} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Hasta (hora)</label>
              <HourPicker value={endHour} onChange={setEndHour} />
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

// ── Custom hour picker ───────────────────────────────────────────────────────

function HourPicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const label = `${String(value).padStart(2, '0')}:00`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
          open
            ? 'border-amber-400 bg-white dark:bg-[#0d0f17] text-gray-900 dark:text-white ring-2 ring-amber-100 dark:ring-amber-500/20'
            : 'border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] text-gray-900 dark:text-white hover:border-amber-300 dark:hover:border-amber-600'
        }`}
      >
        <span className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-amber-500" />
          {label}
        </span>
        <ChevronIcon className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] shadow-xl">
          <div className="max-h-52 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#2a3147]">
            {hours.map((h) => {
              const isSelected = h === value;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => { onChange(h); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-500/10 font-semibold text-amber-700 dark:text-amber-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438]'
                  }`}
                >
                  <span>{String(h).padStart(2, '0')}:00</span>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-amber-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function FlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.818a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .845-.143Z" clipRule="evenodd" />
    </svg>
  );
}
