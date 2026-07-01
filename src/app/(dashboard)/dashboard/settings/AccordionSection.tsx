'use client';

import { useState } from 'react';

export default function AccordionSection({
  title,
  description,
  icon,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">{title}</span>
              {badge}
            </div>
            {description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* CSS-hidden so form inputs inside remain in the DOM and still submit */}
      <div className={open ? 'block' : 'hidden'}>
        <div className="border-t border-gray-100 dark:border-[#1e2438] px-5 py-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
