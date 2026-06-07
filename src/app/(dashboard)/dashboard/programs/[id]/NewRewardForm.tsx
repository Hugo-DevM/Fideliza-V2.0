'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createRewardAction } from './actions';
import { useAutoError } from '@/hooks/useAutoError';
import { useModalTransition } from '@/hooks/useModalTransition';

type ProgramType = 'points' | 'stamp' | 'visit' | 'cashback';

interface Props {
  programId:     string;
  programType:   ProgramType;
  programConfig: Record<string, unknown>;
  compact?:      boolean; // renders only the header "+ Agregar" button
}

export default function NewRewardForm({ programId, programType, programConfig, compact }: Props) {
  const [open, setOpen]   = useState(false);
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(open);
  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  const stampThreshold = typeof programConfig.stamps_needed === 'number' ? programConfig.stamps_needed : null;
  const visitThreshold = typeof programConfig.visits_needed === 'number' ? programConfig.visits_needed : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createRewardAction(programId, data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  // Compact mode: just the header button that opens a modal
  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Agregar
        </button>

        {modalMounted && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl"
              style={{ opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Nueva recompensa</h2>
                <button onClick={() => { setOpen(false); setError(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none transition">×</button>
              </div>
              <RewardFormBody
                formRef={formRef}
                onSubmit={handleSubmit}
                programType={programType}
                stampThreshold={stampThreshold}
                visitThreshold={visitThreshold}
                error={error}
                errorStyle={errorStyle}
                mounted={mounted}
                displayText={displayText}
                wrapperStyle={wrapperStyle}
                isPending={isPending}
                onCancel={() => { setOpen(false); setError(''); }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline mode: shows nothing or the form
  if (!open) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Nueva recompensa</h3>
      <RewardFormBody
        formRef={formRef}
        onSubmit={handleSubmit}
        programType={programType}
        stampThreshold={stampThreshold}
        visitThreshold={visitThreshold}
        error={error}
        errorStyle={errorStyle}
        isPending={isPending}
        onCancel={() => { setOpen(false); setError(''); }}
      />
    </div>
  );
}

// ── Shared form body ──────────────────────────────────────────────

function RewardFormBody({
  formRef, onSubmit, programType, stampThreshold, visitThreshold, error, errorStyle, mounted, displayText, wrapperStyle, isPending, onCancel,
}: {
  formRef: React.RefObject<HTMLFormElement | null>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  programType: ProgramType;
  stampThreshold: number | null;
  visitThreshold: number | null;
  error: string;
  errorStyle: React.CSSProperties;
  mounted: boolean;
  displayText: string;
  wrapperStyle: React.CSSProperties;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {mounted && (
        <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
          <p style={errorStyle} className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {displayText}
          </p>
        </div></div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nombre *</label>
          <input name="name" type="text" required placeholder="Café gratis" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Descripción</label>
          <input name="description" type="text" placeholder="Cualquier tamaño, cualquier bebida" className={inputCls} />
        </div>

        {programType === 'points' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Costo (puntos) *</label>
            <input name="cost_points" type="number" min="1" required placeholder="250" className={inputCls} />
          </div>
        )}
        {programType === 'cashback' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Saldo mínimo *</label>
            <input name="cost_points" type="number" min="1" required placeholder="500" className={inputCls} />
          </div>
        )}
        {programType === 'stamp' && stampThreshold !== null && (
          <>
            <input type="hidden" name="cost_points" value={stampThreshold} />
            <div className="col-span-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 px-3 py-2 text-xs text-violet-700 dark:text-violet-400">
              Se entrega al completar <strong>{stampThreshold} sellos</strong>
            </div>
          </>
        )}
        {programType === 'visit' && visitThreshold !== null && (
          <>
            <input type="hidden" name="cost_points" value={visitThreshold} />
            <div className="col-span-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              Se entrega al alcanzar <strong>{visitThreshold} visitas</strong>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Vencimiento (días)</label>
          <input name="expiry_days" type="number" min="1" placeholder="30" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Límite de stock</label>
          <input name="stock" type="number" min="0" placeholder="∞ ilimitado" className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isPending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
          {isPending ? 'Guardando…' : 'Guardar recompensa'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition">
          Cancelar
        </button>
      </div>
    </form>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
