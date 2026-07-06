'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignPointsAction } from './actions';
import { computeEarnDelta } from '@/lib/utils/points-calculator';
import type { CustomerProgramEnrollment, RewardProgram } from '@/lib/types';
import { useAutoError } from '@/hooks/useAutoError';

interface Props {
  customerId: string;
  enrollments: (CustomerProgramEnrollment & { program: RewardProgram })[];
  programLabel: string;
}

export default function AssignPointsForm({ customerId, enrollments, programLabel }: Props) {
  const [selectedProgramId, setSelectedProgramId] = useState(enrollments[0]?.program_id ?? '');
  const [amountStr, setAmountStr] = useState('');
  const [manualDelta, setManualDelta] = useState('');
  const [note, setNote] = useState('');
  const { setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedEnrollment = enrollments.find((e) => e.program_id === selectedProgramId);
  const selectedProgram    = selectedEnrollment?.program;

  // Auto-compute preview
  let preview: { points_delta: number; note: string; skipped: boolean } | null = null;
  if (selectedProgram && amountStr) {
    const cents = Math.round(parseFloat(amountStr) * 100);
    if (!isNaN(cents) && cents > 0) {
      preview = computeEarnDelta(cents, selectedProgram);
    }
  }

  const isStampOrVisit = selectedProgram?.type === 'stamp' || selectedProgram?.type === 'visit';
  const effectiveDelta = manualDelta
    ? parseInt(manualDelta, 10)
    : isStampOrVisit
      ? 1
      : preview?.points_delta ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProgramId) { setError('Selecciona un programa.'); return; }
    if (!effectiveDelta)    { setError('Ingresa un monto o cantidad de puntos.'); return; }

    const fd = new FormData();
    fd.set('customer_id',  customerId);
    fd.set('program_id',   selectedProgramId);
    fd.set('points_delta', String(effectiveDelta));
    fd.set('note',         note || (preview?.note ?? ''));

    startTransition(async () => {
      const result = await assignPointsAction(fd);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(`${effectiveDelta > 0 ? '+' : ''}${effectiveDelta} ${programLabel} registrado`);
        setAmountStr('');
        setManualDelta('');
        setNote('');
        router.refresh();
      }
    });
  }

  if (!enrollments.length) {
    return (
      <p className="text-sm text-gray-400">
        El cliente aún no está inscrito en ningún programa. Registra una transacción para inscribirse automáticamente.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mounted && (
        <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
          <p style={errorStyle} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{displayText}</p>
        </div></div>
      )}
      {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

      {/* Program selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
        <select
          value={selectedProgramId}
          onChange={(e) => { setSelectedProgramId(e.target.value); setAmountStr(''); setManualDelta(''); }}
          className={inputCls}
        >
          {enrollments.map((e) => (
            <option key={e.program_id} value={e.program_id}>
              {e.program.name} — {e.current_points} {programLabel}
            </option>
          ))}
        </select>
      </div>

      {selectedProgram?.type === 'points' || selectedProgram?.type === 'cashback' ? (
        /* Purchase amount → auto-compute points */
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto de compra ($)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amountStr}
            onChange={(e) => { setAmountStr(e.target.value); setManualDelta(''); }}
            placeholder="e.g. 25.00"
            className={inputCls}
          />
          {preview && !preview.skipped && (
            <p className="mt-1 text-xs text-green-600 font-medium">
              Se otorgarán {preview.points_delta} {programLabel}
            </p>
          )}
          {preview?.skipped && (
            <p className="mt-1 text-xs text-orange-500">{preview.note}</p>
          )}
        </div>
      ) : (
        /* Stamp / visit: manual delta */
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedProgram?.type === 'stamp' ? 'Sellos a agregar' : 'Visitas a agregar'}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={manualDelta || '1'}
            onChange={(e) => setManualDelta(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {/* Manual override */}
      {(selectedProgram?.type === 'points' || selectedProgram?.type === 'cashback') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ajuste manual de {programLabel} (opcional)
          </label>
          <input
            type="number"
            step="1"
            value={manualDelta}
            onChange={(e) => setManualDelta(e.target.value)}
            placeholder="Dejar en blanco para usar el monto calculado"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Compra #1234"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !effectiveDelta}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? 'Registrando…' : `Registrar ${effectiveDelta > 0 ? `+${effectiveDelta}` : effectiveDelta} ${programLabel}`}
      </button>
    </form>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
