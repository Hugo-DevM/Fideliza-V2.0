/**
 * Shared authorization for cron endpoints.
 *
 * These routes trigger mass sends (WhatsApp, email) and mass reward grants, so
 * an unauthenticated caller could drain a tenant's message quota or hand out
 * birthday bonuses on demand. Every cron route must call this first.
 *
 * The secret is compared in constant time — the previous `!==` leaked the
 * matching prefix through response timing.
 */

import 'server-only';
import { safeEqual } from '@/lib/utils/timing-safe';

export function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  return safeEqual(authHeader, `Bearer ${cronSecret}`);
}
