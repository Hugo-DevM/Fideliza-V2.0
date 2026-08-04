/**
 * Feature flags for functionality that is built but intentionally not exposed yet.
 *
 * These are NOT plan gates — plan gating lives in `plans.ts`. A flag here means
 * "the code exists and works, but the product isn't ready to ship it". Flipping
 * one to `true` re-enables the feature everywhere; nothing else needs to change.
 *
 * Each flag must be consulted at BOTH the UI and the entry point (server action
 * or cron route), so a disabled feature can't be triggered by a stale page or a
 * forged request.
 */
export const FEATURES = {
  /**
   * Streak-at-risk WhatsApp reminder.
   *
   * OFF because there is no streak feature to back it: nothing counts
   * consecutive visits, the portal never shows a streak, and no reward depends
   * on one. The cron approximates "streak weeks" as the time between enrollment
   * and last activity (whatsapp-streak-at-risk/route.ts), which is account age,
   * not a streak — so the message states a number that isn't true.
   *
   * To re-enable: build a real streak counter (consecutive visits per period),
   * surface it in the customer portal, attach a reward, then have the cron read
   * that counter instead of approximating it.
   */
  streakAtRisk: false,

  /**
   * Manual promotion blast (WhatsApp).
   *
   * OFF because the approved template `fideliza_promotion_v2` only takes the
   * customer name and the business name — there is no parameter for the promo
   * itself, so a business cannot say what it is promoting. Free-form content
   * needs per-tenant approved templates, which depends on tenants connecting
   * their own WhatsApp number (`tenants.whatsapp_from`).
   *
   * To re-enable: ship own-number onboarding + per-tenant templates, add a
   * content parameter, and fix the business-name bug in sendPromotionBlastAction
   * (it passes `program_label`, the unit label, instead of the tenant name).
   */
  promotionBlast: false,
} as const;
