/**
 * WhatsApp queue health check.
 *
 * Why this exists: enqueueing a message and sending it are two different things.
 * `send*Message()` only writes a row into `whatsapp_message_queue`; the actual
 * delivery depends on /api/cron/whatsapp-send being triggered every 5 minutes.
 * That trigger lives on an EXTERNAL scheduler (cron-job.org), because Vercel's
 * free tier caps how many crons we can declare in vercel.json.
 *
 * If that external scheduler stops — account expiry, changed URL, rotated
 * CRON_SECRET returning 401, provider outage — the failure is completely
 * silent. Nothing errors on our side: a cron that never fires produces no log,
 * no exception, no failed request. Messages simply pile up as 'pending' and no
 * customer ever hears from the business again.
 *
 * So this check must NOT run on the external scheduler too — it would die
 * alongside the thing it is supposed to watch. It is called from
 * /api/cron/voucher-expiry, which Vercel itself triggers daily and is therefore
 * an independent heartbeat.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendQueueStuckAlert } from '@/lib/email/resend';
import { logger } from '@/lib/utils/logger';

/**
 * A message older than this that is still pending means the dispatcher has
 * missed several cycles — it runs every 5 minutes, so 30 minutes is ~6 misses.
 * Retries push `scheduled_at` into the future (1m/2m/4m backoff), so a message
 * that is legitimately retrying will not be counted here.
 */
const STUCK_AFTER_MINUTES = 30;

/**
 * Below this count we stay quiet. A couple of stragglers can be explained by a
 * cycle that overlapped this check; a dead dispatcher produces far more.
 */
const ALERT_THRESHOLD = 5;

export interface QueueHealth {
  stuck:        number;
  failed24h:    number;
  oldestMinutes: number | null;
  alerted:      boolean;
}

/**
 * Inspects the queue and emails ADMIN_EMAIL when messages are visibly stuck.
 *
 * Never throws — a monitoring failure must not take down the cron it rides on.
 * No de-duplication is needed: the host cron runs once a day, so this can send
 * at most one alert per day.
 */
export async function checkQueueHealth(): Promise<QueueHealth> {
  const health: QueueHealth = { stuck: 0, failed24h: 0, oldestMinutes: null, alerted: false };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceRoleClient() as any;
    const now       = Date.now();
    const stuckThan = new Date(now - STUCK_AFTER_MINUTES * 60 * 1000).toISOString();
    const dayAgo    = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Pending and already due — these are messages the dispatcher should have
    // claimed by now and did not.
    const { count: stuckCount } = await db
      .from('whatsapp_message_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_at', stuckThan);

    health.stuck = stuckCount ?? 0;

    const { count: failedCount } = await db
      .from('whatsapp_message_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', dayAgo);

    health.failed24h = failedCount ?? 0;

    if (health.stuck < ALERT_THRESHOLD) return health;

    // Age of the oldest stuck message — tells us how long delivery has been down.
    const { data: oldest } = await db
      .from('whatsapp_message_queue')
      .select('scheduled_at')
      .eq('status', 'pending')
      .lte('scheduled_at', stuckThan)
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle() as { data: { scheduled_at: string } | null };

    if (oldest) {
      health.oldestMinutes = Math.round((now - new Date(oldest.scheduled_at).getTime()) / 60000);
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.error('[queue-health] messages stuck but ADMIN_EMAIL is not set', {
        stuck: health.stuck,
      });
      return health;
    }

    await sendQueueStuckAlert(adminEmail, {
      stuck:         health.stuck,
      failed24h:     health.failed24h,
      oldestMinutes: health.oldestMinutes,
    });
    health.alerted = true;

    logger.error('[queue-health] WhatsApp queue is stuck — alert sent', {
      stuck:         health.stuck,
      oldestMinutes: health.oldestMinutes,
    });
  } catch (err) {
    // Best-effort: never break the cron this rides on.
    logger.error('[queue-health] check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return health;
}
