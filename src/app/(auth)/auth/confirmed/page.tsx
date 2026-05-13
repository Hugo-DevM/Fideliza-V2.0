import Link from 'next/link';

export const metadata = { title: 'Correo confirmado — Fideliza+' };

export default function ConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 p-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Logo */}
        <img src="/logofideliza.svg" alt="Fideliza+" className="h-16 mx-auto" />

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 pt-8 pb-7 shadow-2xl shadow-black/50 ring-1 ring-white/5 space-y-5">

          {/* Success icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-green-50 ring-4 ring-green-100/60 flex items-center justify-center">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[1.15rem] font-semibold text-gray-900 tracking-tight">
              Correo confirmado
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tu cuenta está activa. Ya puedes entrar a tu panel y comenzar a fidelizar clientes.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-500 active:scale-[0.98]"
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
