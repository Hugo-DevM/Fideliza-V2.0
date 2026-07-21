import Image from 'next/image';
import LoginForm from './LoginForm';
import LoginNotice from './LoginNotice';

export const metadata = { title: 'Iniciar sesión — Fideliza' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  const { error, reason } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1.5">
          <Image src="/logofidelizalight.svg" alt="Fideliza" width={288} height={96} className="block dark:hidden h-24 w-auto mx-auto" />
          <Image src="/logofideliza.svg" alt="Fideliza" width={288} height={96} className="hidden dark:block h-24 w-auto mx-auto" />
          <p className="text-sm text-gray-500 dark:text-indigo-300/70 tracking-wide">Panel de negocios</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white dark:bg-[#161b2e] px-8 pt-8 pb-7 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5">
          <h1 className="mb-5 text-[1.15rem] font-semibold text-gray-900 dark:text-white tracking-tight">
            Inicia sesión en tu cuenta
          </h1>

          {error === 'auth_failed' && (
            <LoginNotice
              message="El enlace de acceso expiró o ya fue usado. Solicita uno nuevo."
              variant="error"
            />
          )}

          {reason === 'account_not_found' && (
            <LoginNotice
              message="Esta cuenta ya no existe o fue eliminada. Si crees que es un error, contáctanos."
              variant="warning"
            />
          )}

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          ¿No tienes cuenta?{' '}
          <a
            href="/auth/register"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold transition-colors"
          >
            Crea una gratis
          </a>
        </p>

      </div>
    </div>
  );
}
