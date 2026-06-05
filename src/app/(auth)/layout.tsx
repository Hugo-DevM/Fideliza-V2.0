import type { Metadata } from 'next';
import ThemeToggle from './ThemeToggle';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-gray-950">
        {/* Top-left glow */}
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-300/30 dark:bg-indigo-500/20 blur-3xl" />
        {/* Bottom-right glow */}
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-violet-300/25 dark:bg-violet-500/15 blur-3xl" />
        {/* Center-right subtle */}
        <div className="absolute top-1/2 right-1/4 h-72 w-72 rounded-full bg-blue-200/20 dark:bg-blue-500/10 blur-3xl" />
      </div>

      <ThemeToggle />
      {children}
    </>
  );
}
