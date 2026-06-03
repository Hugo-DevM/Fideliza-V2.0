'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ0-9 +\-()]*$/;

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',      label: 'Todos'     },
  { value: 'active',   label: 'Activos'   },
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
    <div className="flex flex-wrap items-center gap-3">

      {/* Search */}
      <form onSubmit={handleSubmit} className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          value={value}
          onChange={handleChange}
          placeholder="Nombre, teléfono o código…"
          className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] pl-10 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            title="Limpiar"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Status filter pills */}
      <div className="flex gap-1 rounded-xl bg-gray-50 dark:bg-[#0d0f17] p-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleStatusChange(opt.value)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              status === opt.value
                ? 'bg-white dark:bg-[#1e2438] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
