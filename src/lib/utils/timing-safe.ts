/**
 * Constant-time string comparison for secrets.
 *
 * `===` on a secret short-circuits at the first differing byte, so response
 * time correlates with how many leading characters the guess got right.
 * Use this for every server-side secret comparison (cron tokens, admin keys,
 * webhook signatures).
 */

import 'server-only';
import { timingSafeEqual } from 'crypto';

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Length is not secret; bailing here avoids timingSafeEqual throwing.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
