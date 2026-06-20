'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { AlertItem } from '@/lib/alerts/get-alerts';

interface Props {
  initialAlerts: AlertItem[];
}

const TYPE_CONFIG = {
  stock_out:        { color: 'text-red-500   dark:text-red-400',    bg: 'bg-red-50    dark:bg-red-500/10',    dot: 'bg-red-500'    },
  program_expiring: { color: 'text-amber-500 dark:text-amber-400',  bg: 'bg-amber-50  dark:bg-amber-500/10',  dot: 'bg-amber-500'  },
  vouchers_expired: { color: 'text-orange-500 dark:text-orange-400',bg: 'bg-orange-50 dark:bg-orange-500/10', dot: 'bg-orange-500' },
  milestone:        { color: 'text-indigo-500 dark:text-indigo-400',bg: 'bg-indigo-50 dark:bg-indigo-500/10', dot: 'bg-indigo-500' },
  whatsapp_quality: { color: 'text-red-600   dark:text-red-400',    bg: 'bg-red-50    dark:bg-red-500/10',    dot: 'bg-red-600'    },
} as const;

const DISMISS_KEY = 'dismissed-alerts';

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
}

export default function AlertsBell({ initialAlerts }: Props) {
  const [open, setOpen]           = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate dismissed set from localStorage after mount
  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const visible = initialAlerts.filter((a) => !dismissed.has(a.id));
  const count   = visible.length;

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
        aria-label="Alertas"
      >
        <BellIcon className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#1e2438]">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Alertas</p>
            {count > 0 && (
              <span className="rounded-full bg-red-100 dark:bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                {count}
              </span>
            )}
          </div>

          {/* Alert list */}
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="text-2xl">✅</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Todo en orden</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">No hay alertas pendientes.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-[#1e2438]">
              {visible.map((alert) => {
                const cfg = TYPE_CONFIG[alert.type];
                return (
                  <li key={alert.id} className="group relative">
                    <Link
                      href={alert.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition"
                    >
                      {/* Color dot */}
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                          {alert.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300 leading-snug">
                          {alert.body}
                        </p>
                      </div>
                    </Link>

                    {/* Dismiss button (milestones only) */}
                    {alert.dismissible && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(alert.id); }}
                        className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a3050] transition"
                        aria-label="Descartar"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
