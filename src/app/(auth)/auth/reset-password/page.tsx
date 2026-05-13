import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = { title: 'Nueva contraseña — Fideliza+' };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md space-y-6">

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

          {/* useSearchParams requires Suspense boundary */}
          <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-gray-100" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-gray-400">
          ¿El enlace no funciona?{' '}
          <a href="/auth/forgot-password" className="text-indigo-500 hover:underline font-medium">
            Solicitar uno nuevo
          </a>
        </p>
      </div>
    </div>
  );
}
