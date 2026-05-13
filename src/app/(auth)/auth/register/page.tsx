import RegisterForm from './RegisterForm';

export const metadata = { title: 'Crea tu cuenta — Fideliza+' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 p-4">
      <div className="w-full max-w-sm py-10">

        {/* Logo */}
        <div className="mb-7 text-center space-y-1.5">
          <a href="/">
            <img src="/logofideliza.svg" alt="Fideliza+" className="h-16 mx-auto" />
          </a>
          <p className="text-sm text-indigo-300/70 tracking-wide">
            Configura tu programa de fidelidad en minutos
          </p>
        </div>

        <RegisterForm />

      </div>
    </div>
  );
}
