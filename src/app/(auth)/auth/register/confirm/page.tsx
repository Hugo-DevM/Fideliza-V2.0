export const metadata = { title: 'Revisa tu correo — Fideliza+' };

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">

        {/* Logo */}
        <img src="/logofideliza.svg" alt="Fideliza+" className="h-16 mx-auto" />

        {/* Icon + heading */}
        <div className="space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Revisa tu correo</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enviamos un enlace de confirmación a{' '}
              {email
                ? <span className="font-medium text-indigo-300">{email}</span>
                : 'tu dirección de correo'
              }.
              Haz clic en él para activar tu cuenta.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-5 text-left space-y-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Pasos a seguir
          </p>
          {[
            'Abre el correo de Fideliza+',
            'Haz clic en "Confirmar tu correo"',
            'Serás redirigido a tu panel',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[11px] font-bold text-indigo-400">
                {i + 1}
              </span>
              <span className="text-sm text-gray-300">{step}</span>
            </div>
          ))}
        </div>

        {/* Spam note + back link */}
        <div className="space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            ¿No recibiste nada? Revisa la carpeta de spam o{' '}
            <a href="/auth/register" className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150">
              intenta con otra dirección
            </a>
            .
          </p>

          <a
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors duration-150"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al inicio de sesión
          </a>
        </div>

      </div>
    </div>
  );
}
