'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsAction } from './actions';
import type { TenantSettings } from '@/lib/types';

export default function SettingsForm({
  settings,
  tenantName,
  subdomain,
  year,
}: {
  settings: TenantSettings;
  tenantName: string;
  subdomain: string;
  year: number;
}) {
  const [primaryColor,   setPrimaryColor]   = useState(settings.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondary_color);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcome_message ?? '');
  const [programLabel,   setProgramLabel]   = useState(settings.program_label);
  const [saved, setSaved] = useState({
    primary_color:   settings.primary_color,
    secondary_color: settings.secondary_color,
    welcome_message: settings.welcome_message ?? '',
    program_label:   settings.program_label,
  });
  const [copied, setCopied] = useState(false);

  const isDirty =
    primaryColor   !== saved.primary_color   ||
    secondaryColor !== saved.secondary_color ||
    welcomeMessage !== saved.welcome_message ||
    programLabel   !== saved.program_label;

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
        });
        setSuccess('Configuración guardada');
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
            Cuenta
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuración{' '}
            <span className="font-normal text-gray-400 dark:text-gray-500">{year}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personaliza tu negocio y gestiona tu suscripción.
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {error   && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="rounded-xl bg-green-50 dark:bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">{success} ✓</p>}

      {/* ── Cuenta card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Cuenta</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Nombre del negocio</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{tenantName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Subdominio</p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{subdomain}.fideliza.app</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">URL del portal</p>
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
              {copied ? 'Copiado ✓' : 'Copiar'}
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Abrir
            </a>
          </div>
        </div>
      </div>

      {/* ── Apariencia card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Apariencia</h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Colores del portal del cliente</p>
          </div>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Portal del cliente
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField
            label="Color primario"
            name="primary_color"
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorField
            label="Color secundario"
            name="secondary_color"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
        </div>

        <div
          className="rounded-xl p-5 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
        >
          <p className="text-xs opacity-70 uppercase tracking-widest">Vista previa</p>
          <p className="mt-1 text-xl font-bold">{tenantName}</p>
          <p className="mt-1 text-xs opacity-80">{welcomeMessage || 'El mensaje de bienvenida aparece aquí'}</p>
        </div>
      </div>

      {/* ── Portal del cliente card ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Portal del cliente</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Tus clientes acceden con su código para ver puntos, recompensas y vouchers.
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
            Mensaje de bienvenida
          </label>
          <textarea
            name="welcome_message"
            rows={3}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="¡Bienvenido! Acumula puntos en cada visita."
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Aparece en la tarjeta del portal cuando el cliente abre su página.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Etiqueta de moneda
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
            El nombre de tu moneda de lealtad (ej: Puntos, Beans, Stars, Granos).
          </p>

          <div className="mt-3 rounded-xl border border-dashed border-gray-200 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Así lo ve tu cliente
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">150</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{programLabel || 'Points'}</p>
              </div>
              <div className="h-10 w-px bg-gray-200 dark:bg-[#1e2438]" />
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">Ejemplos:</p>
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
    </form>
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
