import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import BillingSection from './BillingSection';
import DeleteAccountSection from './DeleteAccountSection';
import WhatsappSenderSection from './WhatsappSenderSection';
import AccordionSection from './AccordionSection';

export const metadata = { title: 'Configuración — Fideliza+' };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { tenant, settings, effectivePlan, planLimits } = await getAuthenticatedTenant();
  const { checkout } = await searchParams;
  const year = new Date().getFullYear();

  let planUsage: {
    customers: { used: number; max: number } | null;
    programs:  { used: number; max: number } | null;
    whatsapp:  { used: number; max: number };
  } | null = null;
  if (effectivePlan === 'free' || effectivePlan === 'starter' || effectivePlan === 'pro') {
    const db = createServiceRoleClient();
    const hasLimits = effectivePlan !== 'pro';
    const waLimit = planLimits.whatsappMonthlyLimit ?? 0;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const [{ count: customerCount }, { count: programCount }, { count: whatsappCount }] = await Promise.all([
      hasLimits
        ? db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('is_active', true)
        : Promise.resolve({ count: 0 }),
      hasLimits
        ? db.from('reward_programs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).neq('status', 'archived')
        : Promise.resolve({ count: 0 }),
      waLimit > 0
        ? db.from('whatsapp_message_queue').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).neq('status', 'failed').gte('created_at', monthStart.toISOString())
        : Promise.resolve({ count: 0 }),
    ]);
    planUsage = {
      customers: hasLimits ? { used: customerCount ?? 0, max: planLimits.maxCustomers! } : null,
      programs:  hasLimits ? { used: programCount  ?? 0, max: planLimits.maxPrograms!  } : null,
      whatsapp:  { used: whatsappCount ?? 0, max: waLimit },
    };
  }

  return (
    <div className="space-y-4">
      <SettingsForm
        settings={settings}
        tenantName={tenant.name}
        subdomain={tenant.subdomain}
        logoUrl={tenant.logo_url}
        year={year}
        plan={effectivePlan}
      />

      <AccordionSection
        title="WhatsApp Business"
        description="Configura el número desde el que se envían los mensajes a tus clientes"
        icon={
          <svg className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        }
      >
        <WhatsappSenderSection
          currentFrom={tenant.whatsapp_from ?? null}
          plan={effectivePlan}
        />
      </AccordionSection>

      <AccordionSection
        title="Plan y facturación"
        description="Gestiona tu suscripción y límites del plan actual"
        defaultOpen={checkout === 'success' || checkout === 'canceled'}
        icon={
          <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        }
      >
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
      </AccordionSection>

      <AccordionSection
        title="Zona de peligro"
        description="Acciones irreversibles para tu cuenta"
        icon={
          <svg className="h-4 w-4 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        }
      >
        <DeleteAccountSection subdomain={tenant.subdomain} />
      </AccordionSection>
    </div>
  );
}
