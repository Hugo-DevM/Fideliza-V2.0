'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProgramAction } from './actions';
import { useAutoError } from '@/hooks/useAutoError';
import { useModalTransition } from '@/hooks/useModalTransition';

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
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(open);
  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
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
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shrink-0"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo programa
      </button>

      {modalMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl overflow-y-auto max-h-[90vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#2a3147]"
            style={{ opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Crear programa</h2>
              <button onClick={() => setOpen(false)} className="text-xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {mounted && (
                <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
                  <p style={errorStyle} className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{displayText}</p>
                </div></div>
              )}

              <NameField charCount={nameLen} onCharCount={setNameLen} />
              <DescField charCount={descLen} onCharCount={setDescLen} />

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de programa *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PROGRAM_TYPES.map((t) => {
                    const allowed = allowedTypes.includes(t.value);
                    return allowed ? (
                      <label
                        key={t.value}
                        className={`flex cursor-pointer flex-col rounded-lg border p-3 transition ${
                          type === t.value
                            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/15'
                            : 'border-gray-200 dark:border-[#2a3147] hover:border-gray-300 dark:hover:border-[#3a4157]'
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
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{t.label}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.hint}</span>
                      </label>
                    ) : (
                      <div
                        key={t.value}
                        className="relative flex flex-col rounded-lg border border-gray-100 dark:border-[#2a3147] bg-gray-50 dark:bg-[#1a1f35] p-3 opacity-60 cursor-not-allowed"
                      >
                        <span className="absolute top-2 right-2 rounded-full bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          Pro
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.label}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.hint}</span>
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

              {/* Head Start — bonus points on first earn */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Head Start (opcional)</span>
                  <span className="rounded-full bg-amber-200 dark:bg-amber-700/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">NUEVO</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Puntos extra al inscribirse. <strong>2/10 sellos convierte mejor que 0/10</strong> — el cliente siente que ya tiene progreso que perder.
                </p>
                <NumField
                  label="Puntos de bienvenida"
                  name="initial_bonus"
                  defaultValue="0"
                  min="0"
                  hint="0 = sin bonus. Ej: 2 en programa de 10 sellos"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
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

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20';

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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
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
