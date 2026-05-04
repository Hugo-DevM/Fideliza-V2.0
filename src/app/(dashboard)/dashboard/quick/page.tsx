import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import QuickRegister from './QuickRegister';

export const metadata = { title: 'Registro rápido — Fideliza+' };

export default async function QuickRegisterPage() {
  const { settings } = await getAuthenticatedTenant();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Registro rápido</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Busca al cliente por código de acceso o teléfono y registra su transacción al instante.
        </p>
      </div>

      <QuickRegister programLabel={settings.program_label} />
    </div>
  );
}
