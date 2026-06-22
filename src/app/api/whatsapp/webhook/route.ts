/**
 * Twilio WhatsApp webhook — /api/whatsapp/webhook
 *
 * POST — Receives events from Twilio:
 *   - Incoming messages (opt-outs via STOP keywords)
 *   - Message status updates (delivered, read, failed)
 *
 * Security: every POST is verified with Twilio's HMAC-SHA1 signature.
 * Any request with an invalid or missing signature is rejected with 401.
 *
 * Setup in Twilio Console:
 *   - Messaging → Senders → your WhatsApp sender
 *   - Set "A message comes in" webhook URL to: https://yourdomain.com/api/whatsapp/webhook
 *   - Set "Message status updates" callback URL to the same endpoint
 *
 * Required env vars:
 *   TWILIO_AUTH_TOKEN       — used to validate incoming webhook signatures
 *   TWILIO_WHATSAPP_FROM    — e.g. "whatsapp:+14155238886"
 */

import { NextResponse }            from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit }          from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';

// ── POST — receive events from Twilio ────────────────────────────────────────
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`webhook:${ip}`, 100, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const rawBody = await request.text();

  // 1. Verify Twilio signature (HMAC-SHA1)
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('[webhook] TWILIO_AUTH_TOKEN is not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const twilioSignature = request.headers.get('x-twilio-signature') ?? '';
  const webhookUrl      = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`;

  if (!verifyTwilioSignature(authToken, twilioSignature, webhookUrl, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse form-encoded body from Twilio
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // 3. Route by event type
  if (params.MessageStatus) {
    await handleStatusUpdate(params);
  } else if (params.Body !== undefined) {
    await handleIncomingMessage(params);
  }

  // Twilio requires a 200 response — always return OK
  return new Response('', { status: 200 });
}

// ── Signature verification ────────────────────────────────────────────────────

/**
 * Twilio HMAC-SHA1 validation:
 * 1. Concatenate the webhook URL with sorted POST params (key+value)
 * 2. Sign with HMAC-SHA1 using the Auth Token
 * 3. Base64-encode and compare with X-Twilio-Signature header
 */
function verifyTwilioSignature(
  authToken:  string,
  signature:  string,
  url:        string,
  rawBody:    string,
): boolean {
  try {
    const params = new URLSearchParams(rawBody);
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join('');

    const data     = url + sortedParams;
    const expected = createHmac('sha1', authToken).update(data).digest('base64');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

/**
 * Updates delivery status in the queue when Twilio reports a status change.
 * Twilio sends: sent → delivered → read (or failed/undelivered)
 */
async function handleStatusUpdate(params: Record<string, string>): Promise<void> {
  const messageSid = params.MessageSid;
  const rawStatus  = params.MessageStatus;

  if (!messageSid || !rawStatus) return;

  const statusMap: Record<string, string> = {
    delivered:   'delivered',
    read:        'read',
    failed:      'failed',
    undelivered: 'failed',
  };

  const newStatus = statusMap[rawStatus];
  if (!newStatus) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  await db
    .from('whatsapp_message_queue')
    .update({ status: newStatus })
    .eq('waba_message_id', messageSid);
}

/**
 * Handles incoming messages from customers.
 * Detects STOP keywords and opts the customer out.
 */
async function handleIncomingMessage(params: Record<string, string>): Promise<void> {
  const from = params.From ?? ''; // e.g. "whatsapp:+521234567890"
  const body = (params.Body ?? '').trim().toLowerCase();

  const OPT_OUT_KEYWORDS = ['stop', 'para', 'baja', 'cancelar', 'no', 'salir'];
  if (!OPT_OUT_KEYWORDS.includes(body)) return;

  // Strip "whatsapp:" prefix — normalize to E.164
  const rawPhone       = from.replace(/^whatsapp:/, '');
  const phoneWithPlus  = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
  const phoneWithout   = phoneWithPlus.slice(1);

  if (!/^\+[1-9]\d{6,14}$/.test(phoneWithPlus)) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  await db
    .from('customers')
    .update({ whatsapp_opt_in: false })
    .in('phone', [phoneWithPlus, phoneWithout]);

  await db
    .from('whatsapp_message_queue')
    .update({ status: 'cancelled' })
    .in('phone_number', [phoneWithPlus, phoneWithout])
    .eq('status', 'pending');
}
