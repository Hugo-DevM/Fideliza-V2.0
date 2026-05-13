'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Permite: letras (con acentos), dígitos, espacio, +, -, (, ), guion — todo lo necesario para nombre, teléfono y código FSC5-YN5V
const ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ0-9 +\-()]*$/;

export default function CustomerSearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw !== '' && !ALLOWED.test(raw)) return; // bloquea símbolos no permitidos
    setValue(raw.toUpperCase()); // código de acceso siempre en mayúsculas
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    params.delete('page');
    router.push(`/dashboard/customers?${params.toString()}`);
  }

  function handleClear() {
    setValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    router.push(`/dashboard/customers?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={handleChange}
        placeholder="Nombre, teléfono o código (FSC5-YN5V)…"
        className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <button type="submit" className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        Buscar
      </button>
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
