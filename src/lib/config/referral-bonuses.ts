/**
 * Default referral bonuses and input bounds, per program type.
 *
 * These defaults are what a business sees before it has saved anything, and
 * they were previously written out in four places with values that disagreed:
 * the referrals screen defaulted a VISIT program to 3/2, while the customer
 * portal, the invitation page and the payout hook all fell back to 100/50
 * regardless of type. The result was a business reading "3 visitas" on its own
 * screen while its customers were promised "100 visitas".
 *
 * Rules are expressed in DISPLAY units — what a human types. Use
 * defaultReferralBonuses() to get them in the units the database stores
 * (identical for every type except cashback, which stores cents).
 */

import { toStorageUnits, type ProgramType } from '@/lib/utils/program-units';

export interface ReferralBonusRule {
  /** Highest value the operator may enter, in display units. */
  max:      number;
  /** Input step, in display units. */
  step:     number;
  /** Default bonus for whoever shared the link, in display units. */
  referrer: number;
  /** Default bonus for the new customer, in display units. */
  referred: number;
}

const RULES: Record<ProgramType, ReferralBonusRule> = {
  stamp:    { max: 50,    step: 1,   referrer: 3,   referred: 2  },
  visit:    { max: 50,    step: 1,   referrer: 3,   referred: 2  },
  cashback: { max: 500,   step: 0.5, referrer: 10,  referred: 5  },
  points:   { max: 10000, step: 50,  referrer: 100, referred: 50 },
};

export function referralBonusRule(type: string): ReferralBonusRule {
  return RULES[type as ProgramType] ?? RULES.points;
}

/**
 * Defaults converted to storage units — safe to use directly as the `??`
 * fallback anywhere a saved config might be missing.
 */
export function defaultReferralBonuses(type: string): { referrer: number; referred: number } {
  const rule = referralBonusRule(type);
  return {
    referrer: toStorageUnits(type, rule.referrer),
    referred: toStorageUnits(type, rule.referred),
  };
}
