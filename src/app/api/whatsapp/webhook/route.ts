/**
 * Meta WhatsApp webhook — /api/whatsapp/webhook
 *
 * GET  — Verification challenge (Meta calls this once when you register the webhook)
 * POST — Receive events from Meta (quality rating, delivery status, opt-outs)
 *
 * Security: every POST is verified with HMAC-SHA256 using META_APP_SECRET.
 * Any request with an invalid or missing signature is rejected with 401.
 *
 * Required env vars:
 *   META_APP_SECRET          — App Settings → Basic → App Secret
 *   META_WEBHOOK_VERIFY_TOKEN — any secret string you choose; must match Meta dashboard
 */

import { NextResponse }           from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { updateQualityState, invalidateQualityCache } from '@/lib/whatsapp/quality-gate';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';

// ── GET — webhook verification challenge ────────────────────────────────────
export async function GET(request: Request) {
  const url    = new URL(request.url);
  const mode   = url.searchParams.get('hub.mode');
  const token  = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    // Return the challenge as plain text — Meta requires exactly this
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ── POST — receive events ────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Rate limit: 100 requests per minute per IP (Meta sends at most a few per second)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`webhook:${ip}`, 100, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const rawBody = await request.text();

  // 1. Verify HMAC-SHA256 signature — reject anything not from Meta
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[webhook] META_APP_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const expected  = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse payload
  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3. Process all entries concurrently (usually just one entry per webhook call)
  await Promise.allSettled(
    (payload.entry ?? []).flatMap((entry) =>
      (entry.changes ?? []).map((change) => processChange(change)),
    ),
  );

  // Meta requires a 200 response — always return OK even if processing had issues
  return NextResponse.json({ ok: true });
}

// ── Event processors ─────────────────────────────────────────────────────────

async function processChange(change: MetaChange): Promise<void> {
  switch (change.field) {
    case 'phone_number_quality_update':
      await handleQualityUpdate(change.value as MetaQualityValue, change);
      break;

    case 'messages':
      await handleMessagesChange(change.value as MetaMessagesValue);
      break;
  }
}

async function handleQualityUpdate(
  value: MetaQualityValue,
  rawChange: MetaChange,
): Promise<void> {
  const event = value.event;

  let rating:   'GREEN' | 'YELLOW' | 'RED';
  let isPaused: boolean;

  switch (event) {
    case 'FLAGGED':
      rating   = 'YELLOW';
      isPaused = false;
      break;
    case 'BLOCKED':
      rating   = 'RED';
      isPaused = true;
      break;
    case 'RESTORED':
      rating   = 'GREEN';
      isPaused = false;
      break;
    default:
      return; // Unknown event — ignore
  }

  await updateQualityState(rating, isPaused, rawChange);
}

async function handleMessagesChange(value: MetaMessagesValue): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // A. Update delivery status for messages we sent
  const statuses = value.statuses ?? [];
  for (const s of statuses) {
    const newStatus =
      s.status === 'delivered' ? 'delivered' :
      s.status === 'read'      ? 'read'      :
      s.status === 'failed'    ? 'failed'    :
      null;

    if (!newStatus || !s.id) continue;

    await db
      .from('whatsapp_message_queue')
      .update({ status: newStatus })
      .eq('waba_message_id', s.id);
  }

  // B. Handle opt-out: customer replies STOP (or Spanish equivalents)
  const OPT_OUT_KEYWORDS = ['stop', 'para', 'baja', 'cancelar', 'no', 'salir'];
  const inboundMessages = value.messages ?? [];

  for (const msg of inboundMessages) {
    if (msg.type !== 'text') continue;

    const body = (msg.text?.body ?? '').trim().toLowerCase();
    if (!OPT_OUT_KEYWORDS.includes(body)) continue;

    // Phone from Meta is E.164 without the + (e.g. "521234567890")
    // Our DB stores with + prefix — normalize to both formats
    const phoneWithPlus    = msg.from.startsWith('+') ? msg.from : `+${msg.from}`;
    const phoneWithoutPlus = msg.from.startsWith('+') ? msg.from.slice(1) : msg.from;

    // Validate E.164 format before touching the DB
    if (!/^\+?[1-9]\d{6,14}$/.test(phoneWithPlus)) continue;

    // Use .in() with array — safe parameterized query
    await db
      .from('customers')
      .update({ whatsapp_opt_in: false })
      .in('phone', [phoneWithPlus, phoneWithoutPlus]);

    // Cancel their pending queued messages
    await db
      .from('whatsapp_message_queue')
      .update({ status: 'cancelled' })
      .in('phone_number', [phoneWithPlus, phoneWithoutPlus])
      .eq('status', 'pending');

    invalidateQualityCache();
  }
}

// ── Meta payload type definitions ────────────────────────────────────────────

interface MetaWebhookPayload {
  object?: string;
  entry?: MetaEntry[];
}

interface MetaEntry {
  id?: string;
  changes?: MetaChange[];
}

interface MetaChange {
  field: string;
  value: unknown;
}

interface MetaQualityValue {
  display_phone_number?: string;
  event: 'FLAGGED' | 'BLOCKED' | 'RESTORED';
  current_limit?: string;
}

interface MetaMessagesValue {
  statuses?: Array<{
    id: string;
    status: string;
    timestamp?: string;
    recipient_id?: string;
  }>;
  messages?: Array<{
    from: string;
    type: string;
    text?: { body: string };
  }>;
}
