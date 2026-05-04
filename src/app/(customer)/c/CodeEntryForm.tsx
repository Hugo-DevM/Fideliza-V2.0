'use client';

/**
 * CodeEntryForm — client component for manual access code entry.
 *
 * Auto-formats input as XXXX-XXXX (uppercase, inserts hyphen after 4 chars).
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

    // Max 8 meaningful chars
    const trimmed = raw.slice(0, 8);

    // Insert hyphen after position 4
    const formatted = trimmed.length > 4
      ? `${trimmed.slice(0, 4)}-${trimmed.slice(4)}`
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
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-1.5">
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
          placeholder="XXXX-XXXX"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={9}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-xl font-mono font-semibold tracking-widest text-gray-900 placeholder-gray-300 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-describedby={error ? 'code-error' : undefined}
        />
        <p className="mt-1.5 text-xs text-gray-400 text-center">
          Encuentra tu código en la tarjeta que te dieron, o pídelo al negocio.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || code.replace(/-/g, '').length < 4}
        style={{ backgroundColor: primaryColor }}
        className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Buscando…' : 'Ver mis recompensas'}
      </button>
    </form>
  );
}
