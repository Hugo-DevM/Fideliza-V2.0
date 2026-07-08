'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Dictionary } from '@/lib/i18n';

interface CouponStatus {
  code: string;
  active: boolean;
  remaining: number | null;
  total: number | null;
}

interface AnnouncementBarProps {
  t: Dictionary['pricing']['coupon'];
  /** Notifies the parent so the navbar can shift down while the bar is visible. */
  onVisibleChange: (visible: boolean) => void;
}

/**
 * Fixed announcement bar above the navbar promoting the founders coupon,
 * with a live remaining-redemptions counter. Hides itself when the coupon
 * is sold out, deactivated, or dismissed by the user.
 */
export function AnnouncementBar({ t, onVisibleChange }: AnnouncementBarProps) {
  const [status, setStatus] = useState<CouponStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stripe/coupon')
      .then((res) => res.json())
      .then((json: { data: CouponStatus | null }) => {
        if (!cancelled && json.data?.active) setStatus(json.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visible = Boolean(status) && !dismissed;

  useEffect(() => {
    onVisibleChange(visible);
  }, [visible, onVisibleChange]);

  const remainingText =
    status && status.remaining !== null && status.total !== null
      ? t.remaining.replace('{n}', String(status.remaining)).replace('{total}', String(status.total))
      : null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(t.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          exit={{ y: -40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[60] h-10 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white"
        >
          <div className="mx-auto flex h-full max-w-7xl items-center justify-center gap-1.5 sm:gap-3 pl-2 pr-9 sm:px-10 text-xs sm:text-sm">
            <span aria-hidden="true" className="hidden sm:inline">🎟️</span>

            {/* Full copy on ≥sm, compact on mobile */}
            <p className="min-w-0 flex-shrink">
              <span className="hidden sm:inline truncate">{t.description}</span>
              <span className="sm:hidden font-medium text-[11px] leading-tight">{t.introShort}</span>
            </p>

            <button
              onClick={handleCopy}
              title={copied ? t.copied : t.copy}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/25 px-2 sm:px-2.5 py-1 font-mono text-[11px] sm:text-xs font-bold tracking-wide transition-colors"
            >
              {copied ? t.copied : t.code}
            </button>

            {status && status.remaining !== null && status.total !== null && (
              <span className="flex-shrink-0 rounded-full bg-amber-300 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-950 whitespace-nowrap">
                <span className="hidden sm:inline">{remainingText}</span>
                <span className="sm:hidden">{status.remaining}/{status.total}</span>
              </span>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
