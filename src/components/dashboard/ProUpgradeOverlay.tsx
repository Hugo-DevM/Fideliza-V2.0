import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Plan-gate wall: renders a blurred, non-interactive preview of the feature
 * behind a centered upgrade card. Server-side actions must still enforce the
 * plan — this is presentation only.
 */
export default function ProUpgradeOverlay({
  title,
  description,
  icon,
  planLabel = 'Plan Pro',
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  planLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[70vh]">
      {/* Blurred preview — inert blocks focus/interaction, blur hides detail */}
      <div
        inert
        aria-hidden="true"
        className="pointer-events-none select-none max-h-[80vh] overflow-hidden blur-[6px] opacity-60 dark:opacity-40"
      >
        {children}
      </div>

      {/* Bottom fade so the clipped preview doesn't end abruptly */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f8f9fc] dark:from-[#0d0f17] to-transparent" />

      {/* Upgrade card */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 p-5 ring-8 ring-white/60 dark:ring-[#0d0f17]/60">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title} — {planLabel}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          <Link
            href="/dashboard/settings#billing"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition"
          >
            Actualizar a Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
