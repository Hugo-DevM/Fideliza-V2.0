import { verifyAdminSecret } from './actions';

export const metadata = { title: 'Admin — Verificación' };

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-[#07090f]">
      <div className="w-full max-w-xs space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Acceso al panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ingresa la clave de administrador</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0f1222] border border-gray-200 dark:border-[#1e2538] px-6 py-6 shadow-lg">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              Clave incorrecta.
            </p>
          )}

          <form action={verifyAdminSecret} className="space-y-4">
            <div>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clave secreta
              </label>
              <input
                id="secret"
                name="secret"
                type="password"
                required
                autoFocus
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#07090f] px-4 py-2.5 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Verificar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
