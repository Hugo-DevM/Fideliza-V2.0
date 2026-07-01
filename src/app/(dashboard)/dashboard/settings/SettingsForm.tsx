'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useAutoError } from '@/hooks/useAutoError';
import { useRouter } from 'next/navigation';
import { updateSettingsAction } from './actions';
import type { TenantSettings } from '@/lib/types';
import { useDashboardI18n } from '@/lib/i18n/dashboard-context';
import type { Locale } from '@/lib/i18n';
import { formatTimeOnly } from '@/lib/utils/date';
import AccordionSection from './AccordionSection';

export default function SettingsForm({
  settings,
  tenantName,
  subdomain,
  logoUrl,
  year,
  plan,
}: {
  settings: TenantSettings;
  tenantName: string;
  subdomain: string;
  logoUrl: string | null;
  year: number;
  plan: string;
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
  const [waNotifyWelcome,        setWaNotifyWelcome]        = useState(settings.wa_notify_welcome        ?? true);
  const [waNotifyVoucherExpiry,  setWaNotifyVoucherExpiry]  = useState(settings.wa_notify_voucher_expiry ?? true);
  const [waNotifyBalanceReminder,setWaNotifyBalanceReminder]= useState(settings.wa_notify_balance_reminder ?? false);
  const [waNotifyReactivation,   setWaNotifyReactivation]   = useState(settings.wa_notify_reactivation   ?? true);
  const [waNotifyStreakAtRisk,   setWaNotifyStreakAtRisk]   = useState(settings.wa_notify_streak_at_risk  ?? false);
  const [waNotifyPromotion,      setWaNotifyPromotion]      = useState(settings.wa_notify_promotion       ?? false);
  const [waNotifyBirthday,       setWaNotifyBirthday]       = useState(settings.wa_notify_birthday        ?? false);
  const [waNotifyMilestone80,    setWaNotifyMilestone80]    = useState(settings.wa_notify_milestone_80    ?? false);
  const [saved, setSaved] = useState({
    primary_color:   settings.primary_color,
    secondary_color: settings.secondary_color,
    welcome_message: settings.welcome_message ?? '',
    program_label:   settings.program_label,
    phone_prefix:    settings.phone_prefix ?? '',
    timezone:        settings.timezone ?? 'America/Mexico_City',
    currency:                  settings.currency ?? 'MXN',
    notifyNewCustomer:         settings.notify_new_customer  ?? true,
    notifyRedemption:          settings.notify_redemption    ?? true,
    notifyWeeklyDigest:        settings.notify_weekly_digest ?? true,
    waNotifyWelcome:           settings.wa_notify_welcome        ?? true,
    waNotifyVoucherExpiry:     settings.wa_notify_voucher_expiry ?? true,
    waNotifyBalanceReminder:   settings.wa_notify_balance_reminder ?? false,
    waNotifyReactivation:      settings.wa_notify_reactivation   ?? true,
    waNotifyStreakAtRisk:      settings.wa_notify_streak_at_risk  ?? false,
    waNotifyPromotion:         settings.wa_notify_promotion       ?? false,
    waNotifyBirthday:          settings.wa_notify_birthday        ?? false,
    waNotifyMilestone80:       settings.wa_notify_milestone_80    ?? false,
  });
  const [copied, setCopied] = useState(false);

  const isDirty =
    primaryColor   !== saved.primary_color   ||
    secondaryColor !== saved.secondary_color ||
    welcomeMessage !== saved.welcome_message ||
    programLabel   !== saved.program_label   ||
    phonePrefix    !== saved.phone_prefix    ||
    tz             !== saved.timezone        ||
    currency                   !== saved.currency                  ||
    notifyNewCustomer          !== saved.notifyNewCustomer         ||
    notifyRedemption           !== saved.notifyRedemption          ||
    notifyWeeklyDigest         !== saved.notifyWeeklyDigest        ||
    waNotifyWelcome            !== saved.waNotifyWelcome           ||
    waNotifyVoucherExpiry      !== saved.waNotifyVoucherExpiry     ||
    waNotifyBalanceReminder    !== saved.waNotifyBalanceReminder   ||
    waNotifyReactivation       !== saved.waNotifyReactivation      ||
    waNotifyStreakAtRisk       !== saved.waNotifyStreakAtRisk      ||
    waNotifyPromotion          !== saved.waNotifyPromotion         ||
    waNotifyBirthday           !== saved.waNotifyBirthday       ||
    waNotifyMilestone80        !== saved.waNotifyMilestone80;

  function handleProgramLabelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw !== '' && !/^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/.test(raw)) return;
    setProgramLabel(raw.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase()));
  }

  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
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
          waNotifyWelcome,
          waNotifyVoucherExpiry,
          waNotifyBalanceReminder,
          waNotifyReactivation,
          waNotifyStreakAtRisk,
          waNotifyPromotion,
          waNotifyBirthday,
          waNotifyMilestone80,
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
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
          className="w-full sm:w-auto shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isPending ? s.saving : s.save}
        </button>
      </div>

      {mounted && (
        <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
          <p style={errorStyle} className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{displayText}</p>
        </div></div>
      )}
      {success && <p className="rounded-xl bg-green-50 dark:bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">{success} ✓</p>}

      {/* ── Notification hidden inputs — always in DOM so they submit regardless of accordion state ── */}
      <input type="hidden" name="notify_new_customer"  value={notifyNewCustomer  ? 'true' : 'false'} />
      <input type="hidden" name="notify_redemption"    value={notifyRedemption   ? 'true' : 'false'} />
      <input type="hidden" name="notify_weekly_digest" value={notifyWeeklyDigest ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_welcome"          value={waNotifyWelcome         ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_voucher_expiry"   value={waNotifyVoucherExpiry   ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_balance_reminder" value={waNotifyBalanceReminder ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_reactivation"     value={waNotifyReactivation    ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_streak_at_risk"   value={waNotifyStreakAtRisk    ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_promotion"        value={waNotifyPromotion       ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_birthday"         value={waNotifyBirthday        ? 'true' : 'false'} />
      <input type="hidden" name="wa_notify_milestone_80"     value={waNotifyMilestone80     ? 'true' : 'false'} />

      {/* ── Negocio ─────────────────────────────────────────────────────────── */}
      <AccordionSection
        title={s.account.title}
        description="Nombre, subdominio y logo de tu negocio"
        defaultOpen
        icon={
          <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
        }
      >
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
          <div className="rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="h-4 w-4 shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all">
                {portalUrl}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyPortalUrl}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {copied ? s.account.copied : s.account.copy}
              </button>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {s.account.open}
              </a>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* ── Logo ────────────────────────────────────────────────────────────── */}
      <AccordionSection
        title={s.logo.title}
        description={s.logo.subtitle}
        icon={
          <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        }
      >
        <LogoCardContent initialUrl={logoUrl} initialPadding={settings.logo_padding ?? 8} t={s.logo} />
      </AccordionSection>

      {/* ── Apariencia ──────────────────────────────────────────────────────── */}
      <AccordionSection
        title={s.appearance.title}
        description="Colores, mensaje de bienvenida y etiqueta de puntos"
        icon={
          <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
          </svg>
        }
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">{s.appearance.subtitle}</p>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
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

        <div className="border-t border-gray-100 dark:border-[#1e2438] pt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">{s.portal.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{s.portal.subtitle}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {s.portal.welcomeLabel}
            </label>
            <textarea
              name="welcome_message"
              rows={3}
              maxLength={150}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder={s.portal.welcomePlaceholder}
              className={`${inputCls} resize-none`}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-gray-500">{s.portal.welcomeHint}</p>
              <p className={`text-xs tabular-nums ${welcomeMessage.length >= 140 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {welcomeMessage.length}/150
              </p>
            </div>
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
            <div className="mt-3 rounded-xl border border-dashed border-gray-200 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center">
                {s.portal.previewLabel}
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">150</span>
                  <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400">{programLabel || 'Points'}</span>
                </div>
                <div className="w-full h-px bg-gray-200 dark:bg-[#1e2438]" />
                <div className="w-full space-y-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{s.portal.examplesLabel}</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {['Beans', 'Slices', 'Stars', 'Granos', 'Sellos'].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setProgramLabel(ex)}
                        className="rounded-full border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
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

        <div className="border-t border-gray-100 dark:border-[#1e2438] pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">{s.language.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{s.language.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['es', 'en'] as Locale[]).map((lang) => {
              const isSelected = locale === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  className={[
                    'inline-flex items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
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
      </AccordionSection>

      {/* ── Región ──────────────────────────────────────────────────────────── */}
      <AccordionSection
        title={s.region.title}
        description={s.region.subtitle}
        icon={
          <GlobeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        }
      >
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
      </AccordionSection>

      {/* ── Notificaciones ──────────────────────────────────────────────────── */}
      <AccordionSection
        title={s.notifications.title}
        description="Alertas por email y mensajes automáticos a tus clientes por WhatsApp"
        icon={
          <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        }
      >
        {/* Email */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {s.notifications.subtitle}
          </p>
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

        {/* WhatsApp */}
        <div className="border-t border-gray-100 dark:border-[#1e2438] pt-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <WhatsAppIcon className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                WhatsApp
              </p>
            </div>
            {plan === 'free' && (
              <a
                href="/dashboard/settings#billing"
                className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                Actualizar plan
              </a>
            )}
          </div>

          {plan === 'free' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-3 mb-3">
              <svg className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Las notificaciones por WhatsApp están disponibles en el <span className="font-semibold">Plan Starter</span> y superiores.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <NotifToggle label="Bienvenida al registrarse" hint="Mensaje de bienvenida cuando un cliente se une al programa." checked={waNotifyWelcome} onChange={setWaNotifyWelcome} disabled={plan === 'free'} />
            <NotifToggle label="Recordatorio de voucher por vencer" hint="Aviso 3 días antes de que un voucher expire sin ser canjeado." checked={waNotifyVoucherExpiry} onChange={setWaNotifyVoucherExpiry} disabled={plan === 'free'} />
            <NotifToggle label="Recordatorio de saldo acumulado" hint="Recuerda a clientes inactivos que tienen puntos/sellos disponibles." checked={waNotifyBalanceReminder} onChange={setWaNotifyBalanceReminder} disabled={plan === 'free'} />
            <NotifToggle label="Reactivación de clientes inactivos" hint="Mensaje semanal para clientes sin visitas en los últimos 21 días." checked={waNotifyReactivation} onChange={setWaNotifyReactivation} disabled={plan === 'free'} />
            <NotifToggle label="Racha en riesgo" hint="Alerta cuando un cliente está a punto de perder su racha de visitas." checked={waNotifyStreakAtRisk} onChange={setWaNotifyStreakAtRisk} disabled={plan === 'free'} />
            <NotifToggle label="Mensajes promocionales" hint="Envía promociones y ofertas especiales a tus clientes (costo más alto)." checked={waNotifyPromotion} onChange={setWaNotifyPromotion} disabled={plan === 'free'} />
            <NotifToggle label="Felicitación de cumpleaños" hint="Mensaje automático el día del cumpleaños del cliente con puntos de regalo." checked={waNotifyBirthday} onChange={setWaNotifyBirthday} disabled={plan === 'free'} />
            <NotifToggle label="Cerca de su recompensa (80%)" hint="Avisa al cliente cuando le falta poco para completar su meta y obtener su recompensa." checked={waNotifyMilestone80} onChange={setWaNotifyMilestone80} disabled={plan === 'free'} />
          </div>
        </div>
      </AccordionSection>

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
  disabled = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={[
      'flex items-center justify-between gap-4 rounded-xl border px-4 py-3',
      disabled
        ? 'border-gray-100 dark:border-[#1e2438] bg-gray-50/50 dark:bg-[#1a1f35]/50 opacity-50'
        : 'border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35]',
    ].join(' ')}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          'relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/30',
          disabled ? 'cursor-not-allowed' : '',
          checked && !disabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-[#2a3050]',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked && !disabled ? 'translate-x-5' : 'translate-x-0',
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
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-6 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {selected.symbol}
          </span>
          <span className="shrink-0">{selected.code}</span>
          <span className="shrink-0 text-gray-400 dark:text-gray-500">·</span>
          <span className="truncate text-gray-500 dark:text-gray-400">{selected.name}</span>
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

// LogoCardContent — the inner content without the card shell (used inside AccordionSection)
function LogoCardContent({
  initialUrl,
  initialPadding,
  t,
}: {
  initialUrl: string | null;
  initialPadding: number;
  t: LogoStrings;
}) {
  return <LogoCard initialUrl={initialUrl} initialPadding={initialPadding} t={t} bare />;
}

function LogoCard({
  initialUrl,
  initialPadding,
  t,
  bare = false,
}: {
  initialUrl: string | null;
  initialPadding: number;
  t: LogoStrings;
  bare?: boolean;
}) {
  const [url,     setUrl]     = useState<string | null>(initialUrl);
  const [padding, setPadding] = useState(initialPadding);
  const [status,  setStatus]  = useState<'idle' | 'uploading' | 'removing' | 'saving-padding'>('idle');
  const { error: logoError, setError: setLogoError, mounted: logoMounted, displayText: logoDisplayText, wrapperStyle: logoWrapperStyle, errorStyle: logoErrorStyle } = useAutoError();
  const fileRef = useRef<HTMLInputElement>(null);
  const router  = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLogoError('');
    setStatus('uploading');

    const form = new FormData();
    form.append('logo', file);

    const res  = await fetch('/api/tenants/logo', { method: 'POST', body: form });
    const json = await res.json();

    if (!res.ok) {
      setLogoError(json.error ?? 'Error al subir el logo.');
      setStatus('idle');
      return;
    }

    setUrl(json.url);
    setStatus('idle');
    router.refresh();
  }

  async function handleRemove() {
    setLogoError('');
    setStatus('removing');
    const res = await fetch('/api/tenants/logo', { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      setLogoError(json.error ?? 'Error al eliminar el logo.');
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

  const inner = (
    <div className="space-y-4">
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

      {logoMounted && (
        <div style={logoWrapperStyle}><div style={{ overflow: 'hidden' }}>
          <p style={logoErrorStyle} className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {logoDisplayText}
          </p>
        </div></div>
      )}
    </div>
  );

  if (bare) return inner;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
      {inner}
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
