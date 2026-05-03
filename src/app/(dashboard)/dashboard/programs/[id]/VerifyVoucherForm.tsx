'use client';

import { useState, useTransition } from 'react';
import { verifyVoucherAction } from './actions';

export default function VerifyVoucherForm() {
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setSuccess('');

    startTransition(async () => {
      const result = await verifyVoucherAction(code);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(`Voucher ${code.toUpperCase()} marked as used ✓`);
        setCode('');
      }
    });
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-gray-700">Verify voucher</h2>
      <p className="mb-3 text-xs text-gray-400">
        Enter the code a customer shows at the counter to mark it used.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. BREW-XK3-72F"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm uppercase placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          maxLength={20}
        />
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? '…' : 'Verify'}
        </button>
      </form>

      {error   && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-700 font-medium">{success}</p>}
    </div>
  );
}
