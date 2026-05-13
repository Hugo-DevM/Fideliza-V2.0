import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata = { title: 'Recuperar contraseña — Fideliza+' };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <span className="text-2xl font-bold text-indigo-600">Fideliza+</span>
          <p className="mt-1 text-sm text-gray-500">Panel de negocios</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Recupera tu contraseña</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        <p className="text-center text-xs text-gray-400">
          ¿Recordaste tu contraseña?{' '}
          <a href="/auth/login" className="text-indigo-500 hover:underline font-medium">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
