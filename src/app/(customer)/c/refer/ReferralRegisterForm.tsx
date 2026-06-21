'use client';

import { useState, useTransition } from 'react';
import { registerReferredCustomerAction } from './actions';

interface ReferralRegisterFormProps {
  tenantId:   string;
  referrerId: string;
  programId:  string;
}

export default function ReferralRegisterForm({ tenantId, referrerId, programId }: ReferralRegisterFormProps) {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { setError('El nombre es obligatorio.'); return; }
    setError('');
    startTransition(async () => {
      const res = await registerReferredCustomerAction({
        tenantId,
        referrerId,
        programId,
        name: trimmedName,
        phone: phone.trim() || null,
      });
      if ('error' in res) {
        setError(res.error);
      } else {
        // Redirect to portal with new customer's code
        window.location.href = `/c?code=${res.accessCode}`;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tu nombre <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="María González"
          maxLength={80}
          required
          className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          WhatsApp <span className="text-xs text-gray-400">(opcional — para recibir notificaciones)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 555 123 4567"
          maxLength={20}
          className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Registrando…' : 'Registrarme y reclamar puntos'}
      </button>
    </form>
  );
}
