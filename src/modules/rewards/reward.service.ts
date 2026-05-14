/**
 * Reward service — business logic for programs and rewards.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  listActivePrograms,
  getProgramById,
  listRewardsByProgram,
  getRewardById,
} from './reward.repository';
import { BadRequestError } from '@/lib/middleware/errors';
import { enforceProgramLimit, enforceProgramTypeAllowed, enforceRewardCatalog } from '@/lib/middleware/plan-limits';
import type { Reward, RewardProgram, UUID } from '@/lib/types';
import type {
  CreateRewardProgramInput,
  CreateRewardInput,
  ListRewardsQueryInput,
} from '@/lib/validation/reward.schema';

export async function listProgramsWithRewards(
  tenantId: UUID
): Promise<(RewardProgram & { rewards: Reward[] })[]> {
  const programs = await listActivePrograms(tenantId);

  const programsWithRewards = await Promise.all(
    programs.map(async (program) => {
      const rewards = await listRewardsByProgram(tenantId, program.id);
      return { ...program, rewards };
    })
  );

  return programsWithRewards;
}

export async function listRewards(
  tenantId: UUID,
  query: ListRewardsQueryInput
): Promise<{ rewards: Reward[]; total: number }> {
  const db = createServiceRoleClient();

  let builder = db
    .from('rewards')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('cost_points', { ascending: true });

  if (query.program_id) {
    builder = builder.eq('program_id', query.program_id);
  }

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  builder = builder.range(from, to);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error(`Error al listar recompensas: ${error.message}`);
  }

  return { rewards: (data ?? []) as Reward[], total: count ?? 0 };
}

export async function createProgram(
  tenantId: UUID,
  input: CreateRewardProgramInput
): Promise<RewardProgram> {
  const db = createServiceRoleClient();

  // Enforce plan limits before creating
  await enforceProgramLimit(tenantId);
  await enforceProgramTypeAllowed(tenantId, input.type);

  const { data, error } = await db
    .from('reward_programs')
    .insert({
      tenant_id:       tenantId,
      name:            input.name,
      description:     input.description ?? null,
      type:            input.type,
      status:          'active',
      config:          input.config as import('@/lib/supabase/database.types').Json,
      max_enrollments: input.max_enrollments ?? null,
      starts_at:       input.starts_at ?? null,
      ends_at:         input.ends_at ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al crear el programa: ${error?.message}`);
  }

  return data as unknown as RewardProgram;
}

export async function updateProgram(
  tenantId: UUID,
  programId: UUID,
  input: import('@/lib/validation/reward.schema').UpdateRewardProgramInput
): Promise<RewardProgram> {
  const db = createServiceRoleClient();

  // Confirm the program belongs to this tenant before updating
  await getProgramById(tenantId, programId);

  const { data, error } = await db
    .from('reward_programs')
    .update({
      ...(input.name        !== undefined && { name:            input.name }),
      ...(input.description !== undefined && { description:     input.description }),
      ...(input.status      !== undefined && { status:          input.status }),
      ...(input.config      !== undefined && { config:          input.config as import('@/lib/supabase/database.types').Json }),
      ...(input.max_enrollments !== undefined && { max_enrollments: input.max_enrollments }),
      ...(input.starts_at   !== undefined && { starts_at:       input.starts_at }),
      ...(input.ends_at     !== undefined && { ends_at:         input.ends_at }),
    })
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al actualizar el programa: ${error?.message}`);
  }

  return data as unknown as RewardProgram;
}

export async function createReward(
  tenantId: UUID,
  input: CreateRewardInput
): Promise<Reward> {
  const db = createServiceRoleClient();

  // Enforce reward catalog plan feature
  await enforceRewardCatalog(tenantId);

  // Verify the program belongs to this tenant
  await getProgramById(tenantId, input.program_id);

  const { data, error } = await db
    .from('rewards')
    .insert({
      tenant_id:   tenantId,
      program_id:  input.program_id,
      name:        input.name,
      description: input.description ?? null,
      image_url:   input.image_url ?? null,
      cost_points: input.cost_points,
      stock:       input.stock ?? null,
      expiry_days: input.expiry_days ?? null,
      is_active:   true,
    })
    .select('*')
    .single();

  if (error || !data) {
    // Detect tenant mismatch from the DB CHECK constraint
    if (error?.code === '23514') {
      throw new BadRequestError('El programa de recompensas no pertenece a tu cuenta');
    }
    throw new Error(`Error al crear la recompensa: ${error?.message}`);
  }

  return data as Reward;
}

export async function updateReward(
  tenantId: UUID,
  rewardId: UUID,
  input: import('@/lib/validation/reward.schema').UpdateRewardInput
): Promise<Reward> {
  const db = createServiceRoleClient();

  // Confirm the reward belongs to this tenant
  await getRewardById(tenantId, rewardId);

  const { data, error } = await db
    .from('rewards')
    .update({
      ...(input.name        !== undefined && { name:        input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.image_url   !== undefined && { image_url:   input.image_url }),
      ...(input.cost_points !== undefined && { cost_points: input.cost_points }),
      ...(input.stock       !== undefined && { stock:       input.stock }),
      ...(input.expiry_days !== undefined && { expiry_days: input.expiry_days }),
      ...(input.is_active   !== undefined && { is_active:   input.is_active }),
    })
    .eq('id', rewardId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al actualizar la recompensa: ${error?.message}`);
  }

  return data as Reward;
}

/**
 * Explicitly enrolls a customer in a program.
 * Idempotent — calling it twice returns the existing enrollment.
 */
export async function enrollCustomer(
  tenantId: UUID,
  customerId: UUID,
  programId: UUID
): Promise<import('@/lib/types').CustomerProgramEnrollment> {
  const db = createServiceRoleClient();

  // Validate both belong to this tenant
  const [programRow] = await Promise.all([
    getProgramById(tenantId, programId),
    db
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) throw new BadRequestError('Cliente no encontrado en este negocio');
        return data;
      }),
  ]);

  if (programRow.status !== 'active') {
    throw new BadRequestError(`No se puede inscribir en un programa con estado: ${programRow.status}`);
  }

  // Upsert — safe to call multiple times
  const { data, error } = await db
    .from('customer_program_enrollments')
    .upsert(
      {
        tenant_id:   tenantId,
        customer_id: customerId,
        program_id:  programId,
      },
      { onConflict: 'customer_id,program_id', ignoreDuplicates: false }
    )
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al inscribir al cliente: ${error?.message}`);
  }

  return data as unknown as import('@/lib/types').CustomerProgramEnrollment;
}

/**
 * Returns all enrollments for a customer, optionally filtered by program.
 */
export async function listEnrollments(
  tenantId: UUID,
  customerId: UUID | undefined,
  programId: UUID | undefined,
  page = 1,
  limit = 50
): Promise<{
  enrollments: (import('@/lib/types').CustomerProgramEnrollment & {
    program_name: string;
    program_type: string;
    program_status: string;
  })[];
  total: number;
}> {
  const db = createServiceRoleClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let builder = db
    .from('customer_program_enrollments')
    .select(`
      *,
      reward_programs!inner(name, type, status)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('last_activity_at', { ascending: false })
    .range(from, to);

  if (customerId) builder = builder.eq('customer_id', customerId);
  if (programId)  builder = builder.eq('program_id', programId);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error(`Error al listar inscripciones: ${error.message}`);
  }

  const enriched = ((data ?? []) as unknown as Record<string, unknown>[]).map((e) => {
    const prog = e['reward_programs'] as { name: string; type: string; status: string } | null;
    return {
      ...(e as unknown as import('@/lib/types').CustomerProgramEnrollment),
      program_name:   prog?.name   ?? '',
      program_type:   prog?.type   ?? '',
      program_status: prog?.status ?? '',
    };
  });

  return { enrollments: enriched, total: count ?? 0 };
}

export { listActivePrograms, getProgramById, getRewardById };
