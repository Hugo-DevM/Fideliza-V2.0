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
export async function getTenantBySubdomainPublic(subdomain: string): Promise<{ id: UUID; name: string; is_active: boolean }> {
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('tenants')
    .select('id, name, is_active')
    .eq('subdomain', subdomain.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new TenantNotFoundError(subdomain);
  }

  return data as { id: UUID; name: string; is_active: boolean };
}

// ── Response types ────────────────────────────────────────────────────

export interface PortalTenant {
  name: string;
  subdomain: string;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  program_label: string;
}

export interface PortalCustomer {
  id: string;
  name: string;
  access_code: string;
  member_since: string;
}

export interface PortalReward {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  expiry_days: number | null;
  is_affordable: boolean;
  is_out_of_stock: boolean;
}

export interface PortalEnrollment {
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

export interface PortalData {
  tenant: PortalTenant;
  customer: PortalCustomer;
  enrollments: PortalEnrollment[];
  recent_transactions: PortalTransaction[];
  pending_vouchers: PortalVoucher[];
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
  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id, name, access_code, created_at')
    .eq('tenant_id', tenantId)
    .eq('access_code', code)
    .eq('is_active', true)
    .single();

  if (custErr || !customer) {
    throw new NotFoundError('Customer not found. Check your access code and try again.');
  }

  // ── 2. Parallel data fetch ────────────────────────────────────────
  const [tenantRes, enrollRes, txRes, voucherRes] = await Promise.all([
    // Tenant name + branding settings (no email, no plan)
    db
      .from('tenants')
      .select('name, subdomain, tenant_settings(primary_color, secondary_color, welcome_message, program_label)')
      .eq('id', tenantId)
      .single(),

    // Enrollments with program details
    db
      .from('customer_program_enrollments')
      .select(`
        current_points, lifetime_points, stamp_count, visit_count,
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
  if (!tenantRes.data) throw new Error('Tenant data unavailable');

  const raw = tenantRes.data as unknown as {
    name: string;
    subdomain: string;
    tenant_settings: Array<{
      primary_color: string;
      secondary_color: string;
      welcome_message: string | null;
      program_label: string;
    }> | null;
  };

  const settings = Array.isArray(raw.tenant_settings)
    ? raw.tenant_settings[0]
    : raw.tenant_settings;

  const tenant: PortalTenant = {
    name: raw.name,
    subdomain: raw.subdomain,
    primary_color:   settings?.primary_color   ?? '#6366F1',
    secondary_color: settings?.secondary_color ?? '#A5B4FC',
    welcome_message: settings?.welcome_message ?? null,
    program_label:   settings?.program_label   ?? 'Points',
  };

  // ── 4. Parse enrollments + fetch affordable rewards ───────────────
  type RawEnrollment = {
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
    const program = e.reward_programs!;
    const allProgramRewards = rewardsMap.get(program.id) ?? [];

    return {
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
      rewards: allProgramRewards.map((r) => ({
        id:             r.id,
        name:           r.name,
        description:    r.description,
        cost_points:    r.cost_points,
        expiry_days:    r.expiry_days,
        is_affordable:  e.current_points >= r.cost_points && (r.stock === null || r.stock > 0),
        is_out_of_stock: r.stock !== null && r.stock <= 0,
      })),
    };
  });

  // ── 5. Parse transactions ─────────────────────────────────────────
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

  // ── 6. Parse pending vouchers ─────────────────────────────────────
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

  return {
    tenant,
    customer: {
      id:           customer.id,
      name:         customer.name,
      access_code:  customer.access_code,
      member_since: customer.created_at,
    },
    enrollments,
    recent_transactions,
    pending_vouchers,
  };
}
