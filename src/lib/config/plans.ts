/**
 * Centralized plan configuration.
 * Single source of truth for all plan limits and feature flags.
 * ALL services and UI components must derive limits from here — never hardcode plan values elsewhere.
 */

export type ProgramTypeAllowed = 'points' | 'stamp' | 'visit' | 'cashback';

export interface PlanLimits {
  maxCustomers: number | null;            // null = unlimited
  maxPrograms: number | null;             // null = unlimited
  allowedProgramTypes: ProgramTypeAllowed[];
  transactionHistoryLimit: number | null; // null = unlimited; for FREE = 50 most recent
  rewardCatalog: boolean;
  exportCSV: boolean;
  prioritySupport: boolean;
}

export const PLAN_CONFIG: Record<string, PlanLimits> = {
  free: {
    maxCustomers:           50,
    maxPrograms:            1,
    allowedProgramTypes:    ['points', 'stamp'],
    transactionHistoryLimit: 50,
    rewardCatalog:          false,
    exportCSV:              false,
    prioritySupport:        false,
  },
  starter: {
    maxCustomers:           500,
    maxPrograms:            3,
    allowedProgramTypes:    ['points', 'stamp', 'visit'],
    transactionHistoryLimit: null,
    rewardCatalog:          true,
    exportCSV:              false,
    prioritySupport:        false,
  },
  pro: {
    maxCustomers:           null,
    maxPrograms:            null,
    allowedProgramTypes:    ['points', 'stamp', 'visit', 'cashback'],
    transactionHistoryLimit: null,
    rewardCatalog:          true,
    exportCSV:              true,
    prioritySupport:        true,
  },
  // Backward compatibility — maps to pro limits
  enterprise: {
    maxCustomers:           null,
    maxPrograms:            null,
    allowedProgramTypes:    ['points', 'stamp', 'visit', 'cashback'],
    transactionHistoryLimit: null,
    rewardCatalog:          true,
    exportCSV:              true,
    prioritySupport:        true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
}

/**
 * Returns the effective plan string for a tenant, accounting for subscription status.
 *
 * Rules:
 *  - plan = 'free'                    → always 'free' (no subscription needed)
 *  - subscription_status = 'active' | 'trialing' → use tenant.plan
 *  - subscription_status = anything else (past_due, canceled, null) → 'free'
 */
export function getEffectivePlan(
  plan: string,
  subscriptionStatus: string | null
): string {
  if (plan === 'free') return 'free';
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') return plan;
  return 'free';
}

/** Convenience wrapper — same as getEffectivePlan but takes a partial Tenant object. */
export function getEffectivePlanFromTenant(tenant: {
  plan: string;
  subscription_status: string | null;
}): string {
  return getEffectivePlan(tenant.plan, tenant.subscription_status);
}
