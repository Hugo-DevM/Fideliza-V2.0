/**
 * Stripe SDK singleton + plan-to-price-ID mapping.
 * Server-only — never import from client components.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY        — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET    — whsec_...
 *   STRIPE_PRICE_STARTER     — price_... (monthly Starter price ID from Stripe dashboard)
 *   STRIPE_PRICE_PRO         — price_... (monthly Pro price ID from Stripe dashboard)
 */

import 'server-only';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set. Add it to .env.local');
}

// Prevent accidental use of Stripe test keys in production.
// NEXT_PHASE is 'phase-production-build' during `next build` — skip the check
// then so the build succeeds. The check fires on every real request at runtime.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
if (
  !isBuildPhase &&
  process.env.NODE_ENV === 'production' &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
) {
  throw new Error(
    'FATAL: Stripe TEST key detected in production. Set STRIPE_SECRET_KEY to a sk_live_... key.'
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// ── Plan → Stripe Price ID mapping ───────────────────────────────────────────
// Price IDs are created in the Stripe Dashboard under Products.
// Use test mode Price IDs during development (price_test_...).

export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  starter:        process.env.STRIPE_PRICE_STARTER,
  pro:            process.env.STRIPE_PRICE_PRO,
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  pro_annual:     process.env.STRIPE_PRICE_PRO_ANNUAL,
  test:           process.env.STRIPE_PRICE_TEST,
};

/** Returns the internal plan name for a given Stripe Price ID, or null if not found. */
export function planFromPriceId(priceId: string): 'starter' | 'pro' | null {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id && id === priceId) return plan as 'starter' | 'pro';
  }
  return null;
}

/** Active Stripe subscription statuses that grant full plan access. */
export const ACTIVE_STATUSES = new Set(['active', 'trialing']);
