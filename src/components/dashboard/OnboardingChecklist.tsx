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
  const storageKey   = `fideliza_onboarding_dismissed_${tenantId}`;
  const collapsedKey = `fideliza_onboarding_collapsed_${tenantId}`;

  // Start hidden to avoid flash — useLayoutEffect runs before paint
  const [dismissed, setDismissed] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [visible,   setVisible]   = useState(false); // drives entrance animation

  useLayoutEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === '1';
    const isCollapsed = localStorage.getItem(collapsedKey) === '1';
    setDismissed(isDismissed);
    setCollapsed(isCollapsed);
    // Trigger entrance on next frame so CSS transition fires
    if (!isDismissed) requestAnimationFrame(() => setVisible(true));
  }, [storageKey, collapsedKey]);

  const completed = steps.filter((s) => s.done).length;
  const total     = steps.length;
  const allDone   = completed === total;
  const pct       = Math.round((completed / total) * 100);

  if (allDone || dismissed) return null;

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
    // Wait for exit animation before unmounting
    setTimeout(() => setDismissed(true), 350);
  }

  function toggleCollapse() {
    const next = !collapsed;
    localStorage.setItem(collapsedKey, next ? '1' : '0');
    setCollapsed(next);
  }

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end"
      style={{
        // On mobile, don't exceed the viewport width
        maxWidth: 'calc(100vw - 2rem)',
        // Entrance: slide up + fade in
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 350ms cubic-bezier(.4,0,.2,1), transform 350ms cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Panel — always in DOM, animated with grid-template-rows trick */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          opacity:   collapsed ? 0 : 1,
          transform: collapsed ? 'translateY(8px) scale(0.97)' : 'translateY(0) scale(1)',
          marginBottom: collapsed ? 0 : '0.75rem',
          transition: [
            'grid-template-rows 320ms cubic-bezier(.4,0,.2,1)',
            'opacity 250ms cubic-bezier(.4,0,.2,1)',
            'transform 320ms cubic-bezier(.4,0,.2,1)',
            'margin-bottom 320ms cubic-bezier(.4,0,.2,1)',
          ].join(', '),
          pointerEvents: collapsed ? 'none' : 'auto',
          width: '100%',
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-white dark:bg-[#161b2e] shadow-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-50 dark:border-indigo-500/10 bg-indigo-50/60 dark:bg-indigo-500/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <RocketIcon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Primeros pasos</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{completed} de {total} completados</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleCollapse}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Minimizar"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Descartar"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
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
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                    step.done
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-200 dark:border-[#2a3147] bg-transparent'
                  }`}>
                    {step.done && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`flex-1 text-sm ${
                    step.done
                      ? 'text-gray-400 dark:text-gray-500 line-through'
                      : 'text-gray-700 dark:text-gray-200 font-medium'
                  }`}>
                    {step.label}
                  </span>
                  {!step.done && step.href && (
                    <Link
                      href={step.href}
                      className="shrink-0 text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                      Ir
                    </Link>
                  )}
                </li>
              ))}
            </ul>

          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Ver primeros pasos' : 'Minimizar'}
        style={{
          transition: 'transform 200ms cubic-bezier(.4,0,.2,1), box-shadow 200ms ease',
        }}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-90 text-white shadow-lg hover:shadow-indigo-500/40 hover:scale-110"
      >
        {/* Icon: rocket when collapsed, chevron when expanded */}
        <span
          style={{
            display: 'grid',
            position: 'absolute',
            inset: 0,
            placeItems: 'center',
            opacity: collapsed ? 1 : 0,
            transform: collapsed ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
            transition: 'opacity 220ms ease, transform 220ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <RocketIcon className="h-5 w-5" />
        </span>
        <span
          style={{
            display: 'grid',
            position: 'absolute',
            inset: 0,
            placeItems: 'center',
            opacity: collapsed ? 0 : 1,
            transform: collapsed ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
            transition: 'opacity 220ms ease, transform 220ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </span>

        {/* Progress badge */}
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-[#161b2e] border border-indigo-100 dark:border-indigo-500/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400"
          style={{
            transition: 'transform 300ms cubic-bezier(.34,1.56,.64,1)',
            transform: collapsed ? 'scale(1)' : 'scale(0.85)',
          }}
        >
          {completed}
        </span>
      </button>
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}
