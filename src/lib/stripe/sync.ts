/**
 * Stripe → database sync helpers.
 * Called exclusively from the webhook handler.
 * Uses service role client to bypass RLS.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { revalidateTenantCache } from '@/lib/cache/tenant-cache';
import { planFromPriceId } from './index';
import type Stripe from 'stripe';

/**
 * Syncs an active/updated Stripe subscription to the tenant record.
 * Updates: plan, subscription_status, stripe_subscription_id, subscription_end_date.
 */
export async function syncSubscriptionToTenant(
  tenantId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const db = createServiceRoleClient();

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plan    = priceId ? planFromPriceId(priceId) : null;

  const { data, error } = await db.from('tenants').update({
    stripe_subscription_id: subscription.id,
    subscription_status:    subscription.status,
    subscription_end_date:  new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at:             new Date().toISOString(),
    // Only update plan when we can resolve it from the Price ID
    ...(plan ? { plan } : {}),
  }).eq('id', tenantId).select('subdomain').single();
  if (error) throw new Error(`syncSubscriptionToTenant failed: ${error.message}`);

  // Plan changes affect cached tenant data + portal branding gating
  revalidateTenantCache(tenantId, (data as { subdomain: string } | null)?.subdomain);
}

/**
 * Downgrades a tenant to FREE after subscription cancellation or deletion.
 */
export async function downgradeToFree(tenantId: string): Promise<void> {
  const db = createServiceRoleClient();

  const { data, error } = await db.from('tenants').update({
    plan:                    'free',
    stripe_subscription_id:  null,
    subscription_status:     'canceled',
    subscription_end_date:   null,
    updated_at:              new Date().toISOString(),
  }).eq('id', tenantId).select('subdomain').single();

  if (error) throw new Error(`downgradeToFree failed: ${error.message}`);

  revalidateTenantCache(tenantId, (data as { subdomain: string } | null)?.subdomain);
}

/**
 * Marks a tenant as past_due after a failed invoice payment.
 * Plan field is NOT changed — access is restricted at query time via effective plan logic.
 */
export async function markPastDue(stripeCustomerId: string): Promise<void> {
  const db = createServiceRoleClient();

  const { data, error } = await db.from('tenants').update({
    subscription_status: 'past_due',
    updated_at:          new Date().toISOString(),
  }).eq('stripe_customer_id', stripeCustomerId).select('id, subdomain');

  if (error) throw new Error(`markPastDue failed: ${error.message}`);

  for (const row of (data ?? []) as { id: string; subdomain: string }[]) {
    revalidateTenantCache(row.id, row.subdomain);
  }
}

/**
 * Resolves a tenant ID from a Stripe customer ID.
 * Used when webhook events don't include tenant_id in metadata.
 */
export async function resolveTenantByCustomer(customerId: string): Promise<string | null> {
  const db = createServiceRoleClient();

  const { data } = await db
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  return (data as { id: string } | null)?.id ?? null;
}
