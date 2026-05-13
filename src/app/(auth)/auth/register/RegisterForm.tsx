'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signUpAndSendConfirmationAction, setupTenantAction, checkSubdomainAction } from './actions';

type Step = 1 | 2;

// ── Input style ───────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition
   focus:ring-2 focus:ring-indigo-100
   ${hasError
     ? 'border-red-300 focus:border-red-400'
     : 'border-gray-200 focus:border-indigo-400'}`;

// Only letters (including accented/ñ) and spaces
const VALID_NAME_RE = /^[a-zA-ZÀ-ÖØ-öø-ÿÑñ\s]*$/;

// ── Main component ────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const router = useRouter();
  const [isGoingToStep2, setIsGoingToStep2] = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Account
  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms,   setAcceptedTerms]   = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auth user created at step 1→2 transition
  const [authUserId, setAuthUserId] = useState('');
  const [authEmail,  setAuthEmail]  = useState('');

  // Step 2 — Business
  const [businessName,      setBusinessName]      = useState('');
  const [subdomain,         setSubdomain]         = useState('');
  const [subdomainStatus,   setSubdomainStatus]   = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [subdomainError,    setSubdomainError]    = useState('');
  const [subdomainTouched,  setSubdomainTouched]  = useState(false);

  // Global error
  const [globalError, setGlobalError] = useState('');

  // ── Auto-generate subdomain from business name ──────────────────────────
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

  // ── Subdomain availability check (debounced) ────────────────────────────
  const checkSubdomain = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainStatus('idle');
      return;
    }
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

  // ── Step 1 validation ───────────────────────────────────────────────────
  function validateStep1(): string | null {
    if (!fullName.trim() || fullName.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!VALID_NAME_RE.test(fullName)) return 'El nombre solo puede contener letras y espacios.';
    if (!email) return 'El email es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa un email válido.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/.test(password)) return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!/[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(password)) return 'La contraseña debe incluir al menos una letra minúscula.';
    if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número (0-9).';
    if (!/[^a-zA-Z0-9]/.test(password)) return 'La contraseña debe incluir al menos un símbolo (!@#$%...).';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    if (!acceptedTerms) return 'Debes aceptar los Términos de Servicio y la Política de Privacidad.';
    return null;
  }

  // ── Step 2 validation ───────────────────────────────────────────────────
  function validateStep2(): string | null {
    if (!businessName.trim() || businessName.trim().length < 2) return 'El nombre del negocio debe tener al menos 2 caracteres.';
    if (!subdomain || subdomain.length < 3) return 'El subdominio debe tener al menos 3 caracteres.';
    if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') return subdomainError || 'Elige un subdominio diferente.';
    if (subdomainStatus === 'checking') return 'Espera a que termine la verificación del subdominio.';
    return null;
  }

  // ── Navigate steps ──────────────────────────────────────────────────────
  async function goToStep2() {
    const err = validateStep1();
    if (err) { setGlobalError(err); return; }
    setGlobalError('');

    // User already created for this email (came back from step 2) — skip signUp
    if (authUserId && authEmail === email) {
      setStep(2);
      return;
    }

    setIsGoingToStep2(true);

    const result = await signUpAndSendConfirmationAction({
      email,
      password,
      fullName: fullName.trim(),
    });

    setIsGoingToStep2(false);

    if (result.error || !result.userId) {
      setGlobalError(result.error ?? 'Error al registrarse. Inténtalo de nuevo.');
      return;
    }

    setAuthUserId(result.userId);
    setAuthEmail(email);
    setStep(2);
  }

  // ── Final submit ────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep2();
    if (err) { setGlobalError(err); return; }
    setGlobalError('');
    setIsSubmitting(true);

    try {
      const result = await setupTenantAction({
        userId: authUserId,
        email,
        businessName: businessName.trim(),
        subdomain,
      });

      if (result.error) {
        setGlobalError(result.error);
        return;
      }

      router.push('/auth/register/confirm?email=' + encodeURIComponent(email));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step indicator ──────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Cuenta' },
    { n: 2, label: 'Negocio' },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0">
        {steps.map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step === n
                    ? 'bg-indigo-600 text-white'
                    : step > n
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > n ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`mt-1 text-xs font-medium ${step === n ? 'text-indigo-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 mb-4 h-px w-12 transition-colors ${step > n ? 'bg-indigo-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        {globalError && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {globalError}
          </div>
        )}

        {/* ── STEP 1: Account ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Crea tu cuenta</h2>
              <p className="mt-1 text-sm text-gray-500">Tus credenciales de acceso personales.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                autoFocus
                value={fullName}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿÑñ\s]/g, '')
                    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
                  setFullName(val);
                }}
                placeholder="Ana García"
                className={inputCls()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourshop.com"
                maxLength={320}
                className={inputCls()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={inputCls(password.length > 0 && password.length < 8)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password requirements */}
              {password.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
                    { label: 'Letra mayúscula',      ok: /[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/.test(password) },
                    { label: 'Letra minúscula',      ok: /[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(password) },
                    { label: 'Un número (0-9)',       ok: /[0-9]/.test(password) },
                    { label: 'Un símbolo (!@#…)',    ok: /[^a-zA-Z0-9]/.test(password) },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${ok ? 'text-green-500' : 'text-gray-300'}`}
                        fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-xs transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={inputCls(confirmPassword.length > 0 && confirmPassword !== password)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Acepto los{' '}
                <a href="/es/terms" target="_blank" className="text-indigo-600 hover:underline font-medium">
                  Términos de Servicio
                </a>{' '}
                y la{' '}
                <a href="/es/privacy" target="_blank" className="text-indigo-600 hover:underline font-medium">
                  Política de Privacidad
                </a>
              </span>
            </label>

            <button
              type="button"
              onClick={goToStep2}
              disabled={
                isGoingToStep2 ||
                !acceptedTerms ||
                fullName.trim().length < 2 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                password.length < 8 ||
                !/[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/.test(password) ||
                !/[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(password) ||
                !/[\d\W_]/.test(password) ||
                confirmPassword !== password
              }
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoingToStep2 ? 'Verificando…' : 'Continuar →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Business ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tu negocio</h2>
              <p className="mt-1 text-sm text-gray-500">Así te verán tus clientes.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu subdominio</label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomainTouched(true);
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="your-shop"
                  maxLength={63}
                  className={`flex-1 rounded-l-lg border-y border-l px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-100 ${
                    subdomainStatus === 'taken' || subdomainStatus === 'invalid'
                      ? 'border-red-300 focus:border-red-400'
                      : subdomainStatus === 'available'
                        ? 'border-green-300 focus:border-green-400'
                        : 'border-gray-200 focus:border-indigo-400'
                  }`}
                />
                <span className="rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 whitespace-nowrap">
                  .fideliza.app
                </span>
              </div>

              {/* Status feedback */}
              <div className="mt-1.5 flex items-center gap-1.5 min-h-[20px]">
                {subdomainStatus === 'checking' && (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs text-gray-400">Verificando disponibilidad…</span>
                  </>
                )}
                {subdomainStatus === 'available' && (
                  <>
                    <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-green-600 font-medium">¡{subdomain}.fideliza.app está disponible!</span>
                  </>
                )}
                {(subdomainStatus === 'taken' || subdomainStatus === 'invalid') && (
                  <>
                    <svg className="h-3.5 w-3.5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-xs text-red-500">{subdomainError}</span>
                  </>
                )}
              </div>

              {/* Preview pill */}
              {subdomain && subdomainStatus === 'available' && (
                <div className="mt-3 rounded-xl bg-indigo-50 px-4 py-3">
                  <p className="text-xs text-indigo-500 font-medium uppercase tracking-widest mb-0.5">URL de tu portal</p>
                  <p className="text-sm font-mono text-indigo-700 font-semibold">
                    https://{subdomain}.fideliza.app/c
                  </p>
                  <p className="mt-0.5 text-xs text-indigo-400">Compártelo con tus clientes</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setStep(1); setGlobalError(''); }}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                ← Atrás
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        ¿Ya tienes una cuenta?{' '}
        <a href="/auth/login" className="text-indigo-500 hover:underline font-medium">
          Inicia sesión
        </a>
      </p>
    </div>
  );
}
