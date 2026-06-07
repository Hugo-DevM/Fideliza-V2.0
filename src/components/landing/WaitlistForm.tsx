'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import type { Dictionary } from '@/lib/i18n';
import { withBrand } from '@/lib/brand';

interface WaitlistFormProps {
  variant?: 'hero' | 'cta';
  t: Dictionary['waitlistForm'];
}

const VALID_NAME_RE = /^[a-zA-ZÀ-ÖØ-öø-ÿÑñ\s]*$/;

export function WaitlistForm({ variant = 'hero', t }: WaitlistFormProps) {
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [name,     setName]     = useState('');
  const [business, setBusiness] = useState('');
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message,  setMessage]  = useState('');

  // ── Client-side validation ────────────────────────────────────────────────
  function validate(): string | null {
    if (!name.trim()) return t.errors.nameRequired;
    if (!VALID_NAME_RE.test(name)) return t.errors.nameInvalid;
    if (name.trim().length > 60) return t.errors.nameTooLong;
    if (!email) return t.errors.emailInvalid;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t.errors.emailInvalid;
    if (email.length > 320) return t.errors.emailTooLong;
    if (!phone.trim()) return t.errors.phoneInvalid;
    if (!/^\+?[\d\s\-().]+$/.test(phone.trim()) || phone.trim().replace(/\D/g, '').length < 7) return t.errors.phoneInvalid;
    if (business && business.trim().length > 100) return t.errors.businessTooLong;
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setMessage(validationError);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone:         phone.trim(),
          name:          name     || undefined,
          business_name: business || undefined,
          source: variant,
        }),
      });

      const json = await res.json() as { data: { message: string } | null; error: string | null };

      if (res.ok && json.data) {
        setStatus('success');
        // Detect "already on list" from server and use translated message
        const isAlready = json.data.message.toLowerCase().includes('already');
        setMessage(isAlready ? t.alreadyOnList : t.successMessage);
      } else {
        setStatus('error');
        setMessage(t.errors.generic);
      }
    } catch {
      setStatus('error');
      setMessage(t.errors.serverUnreachable);
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-emerald-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>
        <p className={`font-semibold ${variant === 'cta' ? 'text-white' : 'text-gray-900'}`}>
          {t.successTitle}
        </p>
        <p className={`text-sm ${variant === 'cta' ? 'text-indigo-200' : 'text-gray-500'}`}>
          {withBrand(message, variant === 'cta' ? 'font-bold text-white' : 'font-bold text-gray-900')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3" noValidate>
      {/* 1. Nombre */}
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            const val = e.target.value
              .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿÑñ\s]/g, '')
              .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
            if (val.length <= 60) setName(val);
          }}
          placeholder={t.namePlaceholder}
          required
          autoComplete="name"
          maxLength={60}
          className={[
            'w-full rounded-lg px-4 py-2.5 text-sm border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            variant === 'cta'
              ? 'bg-white/15 border-white/20 text-white placeholder-indigo-300 focus:bg-white/20'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
          ].join(' ')}
        />
        <span className={`absolute top-1 right-2 text-[10px] font-medium ${
          variant === 'cta' ? 'text-indigo-300/70' : 'text-gray-400'
        }`}>{t.required}</span>
      </div>

      {/* 2. Correo */}
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          required
          maxLength={320}
          autoComplete="email"
          className={[
            'w-full rounded-lg px-4 py-2.5 text-sm border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            variant === 'cta'
              ? 'bg-white/15 border-white/20 text-white placeholder-indigo-300 focus:bg-white/20'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
          ].join(' ')}
        />
        <span className={`absolute top-1 right-2 text-[10px] font-medium ${
          variant === 'cta' ? 'text-indigo-300/70' : 'text-gray-400'
        }`}>{t.required}</span>
      </div>

      {/* 3. Teléfono + nombre del negocio */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.phonePlaceholder}
            required
            maxLength={20}
            autoComplete="tel"
            className={[
              'w-full rounded-lg px-3 py-2.5 text-sm border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500',
              variant === 'cta'
                ? 'bg-white/15 border-white/20 text-white placeholder-indigo-300'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
            ].join(' ')}
          />
          <span className={`absolute top-1 right-2 text-[10px] font-medium ${
            variant === 'cta' ? 'text-indigo-300/70' : 'text-gray-400'
          }`}>{t.required}</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={business}
            onChange={(e) => {
              if (e.target.value.length <= 100) setBusiness(e.target.value);
            }}
            placeholder={t.businessPlaceholder}
            maxLength={100}
            className={[
              'w-full rounded-lg px-3 py-2.5 text-sm border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500',
              variant === 'cta'
                ? 'bg-white/15 border-white/20 text-white placeholder-indigo-300'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
            ].join(' ')}
          />
          <span className={`absolute top-1 right-2 text-[10px] font-medium ${
            variant === 'cta' ? 'text-indigo-300/70' : 'text-gray-400'
          }`}>
            {t.optional}
          </span>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && (
        <p className="text-xs text-red-400">{message}</p>
      )}

      <Button
        type="submit"
        loading={status === 'loading'}
        size="md"
        variant={variant === 'cta' ? 'secondary' : 'primary'}
        className="w-full"
      >
        {t.submitButton}
      </Button>

      <p className={`text-xs ${variant === 'cta' ? 'text-indigo-400' : 'text-gray-400'}`}>
        {t.disclaimer}
      </p>
    </form>
  );
}
