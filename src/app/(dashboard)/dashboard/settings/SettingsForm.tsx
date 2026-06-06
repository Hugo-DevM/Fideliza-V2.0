'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsAction } from './actions';
import type { TenantSettings } from '@/lib/types';
import { useDashboardI18n } from '@/lib/i18n/dashboard-context';
import type { Locale } from '@/lib/i18n';
import { formatTimeOnly } from '@/lib/utils/date';

export default function SettingsForm({
  settings,
  tenantName,
  subdomain,
  logoUrl,
  year,
}: {
  settings: TenantSettings;
  tenantName: string;
  subdomain: string;
  logoUrl: string | null;
  year: number;
}) {
  const { t, locale, setLocale, timezone } = useDashboardI18n();
  const s = t.settings;

  const [primaryColor,   setPrimaryColor]   = useState(settings.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondary_color);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcome_message ?? '');
  const [programLabel,   setProgramLabel]   = useState(settings.program_label);
  const [phonePrefix,    setPhonePrefix]    = useState(settings.phone_prefix ?? '');
  const [tz,             setTz]             = useState(settings.timezone ?? 'America/Mexico_City');
  const [currency,       setCurrency]       = useState(settings.currency ?? 'MXN');
  const [notifyNewCustomer,  setNotifyNewCustomer]  = useState(settings.notify_new_customer  ?? true);
  const [notifyRedemption,   setNotifyRedemption]   = useState(settings.notify_redemption    ?? true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(settings.notify_weekly_digest ?? true);
  const [saved, setSaved] = useState({
    primary_color:   settings.primary_color,
    secondary_color: settings.secondary_color,
    welcome_message: settings.welcome_message ?? '',
    program_label:   settings.program_label,
    phone_prefix:    settings.phone_prefix ?? '',
    timezone:        settings.timezone ?? 'America/Mexico_City',
    currency:             settings.currency ?? 'MXN',
    notifyNewCustomer:    settings.notify_new_customer  ?? true,
    notifyRedemption:     settings.notify_redemption    ?? true,
    notifyWeeklyDigest:   settings.notify_weekly_digest ?? true,
  });
  const [copied, setCopied] = useState(false);

  const isDirty =
    primaryColor   !== saved.primary_color   ||
    secondaryColor !== saved.secondary_color ||
    welcomeMessage !== saved.welcome_message ||
    programLabel   !== saved.program_label   ||
    phonePrefix    !== saved.phone_prefix    ||
    tz             !== saved.timezone        ||
    currency            !== saved.currency             ||
    notifyNewCustomer   !== saved.notifyNewCustomer    ||
    notifyRedemption    !== saved.notifyRedemption     ||
    notifyWeeklyDigest  !== saved.notifyWeeklyDigest;

  function handleProgramLabelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw !== '' && !/^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/.test(raw)) return;
    setProgramLabel(raw.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase()));
  }

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSettingsAction(data);
      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        setSaved({
          primary_color:   primaryColor,
          secondary_color: secondaryColor,
          welcome_message: welcomeMessage,
          program_label:   programLabel,
          phone_prefix:    phonePrefix,
          timezone:        tz,
          currency,
          notifyNewCustomer,
          notifyRedemption,
          notifyWeeklyDigest,
        });
        setSuccess(s.saved);
        router.refresh();
      }
    });
  }

  const portalUrl = `https://${subdomain}.fideliza.app/c`;

  function copyPortalUrl() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {s.breadcrumb}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {s.title}{' '}
            <span className="font-normal text-gray-400 dark:text-gray-500">{year}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {s.subtitle}
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isPending ? s.saving : s.save}
        </button>
      </div>

      {error   && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="rounded-xl bg-green-50 dark:bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">{success} ✓</p>}

      {/* ── Cuenta card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{s.account.title}</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.account.businessName}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{tenantName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.account.subdomain}</p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{subdomain}.fideliza.app</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{s.account.portalUrl}</p>
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-3 py-2.5">
            <svg className="h-4 w-4 shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <span className="flex-1 font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate min-w-0">
              {portalUrl}
            </span>
            <button
              type="button"
              onClick={copyPortalUrl}
              className="shrink-0 rounded-lg border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {copied ? s.account.copied : s.account.copy}
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {s.account.open}
            </a>
          </div>
        </div>
      </div>

      {/* ── Logo card ───────────────────────────────────────────────────────── */}
      <LogoCard initialUrl={logoUrl} initialPadding={settings.logo_padding ?? 8} t={s.logo} />

      {/* ── Apariencia card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{s.appearance.title}</h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.appearance.subtitle}</p>
          </div>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {s.appearance.portalLink}
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField
            label={s.appearance.primaryColor}
            name="primary_color"
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorField
            label={s.appearance.secondaryColor}
            name="secondary_color"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
        </div>

        <div
          className="rounded-xl p-5 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
        >
          <p className="text-xs opacity-70 uppercase tracking-widest">{s.appearance.preview}</p>
          <p className="mt-1 text-xl font-bold">{tenantName}</p>
          <p className="mt-1 text-xs opacity-80">{welcomeMessage || s.appearance.welcomePlaceholder}</p>
        </div>
      </div>

      {/* ── Región card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{s.region.title}</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {s.region.subtitle}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {s.region.countryLabel}
          </label>
          <input type="hidden" name="phone_prefix" value={phonePrefix} />
          <PhonePrefixSelect
            value={phonePrefix}
            onChange={setPhonePrefix}
            noPrefix={s.region.noPrefix}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {s.region.hint}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {s.region.timezoneLabel}
          </label>
          <input type="hidden" name="timezone" value={tz} />
          <TimezoneSelect
            value={tz}
            onChange={setTz}
            searchPlaceholder={s.region.timezoneSearch}
            currentTime={formatTimeOnly(new Date().toISOString(), tz, locale)}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {s.region.timezoneHint}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {s.region.currencyLabel}
          </label>
          <input type="hidden" name="currency" value={currency} />
          <CurrencySelect value={currency} onChange={setCurrency} />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {s.region.currencyHint}
          </p>
        </div>
      </div>

      {/* ── Portal del cliente card ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{s.portal.title}</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {s.portal.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          <span className="flex-1 font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate min-w-0">
            {portalUrl}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {s.portal.welcomeLabel}
          </label>
          <textarea
            name="welcome_message"
            rows={3}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder={s.portal.welcomePlaceholder}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {s.portal.welcomeHint}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {s.portal.currencyLabel}
          </label>
          <input
            name="program_label"
            type="text"
            value={programLabel}
            onChange={handleProgramLabelChange}
            placeholder="Puntos"
            maxLength={30}
            className={inputCls + ' max-w-xs'}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {s.portal.currencyHint}
          </p>

          <div className="mt-3 rounded-xl border border-dashed border-gray-200 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {s.portal.previewLabel}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">150</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{programLabel || 'Points'}</p>
              </div>
              <div className="h-10 w-px bg-gray-200 dark:bg-[#1e2438]" />
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.portal.examplesLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Beans', 'Slices', 'Stars', 'Granos', 'Sellos'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setProgramLabel(ex)}
                      className="rounded-full border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Idioma card ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{s.language.title}</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.language.subtitle}</p>
        </div>

        <div className="flex gap-3">
          {(['es', 'en'] as Locale[]).map((lang) => {
            const isSelected = locale === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={[
                  'flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                ].join(' ')}
              >
                <span className="text-base leading-none">{lang === 'es' ? '🇲🇽' : '🇺🇸'}</span>
                <span>{s.language[lang]}</span>
                {isSelected && (
                  <svg className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notificaciones card ─────────────────────────────────────────────── */}
      <input type="hidden" name="notify_new_customer"  value={notifyNewCustomer  ? 'true' : 'false'} />
      <input type="hidden" name="notify_redemption"    value={notifyRedemption   ? 'true' : 'false'} />
      <input type="hidden" name="notify_weekly_digest" value={notifyWeeklyDigest ? 'true' : 'false'} />
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{s.notifications.title}</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.notifications.subtitle}</p>
        </div>

        <div className="space-y-3">
          <NotifToggle
            label={s.notifications.newCustomer}
            hint={s.notifications.newCustomerHint}
            checked={notifyNewCustomer}
            onChange={setNotifyNewCustomer}
          />
          <NotifToggle
            label={s.notifications.redemption}
            hint={s.notifications.redemptionHint}
            checked={notifyRedemption}
            onChange={setNotifyRedemption}
          />
          <NotifToggle
            label={s.notifications.weeklyDigest}
            hint={s.notifications.weeklyDigestHint}
            checked={notifyWeeklyDigest}
            onChange={setNotifyWeeklyDigest}
          />
        </div>
      </div>

    </form>
  );
}

// ── Currency selector ─────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'MXN', symbol: '$',  name: 'Peso mexicano'          },
  { code: 'USD', symbol: '$',  name: 'Dólar estadounidense'   },
  { code: 'EUR', symbol: '€',  name: 'Euro'                   },
  { code: 'COP', symbol: '$',  name: 'Peso colombiano'        },
  { code: 'ARS', symbol: '$',  name: 'Peso argentino'         },
  { code: 'CLP', symbol: '$',  name: 'Peso chileno'           },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano'            },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño'         },
  { code: 'GTQ', symbol: 'Q',  name: 'Quetzal guatemalteco'   },
  { code: 'CRC', symbol: '₡',  name: 'Colón costarricense'    },
  { code: 'FDZ', symbol: '₣',  name: 'Peso Fideliza 🪙'        },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

// ── Notification toggle row ───────────────────────────────────────────────────

function NotifToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/30',
          checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-[#2a3050]',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none transition hover:border-indigo-400 dark:hover:border-indigo-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/20"
      >
        <span className="flex items-center gap-2.5">
          <span className="w-6 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {selected.symbol}
          </span>
          <span>{selected.code}</span>
          <span className="text-gray-400 dark:text-gray-500">·</span>
          <span className="text-gray-500 dark:text-gray-400">{selected.name}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1">
            {CURRENCIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); }}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition',
                    c.code === value
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161b2e]',
                  ].join(' ')}
                >
                  <span className="w-6 text-center font-mono text-xs font-bold shrink-0">{c.symbol}</span>
                  <span className="font-medium">{c.code}</span>
                  <span className="text-gray-400 dark:text-gray-500 truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PhonePrefixSelect({
  value,
  onChange,
  noPrefix,
}: {
  value: string;
  onChange: (v: string) => void;
  noPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = PHONE_PREFIXES.find((c) => c.code === value) ?? null;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none transition hover:border-indigo-400 dark:hover:border-indigo-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/20"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selected ? (
            <>
              <CountryBadge code={selected.iso} />
              <span className="truncate">{selected.name}</span>
              <span className="shrink-0 text-xs font-mono text-gray-400 dark:text-gray-500">{selected.code}</span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{noPrefix}</span>
          )}
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition',
              value === ''
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161b2e]',
            ].join(' ')}
          >
            <span className="flex h-6 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-[#2a3147] text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
              —
            </span>
            <span>{noPrefix}</span>
          </button>

          <div className="h-px bg-gray-100 dark:bg-[#1e2438]" />

          <div className="max-h-56 overflow-y-auto">
            {PHONE_PREFIXES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition',
                  value === c.code
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161b2e]',
                ].join(' ')}
              >
                <CountryBadge code={c.iso} />
                <span className="flex-1 text-left truncate">{c.name}</span>
                <span className="shrink-0 text-xs font-mono text-gray-400 dark:text-gray-500">{c.code}</span>
                {value === c.code && (
                  <svg className="h-3.5 w-3.5 shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CountryBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex h-6 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-[#2a3147] text-[10px] font-bold tracking-wide text-gray-600 dark:text-gray-300 shrink-0">
      {code}
    </span>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

const PHONE_PREFIXES = [
  { code: '+52',  iso: 'MX', name: 'México'            },
  { code: '+54',  iso: 'AR', name: 'Argentina'          },
  { code: '+1',   iso: 'US', name: 'EE.UU. / Canadá'   },
  { code: '+57',  iso: 'CO', name: 'Colombia'           },
  { code: '+56',  iso: 'CL', name: 'Chile'              },
  { code: '+55',  iso: 'BR', name: 'Brasil'             },
  { code: '+51',  iso: 'PE', name: 'Perú'               },
  { code: '+598', iso: 'UY', name: 'Uruguay'            },
  { code: '+595', iso: 'PY', name: 'Paraguay'           },
  { code: '+591', iso: 'BO', name: 'Bolivia'            },
  { code: '+593', iso: 'EC', name: 'Ecuador'            },
  { code: '+502', iso: 'GT', name: 'Guatemala'          },
  { code: '+503', iso: 'SV', name: 'El Salvador'        },
  { code: '+504', iso: 'HN', name: 'Honduras'           },
  { code: '+505', iso: 'NI', name: 'Nicaragua'          },
  { code: '+506', iso: 'CR', name: 'Costa Rica'         },
  { code: '+507', iso: 'PA', name: 'Panamá'             },
  { code: '+509', iso: 'HT', name: 'Haití'              },
  { code: '+53',  iso: 'CU', name: 'Cuba'               },
  { code: '+34',  iso: 'ES', name: 'España'             },
  { code: '+44',  iso: 'GB', name: 'Reino Unido'        },
  { code: '+49',  iso: 'DE', name: 'Alemania'           },
  { code: '+33',  iso: 'FR', name: 'Francia'            },
  { code: '+39',  iso: 'IT', name: 'Italia'             },
];

// ── Logo card ─────────────────────────────────────────────────────────────────

type LogoStrings = {
  title: string; subtitle: string; upload: string; change: string;
  remove: string; sizeHint: string; uploading: string; removing: string; noLogo: string;
  paddingLabel: string; paddingCompact: string; paddingNormal: string; paddingSpaced: string;
};

const PADDING_PRESETS = [
  { key: 'compact', value: 0  },
  { key: 'normal',  value: 8  },
  { key: 'spaced',  value: 16 },
] as const;

function LogoCard({
  initialUrl,
  initialPadding,
  t,
}: {
  initialUrl: string | null;
  initialPadding: number;
  t: LogoStrings;
}) {
  const [url,     setUrl]     = useState<string | null>(initialUrl);
  const [padding, setPadding] = useState(initialPadding);
  const [status,  setStatus]  = useState<'idle' | 'uploading' | 'removing' | 'saving-padding'>('idle');
  const [error,   setError]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const router  = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');
    setStatus('uploading');

    const form = new FormData();
    form.append('logo', file);

    const res  = await fetch('/api/tenants/logo', { method: 'POST', body: form });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? 'Error al subir el logo.');
      setStatus('idle');
      return;
    }

    setUrl(json.url);
    setStatus('idle');
    router.refresh();
  }

  async function handleRemove() {
    setError('');
    setStatus('removing');
    const res = await fetch('/api/tenants/logo', { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? 'Error al eliminar el logo.');
    } else {
      setUrl(null);
    }
    setStatus('idle');
    router.refresh();
  }

  async function handlePadding(value: number) {
    setPadding(value);
    setStatus('saving-padding');
    const data = new FormData();
    data.set('logo_padding', String(value));
    await fetch('/api/tenants/logo/padding', { method: 'PATCH', body: data });
    setStatus('idle');
    router.refresh();
  }

  const busy = status !== 'idle';

  const paddingLabels: Record<string, string> = {
    compact: t.paddingCompact,
    normal:  t.paddingNormal,
    spaced:  t.paddingSpaced,
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{t.title}</h2>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{t.subtitle}</p>
      </div>

      <div className="flex items-start gap-5">
        {/* Preview — same size as the entry screen logo */}
        <div
          className="shrink-0 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35]"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Logo"
              className="h-full w-full object-contain transition-all"
              style={{ padding }}
            />
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">{t.noLogo}</span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          {/* Upload / remove buttons */}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition"
            >
              {status === 'uploading' ? t.uploading : url ? t.change : t.upload}
            </button>
            {url && (
              <button
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3.5 py-2 text-xs font-medium text-red-500 hover:border-red-300 dark:hover:border-red-500/50 disabled:opacity-50 transition"
              >
                {status === 'removing' ? t.removing : t.remove}
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.sizeHint}</p>

          {/* Padding presets — only shown when a logo is uploaded */}
          {url && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{t.paddingLabel}</p>
              <div className="flex gap-2">
                {PADDING_PRESETS.map(({ key, value }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={busy}
                    onClick={() => handlePadding(value)}
                    className={[
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                      padding === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] text-gray-600 dark:text-gray-400 hover:border-gray-300',
                    ].join(' ')}
                  >
                    {paddingLabels[key]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Timezone selector ─────────────────────────────────────────────────────────

interface TzOption {
  value:  string;
  label:  string;
  region: string;
  offset: string;
}

const TIMEZONES: TzOption[] = [
  // ── América Latina ─────────────────────────────────────
  { value: 'America/Mexico_City',             label: 'México (Centro)',    region: 'América', offset: 'UTC-6' },
  { value: 'America/Monterrey',               label: 'México (Norte)',     region: 'América', offset: 'UTC-6' },
  { value: 'America/Tijuana',                 label: 'México (Pacífico)',  region: 'América', offset: 'UTC-8' },
  { value: 'America/Bogota',                  label: 'Colombia',           region: 'América', offset: 'UTC-5' },
  { value: 'America/Lima',                    label: 'Perú',               region: 'América', offset: 'UTC-5' },
  { value: 'America/Santiago',                label: 'Chile',              region: 'América', offset: 'UTC-4' },
  { value: 'America/Argentina/Buenos_Aires',  label: 'Argentina',          region: 'América', offset: 'UTC-3' },
  { value: 'America/Montevideo',              label: 'Uruguay',            region: 'América', offset: 'UTC-3' },
  { value: 'America/Asuncion',               label: 'Paraguay',            region: 'América', offset: 'UTC-4' },
  { value: 'America/La_Paz',                  label: 'Bolivia',            region: 'América', offset: 'UTC-4' },
  { value: 'America/Guayaquil',               label: 'Ecuador',            region: 'América', offset: 'UTC-5' },
  { value: 'America/Guatemala',               label: 'Guatemala / C.A.',   region: 'América', offset: 'UTC-6' },
  { value: 'America/Costa_Rica',              label: 'Costa Rica',         region: 'América', offset: 'UTC-6' },
  { value: 'America/Panama',                  label: 'Panamá',             region: 'América', offset: 'UTC-5' },
  { value: 'America/Caracas',                 label: 'Venezuela',          region: 'América', offset: 'UTC-4' },
  { value: 'America/Puerto_Rico',             label: 'Puerto Rico',        region: 'América', offset: 'UTC-4' },
  // ── EE.UU. / Canadá ────────────────────────────────────
  { value: 'America/New_York',                label: 'EE.UU. (Este)',      region: 'América', offset: 'UTC-5' },
  { value: 'America/Chicago',                 label: 'EE.UU. (Centro)',    region: 'América', offset: 'UTC-6' },
  { value: 'America/Denver',                  label: 'EE.UU. (Montaña)',   region: 'América', offset: 'UTC-7' },
  { value: 'America/Los_Angeles',             label: 'EE.UU. (Pacífico)', region: 'América', offset: 'UTC-8' },
  // ── Europa ─────────────────────────────────────────────
  { value: 'Europe/Madrid',                   label: 'España',             region: 'Europa',  offset: 'UTC+1' },
  { value: 'Europe/London',                   label: 'Reino Unido',        region: 'Europa',  offset: 'UTC+0' },
  { value: 'UTC',                             label: 'UTC',                region: 'Europa',  offset: 'UTC+0' },
];

function TimezoneSelect({
  value,
  onChange,
  searchPlaceholder,
  currentTime,
}: {
  value:             string;
  onChange:          (v: string) => void;
  searchPlaceholder: string;
  currentTime:       string;
}) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState('');
  const ref                 = useRef<HTMLDivElement>(null);

  const selected = TIMEZONES.find((tz) => tz.value === value);

  const filtered = query.trim()
    ? TIMEZONES.filter((tz) =>
        tz.label.toLowerCase().includes(query.toLowerCase()) ||
        tz.value.toLowerCase().includes(query.toLowerCase()) ||
        tz.offset.toLowerCase().includes(query.toLowerCase())
      )
    : TIMEZONES;

  // Group by region
  const regions = Array.from(new Set(filtered.map((tz) => tz.region)));

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative max-w-xs">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none transition hover:border-indigo-400 dark:hover:border-indigo-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <span className="flex items-center gap-2 min-w-0">
          <GlobeIcon className="h-4 w-4 shrink-0 text-indigo-400" />
          <span className="truncate">{selected?.label ?? value}</span>
          <span className="shrink-0 text-xs font-mono text-gray-400 dark:text-gray-500">
            {selected?.offset} · {currentTime}
          </span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[280px] rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-[#1e2438]">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
            />
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {regions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                Sin resultados
              </p>
            ) : (
              regions.map((region) => (
                <div key={region}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {region}
                  </p>
                  {filtered.filter((tz) => tz.region === region).map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => { onChange(tz.value); setOpen(false); setQuery(''); }}
                      className={[
                        'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition',
                        value === tz.value
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161b2e]',
                      ].join(' ')}
                    >
                      <span className="text-left">{tz.label}</span>
                      <span className="shrink-0 text-xs font-mono text-gray-400 dark:text-gray-500">{tz.offset}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function ColorField({
  label, name, value, onChange,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-gray-200 dark:border-[#1e2438] p-0.5 bg-white dark:bg-[#1a1f35]"
        />
        <input
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366F1"
          maxLength={7}
          pattern="^#[0-9A-Fa-f]{6}$"
          className={inputCls + ' font-mono'}
        />
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20';
