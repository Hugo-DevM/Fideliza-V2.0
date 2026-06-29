'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { createChallengeAction, deleteChallengeAction } from './actions';

interface Challenge {
  id: string;
  title: string;
  target: number;
  bonus_points: number;
  ends_at: string | null;
  is_active: boolean;
}

interface ChallengesCardProps {
  programId: string;
  plan: string;
  challenges: Challenge[];
}

export default function ChallengesCard({ programId, plan, challenges }: ChallengesCardProps) {
  const isPro = plan === 'pro' || plan === 'enterprise';
  const [showForm, setShowForm] = useState(false);
  const [title,  setTitle]  = useState('');
  const [target, setTarget] = useState(5);
  const [bonus,  setBonus]  = useState(100);
  const [endsAt, setEndsAt] = useState('');
  const [error,  setError]  = useState('');
  const [isPending, startTransition] = useTransition();

  const active = challenges.filter((c) => c.is_active);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    setError('');
    startTransition(async () => {
      const res = await createChallengeAction(programId, {
        title,
        target,
        bonus_points: bonus,
        ends_at:      endsAt || null,
      });
      if ('error' in res) {
        setError(res.error ?? 'Unknown error');
      } else {
        setTitle(''); setTarget(5); setBonus(100); setEndsAt('');
        setShowForm(false);
      }
    });
  }

  function handleDelete(challengeId: string) {
    startTransition(async () => {
      await deleteChallengeAction(programId, challengeId);
    });
  }

  return (
    <div className="rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 dark:border-orange-500/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
            <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Misiones</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Retos con bonus al completarlos</p>
          </div>
        </div>
        <span className="rounded-full bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
          Pro
        </span>
      </div>

      {!isPro ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Las misiones requieren el plan Pro.</p>
          <a href="/dashboard/settings" className="mt-1 inline-block text-xs text-orange-600 dark:text-orange-400 underline hover:opacity-80">
            Actualizar plan
          </a>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">

          {/* Active challenges list */}
          {active.length > 0 && (
            <ul className="space-y-2">
              {active.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-[#0d0f17] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {c.target} visitas → <span className="text-orange-600 dark:text-orange-400 font-semibold">+{c.bonus_points} pts</span>
                      {c.ends_at && (
                        <> · hasta {new Date(c.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-40"
                    title="Eliminar misión"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {active.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              Sin misiones activas. Crea una para motivar a tus clientes.
            </p>
          )}

          {/* Create form */}
          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-orange-100 dark:border-orange-500/20 p-4">
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título de la misión</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Visita 5 veces en enero"
                  maxLength={80}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Visitas requeridas</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bonus (pts)</label>
                  <input
                    type="number"
                    min={1}
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fecha límite <span className="text-gray-400">(opcional)</span>
                </label>
                <DatePicker
                  value={endsAt}
                  min={todayStr()}
                  onChange={setEndsAt}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending || !title.trim()}
                  className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
                >
                  {isPending ? 'Guardando…' : 'Crear misión'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1e2438] transition"
                >
                  Cancelar
                </button>
              </div>

              {/* Preview */}
              {title.trim() && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
                  Visita <strong>{target} {target === 1 ? 'vez' : 'veces'}</strong> y gana <strong className="text-orange-500">+{bonus} pts</strong> de bonus
                </p>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-orange-200 dark:border-orange-500/30 py-3 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva misión
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── DatePicker (same as ExportPanel) ──────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function DatePicker({ value, onChange, min, max }: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, setOpen]           = useState(false);
  const [viewYear, setViewYear]   = useState(0);
  const [viewMonth, setViewMonth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function handleOpen() {
    const d = value ? new Date(value + 'T12:00:00') : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayValue = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDow + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('es', { month: 'long', year: 'numeric' }).replace(/ De /, ' de ');
  const today      = todayStr();

  function selectDay(day: number) {
    const y = String(viewYear).padStart(4, '0');
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;
    onChange(dateStr);
    setOpen(false);
  }

  const canGoPrev = (() => {
    const lastDayOfPrevMonth = new Date(viewYear, viewMonth, 0);
    const y  = String(lastDayOfPrevMonth.getFullYear()).padStart(4, '0');
    const mo = String(lastDayOfPrevMonth.getMonth() + 1).padStart(2, '0');
    const d  = String(lastDayOfPrevMonth.getDate()).padStart(2, '0');
    return !min || `${y}-${mo}-${d}` >= min;
  })();
  const canGoNext = (() => {
    const firstDayOfNextMonth = new Date(viewYear, viewMonth + 1, 1);
    const y  = String(firstDayOfNextMonth.getFullYear()).padStart(4, '0');
    const mo = String(firstDayOfNextMonth.getMonth() + 1).padStart(2, '0');
    return !max || `${y}-${mo}-01` <= max;
  })();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 transition min-w-[168px] hover:border-gray-300 dark:hover:border-[#2a3147]"
      >
        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="flex-1 text-left capitalize">{displayValue}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50 w-72 rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-xl p-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1e2438] disabled:opacity-30 disabled:cursor-default transition"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1e2438] disabled:opacity-30 disabled:cursor-default transition"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-600 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const y  = String(viewYear).padStart(4, '0');
              const mo = String(viewMonth + 1).padStart(2, '0');
              const d  = String(day).padStart(2, '0');
              const dateStr    = `${y}-${mo}-${d}`;
              const isSelected = dateStr === value;
              const isDisabled = Boolean((min && dateStr < min) || (max && dateStr > max));
              const isToday    = dateStr === today;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={isDisabled}
                  className={`rounded-lg text-sm h-9 w-full transition ${
                    isSelected
                      ? 'bg-orange-500 text-white font-semibold'
                      : isDisabled
                      ? 'text-gray-300 dark:text-gray-700 cursor-default'
                      : isToday
                      ? 'ring-1 ring-orange-400 text-orange-600 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-500/10'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1e2438]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
