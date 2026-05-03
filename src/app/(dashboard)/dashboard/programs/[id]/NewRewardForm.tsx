'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createRewardAction } from './actions';

export default function NewRewardForm({ programId }: { programId: string }) {
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

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
        + Add reward
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">New reward</h3>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Reward name *</label>
            <input name="name" type="text" required placeholder="Free Coffee" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input name="description" type="text" placeholder="Any size, any drink" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cost (points) *</label>
            <input name="cost_points" type="number" min="1" required placeholder="250" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry (days)</label>
            <input name="expiry_days" type="number" min="1" placeholder="30" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Stock limit</label>
            <input name="stock" type="number" min="0" placeholder="∞ unlimited" className={inputCls} />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save reward'}
          </button>
          <button type="button" onClick={() => { setOpen(false); setError(''); }}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
