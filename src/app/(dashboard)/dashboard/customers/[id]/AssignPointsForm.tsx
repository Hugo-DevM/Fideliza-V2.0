'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignPointsAction } from './actions';
import { computeEarnDelta } from '@/lib/utils/points-calculator';
import type { CustomerProgramEnrollment, RewardProgram } from '@/lib/types';

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
  const [error, setError] = useState('');
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

    if (!selectedProgramId) { setError('Select a program'); return; }
    if (!effectiveDelta)    { setError('Enter an amount or points delta'); return; }

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
        setSuccess(`${effectiveDelta > 0 ? '+' : ''}${effectiveDelta} ${programLabel} recorded`);
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
        Customer is not enrolled in any programs yet. Record a transaction to auto-enroll.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error   && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

      {/* Program selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase amount ($)</label>
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
              Will award {preview.points_delta} {programLabel}
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
            {selectedProgram?.type === 'stamp' ? 'Stamps to add' : 'Visits to add'}
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
            Override {programLabel} (optional)
          </label>
          <input
            type="number"
            step="1"
            value={manualDelta}
            onChange={(e) => setManualDelta(e.target.value)}
            placeholder="Leave blank to use auto-computed amount"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Purchase #1234"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !effectiveDelta}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? 'Recording…' : `Record ${effectiveDelta > 0 ? `+${effectiveDelta}` : effectiveDelta} ${programLabel}`}
      </button>
    </form>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
