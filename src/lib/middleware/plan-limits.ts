/**
 * Plan enforcement helpers.
 * Call these at the start of service functions to block operations that exceed plan limits.
 * All errors are ForbiddenError (HTTP 403) so callers get a clear upgrade prompt.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { ForbiddenError } from '@/lib/middleware/errors';
import { getPlanLimits, getEffectivePlan } from '@/lib/config/plans';
import type { UUID } from '@/lib/types';
import type { ProgramTypeAllowed } from '@/lib/config/plans';

/**
 * Returns the EFFECTIVE plan for a tenant.
 * Accounts for subscription status — a past_due or canceled subscription
 * results in 'free' regardless of the stored plan field.
 */
async function getTenantPlan(tenantId: UUID): Promise<string> {
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from('tenants')
    .select('plan, subscription_status')
    .eq('id', tenantId)
    .single();
  if (error || !data) throw new Error('Failed to fetch tenant plan');
  const row = data as { plan: string; subscription_status: string | null };
  return getEffectivePlan(row.plan, row.subscription_status);
}

/**
 * Throws if the tenant has reached their active customer limit.
 */
export async function enforceCustomerLimit(tenantId: UUID): Promise<void> {
  const db = createServiceRoleClient();
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);

  if (limits.maxCustomers === null) return; // unlimited

  const { count } = await db
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if ((count ?? 0) >= limits.maxCustomers) {
    throw new ForbiddenError(
      `Tu plan ${plan} permite máximo ${limits.maxCustomers} clientes activos. Actualiza tu plan para agregar más.`
    );
  }
}

/**
 * Throws if the tenant has reached their active program limit.
 */
export async function enforceProgramLimit(tenantId: UUID): Promise<void> {
  const db = createServiceRoleClient();
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);

  if (limits.maxPrograms === null) return; // unlimited

  const { count } = await db
    .from('reward_programs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .neq('status', 'archived');

  if ((count ?? 0) >= limits.maxPrograms) {
    throw new ForbiddenError(
      `Tu plan ${plan} permite máximo ${limits.maxPrograms} programa(s). Actualiza tu plan para crear más.`
    );
  }
}

/**
 * Throws if the given program type is not allowed on the tenant's plan.
 */
export async function enforceProgramTypeAllowed(
  tenantId: UUID,
  type: string
): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);

  if (!limits.allowedProgramTypes.includes(type as ProgramTypeAllowed)) {
    throw new ForbiddenError(
      `El tipo de programa "${type}" no está disponible en el plan ${plan}. Actualiza tu plan para acceder a todos los tipos.`
    );
  }
}

/**
 * Throws if the tenant's plan does not include the reward catalog feature.
 */
export async function enforceRewardCatalog(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);

  if (!limits.rewardCatalog) {
    throw new ForbiddenError(
      'El catálogo de recompensas no está disponible en el plan Gratis. Actualiza al plan Starter o Pro para crear recompensas.'
    );
  }
}

/**
 * Throws if the tenant's plan does not include CSV export.
 */
export async function enforceExportCSV(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);

  if (!limits.exportCSV) {
    throw new ForbiddenError(
      'La exportación CSV está disponible solo en el plan Pro.'
    );
  }
}

/**
 * Returns the maximum number of transaction history records to return,
 * or null for unlimited. Apply this as an upper bound on paginated queries.
 */
export async function getTransactionHistoryLimit(
  tenantId: UUID
): Promise<number | null> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  return limits.transactionHistoryLimit;
}

/** Throws if the tenant's plan does not include portal custom branding (logo/colors). */
export async function enforcePortalBranding(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.portalCustomBranding) {
    throw new ForbiddenError(
      'La personalización del portal (logo y colores) está disponible desde el plan Starter.'
    );
  }
}

/** Throws if the tenant's plan does not include Birthday Rewards. */
export async function enforceBirthdayRewards(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.birthdayRewards) {
    throw new ForbiddenError(
      'Las recompensas de cumpleaños están disponibles en el plan Pro.'
    );
  }
}

/** Throws if the tenant's plan does not include Analytics. */
export async function enforceAnalytics(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.analytics) {
    throw new ForbiddenError(
      'Las analíticas están disponibles en el plan Pro.'
    );
  }
}

/** Throws if the tenant's plan does not include Flash Offers. */
export async function enforceFlashOffers(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.flashOffers) {
    throw new ForbiddenError(
      'Flash Offers está disponible en el plan Starter o Pro.'
    );
  }
}

/** Throws if the tenant's plan does not include Surprise & Delight. */
export async function enforceSurpriseDelight(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.surpriseDelight) {
    throw new ForbiddenError(
      'Surprise & Delight está disponible en el plan Pro.'
    );
  }
}

/** Throws if the tenant's plan does not include the Referral Program. */
export async function enforceReferralProgram(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.referralProgram) {
    throw new ForbiddenError(
      'El programa de referidos está disponible en el plan Pro.'
    );
  }
}

/** Throws if the tenant's plan does not include Challenges. */
export async function enforceChallenges(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.challenges) {
    throw new ForbiddenError(
      'Las misiones/challenges están disponibles en el plan Pro.'
    );
  }
}

/** Throws if the tenant's plan does not include Universal Tiers. */
export async function enforceUniversalTiers(tenantId: UUID): Promise<void> {
  const plan = await getTenantPlan(tenantId);
  const limits = getPlanLimits(plan);
  if (!limits.universalTiers) {
    throw new ForbiddenError(
      'Los niveles VIP están disponibles en el plan Pro.'
    );
  }
}
