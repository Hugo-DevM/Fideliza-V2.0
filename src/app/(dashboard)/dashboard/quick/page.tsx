import { getAuthenticatedTenant } from "@/lib/auth/get-tenant";
import QuickRegister from "./QuickRegister";
import VerifyVoucherForm from "../VerifyVoucherForm";

export const metadata = { title: "Registro rápido — Fideliza+" };

export default async function QuickRegisterPage() {
  const { settings } = await getAuthenticatedTenant();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Registro rápido</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Busca al cliente para sumar puntos o canjea una recompensa
          directamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        {/* Left — assign points / stamps / visits */}
        <QuickRegister programLabel={settings.program_label} />

        {/* Right — redeem vouchers */}
        <VerifyVoucherForm />
      </div>
    </div>
  );
}
