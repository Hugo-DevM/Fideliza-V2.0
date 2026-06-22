// ─────────────────────────────────────────────
// Core domain types — mirrors the PostgreSQL schema exactly.
// Keep in sync with supabase/migrations/001_initial_schema.sql
// ─────────────────────────────────────────────

export type UUID = string;

// ── Enums ─────────────────────────────────────
export type TenantPlan    = 'free' | 'starter' | 'pro' | 'enterprise';
export type ProgramType   = 'points' | 'stamp' | 'visit' | 'cashback';
export type ProgramStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'adjustment' | 'refund';
export type RedemptionStatus = 'pending' | 'used' | 'expired' | 'cancelled';

// ── Tenant ────────────────────────────────────
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface Tenant {
  id: UUID;
  name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  plan: TenantPlan;
  is_active: boolean;
  // Stripe billing fields (null for free tenants with no subscription)
  stripe_customer_id:     string | null;
  stripe_subscription_id: string | null;
  subscription_status:    SubscriptionStatus | null;
  subscription_end_date:  string | null;
  // WhatsApp — Pro tenants may have their own sender number (nullable, defaults to NULL)
  whatsapp_from?: string | null;
  // Soft delete — set by deleteAccountAction, never cleared
  deleted_at:        string | null;
  deletion_reason:   string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  id: UUID;
  tenant_id: UUID;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  program_label: string;
  stamp_icon: string;
  terms_url: string | null;
  phone_prefix: string | null;
  timezone: string;
  logo_padding: number;
  currency: string;
  notify_new_customer: boolean;
  notify_redemption: boolean;
  notify_weekly_digest: boolean;
  wa_notify_welcome: boolean;
  wa_notify_voucher_expiry: boolean;
  wa_notify_balance_reminder: boolean;
  wa_notify_reactivation: boolean;
  wa_notify_streak_at_risk: boolean;
  wa_notify_promotion: boolean;
  wa_notify_birthday: boolean;
  wa_notify_milestone_80: boolean;
  created_at: string;
  updated_at: string;
}

// ── Reward Program ────────────────────────────
// Program config is flexible JSON — typed per program type
export interface PointsProgramConfig {
  points_per_dollar: number;
  min_redeem: number;
}

export interface StampProgramConfig {
  stamps_needed: number;
}

export interface VisitProgramConfig {
  visits_needed: number;
}

export interface CashbackProgramConfig {
  cashback_percent: number;
  min_purchase_cents: number;
}

export type ProgramConfig =
  | PointsProgramConfig
  | StampProgramConfig
  | VisitProgramConfig
  | CashbackProgramConfig;

export interface RewardProgram {
  id: UUID;
  tenant_id: UUID;
  name: string;
  description: string | null;
  type: ProgramType;
  status: ProgramStatus;
  config: ProgramConfig;
  max_enrollments: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Reward ────────────────────────────────────
export interface Reward {
  id: UUID;
  tenant_id: UUID;
  program_id: UUID;
  name: string;
  description: string | null;
  image_url: string | null;
  cost_points: number;
  stock: number | null;           // null = unlimited
  redeemed_count: number;
  is_active: boolean;
  expiry_days: number | null;     // null = no expiry on issued voucher
  created_at: string;
  updated_at: string;
}

// ── Customer ──────────────────────────────────
export interface Customer {
  id: UUID;
  tenant_id: UUID;
  name: string;
  phone: string | null;
  access_code: string;
  is_active: boolean;
  notes: string | null;
  whatsapp_opt_in: boolean;
  whatsapp_opted_in_at: string | null;
  birth_month: number | null;
  birth_day: number | null;
  created_at: string;
  updated_at: string;
}

// ── Customer Program Enrollment ───────────────
export interface CustomerProgramEnrollment {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID;
  program_id: UUID;
  current_points: number;    // redeemable balance
  lifetime_points: number;   // all-time earned (never decremented)
  stamp_count: number;       // for stamp-type programs
  visit_count: number;       // for visit-type programs
  tier_label: string | null; // cached from program config tiers (updated on each earn)
  tier_color: string | null; // 'bronze' | 'silver' | 'gold' | null
  enrolled_at: string;
  last_activity_at: string;
}

// ── Transaction ───────────────────────────────
export interface Transaction {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID;
  program_id: UUID;
  enrollment_id: UUID;
  reward_id: UUID | null;
  type: TransactionType;
  points_delta: number;    // positive = earned/added, negative = spent/expired
  balance_after: number;   // snapshot of balance after this transaction
  note: string | null;
  staff_id: UUID | null;
  created_at: string;
  // No updated_at — transactions are immutable
}

// ── Customer Reward Redemption ────────────────
export interface CustomerRewardRedemption {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID;
  reward_id: UUID;
  transaction_id: UUID;
  status: RedemptionStatus;
  redemption_code: string;
  expires_at: string | null;
  used_at: string | null;
  cancelled_at: string | null;
  whatsapp_expiry_notified_at: string | null;
  created_at: string;
}

// ── API response envelope ─────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  error: string | null;
}

// ── Middleware context injected per request ───
export interface TenantContext {
  tenantId: UUID;
  subdomain: string;
}
