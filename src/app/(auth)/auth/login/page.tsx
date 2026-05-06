import LoginForm from './LoginForm';

export const metadata = { title: 'Iniciar sesión — Fideliza+' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-bold text-indigo-600">Fideliza+</span>
          <p className="mt-1 text-sm text-gray-500">Panel de negocios</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-gray-900">Inicia sesión en tu cuenta</h1>

          {error === 'auth_failed' && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              El enlace de acceso expiró o ya fue usado. Solicita uno nuevo.
            </div>
          )}

          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-400">
          ¿No tienes cuenta?{' '}
          <a href="/auth/register" className="text-indigo-500 hover:underline font-medium">
            Crea una gratis
          </a>
        </p>
      </div>
    </div>
  );
}
