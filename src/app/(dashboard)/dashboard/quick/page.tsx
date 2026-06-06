import { getAuthenticatedTenant } from "@/lib/auth/get-tenant";
import QuickRegister from "./QuickRegister";
import VerifyVoucherForm from "../VerifyVoucherForm";

export const metadata = { title: "Registro rápido — Fideliza+" };

export default async function QuickRegisterPage() {
  const { settings } = await getAuthenticatedTenant();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          <BoltIcon className="h-3.5 w-3.5" />
          Mostrador
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Registro rápido
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Busca al cliente para sumar puntos, agregar un sello o canjear una recompensa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <QuickRegister programLabel={settings.program_label} currency={settings.currency ?? 'MXN'} />
        <VerifyVoucherForm />
      </div>
    </div>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}
