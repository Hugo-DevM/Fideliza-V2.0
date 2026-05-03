import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Settings — Fideliza+' };

export default async function SettingsPage() {
  const { tenant, settings } = await getAuthenticatedTenant();

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">{tenant.name}</p>
      </div>

      {/* Read-only info */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Business name</p>
            <p className="font-medium text-gray-800">{tenant.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Subdomain</p>
            <p className="font-mono text-gray-700">{tenant.subdomain}.fideliza.app</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Plan</p>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 capitalize">
              {tenant.plan}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Customer portal</p>
            <p className="font-mono text-xs text-indigo-600">
              https://{tenant.subdomain}.fideliza.app/c
            </p>
          </div>
        </div>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
