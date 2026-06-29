'use client';

import { useState } from 'react';
import NewProgramModal from './NewProgramModal';

export default function CreateProgramCard({ allowedTypes }: { allowedTypes: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setOpen(true); }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2a3147] p-8 text-center transition hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 group min-h-[200px] focus:outline-none"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#2a3147] group-hover:border-indigo-400 dark:group-hover:border-indigo-500 transition mb-3">
          <span className="text-xl text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition leading-none">+</span>
        </div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Crear programa</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Puntos, sellos o visitas</p>
      </button>

      {open && (
        <NewProgramModal allowedTypes={allowedTypes} controlledOpen={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
