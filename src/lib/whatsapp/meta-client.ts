/**
 * Meta Cloud API client for WhatsApp Business messaging.
 * Direct integration — no BSP intermediary.
 *
 * Required env vars (set in Vercel dashboard):
 *   META_WABA_PHONE_NUMBER_ID — numeric ID of the registered WhatsApp phone number
 *   META_WABA_ACCESS_TOKEN    — system user token (never a user token — use permanent)
 *   META_API_VERSION          — e.g. "v20.0" (default if omitted)
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

function getMetaConfig() {
  const phoneNumberId = process.env.META_WABA_PHONE_NUMBER_ID;
  const accessToken   = process.env.META_WABA_ACCESS_TOKEN;
  const apiVersion    = process.env.META_API_VERSION ?? 'v20.0';

  if (!phoneNumberId) throw new Error('META_WABA_PHONE_NUMBER_ID is not set');
  if (!accessToken)   throw new Error('META_WABA_ACCESS_TOKEN is not set');

  return { phoneNumberId, accessToken, apiVersion };
}

/**
 * Sends a pre-approved template message via Meta Cloud API.
 * Retries up to 3 times with exponential backoff for transient errors (5xx, code 80007).
 */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  languageCode: string,
  components: MetaTemplateComponent[],
): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, apiVersion } = getMetaConfig();
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, unknown>;

    if (res.ok) {
      const messages = json.messages as Array<{ id: string }> | undefined;
      return { messageId: messages?.[0]?.id ?? '' };
    }

    const err     = json.error as { code?: number; error_subcode?: number; message?: string } | undefined;
    const code    = err?.code ?? 0;
    const subcode = err?.error_subcode;
    const msg     = err?.message ?? `HTTP ${res.status}`;

    lastError = new WhatsAppApiError(code, subcode, msg);

    // Only retry on transient errors
    const isTransient = res.status >= 500 || code === 80007;
    if (!isTransient) break;
  }

  throw lastError ?? new WhatsAppApiError(0, undefined, 'Unknown error');
}
