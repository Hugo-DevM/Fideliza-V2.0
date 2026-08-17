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
  /**
   * Reward granted as a free voucher the first time a customer reaches this
   * tier. Optional — null/undefined means the tier grants no gift.
   */
  reward_id?:   string | null;
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
 * Normalises one earn into a comparable "activity score", using the tenant's
 * conversion rates. This is what makes a stamp, a visit, a point and a cent of
 * cashback comparable on one scale.
 *
 * Deliberately NOT gated on tiers_enabled: the monthly ranking needs this
 * number for every tenant, including those on plans without VIP tiers. The
 * gate belongs to the tier system, not to the unit conversion.
 *
 * Always uses the BASE delta (before VIP / flash / surprise multipliers) so a
 * customer's own multiplier cannot inflate their own standing.
 */
export function computeActivityScore(
  programType: string,
  baseDelta: number,
  rates: Pick<
    TenantTierSettings,
    'tier_score_per_stamp' | 'tier_score_per_visit' | 'tier_score_per_point' | 'tier_score_per_cashback_cent'
  >,
): number {
  if (baseDelta <= 0) return 0;
  let raw = 0;
  switch (programType) {
    case 'stamp':    raw = baseDelta * rates.tier_score_per_stamp; break;
    case 'visit':    raw = baseDelta * rates.tier_score_per_visit; break;
    case 'points':   raw = baseDelta * rates.tier_score_per_point; break;
    case 'cashback': raw = baseDelta * rates.tier_score_per_cashback_cent; break;
  }
  return Math.round(raw);
}

/**
 * The share of an earn that counts toward the VIP tier system.
 * Same normalisation as computeActivityScore, but zero when the tenant has
 * tiers turned off.
 */
export function computeLoyaltyDelta(
  programType: string,
  baseDelta: number,
  settings: TenantTierSettings,
): number {
  if (!settings.tiers_enabled) return 0;
  return computeActivityScore(programType, baseDelta, settings);
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

// ── Ventana de revalidación ───────────────────────────────────────────

export interface TierWindowSettings {
  /** null = histórico: el nivel nunca caduca (comportamiento original). */
  tier_window_months:     number | null;
  /** Mientras no se pase esta fecha, nadie baja de nivel. */
  tier_grandfather_until: string | null;
}

/** Inicio de la ventana, o null cuando el nivel es histórico. */
export function tierWindowStart(
  settings: TierWindowSettings,
  now: Date = new Date(),
): Date | null {
  if (!settings.tier_window_months || settings.tier_window_months <= 0) return null;
  const start = new Date(now);
  start.setUTCMonth(start.getUTCMonth() - settings.tier_window_months);
  return start;
}

/**
 * El puntaje con el que se decide el nivel.
 *
 * `windowed` es lo acumulado dentro de la ventana; `lifetime` es el
 * `customers.loyalty_score` de siempre.
 *
 * Durante el periodo de gracia se toma el mayor de los dos, porque
 * `transactions.loyalty_delta` solo existe desde la Fase 1: sin esto, activar
 * una ventana de 12 meses tiraría a Bronce a todos los clientes existentes de
 * un día para otro. Pasada esa fecha manda la ventana.
 */
export function resolveTierScore(params: {
  windowed:   number | null;
  lifetime:   number;
  settings:   TierWindowSettings;
  now?:       Date;
}): number {
  const { windowed, lifetime, settings } = params;
  const now = params.now ?? new Date();

  // Sin ventana configurada, o sin dato de ventana disponible: histórico.
  if (windowed === null || !settings.tier_window_months) return lifetime;

  const grace = settings.tier_grandfather_until
    ? new Date(settings.tier_grandfather_until)
    : null;

  if (grace && now < grace) return Math.max(windowed, lifetime);
  return windowed;
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
