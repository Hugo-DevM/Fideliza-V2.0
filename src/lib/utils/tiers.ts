/**
 * Tier VIP utilities — shared between server (transaction service) and client (UI).
 */

export interface TierConfig {
  label:        string;
  /**
   * Minimum loyalty_score (universal tier system) or minimum lifetime_points
   * (legacy per-program system) required to qualify for this tier.
   */
  min_lifetime: number;
  multiplier:   number;
  color:        'bronze' | 'silver' | 'gold';
}

/**
 * Global tenant-level tier settings stored in tenant_settings.
 * Conversion rates control how many loyalty score points each program action awards.
 */
export interface TenantTierSettings {
  tiers_enabled:               boolean;
  tiers:                       TierConfig[];
  tier_score_per_stamp:        number;
  tier_score_per_visit:        number;
  tier_score_per_point:        number;
  tier_score_per_cashback_cent: number;
}

/** Default tiers used when tenant has not customized. min_lifetime = min loyalty_score. */
export const DEFAULT_TENANT_TIERS: TierConfig[] = [
  { label: 'Bronce', min_lifetime: 0,    multiplier: 1,   color: 'bronze' },
  { label: 'Plata',  min_lifetime: 500,  multiplier: 1.5, color: 'silver' },
  { label: 'Oro',    min_lifetime: 1500, multiplier: 2,   color: 'gold'   },
];

/** @deprecated Use DEFAULT_TENANT_TIERS for the universal tier system. */
export const DEFAULT_TIERS: TierConfig[] = DEFAULT_TENANT_TIERS;

/**
 * Computes the loyalty score delta a single earn event should contribute,
 * based on the program type and tenant conversion rates.
 * Uses the BASE delta (before any multipliers) to avoid inflating tier progress.
 */
export function computeLoyaltyDelta(
  programType: string,
  baseDelta: number,
  settings: TenantTierSettings,
): number {
  if (!settings.tiers_enabled || baseDelta <= 0) return 0;
  let raw = 0;
  switch (programType) {
    case 'stamp':    raw = baseDelta * settings.tier_score_per_stamp; break;
    case 'visit':    raw = baseDelta * settings.tier_score_per_visit; break;
    case 'points':   raw = baseDelta * settings.tier_score_per_point; break;
    case 'cashback': raw = baseDelta * settings.tier_score_per_cashback_cent; break;
  }
  return Math.round(raw);
}

/**
 * Returns the highest tier the customer qualifies for,
 * or null if no tiers are configured.
 */
export function computeTier(
  lifetimePoints: number,
  tiers: TierConfig[],
): TierConfig | null {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => b.min_lifetime - a.min_lifetime);
  return sorted.find((t) => lifetimePoints >= t.min_lifetime) ?? null;
}

/** Returns the next tier the customer has not yet reached, or null if already at top. */
export function nextTier(
  lifetimePoints: number,
  tiers: TierConfig[],
): TierConfig | null {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.min_lifetime - b.min_lifetime);
  return sorted.find((t) => lifetimePoints < t.min_lifetime) ?? null;
}

export const TIER_STYLES: Record<string, { bg: string; text: string; border: string; btnSelected: string }> = {
  bronze: {
    bg:          'bg-amber-50  dark:bg-amber-900/20',
    text:        'text-amber-700 dark:text-amber-400',
    border:      'border-amber-200 dark:border-amber-800/50',
    btnSelected: 'bg-amber-200 dark:bg-amber-700/50 border-amber-500 dark:border-amber-500 text-amber-900 dark:text-amber-200',
  },
  silver: {
    bg:          'bg-slate-100 dark:bg-slate-700/30',
    text:        'text-slate-600 dark:text-slate-300',
    border:      'border-slate-200 dark:border-slate-600/50',
    btnSelected: 'bg-slate-300 dark:bg-slate-600/60 border-slate-500 dark:border-slate-400 text-slate-900 dark:text-slate-100',
  },
  gold: {
    bg:          'bg-yellow-50 dark:bg-yellow-900/20',
    text:        'text-yellow-700 dark:text-yellow-400',
    border:      'border-yellow-200 dark:border-yellow-800/50',
    btnSelected: 'bg-yellow-200 dark:bg-yellow-700/50 border-yellow-500 dark:border-yellow-500 text-yellow-900 dark:text-yellow-200',
  },
};
