import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'Correo confirmado — Fideliza+' };

export default function ConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Logo */}
        <Image src="/logofidelizalight.svg" alt="Fideliza+" width={288} height={96} className="block dark:hidden h-24 w-auto mx-auto" />
        <Image src="/logofideliza.svg" alt="Fideliza+" width={288} height={96} className="hidden dark:block h-24 w-auto mx-auto" />

        {/* Card */}
        <div className="rounded-2xl bg-white dark:bg-[#161b2e] px-8 pt-8 pb-7 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 space-y-5">

          {/* Success icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/15 ring-4 ring-green-100/60 dark:ring-green-500/20 flex items-center justify-center">
            <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[1.15rem] font-semibold text-gray-900 dark:text-white tracking-tight">
              Correo confirmado
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Tu cuenta está activa. Ya puedes entrar a tu panel y comenzar a fidelizar clientes.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
          >
            Ir a mi panel
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

        </div>

      </div>
    </div>
  );
}
