"use client";

import { useState } from "react";
import Link from "next/link";

const t = {
  es: {
    title: "Página no encontrada",
    description: "La página que buscas no existe o ha sido movida. Volvamos a encaminarte.",
    backHome: "Volver al inicio",
    contactSupport: "Contactar soporte",
    logoAriaLabel: "Fideliza — Volver al inicio",
  },
  en: {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
    backHome: "Back to home",
    contactSupport: "Contact support",
    logoAriaLabel: "Fideliza — Back to home",
  },
};

export default function NotFound() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const isEs = lang === "es";
  const tx = t[lang];

  return (
    <div className="hero-bg min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLang(isEs ? "en" : "es")}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-md px-3 py-1.5 transition-colors"
          aria-label={isEs ? "Switch to English" : "Cambiar a Español"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
            />
          </svg>
          {isEs ? "English" : "Español"}
        </button>
      </div>

      {/* Logotipo */}
      <Link
        href="/"
        aria-label={tx.logoAriaLabel}
        className="mb-12 inline-flex items-center gap-2 animate-fade-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logofideliza.svg"
          alt="Fideliza"
          className="h-10 w-auto"
        />
      </Link>

      {/* Número de error */}
      <p
        className="gradient-text text-[8rem] sm:text-[12rem] font-extrabold leading-none select-none animate-fade-in"
        aria-hidden="true"
      >
        404
      </p>

      {/* Título */}
      <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white animate-fade-in-delay-1">
        {tx.title}
      </h1>

      {/* Descripción */}
      <p className="mt-3 max-w-md text-base text-indigo-200/70 animate-fade-in-delay-2">
        {tx.description}
      </p>

      {/* Acciones */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 animate-fade-in-delay-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3
                     bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                     text-white text-sm font-medium
                     shadow-sm transition-colors
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
          {tx.backHome}
        </Link>

        <a
          href="mailto:hola@fideliza.app"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3
                     border border-indigo-500/40 hover:border-indigo-400/70
                     text-indigo-300 hover:text-indigo-200 text-sm font-medium
                     transition-colors
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          {tx.contactSupport}
        </a>
      </div>

      {/* Decoración de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden -z-0"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        h-[600px] w-[600px] rounded-full
                        bg-indigo-600/5 blur-3xl"
        />
      </div>
    </div>
  );
}
