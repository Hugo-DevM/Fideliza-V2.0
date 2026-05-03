import RegisterForm from './RegisterForm';

export const metadata = { title: 'Create your account — Fideliza+' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <div className="w-full max-w-md py-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="currentColor" opacity="0.9" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Fideliza<span className="text-indigo-600">+</span>
            </span>
          </a>
          <p className="mt-2 text-sm text-gray-500">Set up your loyalty program in minutes</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
