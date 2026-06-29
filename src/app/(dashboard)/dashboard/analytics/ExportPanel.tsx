'use client';

import { useState, useRef, useEffect } from 'react';

type ReportType = 'transactions' | 'customers' | 'redemptions';

const REPORT_TYPES: { value: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'transactions',
    label: 'Transacciones',
    desc: 'Historial completo de puntos otorgados y canjeados',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    value: 'customers',
    label: 'Clientes',
    desc: 'Lista de clientes con puntos y última actividad',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    value: 'redemptions',
    label: 'Canjes',
    desc: 'Todos los vouchers generados y su estado',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5A3.375 3.375 0 0 1 8.25 6.75V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
      </svg>
    ),
  },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoStr() {
  return new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
}

export default function ExportPanel({ isPro }: { isPro?: boolean }) {
  const [reportType, setReportType] = useState<ReportType>('transactions');
  const [from, setFrom] = useState(thirtyDaysAgoStr());
  const [to, setTo]     = useState(todayStr());

  const showDateRange = reportType !== 'customers';

  function buildUrl() {
    const params = new URLSearchParams({ type: reportType });
    if (showDateRange) {
      params.set('from', from);
      params.set('to', to);
    }
    return `/api/export?${params.toString()}`;
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">Exportar datos</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Genera un archivo .xlsx listo para Excel.</p>
        </div>
        {!isPro && (
          <a href="/dashboard/settings"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#1e2438] px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Plan Pro
          </a>
        )}
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {REPORT_TYPES.map((r) => {
          const selected = reportType === r.value;
          return (
            <button
              key={r.value}
              onClick={() => setReportType(r.value)}
              className={`rounded-xl border p-3.5 text-left transition ${
                selected
                  ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-300 dark:ring-indigo-500/40'
                  : 'border-gray-200 dark:border-[#1e2438] hover:border-gray-300 dark:hover:border-[#2a3147] hover:bg-gray-50 dark:hover:bg-[#1a1f35]'
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl mb-2.5 ${
                selected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-[#1e2438] text-gray-400 dark:text-gray-500'
              }`}>
                {r.icon}
              </div>
              <p className={`text-sm font-semibold ${selected ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {r.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Date range + download */}
      {showDateRange ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Desde</label>
              <DatePicker
                value={from}
                max={to}
                onChange={(val) => {
                  const today = todayStr();
                  setFrom(val > today ? today : val > to ? to : val);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Hasta</label>
              <DatePicker
                value={to}
                min={from}
                max={todayStr()}
                onChange={(val) => {
                  const today = todayStr();
                  setTo(val > today ? today : val < from ? from : val);
                }}
              />
            </div>
          </div>
          <a
            href={buildUrl()}
            download
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar .xlsx
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-gray-50 dark:bg-[#1a1f35] border border-gray-100 dark:border-[#1e2438] px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Se exportarán <strong className="text-gray-700 dark:text-gray-200">todos los clientes</strong> registrados (sin filtro de fecha).
          </p>
          <a
            href={buildUrl()}
            download
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition sm:shrink-0"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar .xlsx
          </a>
        </div>
      )}
    </div>
  );
}

// ── Custom DatePicker ──────────────────────────────────────────────────────────

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function DatePicker({ value, onChange, min, max }: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(0);
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
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const startOffset = (firstDow + 6) % 7; // convert to Mon=0

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('es', { month: 'long', year: 'numeric' });
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

  // Disable prev/next month nav if all days in target month are out of range
  const canGoPrev = (() => {
    const lastDayOfPrevMonth = new Date(viewYear, viewMonth, 0);
    const y = String(lastDayOfPrevMonth.getFullYear()).padStart(4, '0');
    const mo = String(lastDayOfPrevMonth.getMonth() + 1).padStart(2, '0');
    const d = String(lastDayOfPrevMonth.getDate()).padStart(2, '0');
    return !min || `${y}-${mo}-${d}` >= min;
  })();
  const canGoNext = (() => {
    const firstDayOfNextMonth = new Date(viewYear, viewMonth + 1, 1);
    const y = String(firstDayOfNextMonth.getFullYear()).padStart(4, '0');
    const mo = String(firstDayOfNextMonth.getMonth() + 1).padStart(2, '0');
    return !max || `${y}-${mo}-01` <= max;
  })();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition min-w-[168px] hover:border-gray-300 dark:hover:border-[#2a3147]"
      >
        <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-400 shrink-0" />
        <span className="flex-1 text-left capitalize">{displayValue}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-xl p-3">
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
                      ? 'bg-indigo-600 text-white font-semibold'
                      : isDisabled
                      ? 'text-gray-300 dark:text-gray-700 cursor-default'
                      : isToday
                      ? 'ring-1 ring-indigo-400 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
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
