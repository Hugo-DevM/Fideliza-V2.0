'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateCustomerAction } from '../actions';

const NAME_ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/;
const NAME_MAX = 60;
const PHONE_MAX = 10;

function capitalizeWords(value: string) {
  return value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

interface Props {
  customerId: string;
  initialName: string;
  initialPhone: string | null;
  initialNotes: string | null;
}

export default function EditCustomerModal({ customerId, initialName, initialPhone, initialNotes }: Props) {
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [name,  setName]  = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  function handleOpen() {
    setName(initialName);
    setPhone(initialPhone ?? '');
    setNotes(initialNotes ?? '');
    setError('');
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateCustomerAction(data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 flex items-center gap-1.5"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
        </svg>
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar cliente</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <input type="hidden" name="customerId" value={customerId} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    if (!NAME_ALLOWED.test(e.target.value)) return;
                    if (e.target.value.length > NAME_MAX) return;
                    setName(capitalizeWords(e.target.value));
                  }}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="8134529076"
                  value={phone}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw.length > PHONE_MAX) return;
                    setPhone(raw);
                  }}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {isPending ? 'Guardando…' : 'Guardar cambios'}
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
