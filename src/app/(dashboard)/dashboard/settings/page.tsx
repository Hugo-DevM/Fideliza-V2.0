import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import BillingSection from './BillingSection';
import DeleteAccountSection from './DeleteAccountSection';

export const metadata = { title: 'Configuración — Fideliza+' };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { tenant, settings, effectivePlan, planLimits } = await getAuthenticatedTenant();
  const { checkout } = await searchParams;
  const year = new Date().getFullYear();

  let planUsage: { customers: { used: number; max: number }; programs: { used: number; max: number } } | null = null;
  if (effectivePlan === 'free' || effectivePlan === 'starter') {
    const db = createServiceRoleClient();
    const [{ count: customerCount }, { count: programCount }] = await Promise.all([
      db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('is_active', true),
      db.from('reward_programs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).neq('status', 'archived'),
    ]);
    planUsage = {
      customers: { used: customerCount ?? 0, max: planLimits.maxCustomers! },
      programs:  { used: programCount  ?? 0, max: planLimits.maxPrograms!  },
    };
  }

  return (
    <div className="space-y-6">
      <SettingsForm
        settings={settings}
        tenantName={tenant.name}
        subdomain={tenant.subdomain}
        logoUrl={tenant.logo_url}
        year={year}
        plan={effectivePlan}
      />

      <BillingSection
        currentPlan={tenant.plan}
        effectivePlan={effectivePlan}
        subscriptionStatus={tenant.subscription_status}
        subscriptionEndDate={tenant.subscription_end_date}
        hasStripeCustomer={!!tenant.stripe_customer_id}
        checkoutSuccess={checkout === 'success'}
        checkoutCanceled={checkout === 'canceled'}
        planUsage={planUsage}
        trialDays={parseInt(process.env.STRIPE_TRIAL_DAYS ?? '0', 10)}
      />

      <DeleteAccountSection subdomain={tenant.subdomain} />
    </div>
  );
}
