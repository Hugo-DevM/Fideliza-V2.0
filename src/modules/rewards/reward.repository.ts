/**
 * Reward repository — DB layer for the rewards module.
 * All queries scoped to tenant_id.
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Reward, RewardProgram, UUID } from '@/lib/types';
import { NotFoundError } from '@/lib/middleware/errors';

// ── Programs ─────────────────────────────────────────────────────────

export async function listActivePrograms(tenantId: UUID): Promise<RewardProgram[]> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('reward_programs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to list programs: ${error.message}`);
  }

  return (data ?? []) as unknown as RewardProgram[];
}

export async function getProgramById(tenantId: UUID, programId: UUID): Promise<RewardProgram> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('reward_programs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', programId)
    .single();

  if (error || !data) {
    throw new NotFoundError('RewardProgram');
  }

  return data as unknown as RewardProgram;
}

// ── Rewards ───────────────────────────────────────────────────────────

export async function listRewardsByProgram(tenantId: UUID, programId: UUID): Promise<Reward[]> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('rewards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('program_id', programId)
    .eq('is_active', true)
    .order('cost_points', { ascending: true });

  if (error) {
    throw new Error(`Failed to list rewards: ${error.message}`);
  }

  return (data ?? []) as Reward[];
}

export async function getRewardById(tenantId: UUID, rewardId: UUID): Promise<Reward> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('rewards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', rewardId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Reward');
  }

  return data as Reward;
}
