import UpdatePasswordForm from './UpdatePasswordForm';

export const metadata = { title: 'Nueva contraseña — Fideliza+' };

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-bold text-indigo-600">Fideliza+</span>
          <p className="mt-1 text-sm text-gray-500">Panel de negocios</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Crea una nueva contraseña</h1>
            <p className="mt-1 text-sm text-gray-500">
              Elige una contraseña segura para proteger tu cuenta.
            </p>
          </div>

          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
