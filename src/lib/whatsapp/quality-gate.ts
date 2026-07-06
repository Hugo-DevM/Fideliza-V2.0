/**
 * WhatsApp quality gate.
 *
 * With Twilio as the provider, quality management is handled internally by Twilio.
 * This gate allows manual pausing of sends via the `whatsapp_quality_state` table
 * in Supabase (e.g. from a support dashboard or directly in the DB).
 *
 * Default state (no row in DB): all sending allowed.
 *
 *   is_paused = false → sending allowed
 *   is_paused = true  → all sending paused
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

interface QualityState {
  is_paused: boolean;
}

// Module-level cache — shared across invocations within the same serverless instance
let cached: QualityState | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getState(): Promise<QualityState> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { data } = await db
    .from('whatsapp_quality_state')
    .select('is_paused')
    .limit(1)
    .single() as { data: QualityState | null };

  cached   = data ?? { is_paused: false };
  cachedAt = now;
  return cached;
}

/** Invalidates the in-memory cache. */
export function invalidateQualityCache(): void {
  cached   = null;
  cachedAt = 0;
}

/**
 * Returns true if sending is allowed.
 * Category is kept for interface compatibility — both categories check the same gate.
 */
export async function isSendingAllowed(
  category: 'utility' | 'marketing' = 'utility',
): Promise<boolean> {
  // Both categories currently share the same account-level pause gate.
  void category;
  const state = await getState();
  return !state.is_paused;
}
