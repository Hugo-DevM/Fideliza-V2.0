import Link from 'next/link';
import { verifyEmailAction } from './actions';

export const metadata = { title: 'Confirmar correo — Fideliza+' };

interface Props {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token_hash, type } = await searchParams;

  // Guard: missing params means a broken or tampered link
  if (!token_hash || !type) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <img src="/logofideliza.svg" alt="Fideliza+" className="h-16 mx-auto" />

          <div className="rounded-2xl bg-white px-8 pt-8 pb-7 shadow-2xl shadow-black/50 ring-1 ring-white/5 space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 ring-4 ring-red-100/60 flex items-center justify-center">
              <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[1.15rem] font-semibold text-gray-900 tracking-tight">Enlace inválido</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Este enlace no es válido. Solicita un nuevo correo de confirmación.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-500 active:scale-[0.98]"
            >
              Volver al registro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 p-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Logo */}
        <img src="/logofideliza.svg" alt="Fideliza+" className="h-16 mx-auto" />

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 pt-8 pb-7 shadow-2xl shadow-black/50 ring-1 ring-white/5 space-y-5">

          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-indigo-50 ring-4 ring-indigo-100/60 flex items-center justify-center">
            <svg className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[1.15rem] font-semibold text-gray-900 tracking-tight">
              Un clic para confirmar
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Haz clic en el botón para activar tu cuenta en Fideliza+.
            </p>
          </div>

          {/* Server action form — POST, immune to email pre-fetch */}
          <form action={verifyEmailAction}>
            <input type="hidden" name="token_hash" value={token_hash} />
            <input type="hidden" name="type"       value={type} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-500 active:scale-[0.98]"
            >
              Confirmar correo electrónico
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </form>

          <p className="text-xs text-gray-400">
            ¿No pediste esto?{' '}
            <Link href="/auth/login" className="text-indigo-500 hover:text-indigo-400 transition-colors">
              Ignorar
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
