'use client';

import { useLayoutEffect, useState } from 'react';
import Link from 'next/link';

export interface OnboardingStep {
  label: string;
  done:  boolean;
  href?: string;
}

interface Props {
  tenantId: string;
  steps:    OnboardingStep[];
}

export default function OnboardingChecklist({ tenantId, steps }: Props) {
  const storageKey = `fideliza_onboarding_dismissed_${tenantId}`;

  // Start hidden to avoid flash — useLayoutEffect runs before paint
  const [dismissed, setDismissed] = useState(true);

  useLayoutEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  const completed  = steps.filter((s) => s.done).length;
  const total      = steps.length;
  const allDone    = completed === total;
  const pct        = Math.round((completed / total) * 100);

  if (allDone || dismissed) return null;

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setDismissed(true);
  }

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-50 dark:border-indigo-500/10 bg-indigo-50/60 dark:bg-indigo-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <RocketIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Primeros pasos</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{completed} de {total} completados</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          aria-label="Descartar"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-indigo-50 dark:bg-indigo-500/10">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-3.5">
            {/* Circle */}
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              step.done
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-gray-200 dark:border-[#2a3147] bg-transparent'
            }`}>
              {step.done && <CheckIcon className="h-3.5 w-3.5 text-white" />}
            </div>

            {/* Label */}
            <span className={`flex-1 text-sm ${
              step.done
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-700 dark:text-gray-200 font-medium'
            }`}>
              {step.label}
            </span>

            {/* Action link */}
            {!step.done && step.href && (
              <Link
                href={step.href}
                className="shrink-0 text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              >
                Ir →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
