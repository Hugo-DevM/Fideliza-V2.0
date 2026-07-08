/**
 * GET /api/stripe/coupon
 * Public endpoint: returns availability of the FIDELIZA10 promotion code
 * (remaining redemptions) so the landing page can show a live counter.
 * Cached and revalidated every 60 seconds.
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const revalidate = 60;

const PROMO_CODE = 'FIDELIZA10';

export async function GET() {
  try {
    const codes = await stripe.promotionCodes.list({ code: PROMO_CODE, active: true, limit: 1 });
    const promo = codes.data[0];

    if (!promo) {
      return NextResponse.json({ data: null, error: null });
    }

    const total     = promo.max_redemptions ?? null;
    const remaining = total !== null ? Math.max(total - promo.times_redeemed, 0) : null;
    const active    = promo.active && (remaining === null || remaining > 0);

    return NextResponse.json({
      data: { code: promo.code, active, remaining, total },
      error: null,
    });
  } catch (err) {
    console.error('[Stripe Coupon]', err);
    // Fail silently — the landing page simply hides the banner.
    return NextResponse.json({ data: null, error: null });
  }
}
