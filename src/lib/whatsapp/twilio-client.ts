/**
 * Twilio WhatsApp client — drop-in replacement for meta-client.ts.
 *
 * Required env vars (set in Vercel dashboard):
 *   TWILIO_ACCOUNT_SID      — from Twilio Console
 *   TWILIO_AUTH_TOKEN       — from Twilio Console
 *   TWILIO_WHATSAPP_FROM    — e.g. "whatsapp:+14155238886" (sandbox) or your production number
 *
 * Templates are submitted via Twilio Content Template Builder and approved by Meta.
 * Each approved template gets a ContentSid (HXxxxxxxx) — add them to TEMPLATE_SID_MAP below.
 */

export interface MetaTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{ type: 'text'; text: string }>;
}

export interface MetaSendResult {
  messageId: string;
}

export class WhatsAppApiError extends Error {
  constructor(
    public readonly metaCode: number,
    public readonly metaSubcode: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'WhatsAppApiError';
  }
}

/**
 * Map from Fideliza template names → Twilio Content SIDs.
 * Fill in each SID after creating and approving the template in Twilio Content Template Builder.
 */
const TEMPLATE_SID_MAP: Record<string, string> = {
  fideliza_welcome_v2:            process.env.TWILIO_TMPL_WELCOME            ?? '',
  fideliza_voucher_expiry_v2:     process.env.TWILIO_TMPL_VOUCHER_EXPIRY     ?? '',
  fideliza_balance_reminder_v2:   process.env.TWILIO_TMPL_BALANCE_REMINDER   ?? '',
  fideliza_reactivation_v2:       process.env.TWILIO_TMPL_REACTIVATION       ?? '',
  fideliza_streak_at_risk_v2:     process.env.TWILIO_TMPL_STREAK_AT_RISK     ?? '',
  fideliza_promotion_v2:          process.env.TWILIO_TMPL_PROMOTION          ?? '',
  fideliza_birthday_v2:           process.env.TWILIO_TMPL_BIRTHDAY           ?? '',
  fideliza_milestone_80_v2:       process.env.TWILIO_TMPL_MILESTONE_80       ?? '',
  fideliza_tier_upgrade_v2:       process.env.TWILIO_TMPL_TIER_UPGRADE       ?? '',
  fideliza_surprise_v2:           process.env.TWILIO_TMPL_SURPRISE           ?? '',
  fideliza_referral_earned_v2:    process.env.TWILIO_TMPL_REFERRAL_EARNED    ?? '',
  fideliza_referral_welcome_v2:   process.env.TWILIO_TMPL_REFERRAL_WELCOME   ?? '',
  fideliza_challenge_completed_v2: process.env.TWILIO_TMPL_CHALLENGE_COMPLETED ?? '',
};

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const defaultFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid)  throw new Error('TWILIO_ACCOUNT_SID is not set');
  if (!authToken)   throw new Error('TWILIO_AUTH_TOKEN is not set');
  if (!defaultFrom) throw new Error('TWILIO_WHATSAPP_FROM is not set');

  return { accountSid, authToken, defaultFrom };
}

/**
 * Sends a pre-approved template message via Twilio WhatsApp API.
 * @param fromOverride - tenant's own sender (Pro plan). Falls back to TWILIO_WHATSAPP_FROM.
 */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  _languageCode: string,
  components: MetaTemplateComponent[],
  fromOverride?: string,
): Promise<MetaSendResult> {
  const { accountSid, authToken, defaultFrom } = getTwilioConfig();
  const from = fromOverride ?? defaultFrom;

  const contentSid = TEMPLATE_SID_MAP[templateName];
  if (!contentSid) {
    throw new WhatsAppApiError(0, undefined, `No Twilio ContentSid mapped for template: ${templateName}`);
  }

  // Build ContentVariables: { "1": "value1", "2": "value2", ... }
  const bodyComponent = components.find((c) => c.type === 'body');
  const contentVariables: Record<string, string> = {};
  if (bodyComponent) {
    bodyComponent.parameters.forEach((p, i) => {
      contentVariables[String(i + 1)] = p.text;
    });
  }

  const to   = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  const from_ = from.startsWith('whatsapp:')  ? from  : `whatsapp:${from}`;
  const url  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    To:         to,
    From:       from_,
    ContentSid: contentSid,
  });

  if (Object.keys(contentVariables).length > 0) {
    body.set('ContentVariables', JSON.stringify(contentVariables));
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (res.ok) {
    return { messageId: (json.sid as string) ?? '' };
  }

  const message = (json.message as string) ?? `HTTP ${res.status}`;
  const code    = (json.code as number)    ?? res.status;
  throw new WhatsAppApiError(code, undefined, message);
}
