/**
 * WhatsApp quality gate — reads the Meta phone number's quality rating.
 *
 * Meta assigns GREEN / YELLOW / RED ratings to phone numbers based on
 * how many users block or report messages. If the rating drops, we
 * automatically pause sending to protect the number.
 *
 *   GREEN  → full sending allowed
 *   YELLOW → marketing paused, utility still allowed
 *   RED    → all sending paused
 *
 * The quality state is updated by the Meta webhook receiver (Phase 5).
 * We cache the result for 5 minutes to avoid hitting the DB on every send.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

type QualityRating = 'GREEN' | 'YELLOW' | 'RED';

interface QualityState {
  rating:    QualityRating;
  is_paused: boolean;
}

// Module-level cache — shared across invocations within the same serverless instance
let cached: QualityState | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchQualityState(): Promise<QualityState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { data } = await db
    .from('whatsapp_quality_state')
    .select('rating, is_paused')
    .limit(1)
    .single() as { data: QualityState | null };

  return data ?? { rating: 'GREEN', is_paused: false };
}

async function getState(): Promise<QualityState> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;
  cached   = await fetchQualityState();
  cachedAt = now;
  return cached;
}

/** Call this from the webhook handler after updating the DB row. */
export function invalidateQualityCache(): void {
  cached   = null;
  cachedAt = 0;
}

/**
 * Persists a new quality state from the Meta webhook and invalidates the cache.
 * Called exclusively by /api/whatsapp/webhook.
 */
export async function updateQualityState(
  rating:     QualityRating,
  isPaused:   boolean,
  rawPayload: unknown,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  await db
    .from('whatsapp_quality_state')
    .update({
      rating,
      is_paused:       isPaused,
      paused_at:       isPaused ? new Date().toISOString() : null,
      last_webhook_at: new Date().toISOString(),
      raw_payload:     rawPayload,
      updated_at:      new Date().toISOString(),
    })
    // The table has exactly one row — update it unconditionally
    .not('id', 'is', null);

  invalidateQualityCache();
}

/**
 * Returns true if sending is globally allowed.
 * Pass category to get category-specific check:
 *   - utility:   blocked only on RED or is_paused
 *   - marketing: blocked on YELLOW, RED, or is_paused
 */
export async function isSendingAllowed(
  category: 'utility' | 'marketing' = 'utility',
): Promise<boolean> {
  const state = await getState();
  if (state.is_paused)              return false;
  if (state.rating === 'RED')       return false;
  if (category === 'marketing' && state.rating === 'YELLOW') return false;
  return true;
}
