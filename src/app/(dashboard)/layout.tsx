import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, settings } = await getAuthenticatedTenant();

  return (
    <DashboardShell
      tenantName={tenant.name}
      tenantPlan={tenant.plan}
      timezone={settings.timezone ?? 'America/Mexico_City'}
    >
      {children}
    </DashboardShell>
  );
}
