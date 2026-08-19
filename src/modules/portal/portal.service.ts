/**
 * Portal service — assembles the full customer-facing data view.
 *
 * This is deliberately a separate module from the business-facing
 * customer module. It only returns data the customer is allowed to see:
 *
 *   ✓ Their own name and access code
 *   ✓ Program enrollments (balance, stamps, visits)
 *   ✓ Rewards they can currently afford
 *   ✓ Pending vouchers (with redemption codes)
 *   ✓ Recent transaction history
 *   ✓ Tenant name and branding colours
 *
 *   ✗ Customer email, phone, internal notes  (PII — never exposed)
 *   ✗ Other customers' data                  (tenant-scoped query)
 *   ✗ Tenant email or billing plan           (business-internal)
 */

import { unstable_cache } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { tenantTag, tenantSubdomainTag } from '@/lib/cache/tenant-cache';
import { NotFoundError, TenantNotFoundError } from '@/lib/middleware/errors';
import { getPlanLimits, getEffectivePlan } from '@/lib/config/plans';
import { getTierScore } from '@/lib/utils/tier-score';
import { generateReferralCode } from '@/lib/utils/crypto';
import type { TierWindowSettings } from '@/lib/utils/tiers';
import type { UUID } from '@/lib/types';

/**
 * Neutral Fideliza branding — what a tenant without portalCustomBranding
 * (Free plan) gets instead of their own colours.
 */
export const DEFAULT_PORTAL_COLOR = '#6366F1';
export const DEFAULT_PORTAL_COLOR_SECONDARY = '#A5B4FC';

/**
 * Looks up a tenant by subdomain using the service-role client so it works
 * in unauthenticated contexts (e.g. the customer portal) where RLS blocks
 * the anon client from reading the tenants table.
 *
 * Cached per subdomain (tag `tenant-sub:{subdomain}`, TTL 5 min): every
 * customer of the same business hits this on portal entry, so without cache
 * it produces N identical queries. Invalidated via revalidateTenantCache().
 */
export async function getTenantBySubdomainPublic(
  subdomain: string
): Promise<{ id: UUID; name: string; is_active: boolean; logo_url: string | null; logo_padding: number; primary_color: string; clientPortal: boolean; customBranding: boolean; referralProgram: boolean }> {
  const sub = subdomain.toLowerCase();
  return unstable_cache(
    async () => {
      const db = createServiceRoleClient();

      const { data, error } = await db
        .from('tenants')
        .select('id, name, is_active, logo_url, plan, subscription_status, tenant_settings(logo_padding, primary_color)')
        .eq('subdomain', sub)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new TenantNotFoundError(sub);
      }

      type SettingsSlice = { logo_padding: number; primary_color: string | null };
      const raw = data as unknown as {
        id: UUID; name: string; is_active: boolean; logo_url: string | null;
        plan: string; subscription_status: string | null;
        tenant_settings: Array<SettingsSlice> | SettingsSlice | null;
      };
      const settings = Array.isArray(raw.tenant_settings) ? raw.tenant_settings[0] : raw.tenant_settings;
      const effectivePlan = getEffectivePlan(raw.plan, raw.subscription_status);
      const limits = getPlanLimits(effectivePlan);

      return {
        id:             raw.id,
        name:           raw.name,
        is_active:      raw.is_active,
        logo_url:       raw.logo_url,
        logo_padding:   settings?.logo_padding ?? 8,
        primary_color:  settings?.primary_color ?? DEFAULT_PORTAL_COLOR,
        clientPortal:    limits.clientPortal,
        customBranding:  limits.portalCustomBranding,
        referralProgram: limits.referralProgram,
      };
    },
    ['tenant-by-subdomain', sub],
    { revalidate: 300, tags: [tenantSubdomainTag(sub)] },
  )();
}

// ── Response types ────────────────────────────────────────────────────

export interface PortalTenant {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  logo_padding: number;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  program_label: string;
  /** true = Free plan: neutral Fideliza branding + "Powered by Fideliza" badge */
  powered_by: boolean;
}

export interface PortalCustomer {
  id: string;
  name: string;
  access_code: string;
  referral_code: string;
  member_since: string;
  /** Lifetime accumulated score — never decreases. */
  loyalty_score: number;
  /**
   * The score the VIP tier is decided from. Equals loyalty_score unless the
   * business configured a rolling window, in which case only activity inside
   * the window counts and the tier has to be kept up.
   */
  tier_score: number;
  /** null = tier never expires. */
  tier_window_months: number | null;
  /** Start of the current window, for the "revalidates" message. */
  tier_window_start: string | null;
  tier_label: string | null;
  tier_color: string | null;
}

export interface PortalReward {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  expiry_days: number | null;
  is_affordable: boolean;
  is_out_of_stock: boolean;
  /** Requires a VIP tier the customer has not reached. Shown, not hidden. */
  is_tier_locked: boolean;
  /** Label of the tier needed, when locked. */
  required_tier: string | null;
  // Progress towards this reward (varies by program type)
  progress_current: number;  // stamps collected / visits done / points earned
  progress_total: number;    // stamps needed / visits needed / cost in points
  progress_label: string;    // "stamps" | "visits" | program_label (e.g. "Beans")
}

export interface PortalChallenge {
  id: string;
  title: string;
  description: string | null;
  target: number;
  bonus_points: number;
  ends_at: string | null;
  progress: number;
  completed_at: string | null;
}

export interface PortalMission {
  id: string;
  title: string;
  description: string | null;
  target: number;
  bonus_points: number;
  ends_at: string | null;
  progress: number;
  completed_at: string | null;
  program_type: 'points' | 'stamp' | 'visit' | 'cashback';
}

export interface PortalEnrollment {
  enrollment_id: string;
  program_id: string;
  program_name: string;
  program_type: 'points' | 'stamp' | 'visit' | 'cashback';
  program_config: Record<string, unknown>;
  current_points: number;
  lifetime_points: number;
  stamp_count: number;
  visit_count: number;
  enrolled_at: string;
  last_activity_at: string;
  rewards: PortalReward[];
  challenges: PortalChallenge[];
}

export interface PortalTransaction {
  id: string;
  program_id: string;
  program_name: string;
  type: string;
  points_delta: number;
  balance_after: number;
  note: string | null;
  created_at: string;
}

export interface PortalVoucher {
  id: string;
  redemption_code: string;
  reward_name: string;
  expires_at: string | null;
  created_at: string;
}

export interface PortalRankingEntry {
  rank:         number;
  display_name: string;
  score:        number;
  is_self:      boolean;
}

/**
 * One ranking for the whole business, reset every calendar month.
 *
 * Global rather than per-program on purpose: the score is normalised by the
 * tenant's conversion rates, which is exactly what makes a stamps customer
 * comparable to a points customer in a single table. And monthly rather than
 * all-time because an all-time board is permanently owned by the oldest
 * customers — a newcomer sees themselves at #47 and stops trying.
 */
export interface PortalMonthlyRanking {
  /** e.g. "agosto 2026" */
  period_label:       string;
  /** null when the customer has no activity this month yet */
  customer_rank:      number | null;
  customer_score:     number;
  total_participants: number;
  /** Top 3 of the business. */
  podium:             PortalRankingEntry[];
  /** The customer plus up to 3 above and 3 below — the motivating view. */
  neighbors:          PortalRankingEntry[];
  /** Points needed to pass the next person up. Null when 1st or inactive. */
  points_to_next:     number | null;
}

export interface PortalTierConfig {
  label:        string;
  min_lifetime: number;
  multiplier:   number;
  color:        string;
}

export interface PortalPendingBonus {
  id:         string;
  bonus_type: 'birthday' | 'reactivation';
  units:      number;
  expires_at: string;
}

export interface PortalData {
  tenant: PortalTenant;
  customer: PortalCustomer;
  enrollments: PortalEnrollment[];
  recent_transactions: PortalTransaction[];
  pending_vouchers: PortalVoucher[];
  /** Null when the ranking cannot be computed (e.g. migration not applied). */
  monthly_ranking: PortalMonthlyRanking | null;
  /** Universal tier system — null when tiers_enabled = false */
  tenant_tiers: PortalTierConfig[] | null;
  /** Referral system — tenant-level config */
  referral_enabled: boolean;
  referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
  /** All active tenant missions (regardless of program enrollment) */
  missions: PortalMission[];
  /** Pending bonus credits waiting to be claimed on next transaction */
  pending_bonuses: PortalPendingBonus[];
}

// ── Helpers ───────────────────────────────────────────────────────────

function truncateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] ?? '?';
  return `${parts[0]} ${parts[1][0]}.`;
}

/** How many people to show above and below the customer in the ranking. */
const RANKING_NEIGHBOURS = 3;

/**
 * Builds the current month's business-wide ranking.
 *
 * Returns null rather than throwing when the aggregate is unavailable — the
 * ranking is a nice-to-have and must never take down the whole portal, which
 * is also what makes it safe to deploy before the SQL migration has run.
 */
async function buildMonthlyRanking(
  tenantId: UUID,
  customerId: UUID,
): Promise<PortalMonthlyRanking | null> {
  const now         = new Date();
  const monthStart  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodLabel = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  try {
    const db = createServiceRoleClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any).rpc('rpc_monthly_ranking', {
      p_tenant_id: tenantId,
      p_since:     monthStart.toISOString(),
    }) as { data: Array<{ customer_id: string; name: string; score: number }> | null; error: unknown };

    if (error || !data) return null;

    // Ties share a position: three people on 120 points are all 2nd, and the
    // next one down is 5th. Ordering alone would hand out arbitrary places.
    let lastScore = Number.POSITIVE_INFINITY;
    let lastRank  = 0;
    const rows = data.map((row, idx) => {
      const score = Number(row.score);
      if (score < lastScore) {
        lastRank  = idx + 1;
        lastScore = score;
      }
      return {
        rank:         lastRank,
        display_name: truncateName(row.name ?? '?'),
        score,
        is_self:      row.customer_id === customerId,
      };
    });

    const selfIdx = rows.findIndex((r) => r.is_self);
    const self    = selfIdx >= 0 ? rows[selfIdx] : null;

    // Whoever sits directly above — the gap worth chasing.
    const ahead = selfIdx > 0
      ? rows.slice(0, selfIdx).reverse().find((r) => r.score > (self?.score ?? 0))
      : undefined;

    return {
      period_label:       periodLabel,
      customer_rank:      self?.rank ?? null,
      customer_score:     self?.score ?? 0,
      total_participants: rows.length,
      podium:             rows.slice(0, 3),
      neighbors: selfIdx >= 0
        ? rows.slice(Math.max(0, selfIdx - RANKING_NEIGHBOURS), selfIdx + RANKING_NEIGHBOURS + 1)
        : [],
      points_to_next: ahead && self ? ahead.score - self.score : null,
    };
  } catch {
    return null;
  }
}

// ── Cached per-tenant reads ───────────────────────────────────────────
// These queries return the same result for every customer of a tenant, so
// they are cached under tag `tenant:{id}` (invalidated on every settings /
// branding / plan mutation via revalidateTenantCache) with a TTL fallback.

interface PortalTenantConfig {
  tenant: PortalTenant;
  tiers_enabled: boolean;
  tiers: PortalTierConfig[] | null;
  tier_window: TierWindowSettings;
  referral_enabled: boolean;
  referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
}

async function getPortalTenantConfigCached(tenantId: UUID): Promise<PortalTenantConfig> {
  return unstable_cache(
    async () => {
      const db = createServiceRoleClient();

      const { data } = await db
        .from('tenants')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('name, subdomain, logo_url, plan, subscription_status, tenant_settings(primary_color, secondary_color, welcome_message, program_label, logo_padding, tiers_enabled, tiers, tier_window_months, tier_grandfather_until, referral_enabled, referral_program_configs)' as any)
        .eq('id', tenantId)
        .single();

      if (!data) throw new Error('Datos del negocio no disponibles');

      const raw = data as unknown as {
        name: string;
        subdomain: string;
        logo_url: string | null;
        plan: string;
        subscription_status: string | null;
        tenant_settings: Array<{
          primary_color: string;
          secondary_color: string;
          welcome_message: string | null;
          program_label: string;
          logo_padding: number;
          tiers_enabled: boolean;
          tiers: PortalTierConfig[] | null;
          tier_window_months: number | null;
          tier_grandfather_until: string | null;
          referral_enabled: boolean;
          referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
        }> | null;
      };

      const settings = Array.isArray(raw.tenant_settings)
        ? raw.tenant_settings[0]
        : raw.tenant_settings;

      const limits = getPlanLimits(
        getEffectivePlan(raw.plan, raw.subscription_status)
      );

      // Free plan → neutral Fideliza branding (no tenant logo/colors) + "Powered by" badge
      const customBranding = limits.portalCustomBranding;

      const tenant: PortalTenant = {
        id:              tenantId,
        name:            raw.name,
        subdomain:       raw.subdomain,
        logo_url:        customBranding ? (raw.logo_url ?? null) : null,
        logo_padding:    settings?.logo_padding ?? 8,
        primary_color:   customBranding ? (settings?.primary_color   ?? DEFAULT_PORTAL_COLOR)           : DEFAULT_PORTAL_COLOR,
        secondary_color: customBranding ? (settings?.secondary_color ?? DEFAULT_PORTAL_COLOR_SECONDARY) : DEFAULT_PORTAL_COLOR_SECONDARY,
        welcome_message: settings?.welcome_message ?? null,
        program_label:   settings?.program_label   ?? 'Points',
        powered_by:      !customBranding,
      };

      return {
        tenant,
        tiers_enabled:            settings?.tiers_enabled ?? false,
        tiers:                    settings?.tiers ?? null,
        tier_window: {
          tier_window_months:     settings?.tier_window_months ?? null,
          tier_grandfather_until: settings?.tier_grandfather_until ?? null,
        },
        // The stored flag survives a downgrade (Pro → Starter/Free leaves
        // referral_enabled = true in tenant_settings), so the plan is the
        // authority here — never the flag alone.
        referral_enabled:         limits.referralProgram && (settings?.referral_enabled ?? false),
        referral_program_configs: settings?.referral_program_configs ?? {},
      };
    },
    ['portal-tenant-config', tenantId],
    { revalidate: 300, tags: [tenantTag(tenantId)] },
  )();
}

interface PortalRawReward {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  expiry_days: number | null;
  program_id: string;
  stock: number | null;
  min_tier_score: number | null;
}

/**
 * All active rewards of a tenant. Shorter TTL (60s) because `stock` changes
 * on redemptions; also tagged 'rewards' so dashboard reward mutations
 * (which already revalidate that tag) refresh it immediately.
 */
async function getActiveRewardsCached(tenantId: UUID): Promise<PortalRawReward[]> {
  return unstable_cache(
    async () => {
      const db = createServiceRoleClient();

      const { data } = await db
        .from('rewards')
        .select('id, name, description, cost_points, expiry_days, program_id, stock, min_tier_score')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      return (data ?? []) as unknown as PortalRawReward[];
    },
    ['portal-active-rewards', tenantId],
    { revalidate: 60, tags: [tenantTag(tenantId), 'rewards'] },
  )();
}

// ── Service function ──────────────────────────────────────────────────

export async function getPortalData(
  tenantId: UUID,
  rawCode: string
): Promise<PortalData> {
  const db = createServiceRoleClient();
  const code = rawCode.toUpperCase().trim();

  // ── 1. Customer lookup ────────────────────────────────────────────
  // Deliberately select only safe columns — no email, phone, or notes.
  const { data: customerRaw, error: custErr } = await db
    .from('customers')
    .select('id, name, access_code, created_at')
    .eq('tenant_id', tenantId)
    .eq('access_code', code)
    .eq('is_active', true)
    .single();

  // Fetch loyalty score + referral_code separately to avoid breaking the typed select above
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loyaltyRaw } = customerRaw ? await (db.from('customers') as any)
    .select('loyalty_score, tier_label, tier_color, referral_code')
    .eq('id', customerRaw.id)
    .eq('tenant_id', tenantId)
    .single() as { data: { loyalty_score: number; tier_label: string | null; tier_color: string | null; referral_code: string | null } | null }
    : { data: null };

  // Auto-generate referral_code for customers that don't have one yet
  let referralCode = loyaltyRaw?.referral_code ?? null;
  if (customerRaw && !referralCode) {
    referralCode = generateReferralCode();
    await db.from('customers').update({ referral_code: referralCode }).eq('id', customerRaw.id).eq('tenant_id', tenantId);
  }

  const customer = customerRaw ? {
    ...customerRaw,
    loyalty_score: loyaltyRaw?.loyalty_score ?? 0,
    tier_label:    loyaltyRaw?.tier_label    ?? null,
    tier_color:    loyaltyRaw?.tier_color    ?? null,
    referral_code: referralCode ?? '',
  } : null;

  if (custErr || !customer) {
    throw new NotFoundError('Cliente no encontrado. Verifica tu código de acceso e intenta de nuevo.');
  }

  // ── 2. Parallel data fetch ────────────────────────────────────────
  // Tenant branding/config is cached per tenant (see getPortalTenantConfigCached);
  // the rest is customer-scoped and always fetched live.
  const [tenantCfg, enrollRes, txRes, voucherRes] = await Promise.all([
    getPortalTenantConfigCached(tenantId),

    // Enrollments with program details
    db
      .from('customer_program_enrollments')
      .select(`
        id, current_points, lifetime_points, stamp_count, visit_count,
        enrolled_at, last_activity_at,
        reward_programs!inner(id, name, type, config, status)
      `)
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .order('last_activity_at', { ascending: false }),

    // Last 15 transactions (most recent first)
    db
      .from('transactions')
      .select('id, type, points_delta, balance_after, note, created_at, program_id, reward_programs(name)')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(15),

    // Pending vouchers with reward name
    db
      .from('customer_reward_redemptions')
      .select('id, redemption_code, expires_at, created_at, gift_label, rewards(name)')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  // ── 3. Tenant branding (from per-tenant cache) ────────────────────
  const tenant = tenantCfg.tenant;

  // The tier is decided from this, not from loyalty_score: with a rolling
  // window configured, activity that fell out of the window no longer counts.
  // Computed here rather than at the end because the reward mapping below needs
  // it to decide which rewards are tier-locked.
  const lifetimeLoyalty = customer.loyalty_score ?? 0;
  const { score: tierScore, windowStart } = tenantCfg.tiers_enabled
    ? await getTierScore({
        tenantId,
        customerId:    customer.id,
        lifetimeScore: lifetimeLoyalty,
        settings:      tenantCfg.tier_window,
      })
    : { score: lifetimeLoyalty, windowStart: null };

  // ── 4. Parse enrollments + fetch affordable rewards ───────────────
  type RawEnrollment = {
    id: string;
    current_points: number;
    lifetime_points: number;
    stamp_count: number;
    visit_count: number;
    enrolled_at: string;
    last_activity_at: string;
    reward_programs: {
      id: string;
      name: string;
      type: 'points' | 'stamp' | 'visit' | 'cashback';
      config: Record<string, unknown>;
      status: string;
    } | null;
  };

  const rawEnrollments = ((enrollRes.data ?? []) as unknown as RawEnrollment[])
    .filter((e) => e.reward_programs?.status === 'active');

  const programIds = rawEnrollments
    .map((e) => e.reward_programs?.id)
    .filter((id): id is string => Boolean(id));

  // Rewards catalog comes from the per-tenant cache; filter to the customer's
  // enrolled programs in memory (the catalog is identical for all customers).
  const rewardsMap = new Map<string, PortalRawReward[]>();
  if (programIds.length > 0) {
    const programIdSet = new Set(programIds);
    for (const r of await getActiveRewardsCached(tenantId)) {
      if (!programIdSet.has(r.program_id)) continue;
      if (!rewardsMap.has(r.program_id)) rewardsMap.set(r.program_id, []);
      rewardsMap.get(r.program_id)!.push(r);
    }
  }

  const portalMissions: PortalMission[] = [];

  const enrollments: PortalEnrollment[] = rawEnrollments.map((e) => {
    const program  = e.reward_programs!;
    const allProgramRewards = rewardsMap.get(program.id) ?? [];

    return {
      enrollment_id:     e.id,
      program_id:        program.id,
      program_name:      program.name,
      program_type:      program.type,
      program_config:    program.config ?? {},
      current_points:    e.current_points,
      lifetime_points:   e.lifetime_points,
      stamp_count:       e.stamp_count,
      visit_count:       e.visit_count,
      enrolled_at:       e.enrolled_at,
      last_activity_at:  e.last_activity_at,
      challenges: [],   // populated below
      rewards: allProgramRewards.map((r) => {
        const inStock = r.stock === null || r.stock > 0;

        // Determine affordability and progress based on program type
        let is_affordable: boolean;
        let progress_current: number;
        let progress_total: number;
        let progress_label: string;

        if (program.type === 'stamp') {
          const needed = typeof program.config.stamps_needed === 'number' ? program.config.stamps_needed : 0;
          is_affordable   = e.stamp_count >= needed && inStock;
          progress_current = e.stamp_count;
          progress_total   = needed;
          progress_label   = 'stamps';
        } else if (program.type === 'visit') {
          const needed = typeof program.config.visits_needed === 'number' ? program.config.visits_needed : 0;
          is_affordable   = e.visit_count >= needed && inStock;
          progress_current = e.visit_count;
          progress_total   = needed;
          progress_label   = 'visits';
        } else {
          // points & cashback: use current_points vs cost_points
          is_affordable   = e.current_points >= r.cost_points && inStock;
          progress_current = e.current_points;
          progress_total   = r.cost_points;
          progress_label   = tenant.program_label;
        }

        // Tier-locked rewards stay visible on purpose: hiding them removes the
        // only reason a customer has to want the next level.
        const isTierLocked = r.min_tier_score != null && tierScore < r.min_tier_score;
        const requiredTier = isTierLocked
          ? (tenantCfg.tiers ?? []).find((t) => t.min_lifetime === r.min_tier_score)?.label ?? null
          : null;

        return {
          id:              r.id,
          name:            r.name,
          description:     r.description,
          cost_points:     r.cost_points,
          expiry_days:     r.expiry_days,
          is_affordable:   is_affordable && !isTierLocked,
          is_out_of_stock: !inStock,
          is_tier_locked:  isTierLocked,
          required_tier:   requiredTier,
          progress_current,
          progress_total,
          progress_label,
        };
      }),
    };
  });

  // ── 5. Fetch ALL active tenant missions + customer progress ─────────
  {
    const now = new Date().toISOString();

    const [challengesRes, progressRes] = await Promise.all([
      db
        .from('challenges')
        .select('id, program_id, title, description, target, bonus_points, ends_at, reward_programs!inner(type)')
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      db
        .from('customer_challenge_progress')
        .select('challenge_id, progress, completed_at')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customer.id),
    ]);

    const progressMap = new Map<string, { challenge_id: string; progress: number; completed_at: string | null }>(
      (progressRes.data ?? []).map((p) => [p.challenge_id, p])
    );

    const allChallenges = (challengesRes.data ?? []).filter((c) =>
      !c.ends_at || c.ends_at >= now
    );

    // Populate per-enrollment challenges (for enrolled programs only)
    for (const enrollment of enrollments) {
      enrollment.challenges = allChallenges
        .filter((c: { program_id: string }) => c.program_id === enrollment.program_id)
        .map((c: { id: string; title: string; description: string | null; target: number; bonus_points: number; ends_at: string | null }) => {
          const prog = progressMap.get(c.id);
          return {
            id:           c.id,
            title:        c.title,
            description:  c.description,
            target:       c.target,
            bonus_points: c.bonus_points,
            ends_at:      c.ends_at,
            progress:     prog?.progress ?? 0,
            completed_at: prog?.completed_at ?? null,
          };
        });
    }

    // Top-level missions: ALL active tenant missions (regardless of enrollment)
    portalMissions.push(
      ...allChallenges.map((c: { id: string; title: string; description: string | null; target: number; bonus_points: number; ends_at: string | null; reward_programs: { type: string } }) => {
        const prog = progressMap.get(c.id);
        return {
          id:           c.id,
          title:        c.title,
          description:  c.description,
          target:       c.target,
          bonus_points: c.bonus_points,
          ends_at:      c.ends_at,
          progress:     prog?.progress ?? 0,
          completed_at: prog?.completed_at ?? null,
          program_type: (c.reward_programs?.type ?? 'points') as PortalMission['program_type'],
        };
      })
    );
  }

  // ── 7. Parse transactions ─────────────────────────────────────────
  type RawTx = {
    id: string;
    type: string;
    points_delta: number;
    balance_after: number;
    note: string | null;
    created_at: string;
    program_id: string;
    reward_programs: { name: string } | null;
  };

  const recent_transactions: PortalTransaction[] = (
    (txRes.data ?? []) as unknown as RawTx[]
  ).map((t) => ({
    id:           t.id,
    program_id:   t.program_id,
    program_name: t.reward_programs?.name ?? '',
    type:         t.type,
    points_delta: t.points_delta,
    balance_after: t.balance_after,
    note:         t.note,
    created_at:   t.created_at,
  }));

  // ── 6. Leaderboard per enrolled program ──────────────────────────
  const monthlyRanking = await buildMonthlyRanking(tenantId, customer.id);

  // ── 7. Parse pending vouchers ─────────────────────────────────────
  type RawVoucher = {
    id: string;
    redemption_code: string;
    expires_at: string | null;
    created_at: string;
    gift_label: string | null;
    rewards: { name: string } | null;
  };

  const pending_vouchers: PortalVoucher[] = (
    (voucherRes.data ?? []) as unknown as RawVoucher[]
  ).map((v) => ({
    id:               v.id,
    redemption_code:  v.redemption_code,
    // Tier gift vouchers carry their own label instead of a catalogue reward.
    reward_name:      v.rewards?.name ?? v.gift_label ?? 'Recompensa',
    expires_at:       v.expires_at,
    created_at:       v.created_at,
  }));

  // ── 8. Fetch pending bonus credits for this customer ─────────────────
  const now8 = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny8 = db as any;
  const { data: rawBonuses } = await dbAny8.from('customer_bonus_credits')
    .select('id, bonus_type, units, expires_at')
    .eq('customer_id', customer.id)
    .eq('tenant_id', tenantId)
    .is('claimed_at', null)
    .gt('expires_at', now8)
    .order('created_at', { ascending: true }) as {
      data: Array<{ id: string; bonus_type: string; units: number; expires_at: string }> | null
    };

  const pending_bonuses: PortalPendingBonus[] = (rawBonuses ?? []).map((b) => ({
    id:         b.id,
    bonus_type: b.bonus_type as 'birthday' | 'reactivation',
    units:      b.units,
    expires_at: b.expires_at,
  }));

  const rawCustomer = customer as unknown as {
    id: string; name: string; access_code: string; referral_code: string; created_at: string;
    loyalty_score: number; tier_label: string | null; tier_color: string | null;
  };

  const tenantTiers: PortalTierConfig[] | null = tenantCfg.tiers_enabled
    ? tenantCfg.tiers
    : null;

  return {
    tenant,
    customer: {
      id:            rawCustomer.id,
      name:          rawCustomer.name,
      access_code:   rawCustomer.access_code,
      referral_code: rawCustomer.referral_code ?? '',
      member_since:  rawCustomer.created_at,
      loyalty_score: lifetimeLoyalty,
      tier_score:    tierScore,
      tier_window_months: tenantCfg.tier_window.tier_window_months,
      tier_window_start:  windowStart ? windowStart.toISOString() : null,
      tier_label:    rawCustomer.tier_label ?? null,
      tier_color:    rawCustomer.tier_color ?? null,
    },
    enrollments,
    recent_transactions,
    pending_vouchers,
    monthly_ranking: monthlyRanking,
    tenant_tiers: tenantTiers,
    referral_enabled:          tenantCfg.referral_enabled,
    referral_program_configs:  tenantCfg.referral_program_configs,
    missions: portalMissions,
    pending_bonuses,
  };
}
