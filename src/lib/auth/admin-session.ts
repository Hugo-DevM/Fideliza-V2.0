/**
 * Admin panel second-factor session token.
 *
 * The admin_verified cookie used to hold ADMIN_SECRET verbatim, which meant
 * anywhere the cookie surfaced (proxy logs, a browser profile backup, a shared
 * device) leaked the reusable master secret. It now holds a signed, expiring
 * token derived from the secret instead:
 *
 *   <expiryUnixSeconds>.<hex HMAC-SHA256(ADMIN_SECRET, "admin:<expiry>")>
 *
 * The token is verifiable without any server-side storage, expires on its own,
 * and reveals nothing about ADMIN_SECRET. Rotating ADMIN_SECRET invalidates
 * every outstanding token.
 */

import 'server-only';
import { createHmac } from 'crypto';
import { safeEqual } from '@/lib/utils/timing-safe';

export { safeEqual };

export const ADMIN_COOKIE_NAME = 'admin_verified';
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

function sign(secret: string, expiry: number): string {
  return createHmac('sha256', secret).update(`admin:${expiry}`).digest('hex');
}

export function createAdminSessionToken(secret: string): string {
  const expiry = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  return `${expiry}.${sign(secret, expiry)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string | undefined
): boolean {
  if (!token || !secret) return false;

  const [expiryPart, signature] = token.split('.');
  if (!expiryPart || !signature) return false;

  const expiry = parseInt(expiryPart, 10);
  if (!Number.isFinite(expiry) || expiry <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  return safeEqual(signature, sign(secret, expiry));
}
