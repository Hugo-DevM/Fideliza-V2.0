'use client';

/**
 * Self-registration form for someone arriving through a referral link.
 *
 * Mirrors the fields the business captures in its own new-customer modal,
 * minus the internal ones (notes) and the referral code (already implied by
 * the link). Phone is required here — unlike the dashboard, this is the only
 * identity we get, and it is what the duplicate check keys on.
 */

import { useState, useTransition } from 'react';
import { registerReferredCustomerAction } from './actions';
import { getLocalLimits, PHONE_PREFIXES, PHONE_WA_HINTS } from '@/lib/constants/phone-limits';

interface ReferralRegisterFormProps {
  tenantId:    string;
  referrerId:  string;
  programId:   string;
  /** tenant_settings.phone_prefix — the business's default country. */
  phonePrefix: string | null;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fieldCls =
  'w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20';

export default function ReferralRegisterForm({
  tenantId, referrerId, programId, phonePrefix,
}: ReferralRegisterFormProps) {
  const [name,   setName]   = useState('');
  const [prefix, setPrefix] = useState(phonePrefix ?? '+52');
  const [phone,  setPhone]  = useState('');
  const [optIn,  setOptIn]  = useState(true);

  const [birthDay,   setBirthDay]   = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear,  setBirthYear]  = useState('');

  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const { min: localMin, max: localMax, hint: localHint } = getLocalLimits(prefix);
  const phoneComplete = phone.length >= localMin && phone.length <= localMax;
  const waHint = PHONE_WA_HINTS[prefix];

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, '').slice(0, localMax));
  }

  function handlePrefixChange(code: string) {
    setPrefix(code);
    const { max } = getLocalLimits(code);
    setPhone((p) => p.slice(0, max));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) { setError('El nombre es obligatorio.'); return; }
    if (!phoneComplete) { setError(`El teléfono debe tener ${localHint}.`); return; }
    if (Boolean(birthDay) !== Boolean(birthMonth)) {
      setError('Selecciona el día y el mes de tu cumpleaños.');
      return;
    }

    setError('');
    startTransition(async () => {
      const res = await registerReferredCustomerAction({
        tenantId,
        referrerId,
        programId,
        name:          trimmedName,
        phone:         prefix + phone,
        whatsappOptIn: optIn,
        birthMonth:    birthMonth ? Number(birthMonth) : null,
        birthDay:      birthDay   ? Number(birthDay)   : null,
        birthYear:     birthYear  ? Number(birthYear)  : null,
      });

      if ('error' in res) {
        setError(res.error);
        return;
      }
      // Same destination either way — an existing customer simply lands on the
      // card they already had, with their balance intact.
      window.location.href = `/c?code=${res.accessCode}`;
    });
  }

  const daysInMonth = birthMonth
    ? [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(birthMonth) - 1]
    : 31;
  const thisYear = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="ref-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tu nombre <span className="text-red-400">*</span>
        </label>
        <input
          id="ref-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="María González"
          maxLength={80}
          required
          className={fieldCls}
        />
      </div>

      {/* Phone — required */}
      <div>
        <label htmlFor="ref-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          WhatsApp <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={prefix}
            onChange={(e) => handlePrefixChange(e.target.value)}
            aria-label="Código de país"
            className={`${fieldCls} w-[7.5rem] shrink-0 appearance-none pr-2`}
          >
            {PHONE_PREFIXES.map((p) => (
              <option key={p.code} value={p.code}>{p.iso} {p.code}</option>
            ))}
          </select>
          <input
            id="ref-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="5551234567"
            required
            className={fieldCls}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{localHint}</p>
        {waHint && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{waHint}</p>
        )}
      </div>

      {/* WhatsApp consent */}
      <button
        type="button"
        onClick={() => setOptIn((v) => !v)}
        className={[
          'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
          optIn
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17]',
        ].join(' ')}
        aria-pressed={optIn}
      >
        <span
          className={[
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition',
            optIn ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600',
          ].join(' ')}
        >
          {optIn && (
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </span>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Acepto recibir notificaciones por WhatsApp
        </span>
      </button>

      {/* Birthday */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de cumpleaños{' '}
          <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
            aria-label="Día de cumpleaños"
            className={`${fieldCls} appearance-none`}
          >
            <option value="">Día</option>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select
            value={birthMonth}
            onChange={(e) => {
              setBirthMonth(e.target.value);
              if (!e.target.value) setBirthDay('');
            }}
            aria-label="Mes de cumpleaños"
            className={`${fieldCls} appearance-none`}
          >
            <option value="">Mes</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            aria-label="Año de nacimiento"
            className={`${fieldCls} appearance-none`}
          >
            <option value="">Año</option>
            {Array.from({ length: 100 }, (_, i) => thisYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Para sorprenderte con un regalo en tu cumpleaños. 🎂
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || !name.trim() || !phoneComplete}
        className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Registrando…' : 'Registrarme y reclamar puntos'}
      </button>
    </form>
  );
}
