import Link from 'next/link';

export const metadata = { title: 'Correo confirmado — Fideliza+' };

export default function ConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md space-y-6 text-center">

        {/* Logo */}
        <span className="text-2xl font-bold text-indigo-600">Fideliza+</span>

        <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-6">
          {/* Success icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">¡Correo confirmado!</h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Tu dirección de correo ha sido verificada correctamente. Ya puedes iniciar sesión y comenzar a usar Fideliza+.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Ir al inicio de sesión
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
