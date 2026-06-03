import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant } = await getAuthenticatedTenant();

  return (
    <DashboardShell tenantName={tenant.name} tenantPlan={tenant.plan}>
      {children}
    </DashboardShell>
  );
}
