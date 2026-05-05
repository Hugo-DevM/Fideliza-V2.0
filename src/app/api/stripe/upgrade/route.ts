/**
 * POST /api/stripe/upgrade
 * Upgrades an active Starter subscription to Pro (or any allowed plan change).
 * Updates the subscription item price directly — no new checkout session needed.
 */

import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { syncSubscriptionToTenant } from '@/lib/stripe/sync';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ data: null, error: 'Tenant no encontrado' }, { status: 401 });
    }

    // ── 2. Parse target plan ──────────────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const targetPlan = (body as { plan?: string }).plan;

    if (!targetPlan || !['starter', 'pro'].includes(targetPlan)) {
      return NextResponse.json({ data: null, error: 'Plan inválido.' }, { status: 400 });
    }

    const newPriceId = STRIPE_PRICE_IDS[targetPlan];
    if (!newPriceId) {
      return NextResponse.json(
        { data: null, error: `STRIPE_PRICE_${targetPlan.toUpperCase()} no está configurado.` },
        { status: 500 }
      );
    }

    // ── 3. Fetch tenant subscription ──────────────────────────────────────
    const db = createServiceRoleClient();
    const { data: tenant, error: tenantErr } = await db
      .from('tenants')
      .select('stripe_subscription_id, subscription_status, plan')
      .eq('id', tenantId)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ data: null, error: 'Tenant no encontrado' }, { status: 404 });
    }

    const row = tenant as {
      stripe_subscription_id: string | null;
      subscription_status: string | null;
      plan: string;
    };

    if (!row.stripe_subscription_id) {
      return NextResponse.json(
        { data: null, error: 'No tienes una suscripción activa. Usa el checkout para contratar un plan.' },
        { status: 400 }
      );
    }

    if (row.subscription_status !== 'active' && row.subscription_status !== 'trialing') {
      return NextResponse.json(
        { data: null, error: 'Tu suscripción no está activa. Gestiona tu suscripción desde el portal.' },
        { status: 400 }
      );
    }

    if (row.plan === targetPlan) {
      return NextResponse.json(
        { data: null, error: `Ya estás en el plan ${targetPlan}.` },
        { status: 400 }
      );
    }

    // ── 4. Update subscription price in Stripe ────────────────────────────
    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      return NextResponse.json({ data: null, error: 'No se encontró el ítem de suscripción.' }, { status: 500 });
    }

    const updatedSubscription = await stripe.subscriptions.update(row.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'always_invoice',
    });

    // Sync to DB immediately so the UI reflects the change on the next refresh.
    // The webhook will also fire and be a no-op since the data will already match.
    await syncSubscriptionToTenant(tenantId, updatedSubscription);

    return NextResponse.json({ data: { plan: targetPlan }, error: null });

  } catch (err) {
    console.error('[Stripe Upgrade]', err);
    return NextResponse.json(
      { data: null, error: 'Error al cambiar de plan. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
