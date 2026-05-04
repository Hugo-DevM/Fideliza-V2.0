'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createRewardAction } from './actions';

type ProgramType = 'points' | 'stamp' | 'visit' | 'cashback';

interface Props {
  programId: string;
  programType: ProgramType;
  programConfig: Record<string, unknown>;
}

export default function NewRewardForm({ programId, programType, programConfig }: Props) {
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  // Derive the redemption threshold from program config for stamp/visit
  const stampThreshold = typeof programConfig.stamps_needed === 'number' ? programConfig.stamps_needed : null;
  const visitThreshold = typeof programConfig.visits_needed === 'number' ? programConfig.visits_needed : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createRewardAction(programId, data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
      >
        + Agregar recompensa
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Nueva recompensa</h3>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la recompensa *</label>
            <input name="name" type="text" required placeholder="Café gratis" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <input name="description" type="text" placeholder="Cualquier tamaño, cualquier bebida" className={inputCls} />
          </div>

          {/* cost_points: only shown for points/cashback — for stamp/visit it's auto-set from program config */}
          {programType === 'points' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Costo (puntos) *</label>
              <input name="cost_points" type="number" min="1" required placeholder="250" className={inputCls} />
            </div>
          )}
          {programType === 'cashback' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Saldo mínimo para canjear *</label>
              <input name="cost_points" type="number" min="1" required placeholder="500" className={inputCls} />
            </div>
          )}
          {programType === 'stamp' && stampThreshold !== null && (
            <>
              <input type="hidden" name="cost_points" value={stampThreshold} />
              <div className="col-span-2 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-xs text-purple-700">
                Se entrega automáticamente al completar <strong>{stampThreshold} sellos</strong> (definido en el programa)
              </div>
            </>
          )}
          {programType === 'visit' && visitThreshold !== null && (
            <>
              <input type="hidden" name="cost_points" value={visitThreshold} />
              <div className="col-span-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700">
                Se entrega automáticamente al alcanzar <strong>{visitThreshold} visitas</strong> (definido en el programa)
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vencimiento (días)</label>
            <input name="expiry_days" type="number" min="1" placeholder="30" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Límite de stock</label>
            <input name="stock" type="number" min="0" placeholder="∞ ilimitado" className={inputCls} />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Guardando…' : 'Guardar recompensa'}
          </button>
          <button type="button" onClick={() => { setOpen(false); setError(''); }}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
