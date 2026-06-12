'use client';

/**
 * CodeEntryForm — client component for manual access code entry.
 *
 * Auto-formats input as XXXXX-XXXXX (uppercase, inserts hyphen after 5 chars).
 * On submit, navigates to ?code=INPUT so the server component re-fetches data.
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CodeEntryFormProps {
  /** Error message to display above the form (e.g. "Code not found"). */
  error?: string;
  /** Tenant brand color for the submit button */
  primaryColor?: string;
}

export default function CodeEntryForm({ error, primaryColor = '#6366F1' }: CodeEntryFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip everything that isn't alphanumeric, uppercase it
    const raw = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Max 10 meaningful chars
    const trimmed = raw.slice(0, 10);

    // Insert hyphen after position 5
    const formatted = trimmed.length > 5
      ? `${trimmed.slice(0, 5)}-${trimmed.slice(5)}`
      : trimmed;

    setCode(formatted);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Allow backspace to remove the hyphen cleanly
    if (e.key === 'Backspace' && code.endsWith('-')) {
      e.preventDefault();
      setCode(code.slice(0, -1));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.replace(/-/g, '');
    if (clean.length < 4) return;
    setLoading(true);
    router.push(`?code=${encodeURIComponent(code)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="access-code" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Código de acceso
        </label>
        <input
          ref={inputRef}
          id="access-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="XXXXX - XXXXX"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={11}
          className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-4 py-3.5 text-center text-xl font-mono font-semibold tracking-widest text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
          aria-describedby={error ? 'code-error' : undefined}
        />
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
          Encuentra tu código en la tarjeta que te dieron, o pídelo al negocio.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || code.replace(/-/g, '').length < 5}
        style={{ backgroundColor: primaryColor }}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Buscando…' : 'Ver mis recompensas'}
        {!loading && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        )}
      </button>
    </form>
  );
}
