/**
 * Encabezado de /admin: título y salida al dashboard.
 *
 * No es un layout.tsx porque /admin/verify cuelga de la misma ruta y ahí no
 * debe salir — todavía no has pasado el segundo factor.
 */

import Link from 'next/link';

export default function AdminHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de administración</h1>
      </div>

      {/* Vuelta al negocio: /admin vive fuera del layout del dashboard, así
          que sin esto la única salida es teclear la URL. */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-[#161b2e] hover:text-gray-900 dark:hover:text-white"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver al panel
      </Link>
    </div>
  );
}
