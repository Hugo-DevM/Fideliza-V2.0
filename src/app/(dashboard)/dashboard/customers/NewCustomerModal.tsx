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
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        + Nuevo cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Agregar cliente</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
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
                  <p className="mt-1 text-xs text-amber-600">{phone.length}/10 dígitos — faltan {PHONE_MAX - phone.length}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Notas internas (no visibles al cliente)"
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
