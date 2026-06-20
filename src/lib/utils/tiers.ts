/**
 * Tier VIP utilities — shared between server (transaction service) and client (UI).
 */

export interface TierConfig {
  label:        string;
  min_lifetime: number;
  multiplier:   number;
  color:        'bronze' | 'silver' | 'gold';
}

export const DEFAULT_TIERS: TierConfig[] = [
  { label: 'Bronce', min_lifetime: 0,    multiplier: 1,   color: 'bronze' },
  { label: 'Plata',  min_lifetime: 500,  multiplier: 1.5, color: 'silver' },
  { label: 'Oro',    min_lifetime: 1500, multiplier: 2,   color: 'gold'   },
];

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

export const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  bronze: {
    bg:     'bg-amber-50  dark:bg-amber-900/20',
    text:   'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  silver: {
    bg:     'bg-slate-100 dark:bg-slate-700/30',
    text:   'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-600/50',
  },
  gold: {
    bg:     'bg-yellow-50 dark:bg-yellow-900/20',
    text:   'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800/50',
  },
};
