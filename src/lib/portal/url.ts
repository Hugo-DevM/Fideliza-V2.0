/**
 * Canonical builder for a customer's portal URL.
 *
 * With the access code appended, this is the customer's personal card: opening
 * it skips the code form entirely and lands on their balance. It is the link to
 * put in a welcome message, and the one to resend when they lose it.
 */

const DEFAULT_ROOT_DOMAIN = 'fideliza.app';

function rootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN;
}

/** `https://negocio.fideliza.app/c` — the generic entry point (code form). */
export function portalBaseUrl(subdomain: string): string {
  return `https://${subdomain}.${rootDomain()}/c`;
}

/** `https://negocio.fideliza.app/c?code=ABCDE-12345` — one specific customer. */
export function portalUrlForCustomer(subdomain: string, accessCode: string): string {
  return `${portalBaseUrl(subdomain)}?code=${encodeURIComponent(accessCode)}`;
}

/**
 * wa.me deep link that opens the SENDER's own WhatsApp with the message ready
 * to send to this customer.
 *
 * This is not a Meta template and costs nothing: the business owner presses
 * send from their personal WhatsApp. It therefore works on every plan —
 * including Free, which has no WhatsApp quota at all — and needs no approval.
 */
export function whatsappShareLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** The message body used when resending a card. Shared so copy stays in sync. */
export function accessLinkMessage(params: {
  customerName: string;
  businessName: string;
  accessCode:   string;
  url:          string;
}): string {
  const { customerName, businessName, accessCode, url } = params;
  return (
    `¡Hola ${customerName}! 👋\n\n` +
    `Esta es tu tarjeta de fidelidad de ${businessName}:\n${url}\n\n` +
    `Ábrela para ver tus puntos y recompensas cuando quieras. ` +
    `Guárdala en la pantalla de inicio de tu teléfono para tenerla siempre a la mano.\n\n` +
    `Tu código de acceso es: ${accessCode}`
  );
}
