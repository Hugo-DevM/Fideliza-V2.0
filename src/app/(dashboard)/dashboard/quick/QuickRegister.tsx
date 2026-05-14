'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { lookupCustomerAction, quickTransactionAction } from './actions';
import type { QuickCustomer, QuickProgram } from './actions';

interface Props {
  programLabel: string;
}

export default function QuickRegister({ programLabel }: Props) {
  const [query, setQuery]             = useState('');
  const [customer, setCustomer]       = useState<QuickCustomer | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLooking, startLookup]      = useTransition();

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [deltaStr, setDeltaStr]       = useState('1');
  const [txError, setTxError]         = useState('');
  const [lastSuccess, setLastSuccess] = useState<{ name: string; delta: number } | null>(null);
  const [isSubmitting, startSubmit]   = useTransition();

  const queryRef = useRef<HTMLInputElement>(null);
  const deltaRef = useRef<HTMLInputElement>(null);

  // Poll customer data every 10s to pick up voucher redemptions in real-time
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

    startLookup(async () => {
      const result = await lookupCustomerAction(query);
      if ('error' in result) {
        setLookupError(result.error);
      } else {
        setCustomer(result.customer);
        setSelectedProgramId(result.customer.programs[0]?.id ?? '');
        setTimeout(() => deltaRef.current?.focus(), 50);
      }
    });
  }

  function handleNewSearch() {
    setCustomer(null);
    setQuery('');
    setLookupError('');
    setLastSuccess(null);
    setTxError('');
    setDeltaStr('1');
    setTimeout(() => queryRef.current?.focus(), 50);
  }

  function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !selectedProgramId) return;
    const delta = parseInt(deltaStr, 10);
    if (!delta || delta <= 0) { setTxError('Ingresa una cantidad mayor a 0'); return; }

    // Validate cap for stamp and visit programs
    if (selectedProgram) {
      if (selectedProgram.type === 'stamp') {
        const max = typeof selectedProgram.config.stamps_needed === 'number' ? selectedProgram.config.stamps_needed : null;
        const current = selectedProgram.stamp_count ?? 0;
        if (max !== null && current >= max) {
          setTxError(`El cliente ya tiene ${current}/${max} sellos. Debe canjear su recompensa antes de seguir acumulando.`);
          return;
        }
        if (max !== null && current + delta > max) {
          setTxError(`Agregar ${delta} sellos excedería el límite (${current}/${max}). Máximo permitido: ${max - current}.`);
          return;
        }
      }
      if (selectedProgram.type === 'visit') {
        const max = typeof selectedProgram.config.visits_needed === 'number' ? selectedProgram.config.visits_needed : null;
        const current = selectedProgram.visit_count ?? 0;
        if (max !== null && current >= max) {
          setTxError(`El cliente ya tiene ${current}/${max} visitas. Debe canjear su recompensa antes de seguir acumulando.`);
          return;
        }
        if (max !== null && current + delta > max) {
          setTxError(`Agregar ${delta} visitas excedería el límite (${current}/${max}). Máximo permitido: ${max - current}.`);
          return;
        }
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
        setLastSuccess({ name: customer.name, delta: result.delta });
        setDeltaStr('1');
        // Refresh balances
        const refreshed = await lookupCustomerAction(customer.access_code);
        if ('customer' in refreshed) {
          setCustomer(refreshed.customer);
        }
      }
    });
  }

  const selectedProgram = customer?.programs.find((p) => p.id === selectedProgramId);

  function balanceLabel(p: QuickProgram): string {
    if (p.current_points === null) return 'Nuevo';
    if (p.type === 'stamp')  return `${p.stamp_count} sellos`;
    if (p.type === 'visit')  return `${p.visit_count} visitas`;
    return `${p.current_points} ${programLabel}`;
  }

  function unitLabel(p: QuickProgram): string {
    if (p.type === 'stamp')  return 'sellos';
    if (p.type === 'visit')  return 'visitas';
    return programLabel;
  }

  return (
    <div className="space-y-4">

      {/* Search */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Buscar cliente</h2>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            ref={queryRef}
            type="text"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) {
                  setCustomer(null);
                  setLookupError('');
                  setLastSuccess(null);
                  setTxError('');
                  setDeltaStr('1');
                }
              }}
            placeholder="Código de acceso o teléfono…"
            autoFocus
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={isLooking || !query.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isLooking ? '…' : 'Buscar'}
          </button>
        </form>
        {lookupError && <p className="mt-2 text-sm text-red-600">{lookupError}</p>}
      </div>

      {/* Success flash */}
      {lastSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-green-700">
            +{lastSuccess.delta} {programLabel} registrados para <strong>{lastSuccess.name}</strong>
          </p>
          <button onClick={() => setLastSuccess(null)} className="text-green-400 hover:text-green-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Customer + form */}
      {customer && (
        <>
          {/* Customer card */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">{customer.name}</p>
                <p className="text-xs font-mono text-indigo-500 mt-0.5">{customer.access_code}</p>
                {customer.phone && <p className="text-xs text-gray-400 mt-0.5">{customer.phone}</p>}
              </div>
              <button onClick={handleNewSearch} className="text-xs text-gray-400 hover:text-gray-600 transition">
                ← Nueva búsqueda
              </button>
            </div>

            {/* Program balances */}
            {customer.programs.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {customer.programs.map((p) => (
                  <div key={p.id} className="rounded-lg bg-gray-50 border px-3 py-1.5 text-xs">
                    <span className="text-gray-500">{p.name} · </span>
                    <span className="font-bold text-indigo-600">{balanceLabel(p)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">No hay programas activos en tu cuenta.</p>
            )}
          </div>

          {/* Transaction form */}
          {customer.programs.length > 0 && (
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <form onSubmit={handleTransaction} className="space-y-4">
                {/* Cap warning — shown proactively when already at limit */}
                {selectedProgram && (() => {
                  if (selectedProgram.type === 'stamp') {
                    const max = typeof selectedProgram.config.stamps_needed === 'number' ? selectedProgram.config.stamps_needed : null;
                    const current = selectedProgram.stamp_count ?? 0;
                    if (max !== null && current >= max) {
                      return (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700">
                          <strong>Tarjeta completa ({current}/{max} sellos).</strong> El cliente debe canjear su recompensa antes de seguir acumulando.
                        </div>
                      );
                    }
                  }
                  if (selectedProgram.type === 'visit') {
                    const max = typeof selectedProgram.config.visits_needed === 'number' ? selectedProgram.config.visits_needed : null;
                    const current = selectedProgram.visit_count ?? 0;
                    if (max !== null && current >= max) {
                      return (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700">
                          <strong>Límite alcanzado ({current}/{max} visitas).</strong> El cliente debe canjear su recompensa antes de seguir acumulando.
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {txError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{txError}</p>
                )}

                {/* Program selector — only if more than one */}
                {customer.programs.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className={inputCls}
                    >
                      {customer.programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedProgram ? `Cantidad de ${unitLabel(selectedProgram)} a sumar` : 'Cantidad'}
                  </label>
                  <input
                    ref={deltaRef}
                    type="number"
                    min="1"
                    step="1"
                    value={deltaStr}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',' || e.key === '-') e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[.,\-].*/, '');
                      const num = parseInt(val, 10);
                      setDeltaStr(!isNaN(num) && num < 1 ? '1' : val);
                    }}
                    className={inputCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProgramId}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isSubmitting
                    ? 'Registrando…'
                    : `+${deltaStr || 0} ${selectedProgram ? unitLabel(selectedProgram) : programLabel}`}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
