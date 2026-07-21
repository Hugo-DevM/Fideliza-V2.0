import { Suspense } from 'react';
import Image from 'next/image';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = { title: 'Nueva contraseña — Fideliza' };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-1.5">
          <Image src="/logofidelizalight.svg" alt="Fideliza" width={288} height={96} className="block dark:hidden h-24 w-auto mx-auto" />
          <Image src="/logofideliza.svg" alt="Fideliza" width={288} height={96} className="hidden dark:block h-24 w-auto mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Panel de negocios</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] p-8 shadow-xl shadow-black/5 dark:shadow-black/40">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Crea una nueva contraseña</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Elige una contraseña segura para proteger tu cuenta.
            </p>
          </div>

          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-[#1e2438]" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          ¿El enlace no funciona?{' '}
          <a href="/auth/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            Solicitar uno nuevo
          </a>
        </p>
      </div>
    </div>
  );
}
