/**
 * POST /api/stripe/upgrade-preview
 * Returns the prorated amount due immediately if the tenant upgrades to the given plan.
 * Uses stripe.invoices.retrieveUpcoming() — does NOT charge anything.
 */

import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { rateLimiters, rateLimitExceededResponse, rateLimitKey } from '@/lib/middleware/rate-limit';
import { getClientIp } from '@/lib/middleware/api-context';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ data: null, error: 'Tenant no encontrado' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────────
    const ip = getClientIp(request);
    const rl = await rateLimiters.stripeAction(rateLimitKey.byTenantAndIp(tenantId, ip, 'POST:/api/stripe/upgrade-preview'));
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    const body       = await request.json().catch(() => ({}));
    const targetPlan = (body as { plan?: string; billing?: string }).plan;
    const billing    = (body as { billing?: string }).billing ?? 'monthly';
    const priceKey   = targetPlan ? (billing === 'annual' ? `${targetPlan}_annual` : targetPlan) : undefined;
    const newPriceId = priceKey ? STRIPE_PRICE_IDS[priceKey] : undefined;

    if (!newPriceId) {
      return NextResponse.json({ data: null, error: 'Plan inválido.' }, { status: 400 });
    }

    const db = createServiceRoleClient();
    const { data: tenant } = await db
      .from('tenants')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', tenantId)
      .single();

    const row = tenant as { stripe_subscription_id: string | null; stripe_customer_id: string | null } | null;

    if (!row?.stripe_subscription_id || !row?.stripe_customer_id) {
      return NextResponse.json({ data: null, error: 'Sin suscripción activa.' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      return NextResponse.json({ data: null, error: 'Sin ítem de suscripción.' }, { status: 500 });
    }

    // Preview the upcoming invoice — no charge happens
    const upcoming = await stripe.invoices.retrieveUpcoming({
      customer: row.stripe_customer_id,
      subscription: row.stripe_subscription_id,
      subscription_items: [{ id: itemId, price: newPriceId }],
      subscription_proration_behavior: 'always_invoice',
    });

    // amount_due is in cents
    return NextResponse.json({
      data: {
        amountDue:  upcoming.amount_due,          // cents
        currency:   upcoming.currency.toUpperCase(),
        periodEnd:  upcoming.period_end,           // unix timestamp
      },
      error: null,
    });

  } catch (err) {
    console.error('[Upgrade Preview]', err);
    return NextResponse.json(
      { data: null, error: 'No se pudo calcular el monto.' },
      { status: 500 }
    );
  }
}
