'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ0-9 +\-()]*$/;

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'active',   label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

export default function CustomerSearchInput({
  defaultValue,
  defaultStatus = 'all',
}: {
  defaultValue?: string;
  defaultStatus?: StatusFilter;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue]   = useState(defaultValue ?? '');
  const [status, setStatus] = useState<StatusFilter>(defaultStatus);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildParams(q: string, s: StatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) { params.set('q', q.trim()); } else { params.delete('q'); }
    if (s !== 'all') { params.set('status', s); } else { params.delete('status'); }
    params.delete('page');
    return params.toString();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw !== '' && !ALLOWED.test(raw)) return;
    const upper = raw.toUpperCase();
    setValue(upper);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(`/dashboard/customers?${buildParams(upper, status)}`);
    }, 120);
  }

  function handleStatusChange(s: StatusFilter) {
    setStatus(s);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(`/dashboard/customers?${buildParams(value, s)}`);
  }

  function handleClear() {
    setValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(`/dashboard/customers?${buildParams('', status)}`);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(`/dashboard/customers?${buildParams(value, status)}`);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
        <input
          value={value}
          onChange={handleChange}
          placeholder="Nombre, teléfono o código (FSC5-YN5V)…"
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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

      {/* Status filter pills */}
      <div className="flex gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleStatusChange(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              status === opt.value
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

