import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getAlerts } from '@/lib/alerts/get-alerts';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, settings } = await getAuthenticatedTenant();
  const alerts = await getAlerts(tenant.id).catch(() => []);

  return (
    <DashboardShell
      tenantName={tenant.name}
      tenantPlan={tenant.plan}
      timezone={settings.timezone ?? 'America/Mexico_City'}
      alerts={alerts}
    >
      {children}
    </DashboardShell>
  );
}
