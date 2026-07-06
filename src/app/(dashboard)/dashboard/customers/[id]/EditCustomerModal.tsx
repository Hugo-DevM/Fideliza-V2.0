'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateCustomerAction } from '../actions';
import { getLocalLimits } from '@/lib/constants/phone-limits';
import { useAutoError } from '@/hooks/useAutoError';
import { useModalTransition } from '@/hooks/useModalTransition';

const NAME_ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/;
const NAME_MAX = 60;

function capitalizeWords(value: string) {
  return value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

/** Strip the prefix from a stored phone if it starts with it; otherwise return as-is. */
function extractLocal(phone: string | null, prefix: string | null): string {
  if (!phone) return '';
  if (prefix && phone.startsWith(prefix)) return phone.slice(prefix.length);
  // Old format (digits only) — treat as local digits
  if (/^\d+$/.test(phone)) return phone;
  return phone;
}

interface Props {
  customerId: string;
  initialName: string;
  initialPhone: string | null;
  initialNotes: string | null;
  phonePrefix: string | null;
}

export default function EditCustomerModal({ customerId, initialName, initialPhone, initialNotes, phonePrefix }: Props) {
  const [open, setOpen]   = useState(false);
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(open);
  const { setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
  const [isPending, startTransition] = useTransition();
  const [name,  setName]  = useState(initialName);
  const [phone, setPhone] = useState(extractLocal(initialPhone, phonePrefix));
  const [notes, setNotes] = useState(initialNotes ?? '');
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  const { min: localMin, max: localMax, hint: localHint } = getLocalLimits(phonePrefix);
  const fullPhone = phonePrefix ? phonePrefix + phone : phone;

  function handleOpen() {
    setName(initialName);
    setPhone(extractLocal(initialPhone, phonePrefix));
    setNotes(initialNotes ?? '');
    setError('');
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (phone && phone.length < localMin) {
      setError(`El teléfono debe tener ${localHint}.`);
      return;
    }
    const data = new FormData(e.currentTarget);
    if (phone) data.set('phone', fullPhone);

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
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-[#1e2438]"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
        </svg>
        Editar
      </button>

      {modalMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl"
            style={{ opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Editar cliente</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none transition">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {mounted && (
                <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
                  <p style={errorStyle} className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{displayText}</p>
                </div></div>
              )}

              <input type="hidden" name="customerId" value={customerId} />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre completo *</label>
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

              {!phonePrefix && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
                  <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    No tienes un prefijo telefónico configurado. Los teléfonos se guardarán sin prefijo de país.{' '}
                    <a href="/dashboard/settings" className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-300 transition">
                      Configurar en Ajustes →
                    </a>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teléfono</label>
                <div className="flex">
                  {phonePrefix && (
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 dark:border-[#2a3147] bg-gray-100 dark:bg-[#1a1f35] px-3 text-sm font-medium text-gray-600 dark:text-gray-400 select-none shrink-0">
                      {phonePrefix}
                    </span>
                  )}
                  {/* Hidden input carries the full phone value to the server */}
                  <input type="hidden" name="phone" value={phone ? fullPhone : ''} />
                  <input
                    type="tel"
                    placeholder={phonePrefix ? '8134529076' : 'Configura un prefijo primero'}
                    disabled={!phonePrefix}
                    value={phone}
                    maxLength={localMax}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (raw.length > localMax) return;
                      setPhone(raw);
                    }}
                    className={[
                      inputCls,
                      phonePrefix ? 'rounded-l-none' : '',
                      !phonePrefix ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#1a1f35]' : '',
                      phone.length > 0 && phone.length < localMin ? 'border-amber-400 dark:border-amber-500 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-amber-100 dark:focus:ring-amber-500/20' : '',
                    ].join(' ')}
                  />
                </div>
                {phone.length === 0 && phonePrefix && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Se esperan <span className="font-medium">{localHint}</span>
                  </p>
                )}
                {phone.length > 0 && phone.length < localMin && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {localMin - phone.length} dígito{localMin - phone.length !== 1 ? 's' : ''} más · se esperan {localHint}
                  </p>
                )}
                {phone.length >= localMin && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {phonePrefix
                      ? <>Se guardará como <span className="font-mono text-gray-600 dark:text-gray-300">{fullPhone}</span></>
                      : <span className="font-mono text-gray-600 dark:text-gray-300">{phone}</span>
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
                <textarea
                  name="notes"
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas internas (no visibles al cliente)"
                  className={`${inputCls} resize-none`}
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
  'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';
