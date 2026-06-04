"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { TocNav } from "@/app/[lang]/manual/TocNav";
import { ContentEs, tocEs } from "@/app/[lang]/manual/content/es";
import { ContentEn, tocEn } from "@/app/[lang]/manual/content/en";

export function ManualClient() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const isEs = lang === "es";

  const toc = isEs ? tocEs : tocEn;
  const backLabel = isEs ? "Volver al inicio" : "Back to home";
  const version = isEs
    ? "Manual de Usuario · v1.0 · Mayo 2026"
    : "User Manual · v1.0 · May 2026";
  const docsLabel = isEs ? "Documentación" : "Documentation";
  const title = isEs ? "Manual de Usuario" : "User Manual";
  const description = isEs
    ? "Configura y opera tu programa de fidelización en Fideliza+. Basado en la implementación real del sistema."
    : "Configure and operate your loyalty program in Fideliza+. Based on the real system implementation.";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-white/10">
        <Container className="flex items-center justify-between h-14">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            {backLabel}
          </a>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block">
              {version}
            </span>

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
        </Container>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-indigo-950/40 to-gray-950 border-b border-white/10">
        <Container className="py-12">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
            {docsLabel}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {title}
          </h1>
          <p className="text-gray-400 max-w-xl">{description}</p>
        </Container>
      </div>

      {/* ── Main layout: TOC + content ── */}
      <Container className="py-10">
        <div className="flex gap-10 items-start">
          <TocNav items={toc} />

          <main className="flex-1 min-w-0 space-y-0">
            {isEs ? <ContentEs /> : <ContentEn />}

            <div className="pt-10 pb-4 text-center text-xs text-gray-600">
              Fideliza+ · v1.0 ·{" "}
              <a href="/" className="hover:text-gray-400 transition-colors">
                {backLabel}
              </a>
            </div>
          </main>
        </div>
      </Container>
    </div>
  );
}
