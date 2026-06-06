'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import {
  DashboardI18nProvider,
  useDashboardI18n,
} from '@/lib/i18n/dashboard-context';

interface DashboardShellProps {
  tenantName: string;
  tenantPlan?: string;
  timezone: string;
  children: React.ReactNode;
}

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <DashboardI18nProvider defaultTimezone={props.timezone}>
      <DashboardShellContent {...props} />
    </DashboardI18nProvider>
  );
}

function DashboardShellContent({ tenantName, tenantPlan, children }: DashboardShellProps) {
  const { t } = useDashboardI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [leafLabel, setLeafLabel] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Track document.title changes via MutationObserver for sub-page leaf label
  useEffect(() => {
    function extractLabel() {
      return document.title.replace(/\s*[—–-]\s*Fideliza\+?.*$/i, '').trim();
    }

    setLeafLabel(extractLabel());

    const titleEl = document.querySelector('title');
    if (!titleEl) return;

    const observer = new MutationObserver(() => {
      setLeafLabel(extractLabel());
    });
    observer.observe(titleEl, { childList: true });

    return () => observer.disconnect();
  }, [pathname]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  // Build breadcrumb segments
  const segments     = pathname.split('/').filter(Boolean);
  const depth        = segments.length;
  const sectionPath  = depth >= 2 ? '/' + segments.slice(0, 2).join('/') : '';
  const sectionLabel = t.shell.pageLabels[sectionPath] ?? t.shell.pageLabels[pathname] ?? t.shell.panel;
  const parentIdPath = depth >= 4 ? '/' + segments.slice(0, 3).join('/') : '';
  const lastSegment   = segments[segments.length - 1] ?? '';
  const knownSubLabel = t.shell.subSegmentLabels[lastSegment];
  const parentName = knownSubLabel && leafLabel
    ? leafLabel.replace(new RegExp(`\\s*·\\s*${knownSubLabel}$`, 'i'), '').trim() || leafLabel
    : leafLabel;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc] dark:bg-[#0d0f17]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        tenantName={tenantName}
        tenantPlan={tenantPlan}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#111520] px-4 md:px-6">
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 md:hidden"
              aria-label={t.shell.openMenu}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <nav className="hidden md:flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 dark:text-gray-500">{t.shell.panel}</span>
              <ChevronIcon className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
              {depth <= 2 ? (
                <span className="font-semibold text-gray-700 dark:text-gray-200">{sectionLabel}</span>
              ) : depth >= 4 && knownSubLabel ? (
                <>
                  <Link href={sectionPath} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition">{sectionLabel}</Link>
                  <ChevronIcon className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                  <Link href={parentIdPath} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition">{parentName || '…'}</Link>
                  <ChevronIcon className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{knownSubLabel}</span>
                </>
              ) : (
                <>
                  <Link href={sectionPath} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition">{sectionLabel}</Link>
                  <ChevronIcon className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{leafLabel || '…'}</span>
                </>
              )}
            </nav>
          </div>

          {/* Right: bell + theme toggle */}
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition">
              <BellIcon className="h-4 w-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
              aria-label={isDark ? t.shell.lightMode : t.shell.darkMode}
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}
