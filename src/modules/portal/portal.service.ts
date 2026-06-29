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

import { createServiceRoleClient } from '@/lib/supabase/server';
import { NotFoundError, TenantNotFoundError } from '@/lib/middleware/errors';
import type { UUID } from '@/lib/types';

/**
 * Looks up a tenant by subdomain using the service-role client so it works
 * in unauthenticated contexts (e.g. the customer portal) where RLS blocks
 * the anon client from reading the tenants table.
 */
export async function getTenantBySubdomainPublic(
  subdomain: string
): Promise<{ id: UUID; name: string; is_active: boolean; logo_url: string | null; logo_padding: number }> {
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('tenants')
    .select('id, name, is_active, logo_url, tenant_settings(logo_padding)')
    .eq('subdomain', subdomain.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new TenantNotFoundError(subdomain);
  }

  const raw = data as unknown as {
    id: UUID; name: string; is_active: boolean; logo_url: string | null;
    tenant_settings: Array<{ logo_padding: number }> | { logo_padding: number } | null;
  };
  const settings = Array.isArray(raw.tenant_settings) ? raw.tenant_settings[0] : raw.tenant_settings;

  return {
    id:          raw.id,
    name:        raw.name,
    is_active:   raw.is_active,
    logo_url:    raw.logo_url,
    logo_padding: settings?.logo_padding ?? 8,
  };
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
}

export interface PortalCustomer {
  id: string;
  name: string;
  access_code: string;
  referral_code: string;
  member_since: string;
  loyalty_score: number;
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

export interface PortalLeaderboardEntry {
  rank: number;
  display_name: string;
  lifetime_points: number;
  is_self: boolean;
}

export interface PortalProgramRanking {
  program_id: string;
  program_name: string;
  program_type: 'points' | 'stamp' | 'visit' | 'cashback';
  customer_rank: number;
  customer_lifetime_points: number;
  total_enrolled: number;
  top10: PortalLeaderboardEntry[];
}

export interface PortalTierConfig {
  label:        string;
  min_lifetime: number;
  multiplier:   number;
  color:        string;
}

export interface PortalData {
  tenant: PortalTenant;
  customer: PortalCustomer;
  enrollments: PortalEnrollment[];
  recent_transactions: PortalTransaction[];
  pending_vouchers: PortalVoucher[];
  rankings: PortalProgramRanking[];
  /** Universal tier system — null when tiers_enabled = false */
  tenant_tiers: PortalTierConfig[] | null;
  /** Referral system — tenant-level config */
  referral_enabled: boolean;
  referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
}

// ── Helpers ───────────────────────────────────────────────────────────

function truncateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] ?? '?';
  return `${parts[0]} ${parts[1][0]}.`;
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

  const customer = customerRaw ? {
    ...customerRaw,
    loyalty_score: loyaltyRaw?.loyalty_score ?? 0,
    tier_label:    loyaltyRaw?.tier_label    ?? null,
    tier_color:    loyaltyRaw?.tier_color    ?? null,
    referral_code: loyaltyRaw?.referral_code ?? '',
  } : null;

  if (custErr || !customer) {
    throw new NotFoundError('Cliente no encontrado. Verifica tu código de acceso e intenta de nuevo.');
  }

  // ── 2. Parallel data fetch ────────────────────────────────────────
  const [tenantRes, enrollRes, txRes, voucherRes] = await Promise.all([
    // Tenant name + branding settings + tier config (no email, no plan)
    db
      .from('tenants')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('name, subdomain, logo_url, tenant_settings(primary_color, secondary_color, welcome_message, program_label, logo_padding, tiers_enabled, tiers, referral_enabled, referral_program_configs)' as any)
      .eq('id', tenantId)
      .single(),

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
      .select('id, redemption_code, expires_at, created_at, rewards(name)')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  // ── 3. Parse tenant branding ──────────────────────────────────────
  if (!tenantRes.data) throw new Error('Datos del negocio no disponibles');

  const raw = tenantRes.data as unknown as {
    name: string;
    subdomain: string;
    logo_url: string | null;
    tenant_settings: Array<{
      primary_color: string;
      secondary_color: string;
      welcome_message: string | null;
      program_label: string;
      logo_padding: number;
      tiers_enabled: boolean;
      tiers: PortalTierConfig[] | null;
      referral_enabled: boolean;
      referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
    }> | null;
  };

  const settings = Array.isArray(raw.tenant_settings)
    ? raw.tenant_settings[0]
    : raw.tenant_settings;

  const tenant: PortalTenant = {
    id:              tenantId,
    name:            raw.name,
    subdomain:       raw.subdomain,
    logo_url:        raw.logo_url ?? null,
    logo_padding:    settings?.logo_padding    ?? 8,
    primary_color:   settings?.primary_color   ?? '#6366F1',
    secondary_color: settings?.secondary_color ?? '#A5B4FC',
    welcome_message: settings?.welcome_message ?? null,
    program_label:   settings?.program_label   ?? 'Points',
  };

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

  // Fetch all active rewards for the programs in one query
  const rewardsMap = new Map<string, Array<{
    id: string; name: string; description: string | null;
    cost_points: number; expiry_days: number | null;
    program_id: string; stock: number | null;
  }>>();
  if (programIds.length > 0) {
    const { data: allRewards } = await db
      .from('rewards')
      .select('id, name, description, cost_points, expiry_days, program_id, stock')
      .eq('tenant_id', tenantId)
      .in('program_id', programIds)
      .eq('is_active', true);

    type RawReward = {
      id: string;
      name: string;
      description: string | null;
      cost_points: number;
      expiry_days: number | null;
      program_id: string;
      stock: number | null;
    };

    for (const r of ((allRewards ?? []) as unknown as RawReward[])) {
      if (!rewardsMap.has(r.program_id)) rewardsMap.set(r.program_id, []);
      rewardsMap.get(r.program_id)!.push(r);
    }
  }

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

        return {
          id:              r.id,
          name:            r.name,
          description:     r.description,
          cost_points:     r.cost_points,
          expiry_days:     r.expiry_days,
          is_affordable,
          is_out_of_stock: !inStock,
          progress_current,
          progress_total,
          progress_label,
        };
      }),
    };
  });

  // ── 5. Fetch active challenges + customer progress ───────────────
  if (programIds.length > 0) {
    const now = new Date().toISOString();

    const [challengesRes, progressRes] = await Promise.all([
      (db as any)
        .from('challenges')
        .select('id, program_id, title, description, target, bonus_points, ends_at')
        .eq('tenant_id', tenantId)
        .in('program_id', programIds)
        .eq('is_active', true) as Promise<{ data: Array<{
          id: string; program_id: string; title: string; description: string | null;
          target: number; bonus_points: number; ends_at: string | null;
        }> | null }>,
      (db as any)
        .from('customer_challenge_progress')
        .select('challenge_id, progress, completed_at')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customer.id) as Promise<{ data: Array<{
          challenge_id: string; progress: number; completed_at: string | null;
        }> | null }>,
    ]);

    const progressMap = new Map<string, { challenge_id: string; progress: number; completed_at: string | null }>(
      ((progressRes as any).data ?? []).map((p: { challenge_id: string; progress: number; completed_at: string | null }) =>
        [p.challenge_id, p]
      )
    );

    const allChallenges = ((challengesRes as any).data ?? []).filter((c: { ends_at: string | null }) =>
      !c.ends_at || c.ends_at >= now
    );

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
  const rankings: PortalProgramRanking[] = await Promise.all(
    enrollments.map(async (e) => {
      const myLifetime = e.lifetime_points;

      const [top10Res, aboveRes, totalRes] = await Promise.all([
        (db as any)
          .from('customer_program_enrollments')
          .select('customer_id, lifetime_points, customers(name)')
          .eq('tenant_id', tenantId)
          .eq('program_id', e.program_id)
          .order('lifetime_points', { ascending: false })
          .limit(10),
        db
          .from('customer_program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('program_id', e.program_id)
          .gt('lifetime_points', myLifetime),
        db
          .from('customer_program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('program_id', e.program_id),
      ]);

      type RawLeaderRow = {
        customer_id: string;
        lifetime_points: number;
        customers: { name: string } | null;
      };

      const top10: PortalLeaderboardEntry[] = (
        (top10Res.data ?? []) as unknown as RawLeaderRow[]
      ).map((row, idx) => ({
        rank:            idx + 1,
        display_name:    truncateName(row.customers?.name ?? '?'),
        lifetime_points: row.lifetime_points,
        is_self:         row.customer_id === customer.id,
      }));

      return {
        program_id:               e.program_id,
        program_name:             e.program_name,
        program_type:             e.program_type,
        customer_rank:            (aboveRes.count ?? 0) + 1,
        customer_lifetime_points: myLifetime,
        total_enrolled:           totalRes.count ?? 0,
        top10,
      };
    })
  );

  // ── 7. Parse pending vouchers ─────────────────────────────────────
  type RawVoucher = {
    id: string;
    redemption_code: string;
    expires_at: string | null;
    created_at: string;
    rewards: { name: string } | null;
  };

  const pending_vouchers: PortalVoucher[] = (
    (voucherRes.data ?? []) as unknown as RawVoucher[]
  ).map((v) => ({
    id:               v.id,
    redemption_code:  v.redemption_code,
    reward_name:      v.rewards?.name ?? 'Reward',
    expires_at:       v.expires_at,
    created_at:       v.created_at,
  }));

  const rawCustomer = customer as unknown as {
    id: string; name: string; access_code: string; referral_code: string; created_at: string;
    loyalty_score: number; tier_label: string | null; tier_color: string | null;
  };

  const tenantTiersEnabled = settings?.tiers_enabled ?? false;
  const tenantTiers: PortalTierConfig[] | null = tenantTiersEnabled
    ? (settings?.tiers ?? null)
    : null;

  return {
    tenant,
    customer: {
      id:            rawCustomer.id,
      name:          rawCustomer.name,
      access_code:   rawCustomer.access_code,
      referral_code: rawCustomer.referral_code ?? '',
      member_since:  rawCustomer.created_at,
      loyalty_score: rawCustomer.loyalty_score ?? 0,
      tier_label:    rawCustomer.tier_label ?? null,
      tier_color:    rawCustomer.tier_color ?? null,
    },
    enrollments,
    recent_transactions,
    pending_vouchers,
    rankings,
    tenant_tiers: tenantTiers,
    referral_enabled:          settings?.referral_enabled ?? false,
    referral_program_configs:  settings?.referral_program_configs ?? {},
  };
}
