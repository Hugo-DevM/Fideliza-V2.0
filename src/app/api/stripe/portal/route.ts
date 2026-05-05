/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session for the authenticated tenant.
 * Redirects the user to the portal where they can manage their subscription,
 * update payment methods, and cancel.
 */

import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // ── Verify auth ───────────────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: 'No autenticado' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ data: null, error: 'Tenant no encontrado' }, { status: 401 });
    }

    // ── Fetch stripe_customer_id ──────────────────────────────────────
    const db = createServiceRoleClient();
    const { data: tenant } = await db
      .from('tenants')
      .select('stripe_customer_id')
      .eq('id', tenantId)
      .single();

    const customerId = (tenant as { stripe_customer_id: string | null } | null)?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { data: null, error: 'No tienes ninguna suscripción de pago. Actualiza tu plan primero.' },
        { status: 400 }
      );
    }

    // ── Create portal session ─────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ data: { url: portalSession.url }, error: null });

  } catch (err) {
    console.error('[Stripe Portal]', err);
    return NextResponse.json(
      { data: null, error: 'Error al abrir el portal de facturación. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
