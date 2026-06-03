'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProgramAction } from './actions';

const ALL_PROGRAM_TYPES = [
  { value: 'points',   label: 'Puntos',           hint: 'Gana X puntos por $ gastado' },
  { value: 'stamp',    label: 'Tarjeta de sellos', hint: 'Acumula N sellos, gana una recompensa' },
  { value: 'visit',    label: 'Visitas',           hint: 'Recompensa tras N visitas' },
  { value: 'cashback', label: 'Cashback',          hint: 'Gana % de vuelta como crédito' },
];

export default function NewProgramModal({
  allowedTypes,
  controlledOpen,
  onClose,
}: {
  allowedTypes: string[];
  controlledOpen?: boolean;
  onClose?: () => void;
}) {
  const PROGRAM_TYPES = ALL_PROGRAM_TYPES.filter((t) => allowedTypes.includes(t.value));
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  function setOpen(v: boolean) { if (onClose && !v) onClose(); else setInternalOpen(v); }
  const [type, setType]       = useState(() => PROGRAM_TYPES[0]?.value ?? 'points');
  const [error, setError]     = useState('');
  const [nameLen, setNameLen] = useState(0);
  const [descLen, setDescLen] = useState(0);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createProgramAction(data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setType(PROGRAM_TYPES[0]?.value ?? 'points');
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shrink-0"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo programa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Crear programa</h2>
              <button onClick={() => setOpen(false)} className="text-xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <NameField charCount={nameLen} onCharCount={setNameLen} />
              <DescField charCount={descLen} onCharCount={setDescLen} />

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de programa *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PROGRAM_TYPES.map((t) => {
                    const allowed = allowedTypes.includes(t.value);
                    return allowed ? (
                      <label
                        key={t.value}
                        className={`flex cursor-pointer flex-col rounded-lg border p-3 transition ${
                          type === t.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={t.value}
                          checked={type === t.value}
                          onChange={() => setType(t.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-800">{t.label}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{t.hint}</span>
                      </label>
                    ) : (
                      <div
                        key={t.value}
                        className="relative flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-3 opacity-60 cursor-not-allowed"
                      >
                        <span className="absolute top-2 right-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Pro
                        </span>
                        <span className="text-sm font-medium text-gray-500">{t.label}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{t.hint}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Type-specific config */}
              {type === 'points' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumField
                    label="Puntos por cada $1 gastado"
                    name="points_per_dollar"
                    defaultValue="10"
                    hint="Ej: 10 → el cliente gana 10 pts por cada $1"
                  />
                  <NumField
                    label="Puntos mínimos para canjear"
                    name="min_redeem"
                    defaultValue="100"
                    hint="El cliente necesita acumular al menos este número de puntos"
                  />
                </div>
              )}
              {type === 'stamp' && (
                <NumField label="Sellos para la recompensa" name="stamps_needed" defaultValue="10" />
              )}
              {type === 'visit' && (
                <NumField label="Visitas para la recompensa" name="visits_needed" defaultValue="5" />
              )}
              {type === 'cashback' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Cashback %" name="cashback_percent" defaultValue="5" step="0.1" min="0.1" />
                  <NumField label="Compra mínima ($)" name="min_purchase" defaultValue="10" step="0.01" min="0.01" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPending ? 'Creando…' : 'Crear programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

function NameField({ charCount, onCharCount }: { charCount: number; onCharCount: (n: number) => void }) {
  const MAX = 60;
  const warn = charCount >= Math.floor(MAX * 0.85);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del programa *</label>
        <span className={`text-xs ${warn ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {charCount} / {MAX}
        </span>
      </div>
      <input
        name="name"
        type="text"
        placeholder="Recompensas Café"
        required
        maxLength={MAX}
        onChange={(e) => onCharCount(e.target.value.length)}
        className={inputCls}
      />
    </div>
  );
}

function DescField({ charCount, onCharCount }: { charCount: number; onCharCount: (n: number) => void }) {
  const MAX = 200;
  const warn = charCount >= Math.floor(MAX * 0.85);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
        <span className={`text-xs ${warn ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {charCount} / {MAX}
        </span>
      </div>
      <textarea
        name="description"
        placeholder="Acumula puntos en cada compra"
        maxLength={MAX}
        rows={3}
        onChange={(e) => onCharCount(e.target.value.length)}
        className={`${inputCls} resize-none`}
      />
    </div>
  );
}

function NumField({ label, name, defaultValue, step, min, hint }: {
  label: string; name: string; defaultValue: string; step?: string; min?: string; hint?: string;
}) {
  const resolvedStep = step ?? '1';
  const resolvedMin  = min  ?? '1';
  const isInteger    = resolvedStep === '1';

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    if (isInteger) val = val.replace(/[.,].*/, '');
    const num = parseFloat(val);
    if (!isNaN(num) && num < parseFloat(resolvedMin)) {
      e.target.value = resolvedMin;
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type="number"
        min={resolvedMin}
        step={resolvedStep}
        defaultValue={defaultValue}
        required
        onKeyDown={(e) => {
          if (isInteger && (e.key === '.' || e.key === ',')) e.preventDefault();
          if (e.key === '-') e.preventDefault();
        }}
        onChange={handleInput}
        className={inputCls}
      />
      {hint && <p className="mt-1 text-xs text-gray-400 leading-snug">{hint}</p>}
    </div>
  );
}
