/**
 * Supabase Auth callback.
 *
 * Handles two flows:
 *  1. PKCE  — `?code=xxx`         (same-device flows)
 *  2. OTP   — `?token_hash=xxx&type=yyy` (cross-device email links)
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
      // Detect password-recovery sessions by AMR claim so we always
      // land on the update-password page regardless of the `next` param.
      const amr = (data.session?.user as any)?.amr as { method: string }[] | undefined;
      const isRecovery = amr?.some((m) => m.method === 'recovery') ?? false;
      const destination = isRecovery ? '/auth/reset-password/update' : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // ── 2. Token-hash flow (cross-device: no code verifier needed) ──
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const destination = type === 'recovery' ? '/auth/reset-password/update' : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
