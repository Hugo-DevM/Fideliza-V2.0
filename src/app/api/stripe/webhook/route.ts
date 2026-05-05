/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events. Stripe signature is verified before any processing.
 *
 * IMPORTANT: This route must read the raw body (request.text()) before any parsing.
 * Next.js must NOT buffer/parse this request body ahead of time.
 *
 * Handled events:
 *   checkout.session.completed       — subscription created via Checkout
 *   customer.subscription.created   — subscription created (any method)
 *   customer.subscription.updated   — plan change, renewal, status change
 *   customer.subscription.deleted   — subscription canceled → downgrade to free
 *   invoice.payment_failed          — mark tenant as past_due
 *   invoice.payment_succeeded       — restore active status after past_due recovery
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import {
  syncSubscriptionToTenant,
  downgradeToFree,
  markPastDue,
  resolveTenantByCustomer,
} from '@/lib/stripe/sync';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Stripe requires the raw body string for signature verification
export async function POST(request: Request) {
  const body      = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // ── Signature verification ────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Event routing ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── Checkout completed ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const tenantId = session.client_reference_id ?? session.metadata?.tenant_id ?? null;
        if (!tenantId) {
          console.error('[Webhook] checkout.session.completed: no tenant_id found');
          break;
        }

        // Store the Stripe customer ID on the tenant
        const db = createServiceRoleClient();
        await db.from('tenants').update({
          stripe_customer_id: session.customer as string,
          updated_at:         new Date().toISOString(),
        }).eq('id', tenantId);

        // Retrieve the full subscription object to get price/plan info
        const subscriptionId = session.subscription as string;
        const subscription   = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToTenant(tenantId, subscription);
        break;
      }

      // ── Subscription created ───────────────────────────────────────
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId =
          subscription.metadata?.tenant_id ??
          await resolveTenantByCustomer(subscription.customer as string);

        if (!tenantId) {
          console.error('[Webhook] subscription.created: tenant not found for customer', subscription.customer);
          break;
        }
        await syncSubscriptionToTenant(tenantId, subscription);
        break;
      }

      // ── Subscription updated (renewal, plan change, status change) ──
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId =
          subscription.metadata?.tenant_id ??
          await resolveTenantByCustomer(subscription.customer as string);

        if (!tenantId) {
          console.error('[Webhook] subscription.updated: tenant not found for customer', subscription.customer);
          break;
        }
        await syncSubscriptionToTenant(tenantId, subscription);
        break;
      }

      // ── Subscription deleted (canceled) ────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId =
          subscription.metadata?.tenant_id ??
          await resolveTenantByCustomer(subscription.customer as string);

        if (!tenantId) {
          console.error('[Webhook] subscription.deleted: tenant not found for customer', subscription.customer);
          break;
        }
        await downgradeToFree(tenantId);
        break;
      }

      // ── Payment failed → mark as past_due ──────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await markPastDue(customerId);
        break;
      }

      // ── Payment succeeded → restore active (after past_due recovery) ─
      case 'invoice.payment_succeeded': {
        const invoice    = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const tenantId   = await resolveTenantByCustomer(customerId);

        if (!tenantId) break;

        // Re-sync from the subscription to restore active status and correct end date
        const subscriptionId = invoice.subscription as string | null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionToTenant(tenantId, subscription);
        }
        break;
      }

      default:
        // Ignore unhandled event types — Stripe requires a 200 response for all events
        break;
    }

  } catch (err) {
    console.error(`[Webhook] Handler failed for ${event.type}:`, err);
    // Return 500 so Stripe retries the event
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
