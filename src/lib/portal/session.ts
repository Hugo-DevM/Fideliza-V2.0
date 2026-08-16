/**
 * Portal "remembered card" cookie.
 *
 * The access code IS the credential, so remembering it is the same trade-off as
 * a "keep me signed in" checkbox — with a much smaller blast radius: the portal
 * never exposes email, phone or notes, only the customer's own loyalty data.
 *
 * A cookie is used rather than localStorage so the server component can restore
 * the session during the request itself. That means no flash of the code form
 * and no client-side redirect on every return visit.
 *
 * Scope: no Domain attribute, so the browser confines it to the exact host
 * (negocio.fideliza.app). One business can never read another's cookie. The
 * subdomain is stored inside the value anyway as a cheap consistency check.
 */

export const CARD_COOKIE = 'fideliza_card';

/** One year — a loyalty card should outlive the browser session. */
export const CARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface SavedCard {
  sub:  string;
  code: string;
}

export function serializeCard(sub: string, code: string): string {
  return `${sub}|${code}`;
}

/** Returns null for anything malformed — a bad cookie must never throw. */
export function parseCardCookie(raw: string | undefined): SavedCard | null {
  if (!raw) return null;
  const sep = raw.indexOf('|');
  if (sep <= 0) return null;

  const sub  = raw.slice(0, sep);
  const code = raw.slice(sep + 1);

  // Access codes are alphanumeric with an optional hyphen (XXXXX-XXXXX).
  // Anything else is a tampered or stale value.
  if (!/^[A-Z0-9-]{4,12}$/i.test(code)) return null;
  if (!/^[a-z0-9-]{1,63}$/i.test(sub))  return null;

  return { sub, code };
}
