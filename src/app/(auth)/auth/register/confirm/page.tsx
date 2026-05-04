export const metadata = { title: 'Revisa tu correo — Fideliza+' };

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-gray-500">
            Te enviamos un enlace de confirmación a{' '}
            {email ? (
              <span className="font-semibold text-gray-700">{email}</span>
            ) : (
              'tu dirección de correo'
            )}
            .
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Haz clic en el enlace para activar tu cuenta y acceder a tu panel.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Qué hacer a continuación</p>
          {[
            'Abre el correo de Fideliza+',
            'Haz clic en el botón "Confirmar tu correo"',
            'Serás redirigido directamente a tu panel',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {i + 1}
              </span>
              <span className="text-sm text-gray-600">{step}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
          <a href="/auth/register" className="text-indigo-500 hover:underline">
            inténtalo con otra dirección
          </a>
          .
        </p>

        <a
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  );
}
