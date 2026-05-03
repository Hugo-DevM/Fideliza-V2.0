import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant } = await getAuthenticatedTenant();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar tenantName={tenant.name} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
