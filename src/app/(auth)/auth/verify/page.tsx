import Link from 'next/link';
import Image from 'next/image';
import { verifyEmailAction } from './actions';

export const metadata = { title: 'Confirmar correo — Fideliza' };

interface Props {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}

const bgCls = 'flex min-h-screen items-center justify-center p-4';
const cardCls = 'rounded-2xl bg-white dark:bg-[#161b2e] px-8 pt-8 pb-7 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 space-y-5';

function LogoGroup() {
  return (
    <>
      <Image src="/logofidelizalight.svg" alt="Fideliza" width={288} height={96} className="block dark:hidden h-24 w-auto mx-auto" />
      <Image src="/logofideliza.svg" alt="Fideliza" width={288} height={96} className="hidden dark:block h-24 w-auto mx-auto" />
    </>
  );
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token_hash, type } = await searchParams;

  if (!token_hash || !type) {
    return (
      <div className={bgCls}>
        <div className="w-full max-w-sm space-y-6 text-center">
          <LogoGroup />
          <div className={cardCls}>
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/15 ring-4 ring-red-100/60 dark:ring-red-500/20 flex items-center justify-center">
              <svg className="h-7 w-7 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[1.15rem] font-semibold text-gray-900 dark:text-white tracking-tight">Enlace inválido</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Este enlace no es válido. Solicita un nuevo correo de confirmación.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
            >
              Volver al registro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={bgCls}>
      <div className="w-full max-w-sm space-y-6 text-center">

        <LogoGroup />

        <div className={cardCls}>

          <div className="mx-auto w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/15 ring-4 ring-indigo-100/60 dark:ring-indigo-500/20 flex items-center justify-center">
            <svg className="h-7 w-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[1.15rem] font-semibold text-gray-900 dark:text-white tracking-tight">
              Un clic para confirmar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Haz clic en el botón para activar tu cuenta en Fideliza.
            </p>
          </div>

          <form action={verifyEmailAction}>
            <input type="hidden" name="token_hash" value={token_hash} />
            <input type="hidden" name="type"       value={type} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
            >
              Confirmar correo electrónico
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </form>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            ¿No pediste esto?{' '}
            <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
              Ignorar
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
