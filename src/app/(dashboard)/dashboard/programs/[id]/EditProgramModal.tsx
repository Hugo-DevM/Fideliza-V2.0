'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateProgramInfoAction } from './actions';
import { useAutoError } from '@/hooks/useAutoError';
import { useModalTransition } from '@/hooks/useModalTransition';

export default function EditProgramModal({
  programId,
  currentName,
  currentDescription,
}: {
  programId: string;
  currentName: string;
  currentDescription: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(open);
  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
  const [nameLen, setNameLen] = useState(currentName.length);
  const [descLen, setDescLen] = useState(currentDescription?.length ?? 0);
  const NAME_MAX = 60;
  const DESC_MAX = 200;
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProgramInfoAction(programId, data);
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
        onClick={() => setOpen(true)}
        className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
      >
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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Editar programa</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {mounted && (
                <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
                  <p style={errorStyle} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{displayText}</p>
                </div></div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre del programa *
                  </label>
                  <span className={`text-xs ${nameLen >= Math.floor(NAME_MAX * 0.85) ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {nameLen} / {NAME_MAX}
                  </span>
                </div>
                <input
                  name="name"
                  type="text"
                  defaultValue={currentName}
                  required
                  maxLength={NAME_MAX}
                  onChange={(e) => setNameLen(e.target.value.length)}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </label>
                  <span className={`text-xs ${descLen >= Math.floor(DESC_MAX * 0.85) ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {descLen} / {DESC_MAX}
                  </span>
                </div>
                <textarea
                  name="description"
                  defaultValue={currentDescription ?? ''}
                  placeholder="Describe brevemente el programa"
                  maxLength={DESC_MAX}
                  rows={3}
                  onChange={(e) => setDescLen(e.target.value.length)}
                  className="w-full resize-none rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
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
