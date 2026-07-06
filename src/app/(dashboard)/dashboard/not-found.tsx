'use client';

import Link from 'next/link';
import { useDashboardI18n } from '@/lib/i18n/dashboard-context';

const copy = {
  es: {
    title: 'Página no encontrada',
    description:
      'La sección que buscas no existe o ha sido movida. Regresa al panel para continuar.',
    backToDashboard: 'Volver al panel',
    contactSupport: 'Contactar soporte',
  },
  en: {
    title: 'Page not found',
    description:
      "The section you're looking for doesn't exist or has been moved. Go back to the dashboard to continue.",
    backToDashboard: 'Back to dashboard',
    contactSupport: 'Contact support',
  },
};

export default function DashboardNotFound() {
  const { locale } = useDashboardI18n();
  const tx = copy[locale];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-7xl sm:text-8xl font-extrabold leading-none select-none bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-transparent"
        aria-hidden="true"
      >
        404
      </p>

      <h1 className="mt-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {tx.title}
      </h1>

      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {tx.description}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5
                     bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                     text-white text-sm font-medium shadow-sm transition-colors
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
            />
          </svg>
          {tx.backToDashboard}
        </Link>

        <Link
          href="/dashboard/soporte"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5
                     border border-gray-300 dark:border-indigo-500/40 hover:border-gray-400 dark:hover:border-indigo-400/70
                     text-gray-700 dark:text-indigo-300 hover:text-gray-900 dark:hover:text-indigo-200
                     text-sm font-medium transition-colors
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          {tx.contactSupport}
        </Link>
      </div>
    </div>
  );
}
