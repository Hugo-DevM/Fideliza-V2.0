'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomerAction } from './actions';

// Permite letras (incluye acentos, ñ, ü) y espacios; bloquea cualquier símbolo
const NAME_ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/;
const NAME_MAX = 60;
// Solo dígitos, máximo 10
const PHONE_MAX = 10;

function capitalizeWords(value: string) {
  return value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

export default function NewCustomerModal() {
  const [open, setOpen]       = useState(false);
  const [error, setError]     = useState('');
  const [isPending, startTransition] = useTransition();
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!NAME_ALLOWED.test(raw)) return;
    if (raw.length > NAME_MAX) return;
    setName(capitalizeWords(raw));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, ''); // solo dígitos
    if (raw.length > PHONE_MAX) return;
    setPhone(raw);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (phone.length !== PHONE_MAX) {
      setError('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createCustomerAction(data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setName('');
        setPhone('');
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 shrink-0"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Agregar cliente</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none transition">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre completo *</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Alice Méndez"
                  required
                  value={name}
                  onChange={handleNameChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teléfono *</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="8134529076"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`${inputCls} ${phone.length > 0 && phone.length < PHONE_MAX ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-100' : ''}`}
                />
                {phone.length > 0 && phone.length < PHONE_MAX && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{phone.length}/10 dígitos — faltan {PHONE_MAX - phone.length}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Notas internas (no visibles al cliente)"
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isPending ? 'Creando…' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
