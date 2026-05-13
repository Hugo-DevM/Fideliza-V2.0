'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsAction } from './actions';
import type { TenantSettings } from '@/lib/types';

export default function SettingsForm({ settings }: { settings: TenantSettings }) {
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

  const isDirty =
    primaryColor   !== saved.primary_color   ||
    secondaryColor !== saved.secondary_color ||
    welcomeMessage !== saved.welcome_message ||
    programLabel   !== saved.program_label;

  function handleProgramLabelChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Solo letras (incluye acentos, ñ, ü) y espacios; bloquea números y símbolos
    if (raw !== '' && !/^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/.test(raw)) return;
    // Primera letra de cada palabra en mayúscula
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error   && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success} ✓</p>}

      {/* Branding */}
      <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Apariencia</h2>

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

        {/* Live preview */}
        <div
          className="rounded-xl p-4 text-white text-sm font-medium"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
        >
          <p className="text-xs opacity-70 uppercase tracking-widest">Vista previa</p>
          <p className="mt-0.5 font-bold text-lg">Nombre de tu negocio</p>
          <p className="text-xs opacity-80 mt-1">{welcomeMessage || 'El mensaje de bienvenida aparece aquí'}</p>
        </div>
      </section>

      {/* Portal */}
      <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Customer portal</h2>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Tus clientes acceden a una página pública con su código de acceso para ver sus puntos, recompensas y vouchers. Estos ajustes controlan cómo se ve esa página.
          </p>
          {/* What the customer sees */}
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <p className="text-xs text-indigo-700">
              URL del portal de tus clientes:{' '}
              <span className="font-mono font-semibold">tudominio.fideliza.app/c</span>
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje de bienvenida
          </label>
          <textarea
            name="welcome_message"
            rows={2}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="¡Bienvenido! Acumula puntos en cada visita."
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-400">Texto que aparece en la tarjeta del portal cuando el cliente abre su página.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <p className="mt-1 text-xs text-gray-400">
            El nombre de tu moneda de lealtad. En lugar del genérico "Points" puedes poner algo propio de tu negocio.
          </p>

          {/* Live preview */}
          <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Así lo ve tu cliente</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">150</p>
                <p className="text-xs text-gray-500">{programLabel || 'Points'}</p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Ejemplos de otros negocios:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Beans', 'Slices', 'Stars', 'Granos', 'Sellos'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setProgramLabel(ex)}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-gray-200 p-0.5"
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

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
