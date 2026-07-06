import Image from 'next/image';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata = { title: 'Recuperar contraseña — Fideliza+' };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-1.5">
          <Image src="/logofidelizalight.svg" alt="Fideliza+" width={288} height={96} className="block dark:hidden h-24 w-auto mx-auto" />
          <Image src="/logofideliza.svg" alt="Fideliza+" width={288} height={96} className="hidden dark:block h-24 w-auto mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Panel de negocios</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] p-8 shadow-xl shadow-black/5 dark:shadow-black/40">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recupera tu contraseña</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          ¿Recordaste tu contraseña?{' '}
          <a href="/auth/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
