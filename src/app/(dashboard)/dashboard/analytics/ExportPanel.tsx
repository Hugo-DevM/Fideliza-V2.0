'use client';

import { useState } from 'react';

type ReportType = 'transactions' | 'customers' | 'redemptions';

const REPORT_TYPES: { value: ReportType; label: string; desc: string; icon: string }[] = [
  {
    value: 'transactions',
    label: 'Transacciones',
    desc: 'Historial completo de puntos otorgados y canjeados',
    icon: '↕',
  },
  {
    value: 'customers',
    label: 'Clientes',
    desc: 'Lista de clientes con puntos y última actividad',
    icon: '👥',
  },
  {
    value: 'redemptions',
    label: 'Canjes',
    desc: 'Todos los vouchers generados y su estado',
    icon: '🎟',
  },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoStr() {
  return new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
}

export default function ExportPanel() {
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
    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-800">Exportar datos</p>
        <p className="text-xs text-gray-400 mt-0.5">Genera un archivo .xlsx listo para Excel</p>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.value}
            onClick={() => setReportType(r.value)}
            className={`rounded-lg border p-3 text-left transition ${
              reportType === r.value
                ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-base">{r.icon}</span>
            <p className={`mt-1 text-xs font-semibold ${reportType === r.value ? 'text-indigo-700' : 'text-gray-700'}`}>
              {r.label}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Date range (not for customers — always full history) */}
      {showDateRange ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={from}
              max={to}
              onKeyDown={(e) => e.preventDefault()}
              onChange={(e) => {
                const val = e.target.value;
                const today = todayStr();
                setFrom(val > today ? today : val > to ? to : val);
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:w-auto"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={to}
              min={from}
              max={todayStr()}
              onKeyDown={(e) => e.preventDefault()}
              onChange={(e) => {
                const val = e.target.value;
                const today = todayStr();
                setTo(val > today ? today : val < from ? from : val);
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:w-auto"
            />
          </div>
          <a
            href={buildUrl()}
            download
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar .xlsx
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Se exportarán <strong>todos los clientes</strong> registrados (sin filtro de fecha).</p>
          <a
            href={buildUrl()}
            download
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition sm:shrink-0"
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
