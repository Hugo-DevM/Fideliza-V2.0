/**
 * WhatsApp queue processor — GET /api/cron/whatsapp-send
 *
 * Triggered every 5 minutes via Vercel Cron (vercel.json).
 * Secured with CRON_SECRET.
 *
 * Per invocation:
 *   1. Check quality gate — if paused, exit immediately
 *   2. Claim up to 30 pending messages atomically (via RPC with FOR UPDATE SKIP LOCKED)
 *   3. Send each message to Meta Cloud API
 *   4. Update status to 'sent' or schedule a retry on failure
 */

import { NextResponse }          from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isSendingAllowed }      from '@/lib/whatsapp/quality-gate';
import { sendTemplateMessage, WhatsAppApiError } from '@/lib/whatsapp/twilio-client';
import type { MetaTemplateComponent } from '@/lib/whatsapp/twilio-client';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

interface QueuedMessage {
  id:                string;
  tenant_id:         string;
  customer_id:       string;
  phone_number:      string;
  from_number:       string | null;
  template_name:     string;
  template_category: 'utility' | 'marketing';
  template_params:   Record<string, string>;
  retry_count:       number;
  max_retries:       number;
}

/**
 * Builds the components array for a template message.
 * Params are keyed by position ('1', '2', ...) and mapped to body parameters.
 */
function buildComponents(params: Record<string, string>): MetaTemplateComponent[] {
  const keys = Object.keys(params).sort();
  if (keys.length === 0) return [];
  return [
    {
      type: 'body',
      parameters: keys.map((k) => ({ type: 'text' as const, text: params[k] })),
    },
  ];
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // 1. Global quality gate — if paused, skip this cycle entirely
  const allowed = await isSendingAllowed('utility');
  if (!allowed) {
    return NextResponse.json({ sent: 0, failed: 0, reason: 'quality_gate_paused' });
  }

  // 2. Claim a batch of pending messages atomically
  const { data: claimed, error: claimError } = await db.rpc(
    'claim_whatsapp_messages',
    { batch_size: 30 },
  ) as { data: QueuedMessage[] | null; error: unknown };

  if (claimError || !claimed?.length) {
    return NextResponse.json({ sent: 0, failed: 0, claimed: 0 });
  }

  let sent    = 0;
  let failed  = 0;
  let skipped = 0;

  // 3. Process each claimed message (sequential to respect Meta rate limits)
  for (const msg of claimed) {
    // Per-message quality check: if rating changed mid-batch, stop marketing
    const categoryAllowed = await isSendingAllowed(msg.template_category);
    if (!categoryAllowed) {
      await db
        .from('whatsapp_message_queue')
        .update({ status: 'pending', claimed_at: null })
        .eq('id', msg.id);
      skipped++;
      continue;
    }

    try {
      const components = buildComponents(msg.template_params);
      const result = await sendTemplateMessage(
        msg.phone_number,
        msg.template_name,
        'es',
        components,
        msg.from_number ?? undefined,
      );

      await db
        .from('whatsapp_message_queue')
        .update({
          status:          'sent',
          waba_message_id: result.messageId,
          sent_at:         new Date().toISOString(),
        })
        .eq('id', msg.id);

      sent++;
    } catch (err) {
      const isWaError  = err instanceof WhatsAppApiError;
      const canRetry   = msg.retry_count < msg.max_retries;
      const backoffSec = Math.pow(2, msg.retry_count) * 60; // 1m, 2m, 4m

      // Sanitize error — store only code and category, not full message
      const safeError = isWaError
        ? `meta_error:${(err as WhatsAppApiError).metaCode}`
        : 'send_failed';

      if (canRetry && (!isWaError || isTransientWaError(err as WhatsAppApiError))) {
        const retryAt = new Date(Date.now() + backoffSec * 1000).toISOString();
        await db
          .from('whatsapp_message_queue')
          .update({
            status:        'pending',
            retry_count:   msg.retry_count + 1,
            scheduled_at:  retryAt,
            error_message: safeError,
          })
          .eq('id', msg.id);
      } else {
        await db
          .from('whatsapp_message_queue')
          .update({
            status:        'failed',
            error_message: safeError,
          })
          .eq('id', msg.id);
        failed++;
      }
    }
  }

  return NextResponse.json({
    claimed: claimed.length,
    sent,
    failed,
    skipped,
  });
}

/** Transient Twilio error codes worth retrying (HTTP 429 rate limit, 503 unavailable). */
function isTransientWaError(err: WhatsAppApiError): boolean {
  const TRANSIENT_HTTP_CODES = [429, 503, 504];
  return TRANSIENT_HTTP_CODES.includes(err.metaCode);
}
