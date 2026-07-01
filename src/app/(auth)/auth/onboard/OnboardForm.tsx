'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setupTenantFromOAuthAction } from './actions';
import { checkSubdomainAction } from '@/app/(auth)/auth/register/actions';

const inputCls = (hasError?: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-[#0f1222] outline-none transition focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20
   ${hasError
     ? 'border-red-300 dark:border-red-500/60 focus:border-red-400 dark:focus:border-red-500'
     : 'border-gray-200 dark:border-[#2a3147] focus:border-indigo-400 dark:focus:border-indigo-500'}`;

export default function OnboardForm({ displayName }: { displayName: string | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessName,     setBusinessName]     = useState('');
  const [subdomain,        setSubdomain]        = useState('');
  const [subdomainStatus,  setSubdomainStatus]  = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [subdomainError,   setSubdomainError]   = useState('');
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [globalError,      setGlobalError]      = useState('');

  useEffect(() => {
    if (!subdomainTouched && businessName) {
      const generated = businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40);
      setSubdomain(generated);
    }
  }, [businessName, subdomainTouched]);

  const checkSubdomain = useCallback(async (value: string) => {
    if (!value || value.length < 3) { setSubdomainStatus('idle'); return; }
    setSubdomainStatus('checking');
    setSubdomainError('');
    const result = await checkSubdomainAction(value);
    if (result.error) {
      setSubdomainStatus('invalid');
      setSubdomainError(result.error);
    } else if (result.available) {
      setSubdomainStatus('available');
    } else {
      setSubdomainStatus('taken');
      setSubdomainError('Este subdominio ya está en uso. Prueba con otro.');
    }
  }, []);

  useEffect(() => {
    if (!subdomain) { setSubdomainStatus('idle'); return; }
    const timer = setTimeout(() => checkSubdomain(subdomain), 500);
    return () => clearTimeout(timer);
  }, [subdomain, checkSubdomain]);

  async function handleSubmit() {
    if (!businessName.trim() || businessName.trim().length < 2) {
      setGlobalError('El nombre del negocio debe tener al menos 2 caracteres.');
      return;
    }
    if (!subdomain || subdomain.length < 3) {
      setGlobalError('El subdominio debe tener al menos 3 caracteres.');
      return;
    }
    if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') {
      setGlobalError(subdomainError || 'Elige un subdominio diferente.');
      return;
    }
    if (subdomainStatus === 'checking') {
      setGlobalError('Espera a que termine la verificación del subdominio.');
      return;
    }

    setGlobalError('');
    setIsSubmitting(true);

    try {
      const result = await setupTenantFromOAuthAction({ businessName, subdomain });
      if (result.error) {
        setGlobalError(result.error);
        return;
      }
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1.5">
        <img src="/logofidelizalight.svg" alt="Fideliza" className="block dark:hidden h-24 mx-auto" />
        <img src="/logofideliza.svg"      alt="Fideliza" className="hidden dark:block h-24 mx-auto" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#161b2e] px-8 pt-8 pb-7 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {displayName ? `Hola, ${displayName.split(' ')[0]}` : '¡Casi listo!'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cuéntanos cómo se llama tu negocio.
          </p>
        </div>

        {globalError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {globalError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del negocio
          </label>
          <input
            type="text"
            autoFocus
            value={businessName}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw !== '' && !/^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ0-9 .,'&\-]*$/.test(raw)) return;
              setBusinessName(raw);
            }}
            placeholder="ej. Café Central"
            className={inputCls()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tu subdominio
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => {
                setSubdomainTouched(true);
                setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="tu-negocio"
              maxLength={63}
              className={`flex-1 rounded-l-xl border-y border-l px-4 py-2.5 text-sm bg-white dark:bg-[#0f1222] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 ${
                subdomainStatus === 'taken' || subdomainStatus === 'invalid'
                  ? 'border-red-300 dark:border-red-500/60 focus:border-red-400'
                  : subdomainStatus === 'available'
                    ? 'border-green-300 dark:border-green-500/60 focus:border-green-400'
                    : 'border-gray-200 dark:border-[#2a3147] focus:border-indigo-400'
              }`}
            />
            <span className="rounded-r-xl border border-l-0 border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              .fideliza.app
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 min-h-[20px]">
            {subdomainStatus === 'checking' && (
              <>
                <svg className="h-3.5 w-3.5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-gray-400">Verificando…</span>
              </>
            )}
            {subdomainStatus === 'available' && (
              <>
                <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ¡{subdomain}.fideliza.app está disponible!
                </span>
              </>
            )}
            {(subdomainStatus === 'taken' || subdomainStatus === 'invalid') && (
              <>
                <svg className="h-3.5 w-3.5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs text-red-500 dark:text-red-400">{subdomainError}</span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 flex gap-2.5">
          <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <strong>Elige bien.</strong> El nombre del negocio y el subdominio <strong>no se podrán cambiar</strong> una vez creada la cuenta.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || subdomainStatus === 'checking' || subdomainStatus === 'taken' || subdomainStatus === 'invalid'}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  );
}
