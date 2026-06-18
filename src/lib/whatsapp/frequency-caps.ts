/**
 * WhatsApp frequency cap guard.
 *
 * Limits per customer:
 *   utility:   max 1 message per ISO week  (Monday–Sunday)
 *   marketing: max 2 messages per calendar month
 *
 * Reads and atomically increments a row in whatsapp_frequency_caps.
 * Returns true if the message is allowed, false if the cap is reached.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { UUID } from '@/lib/types';

const CAPS = {
  utility:   { max: 1, windowUnit: 'week'  as const },
  marketing: { max: 2, windowUnit: 'month' as const },
};

function getWindowStart(unit: 'week' | 'month'): string {
  const now = new Date();
  if (unit === 'month') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }
  // ISO week: Monday of the current UTC week
  const day  = now.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

export async function checkAndIncrementCap(
  customerId: UUID,
  tenantId: UUID,
  category: 'utility' | 'marketing',
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { max, windowUnit } = CAPS[category];
  const windowStart = getWindowStart(windowUnit);

  type CapRow = { id: string; send_count: number; window_start: string };
  const { data: existing } = await db
    .from('whatsapp_frequency_caps')
    .select('id, send_count, window_start')
    .eq('customer_id', customerId)
    .eq('cap_type', category)
    .maybeSingle() as { data: CapRow | null };

  if (existing) {
    const isNewWindow    = existing.window_start < windowStart;
    const currentCount   = isNewWindow ? 0 : existing.send_count;

    if (currentCount >= max) return false;

    await db
      .from('whatsapp_frequency_caps')
      .update({
        window_start: isNewWindow ? windowStart : existing.window_start,
        send_count:   currentCount + 1,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await db
      .from('whatsapp_frequency_caps')
      .insert({
        customer_id:  customerId,
        tenant_id:    tenantId,
        cap_type:     category,
        window_start: windowStart,
        send_count:   1,
      });
  }

  return true;
}
