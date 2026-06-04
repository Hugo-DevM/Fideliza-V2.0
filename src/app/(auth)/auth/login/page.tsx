import LoginForm from './LoginForm';

export const metadata = { title: 'Iniciar sesión — Fideliza+' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1.5">
          <img src="/logofidelizalight.svg" alt="Fideliza+" className="block dark:hidden h-24 mx-auto" />
          <img src="/logofideliza.svg" alt="Fideliza+" className="hidden dark:block h-24 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-indigo-300/70 tracking-wide">Panel de negocios</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white dark:bg-[#161b2e] px-8 pt-8 pb-7 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5">
          <h1 className="mb-5 text-[1.15rem] font-semibold text-gray-900 dark:text-white tracking-tight">
            Inicia sesión en tu cuenta
          </h1>

          {error === 'auth_failed' && (
            <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 leading-snug">
              El enlace de acceso expiró o ya fue usado. Solicita uno nuevo.
            </div>
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
