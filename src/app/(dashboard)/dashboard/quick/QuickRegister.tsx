'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { lookupCustomerAction, quickTransactionAction, quickMissionProgressAction } from './actions';
import type { QuickCustomer, QuickProgram, QuickMission } from './actions';
import { useAutoError } from '@/hooks/useAutoError';
import { computeTier, TIER_STYLES } from '@/lib/utils/tiers';
import type { TierConfig } from '@/lib/utils/tiers';

interface Props {
  programLabel: string;
  currency: string;
}

type ActionTab = 'points' | 'stamp' | 'visit' | 'cashback';

const TAB_META: Record<ActionTab, { label: string; buttonLabel: string }> = {
  points:   { label: 'Puntos',    buttonLabel: 'Sumar puntos'    },
  stamp:    { label: 'Sellos',    buttonLabel: 'Agregar sello'   },
  visit:    { label: 'Visitas',   buttonLabel: 'Registrar visita' },
  cashback: { label: 'Cashback',  buttonLabel: 'Registrar compra' },
};

export default function QuickRegister({ programLabel, currency }: Props) {
  const [query, setQuery]             = useState('');
  const [customer, setCustomer]       = useState<QuickCustomer | null>(null);
  const { setError: setLookupError, mounted: lookupMounted, displayText: lookupDisplayText, wrapperStyle: lookupWrapperStyle, errorStyle: lookupErrorStyle } = useAutoError();
  const [isLooking, startLookup]              = useTransition();

  const [missions, setMissions]       = useState<QuickMission[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [activeTab, setActiveTab]     = useState<ActionTab>('points');
  const [deltaStr, setDeltaStr]       = useState('1');
  const [purchaseStr, setPurchaseStr] = useState('');
  const { setError: setTxError, mounted: txMounted, displayText: txDisplayText, wrapperStyle: txWrapperStyle, errorStyle: txErrorStyle } = useAutoError();
  const [lastSuccess, setLastSuccess] = useState<{ name: string; delta: number; unit: string } | null>(null);
  const [isSubmitting, startSubmit]   = useTransition();

  const queryRef    = useRef<HTMLInputElement>(null);
  const deltaRef    = useRef<HTMLInputElement>(null);
  const purchaseRef = useRef<HTMLInputElement>(null);

  const customerAccessCode = customer?.access_code;

  useEffect(() => {
    if (!customerAccessCode) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    function startPolling() {
      if (interval !== undefined) return;
      interval = setInterval(async () => {
        const refreshed = await lookupCustomerAction(customerAccessCode!);
        if ('customer' in refreshed) setCustomer(refreshed.customer);
      }, 30_000);
    }

    function stopPolling() {
      if (interval === undefined) return;
      clearInterval(interval);
      interval = undefined;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        startPolling();
      }
    }

    if (document.visibilityState !== 'hidden') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [customerAccessCode]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLookupError('');
    setCustomer(null);
    setMissions([]);
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
        setMissions(c.missions);
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
    if (activeTab === 'cashback' && purchaseAmount > 0) {
      fd.set('purchase_amount', purchaseStr);
      fd.set('currency', currency);
    }

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

  // Tier for selected program
  const selectedTierList = selectedProgram?.config?.tiers_enabled
    ? (selectedProgram.config.tiers as TierConfig[] | undefined)
    : undefined;
  const selectedTier = selectedTierList
    ? computeTier(selectedProgram?.lifetime_points ?? 0, selectedTierList)
    : null;

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
                  // Access code mode: uppercase, strip non-alphanumeric, auto-dash at pos 5
                  const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                  val = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
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
              placeholder="Código (XXXXX-XXXXX) o teléfono…"
              autoFocus
              className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={isLooking || !query.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            <SearchIcon className="h-4 w-4" />
            {isLooking ? '…' : 'Buscar'}
          </button>
        </form>
        {lookupMounted && (
          <div className="mt-2.5" style={lookupWrapperStyle}><div style={{ overflow: 'hidden' }}>
            <p style={lookupErrorStyle} className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {lookupDisplayText}
            </p>
          </div></div>
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

      {/* Missions */}
      {customer && missions.filter((m) => !m.completedAt).length > 0 && (
        <div className="rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-orange-100 dark:border-orange-500/20">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
              <svg className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Misiones activas</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-[#1e2438]">
            {missions.filter((m) => !m.completedAt).map((m) => (
              <QuickMissionRow
                key={m.challengeId}
                mission={m}
                customerId={customer.id}
                onComplete={(id) =>
                  setMissions((prev) => prev.map((x) => x.challengeId === id ? { ...x, completedAt: new Date().toISOString() } : x))
                }
                onProgress={(id, p) =>
                  setMissions((prev) => prev.map((x) => x.challengeId === id ? { ...x, progress: p } : x))
                }
              />
            ))}
          </div>
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
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400">{customer.access_code}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      Activo
                    </span>
                    {selectedTier && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TIER_STYLES[selectedTier.color].bg} ${TIER_STYLES[selectedTier.color].border} ${TIER_STYLES[selectedTier.color].text}`}>
                        {selectedTier.color === 'bronze' ? '🥉' : selectedTier.color === 'silver' ? '🥈' : '🥇'} {selectedTier.label}
                        {selectedTier.multiplier > 1 && ` · ${selectedTier.multiplier}×`}
                      </span>
                    )}
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
          {txMounted && (
            <div style={txWrapperStyle}><div style={{ overflow: 'hidden' }}>
              <p style={txErrorStyle} className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {txDisplayText}
              </p>
            </div></div>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400 dark:text-gray-500">{currency}</span>
                  <input
                    ref={purchaseRef}
                    type="number" min="0.01" step="0.01"
                    value={purchaseStr}
                    onChange={(e) => setPurchaseStr(e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls} pl-12`}
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
                    <span className="text-xs font-normal text-indigo-400 ml-1">({cashbackPct}% · {purchaseAmount.toFixed(2)} {currency})</span>
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

// ── Mission row ───────────────────────────────────────────────────

function bonusLabel(type: string): string {
  if (type === 'visit')    return 'visitas';
  if (type === 'stamp')    return 'sellos';
  if (type === 'cashback') return 'bono $';
  return 'pts';
}

function QuickMissionRow({
  mission: m,
  customerId,
  onComplete,
  onProgress,
}: {
  mission: QuickMission;
  customerId: string;
  onComplete: (id: string) => void;
  onProgress: (id: string, progress: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<'ok' | 'done' | null>(null);
  const pct = Math.min(100, Math.round((m.progress / m.target) * 100));

  function handleAdd() {
    startTransition(async () => {
      const res = await quickMissionProgressAction(customerId, m.challengeId);
      if ('success' in res) {
        if (res.completed) {
          setFlash('done');
          setTimeout(() => onComplete(m.challengeId), 1200);
        } else {
          onProgress(m.challengeId, res.progress);
          setFlash('ok');
          setTimeout(() => setFlash(null), 1500);
        }
      }
    });
  }

  return (
    <div className="px-5 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{m.title}</p>
          {m.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.description}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {m.progress}/{m.target} · <span className="text-orange-500 font-medium">+{m.bonusPoints} {bonusLabel(m.programType)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className={[
            'shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
            flash === 'done'
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : flash === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30',
            isPending ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {flash === 'done' ? '¡Completada! 🎉' : flash === 'ok' ? '✓ Listo' : (
            <>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              +1
            </>
          )}
        </button>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-400 dark:bg-orange-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
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
