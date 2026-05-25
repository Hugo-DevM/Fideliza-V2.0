import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary, isValidLocale } from "@/lib/i18n";

export default async function NotFound() {
  const headersList = await headers();
  const rawLang = headersList.get("x-locale") ?? "en";
  const lang = isValidLocale(rawLang) ? rawLang : "en";
  const dict = await getDictionary(lang);
  const t = dict.notFound;

  return (
    <div className="hero-bg min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {/* Logotipo */}
      <Link
        href="/"
        aria-label={t.logoAriaLabel}
        className="mb-12 inline-flex items-center gap-2 animate-fade-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logofideliza.svg"
          alt="Fideliza+"
          width={36}
          height={36}
          className="h-10 w-auto"
        />
      </Link>

      {/* Número de error */}
      <p
        className="gradient-text text-[8rem] sm:text-[12rem] font-extrabold leading-none select-none
                   animate-fade-in"
        aria-hidden="true"
      >
        404
      </p>

      {/* Título */}
      <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white animate-fade-in-delay-1">
        {t.title}
      </h1>

      {/* Descripción */}
      <p className="mt-3 max-w-md text-base text-indigo-200/70 animate-fade-in-delay-2">
        {t.description}
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
          {t.backHome}
        </Link>

        <a
          href="mailto:hola@fideliza.app"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3
                     border border-indigo-500/40 hover:border-indigo-400/70
                     text-indigo-300 hover:text-indigo-200 text-sm font-medium
                     transition-colors
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          {t.contactSupport}
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
