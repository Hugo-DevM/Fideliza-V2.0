import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard/DashboardShell';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import { getAlerts } from '@/lib/alerts/get-alerts';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, settings } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const alerts = await getAlerts(tenant.id).catch(() => []);

  const [
    { count: customerCount },
    { count: programCount },
    { count: txCount },
  ] = await Promise.all([
    db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('is_active', true),
    db.from('reward_programs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'active'),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).limit(1),
  ]);

  const onboardingSteps = [
    { label: 'Cuenta creada',                           done: true },
    { label: 'Crea tu primer programa de fidelización', done: (programCount ?? 0) > 0,  href: '/dashboard/programs' },
    { label: 'Agrega tu primer cliente',                done: (customerCount ?? 0) > 0, href: '/dashboard/customers' },
    { label: 'Registra tu primera transacción',         done: (txCount ?? 0) > 0,       href: '/dashboard/quick' },
  ];

  return (
    <DashboardShell
      tenantName={tenant.name}
      tenantPlan={tenant.plan}
      timezone={settings.timezone ?? 'America/Mexico_City'}
      alerts={alerts}
    >
      {children}
      <OnboardingChecklist tenantId={tenant.id} steps={onboardingSteps} />
    </DashboardShell>
  );
}
