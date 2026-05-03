import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in — Fideliza+' };

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
          <p className="mt-1 text-sm text-gray-500">Business dashboard</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-gray-900">Sign in to your account</h1>

          {error === 'auth_failed' && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              The sign-in link expired or was already used. Request a new one.
            </div>
          )}

          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-400">
          No account yet?{' '}
          <a href="/auth/register" className="text-indigo-500 hover:underline font-medium">
            Create one free
          </a>
        </p>
      </div>
    </div>
  );
}
