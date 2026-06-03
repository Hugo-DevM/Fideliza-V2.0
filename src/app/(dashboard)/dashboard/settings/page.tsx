import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import SettingsForm from './SettingsForm';
import BillingSection from './BillingSection';
import DeleteAccountSection from './DeleteAccountSection';

export const metadata = { title: 'Configuración — Fideliza+' };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { tenant, settings, effectivePlan } = await getAuthenticatedTenant();
  const { checkout } = await searchParams;
  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <SettingsForm
        settings={settings}
        tenantName={tenant.name}
        subdomain={tenant.subdomain}
        year={year}
      />

      <BillingSection
        currentPlan={tenant.plan}
        effectivePlan={effectivePlan}
        subscriptionStatus={tenant.subscription_status}
        subscriptionEndDate={tenant.subscription_end_date}
        hasStripeCustomer={!!tenant.stripe_customer_id}
        checkoutSuccess={checkout === 'success'}
        checkoutCanceled={checkout === 'canceled'}
      />

      <DeleteAccountSection subdomain={tenant.subdomain} />
    </div>
  );
}
