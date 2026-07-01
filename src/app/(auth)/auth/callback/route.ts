/**
 * Supabase Auth callback.
 *
 * Handles two flows:
 *  1. PKCE  — `?code=xxx`              (same-device flows: magic link, OAuth)
 *  2. OTP   — `?token_hash=xxx&type=yyy` (cross-device email confirmation links)
 *
 * NOTE: Password recovery is NOT handled here.
 * The app uses a custom password reset flow (tokens in DB + Resend emails).
 * See /api/auth/request-password-reset and /api/auth/reset-password.
 *
 * The `next` query param controls the post-auth redirect (default /dashboard).
 */

import { NextResponse } from 'next/server';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code      = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type      = searchParams.get('type') as EmailOtpType | null;
  const next      = searchParams.get('next') ?? '/dashboard';

  const cookieStore = await cookies();

  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 1. PKCE flow (same-device: code verifier exists in cookies) ──
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth returning user who already has a tenant → skip onboarding
      if (next === '/auth/onboard' && data.user?.user_metadata?.tenant_id) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ── 2. Token-hash flow (cross-device email links: signup confirmation, etc.) ──
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
