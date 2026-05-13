import LoginForm from './LoginForm';

export const metadata = { title: 'Iniciar sesión — Fideliza+' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-1.5">
          <img src="/logofideliza.svg" alt="Fideliza+" className="h-16 mx-auto" />
          <p className="text-sm text-indigo-300/70 tracking-wide">Panel de negocios</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 pt-8 pb-7 shadow-2xl shadow-black/50 ring-1 ring-white/5">
          <h1 className="mb-5 text-[1.15rem] font-semibold text-gray-900 tracking-tight">
            Inicia sesión en tu cuenta
          </h1>

          {error === 'auth_failed' && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 leading-snug">
              El enlace de acceso expiró o ya fue usado. Solicita uno nuevo.
            </div>
          )}

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600">
          ¿No tienes cuenta?{' '}
          <a
            href="/auth/register"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-150"
          >
            Crea una gratis
          </a>
        </p>

      </div>
    </div>
  );
}
