'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { lookupCustomerAction, quickTransactionAction } from './actions';
import type { QuickCustomer, QuickProgram } from './actions';

interface Props {
  programLabel: string;
}

type ActionTab = 'points' | 'stamp' | 'visit' | 'cashback';

const TAB_META: Record<ActionTab, { label: string; buttonLabel: string }> = {
  points:   { label: 'Puntos',    buttonLabel: 'Sumar puntos'    },
  stamp:    { label: 'Sellos',    buttonLabel: 'Agregar sello'   },
  visit:    { label: 'Visitas',   buttonLabel: 'Registrar visita' },
  cashback: { label: 'Cashback',  buttonLabel: 'Registrar compra' },
};

export default function QuickRegister({ programLabel }: Props) {
  const [query, setQuery]             = useState('');
  const [customer, setCustomer]       = useState<QuickCustomer | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLooking, startLookup]      = useTransition();

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [activeTab, setActiveTab]     = useState<ActionTab>('points');
  const [deltaStr, setDeltaStr]       = useState('1');
  const [purchaseStr, setPurchaseStr] = useState('');
  const [txError, setTxError]         = useState('');
  const [lastSuccess, setLastSuccess] = useState<{ name: string; delta: number; unit: string } | null>(null);
  const [isSubmitting, startSubmit]   = useTransition();

  const queryRef    = useRef<HTMLInputElement>(null);
  const deltaRef    = useRef<HTMLInputElement>(null);
  const purchaseRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!customer) return;
    const interval = setInterval(async () => {
      const refreshed = await lookupCustomerAction(customer.access_code);
      if ('customer' in refreshed) setCustomer(refreshed.customer);
    }, 10_000);
    return () => clearInterval(interval);
  }, [customer?.access_code]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLookupError('');
    setCustomer(null);
    setLastSuccess(null);
    setTxError('');
    setDeltaStr('1');
    setPurchaseStr('');

    startLookup(async () => {
      const result = await lookupCustomerAction(query);
      if ('error' in result) {
        setLookupError(result.error);
      } else {
        const c = result.customer;
        setCustomer(c);
        // Default to first available tab type
        const firstType = getUniqueTabs(c.programs)[0] ?? 'points';
        setActiveTab(firstType);
        const firstProgram = c.programs.find((p) => p.type === firstType) ?? c.programs[0];
        setSelectedProgramId(firstProgram?.id ?? '');
        setTimeout(() => deltaRef.current?.focus(), 50);
      }
    });
  }

  function switchTab(tab: ActionTab, programs: QuickProgram[]) {
    setActiveTab(tab);
    setTxError('');
    setDeltaStr('1');
    setPurchaseStr('');
    const first = programs.find((p) => p.type === tab);
    if (first) setSelectedProgramId(first.id);
  }

  function handleTransaction(e: React.FormEvent, overrideDelta?: number) {
    e.preventDefault();
    if (!customer || !selectedProgramId) return;

    let delta = overrideDelta ?? parseInt(deltaStr, 10);

    // Cashback: calculate from purchase amount
    if (activeTab === 'cashback') {
      const amount = parseFloat(purchaseStr);
      if (!amount || amount <= 0) { setTxError('Ingresa un monto de compra válido'); return; }
      const pct = (selectedProgram?.config?.cashback_percent as number) ?? 5;
      delta = Math.floor(amount * pct / 100);
      if (delta < 1) { setTxError('El monto es muy bajo para generar cashback'); return; }
    }

    if (!delta || delta <= 0) { setTxError('Ingresa una cantidad mayor a 0'); return; }

    // Cap validations
    if (selectedProgram?.type === 'stamp') {
      const max     = typeof selectedProgram.config.stamps_needed === 'number' ? selectedProgram.config.stamps_needed : null;
      const current = selectedProgram.stamp_count ?? 0;
      if (max !== null && current >= max) {
        setTxError(`Tarjeta completa (${current}/${max}). El cliente debe canjear primero.`);
        return;
      }
    }
    if (selectedProgram?.type === 'visit') {
      const max     = typeof selectedProgram.config.visits_needed === 'number' ? selectedProgram.config.visits_needed : null;
      const current = selectedProgram.visit_count ?? 0;
      if (max !== null && current >= max) {
        setTxError(`Límite alcanzado (${current}/${max}). El cliente debe canjear primero.`);
        return;
      }
    }

    setTxError('');

    const fd = new FormData();
    fd.set('customer_id',  customer.id);
    fd.set('program_id',   selectedProgramId);
    fd.set('points_delta', String(delta));

    startSubmit(async () => {
      const result = await quickTransactionAction(fd);
      if ('error' in result) {
        setTxError(result.error);
      } else {
        const unit =
          selectedProgram?.type === 'stamp'    ? 'sello(s)'  :
          selectedProgram?.type === 'visit'    ? 'visita(s)' :
          selectedProgram?.type === 'cashback' ? 'pts cashback' : programLabel;
        setLastSuccess({ name: customer.name, delta: result.delta, unit });
        setDeltaStr('1');
        setPurchaseStr('');
        const refreshed = await lookupCustomerAction(customer.access_code);
        if ('customer' in refreshed) setCustomer(refreshed.customer);
      }
    });
  }

  const selectedProgram = customer?.programs.find((p) => p.id === selectedProgramId);

  // Unique program types the customer has
  const availableTabs = getUniqueTabs(customer?.programs ?? []);

  // Programs of the current active type (for the selector)
  const programsOfActiveType = customer?.programs.filter((p) => p.type === activeTab) ?? [];

  // Stamp / visit helpers
  const stampMax     = typeof selectedProgram?.config?.stamps_needed  === 'number' ? selectedProgram.config.stamps_needed  : 10;
  const stampCurrent = selectedProgram?.stamp_count  ?? 0;
  const visitMax     = typeof selectedProgram?.config?.visits_needed  === 'number' ? selectedProgram.config.visits_needed  : 10;
  const visitCurrent = selectedProgram?.visit_count  ?? 0;
  const cashbackPct  = typeof selectedProgram?.config?.cashback_percent === 'number' ? selectedProgram.config.cashback_percent : 5;

  // Cashback preview
  const purchaseAmount  = parseFloat(purchaseStr) || 0;
  const cashbackPreview = Math.floor(purchaseAmount * cashbackPct / 100);

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  function balanceLabel(p: QuickProgram): string {
    if (p.current_points === null) return 'Nuevo';
    if (p.type === 'stamp')  return `${p.stamp_count} sellos`;
    if (p.type === 'visit')  return `${p.visit_count} visitas`;
    return `${p.current_points} ${programLabel}`;
  }

  return (
    <div className="space-y-4">

      {/* Search */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Buscar cliente</h2>
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              ref={queryRef}
              type="text"
              value={query}
              maxLength={16}
              onChange={(e) => {
                let val = e.target.value;
                const hasLetters = /[A-Za-z]/.test(val);

                if (hasLetters) {
                  // Access code mode: uppercase, strip non-alphanumeric, auto-dash at pos 4
                  const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                  val = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
                } else {
                  // Phone mode: digits only, + allowed only at position 0
                  if (val.startsWith('+')) {
                    val = '+' + val.slice(1).replace(/[^0-9]/g, '');
                  } else {
                    val = val.replace(/[^0-9]/g, '');
                  }
                  val = val.slice(0, 16);
                }

                setQuery(val);
                if (!val) {
                  setCustomer(null);
                  setLookupError('');
                  setLastSuccess(null);
                  setTxError('');
                  setDeltaStr('1');
                  setPurchaseStr('');
                }
              }}
              placeholder="Código (XXXX-XXXX) o teléfono…"
              autoFocus
              className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={isLooking || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            <SearchIcon className="h-4 w-4" />
            {isLooking ? '…' : 'Buscar'}
          </button>
        </form>
        {lookupError && (
          <p className="mt-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {lookupError}
          </p>
        )}
      </div>

      {/* Success flash */}
      {lastSuccess && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            +{lastSuccess.delta} {lastSuccess.unit} registrados para <strong>{lastSuccess.name}</strong>
          </p>
          <button onClick={() => setLastSuccess(null)} className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 text-lg leading-none ml-3">×</button>
        </div>
      )}

      {/* Customer + action card */}
      {customer && (
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">

          {/* Customer header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white text-sm font-bold tracking-wide">
              {getInitials(customer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{customer.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400">{customer.access_code}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      Activo
                    </span>
                  </div>
                  {customer.phone && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{customer.phone}</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Tabs — one per unique type */}
          {availableTabs.length > 1 && (
            <div className="flex gap-1 rounded-xl bg-gray-50 dark:bg-[#0d0f17] p-1">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchTab(tab, customer.programs)}
                  className={[
                    'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                    activeTab === tab
                      ? 'bg-white dark:bg-[#1e2438] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {TAB_META[tab].label}
                </button>
              ))}
            </div>
          )}

          {/* Selector — only when 2+ programs of the same active type */}
          {programsOfActiveType.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {programsOfActiveType.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProgramId(p.id)}
                  className={[
                    'rounded-xl border px-3 py-1.5 text-sm font-medium transition',
                    selectedProgramId === p.id
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#3a4160] hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Error / cap warnings */}
          {selectedProgram?.type === 'stamp' && stampCurrent >= stampMax && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <strong>Tarjeta completa ({stampCurrent}/{stampMax}).</strong> El cliente debe canjear primero.
            </div>
          )}
          {selectedProgram?.type === 'visit' && visitCurrent >= visitMax && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <strong>Límite alcanzado ({visitCurrent}/{visitMax}).</strong> El cliente debe canjear primero.
            </div>
          )}
          {txError && (
            <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {txError}
            </p>
          )}

          {/* ── STAMP ── */}
          {activeTab === 'stamp' && selectedProgram?.type === 'stamp' && (
            <form onSubmit={(e) => handleTransaction(e, 1)} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedProgram.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stampCurrent}/{stampMax} sellos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: stampMax }).map((_, i) => (
                  <div key={i} className={[
                    'flex h-11 w-11 items-center justify-center rounded-full transition',
                    i < stampCurrent
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                      : 'border-2 border-dashed border-gray-200 dark:border-[#2a3147] text-gray-300 dark:text-gray-600',
                  ].join(' ')}>
                    {i < stampCurrent ? <CheckCircleIcon className="h-5 w-5" /> : <PlusIcon className="h-4 w-4" />}
                  </div>
                ))}
              </div>
              <button type="submit" disabled={isSubmitting || stampCurrent >= stampMax}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]">
                <PlusIcon className="h-4 w-4" />
                {isSubmitting ? 'Registrando…' : 'Agregar sello'}
              </button>
            </form>
          )}

          {/* ── VISIT ── */}
          {activeTab === 'visit' && selectedProgram?.type === 'visit' && (
            <form onSubmit={(e) => handleTransaction(e, 1)} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedProgram.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{visitCurrent}/{visitMax} visitas</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: visitMax }).map((_, i) => (
                  <div key={i} className={[
                    'flex h-11 w-11 items-center justify-center rounded-full transition',
                    i < visitCurrent
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                      : 'border-2 border-dashed border-gray-200 dark:border-[#2a3147] text-gray-300 dark:text-gray-600',
                  ].join(' ')}>
                    {i < visitCurrent ? <CheckSmallIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  </div>
                ))}
              </div>
              <button type="submit" disabled={isSubmitting || visitCurrent >= visitMax}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]">
                <PlusIcon className="h-4 w-4" />
                {isSubmitting ? 'Registrando…' : 'Registrar visita'}
              </button>
            </form>
          )}

          {/* ── POINTS ── */}
          {activeTab === 'points' && selectedProgram?.type === 'points' && (
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Cantidad de {programLabel} a sumar
                </label>
                <input
                  ref={deltaRef}
                  type="number" min="1" step="1"
                  value={deltaStr}
                  onKeyDown={(e) => { if (e.key === '.' || e.key === ',' || e.key === '-') e.preventDefault(); }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[.,\-].*/, '');
                    const num = parseInt(val, 10);
                    setDeltaStr(!isNaN(num) && num < 1 ? '1' : val);
                  }}
                  className={inputCls}
                />
              </div>
              <button type="submit" disabled={isSubmitting || !selectedProgramId}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]">
                <PlusIcon className="h-4 w-4" />
                {isSubmitting ? 'Registrando…' : `Sumar ${deltaStr || 0} ${programLabel}`}
              </button>
            </form>
          )}

          {/* ── CASHBACK ── */}
          {activeTab === 'cashback' && selectedProgram?.type === 'cashback' && (
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Monto de compra
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">$</span>
                  <input
                    ref={purchaseRef}
                    type="number" min="0.01" step="0.01"
                    value={purchaseStr}
                    onChange={(e) => setPurchaseStr(e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </div>
              {/* Preview */}
              {purchaseAmount > 0 && (
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    El cliente recibirá
                  </p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    +{cashbackPreview} pts
                    <span className="text-xs font-normal text-indigo-400 ml-1">({cashbackPct}% de ${purchaseAmount.toFixed(2)})</span>
                  </p>
                </div>
              )}
              <button type="submit" disabled={isSubmitting || !purchaseStr || purchaseAmount <= 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]">
                <PlusIcon className="h-4 w-4" />
                {isSubmitting ? 'Registrando…' : 'Registrar compra'}
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function getUniqueTabs(programs: QuickProgram[]): ActionTab[] {
  const order: ActionTab[] = ['points', 'stamp', 'visit', 'cashback'];
  const seen = new Set(programs.map((p) => p.type));
  return order.filter((t) => seen.has(t));
}

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function CheckSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
