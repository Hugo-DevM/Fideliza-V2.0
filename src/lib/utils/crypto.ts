/**
 * Cryptographic utilities for generating access codes and redemption codes.
 * Uses the Web Crypto API (available in Node.js 18+ and Edge runtime).
 *
 * Character set excludes visually ambiguous chars: 0/O, 1/I/L
 */

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToString(bytes: Uint8Array, charset: string): string {
  // Rejection sampling ensures uniform distribution — no modulo bias
  const mask = charset.length <= 32 ? 31 : 63;
  let result = '';
  let i = 0;

  while (result.length < bytes.length) {
    const byte = bytes[i++] & mask;
    if (byte < charset.length) {
      result += charset[byte];
    }
    if (i >= bytes.length) {
      // Refill buffer if we ran out of usable bytes
      bytes = randomBytes(bytes.length);
      i = 0;
    }
  }

  return result;
}

/**
 * Generates a customer access code.
 * Format: XXXX-XXXX (8 chars, no ambiguous characters)
 * Example: "BRTK-7PMQ"
 *
 * Used once per customer, stored in DB, shown on their QR card.
 */
export function generateAccessCode(): string {
  const raw = bytesToString(randomBytes(16), CHARSET);
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

/**
 * Generates a staff-facing redemption code.
 * Format: XXXX-XXX (7 chars, prefixed with a 4-char tenant hint)
 * Example: "BREW-XK3-72F"
 *
 * Staff enter or scan this at point of service.
 */
export function generateRedemptionCode(tenantPrefix: string): string {
  const prefix = tenantPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
  const raw = bytesToString(randomBytes(12), CHARSET);
  return `${prefix}-${raw.slice(0, 3)}-${raw.slice(3, 6)}`;
}

/**
 * Generates a cryptographically random hex token.
 * Used for magic link tokens, session identifiers, etc.
 */
export function generateToken(byteLength = 32): string {
  const bytes = randomBytes(byteLength);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Signed portal URLs ────────────────────────────────────────────────
//
// A signed URL lets a business generate a time-limited QR code for a
// customer. The signature is HMAC-SHA256(secret, `${code}:${exp}`) where
// exp is a Unix timestamp. If the signature or expiry is invalid the
// portal falls back to plain code lookup (no expiry enforcement).
//
// Example URL:
//   https://marios.fideliza.app/c?code=CROL-MP01&exp=1700000000&sig=abc123
//
// Security properties:
//   - An attacker who knows the code cannot extend the expiry (sig covers exp)
//   - An attacker who does not know the secret cannot forge a valid sig
//   - Constant-time HMAC verify prevents timing attacks

/**
 * Signs a customer access code for a time-limited portal URL.
 *
 * @param code    The customer's access code (e.g. "CROL-MP01")
 * @param secret  Per-tenant or global HMAC secret (min 32 chars recommended)
 * @param ttlSeconds  How many seconds until the signed URL expires
 * @returns { exp, sig } to append as query params
 */
export async function signPortalCode(
  code: string,
  secret: string,
  ttlSeconds: number
): Promise<{ exp: number; sig: string }> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = new TextEncoder().encode(`${code.toUpperCase()}:${exp}`);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, payload);
  const sig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { exp, sig };
}

/**
 * Verifies a signed portal URL.
 * Returns false if the signature is invalid OR the URL has expired.
 * Uses the Web Crypto subtle.verify() for constant-time comparison.
 */
export async function verifyPortalSignature(
  code: string,
  sig: string,
  exp: number,
  secret: string
): Promise<boolean> {
  // Reject expired signatures immediately
  if (Math.floor(Date.now() / 1000) > exp) return false;

  // Reject malformed sig strings (SHA-256 = 64 hex chars = 32 bytes)
  if (!/^[0-9a-f]{64}$/.test(sig)) return false;

  const payload = new TextEncoder().encode(`${code.toUpperCase()}:${exp}`);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBytes = new Uint8Array(
    sig.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  );

  return crypto.subtle.verify('HMAC', key, sigBytes, payload);
}
