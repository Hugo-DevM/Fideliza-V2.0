'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ0-9 +\-()]*$/;

export default function CustomerSearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushQuery(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }
    params.delete('page');
    router.push(`/dashboard/customers?${params.toString()}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw !== '' && !ALLOWED.test(raw)) return;
    const upper = raw.toUpperCase();
    setValue(upper);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushQuery(upper), 120);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushQuery(value);
  }

  function handleClear() {
    setValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushQuery('');
  }

  // Limpia el timeout al desmontar
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={handleChange}
        placeholder="Nombre, teléfono o código (FSC5-YN5V)…"
        className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
        >
          Limpiar
        </button>
      )}
    </form>
  );
}
