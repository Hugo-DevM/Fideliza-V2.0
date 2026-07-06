import Link from 'next/link';
import Image from 'next/image';
import RegisterForm from './RegisterForm';

export const metadata = { title: 'Crea tu cuenta — Fideliza+' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm py-10">

        {/* Logo */}
        <div className="mb-7 text-center space-y-1.5">
          <Link href="/">
            <Image src="/logofidelizalight.svg" alt="Fideliza+" width={288} height={96} className="block dark:hidden h-24 w-auto mx-auto" />
            <Image src="/logofideliza.svg" alt="Fideliza+" width={288} height={96} className="hidden dark:block h-24 w-auto mx-auto" />
          </Link>
          <p className="text-sm text-gray-500 dark:text-indigo-300/70 tracking-wide">
            Configura tu programa de fidelidad en minutos
          </p>
        </div>

        <RegisterForm />

      </div>
    </div>
  );
}
