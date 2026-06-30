/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for upgrading to Starter or Pro.
 * Requires an authenticated dashboard session (reads Supabase user).
 */

import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { rateLimiters, rateLimitExceededResponse, rateLimitKey } from '@/lib/middleware/rate-limit';
import { getClientIp } from '@/lib/middleware/api-context';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // ── 1. Verify authentication ──────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ data: null, error: 'Tenant no encontrado' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const ip = getClientIp(request);
    const rl = await rateLimiters.stripeAction(rateLimitKey.byTenantAndIp(tenantId, ip, 'POST:/api/stripe/checkout'));
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    // ── 2. Fetch tenant ───────────────────────────────────────────────
    const db = createServiceRoleClient();
    const { data: tenant, error: tenantErr } = await db
      .from('tenants')
      .select('id, name, email, subdomain, plan, stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', tenantId)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ data: null, error: 'Tenant no encontrado' }, { status: 404 });
    }

    // ── 3. Parse & validate plan ──────────────────────────────────────
    const body    = await request.json().catch(() => ({}));
    const plan    = (body as { plan?: string; billing?: string }).plan;
    const billing = (body as { billing?: string }).billing ?? 'monthly';

    if (!plan || !['starter', 'pro'].includes(plan)) {
      return NextResponse.json({ data: null, error: 'Plan inválido. Debe ser "starter" o "pro".' }, { status: 400 });
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return NextResponse.json({ data: null, error: 'Ciclo inválido. Debe ser "monthly" o "annual".' }, { status: 400 });
    }

    const priceKey = billing === 'annual' ? `${plan}_annual` : plan;
    const priceId  = STRIPE_PRICE_IDS[priceKey];
    if (!priceId) {
      return NextResponse.json(
        { data: null, error: `STRIPE_PRICE_${priceKey.toUpperCase()} no está configurado en las variables de entorno.` },
        { status: 500 }
      );
    }

    // ── 4. Block duplicate active subscriptions ───────────────────────
    const row = tenant as {
      stripe_subscription_id: string | null;
      subscription_status: string | null;
      plan: string;
    };

    if (
      row.stripe_subscription_id &&
      (row.subscription_status === 'active' || row.subscription_status === 'trialing')
    ) {
      return NextResponse.json(
        { data: null, error: 'Ya tienes una suscripción activa. Usa el portal de facturación para cambiar de plan.' },
        { status: 400 }
      );
    }

    // ── 5. Create or retrieve Stripe Customer ─────────────────────────
    let customerId = (tenant as { stripe_customer_id: string | null }).stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    (tenant as { email: string }).email,
        name:     (tenant as { name: string }).name,
        metadata: {
          tenant_id: tenantId,
          subdomain: (tenant as { subdomain: string }).subdomain,
        },
      });
      customerId = customer.id;

      // Persist immediately so retries don't create duplicate customers
      await db.from('tenants').update({
        stripe_customer_id: customerId,
        updated_at:         new Date().toISOString(),
      }).eq('id', tenantId);
    }

    // ── 6. Create Checkout Session ────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Trial period: set STRIPE_TRIAL_DAYS=30 in Vercel to give new users a free trial.
    // Remove the env var when the promotion ends — existing trials are unaffected.
    const trialDays = process.env.STRIPE_TRIAL_DAYS ? parseInt(process.env.STRIPE_TRIAL_DAYS, 10) : 0;

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      client_reference_id:  tenantId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?checkout=success`,
      cancel_url:  `${appUrl}/dashboard/settings?checkout=canceled`,
      subscription_data: {
        metadata:          { tenant_id: tenantId },
        ...(trialDays > 0 && { trial_period_days: trialDays }),
      },
      // When trial is active, collect payment method but don't charge until trial ends
      ...(trialDays > 0 && { payment_method_collection: 'if_required' }),
      locale: 'es-419',
      allow_promotion_codes: true,
      metadata: { tenant_id: tenantId, plan, billing },
    });

    return NextResponse.json({ data: { url: session.url }, error: null });

  } catch (err) {
    console.error('[Stripe Checkout]', err);
    return NextResponse.json(
      { data: null, error: 'Error al crear sesión de pago. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
