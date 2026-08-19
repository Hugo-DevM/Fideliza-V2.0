'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  safeEqual,
} from '@/lib/auth/admin-session';

/**
 * Verifies the admin second factor.
 *
 * Server Actions are publicly invocable endpoints, so this needs the same
 * defenses as a login route:
 *   1. The caller must already be the ADMIN_EMAIL user — the secret alone is
 *      not a credential, matching the guard on /admin itself.
 *   2. Rate limited per IP, otherwise ADMIN_SECRET can be brute-forced by
 *      replaying the action.
 *   3. Constant-time comparison, so response timing does not leak the prefix.
 *   4. The cookie stores a signed expiring token, never the secret itself.
 */
export async function verifyAdminSecret(formData: FormData) {
  const expected = process.env.ADMIN_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;

  // ── 1. Must be the admin account ──────────────────────────────────────
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect('/auth/login?next=/admin');
  }

  // ── 2. Rate limit: 5 attempts per 15 minutes per IP ───────────────────
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? hdrs.get('x-real-ip')?.trim()
    ?? 'unknown';

  const rl = await checkRateLimit(`admin-verify:${ip}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    redirect('/admin/verify?error=rate_limit');
  }

  // ── 3. Constant-time secret check ─────────────────────────────────────
  const input = (formData.get('secret') as string | null)?.trim() ?? '';
  if (!expected || !safeEqual(input, expected)) {
    redirect('/admin/verify?error=1');
  }

  // ── 4. Issue a signed, expiring session token ─────────────────────────
  const jar = await cookies();
  jar.set(ADMIN_COOKIE_NAME, createAdminSessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  redirect('/admin');
}
