'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProgramAction } from './actions';

const PROGRAM_TYPES = [
  { value: 'points',   label: 'Points',   hint: 'Earn X points per $ spent' },
  { value: 'stamp',    label: 'Stamp card', hint: 'Collect N stamps, earn a reward' },
  { value: 'visit',    label: 'Visit',    hint: 'Reward after N visits' },
  { value: 'cashback', label: 'Cashback', hint: 'Earn % back as store credit' },
];

export default function NewProgramModal() {
  const [open, setOpen]   = useState(false);
  const [type, setType]   = useState('points');
  const [error, setError] = useState('');
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
        setType('points');
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        + New Program
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Create program</h2>
              <button onClick={() => setOpen(false)} className="text-xl leading-none text-gray-400 hover:text-gray-600">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <Field label="Program name *" name="name" type="text" placeholder="Coffee Rewards" required />
              <Field label="Description" name="description" type="text" placeholder="Earn points on every purchase" />

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROGRAM_TYPES.map((t) => (
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
                  ))}
                </div>
              </div>

              {/* Type-specific config */}
              {type === 'points' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Points per $" name="points_per_dollar" defaultValue="10" />
                  <NumField label="Min to redeem" name="min_redeem" defaultValue="100" />
                </div>
              )}
              {type === 'stamp' && (
                <NumField label="Stamps needed for reward" name="stamps_needed" defaultValue="10" />
              )}
              {type === 'visit' && (
                <NumField label="Visits needed for reward" name="visits_needed" defaultValue="5" />
              )}
              {type === 'cashback' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Cashback %" name="cashback_percent" defaultValue="5" step="0.1" />
                  <NumField label="Min purchase ($)" name="min_purchase" defaultValue="10" step="0.01" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >Cancel</button>
                <button type="submit" disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPending ? 'Creating…' : 'Create program'}
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

function Field({ label, name, type, placeholder, required }: {
  label: string; name: string; type: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required} className={inputCls} />
    </div>
  );
}

function NumField({ label, name, defaultValue, step }: {
  label: string; name: string; defaultValue: string; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input name={name} type="number" min="0" step={step ?? '1'} defaultValue={defaultValue} required className={inputCls} />
    </div>
  );
}
