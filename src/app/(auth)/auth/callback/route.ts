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
 * El destino post-login sale de la cookie POST_AUTH_NEXT_COOKIE (la pone
 * GoogleAuthButton antes de salir a Google) o, si no está, del query param
 * `next`. Por defecto /dashboard.
 */

import { NextResponse } from 'next/server';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';
import { POST_AUTH_NEXT_COOKIE, sanitizeNext } from '@/lib/auth/post-auth-redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code      = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type      = searchParams.get('type') as EmailOtpType | null;

  const cookieStore = await cookies();

  // La cookie manda sobre el query param: es la única vía por la que el
  // destino sobrevive la ida y vuelta a Google (ver post-auth-redirect.ts).
  // Se quema aquí mismo — es de un solo uso, y si no se borra el siguiente
  // login del mismo navegador heredaría el destino de este.
  const cookieNext = cookieStore.get(POST_AUTH_NEXT_COOKIE)?.value;
  if (cookieNext) cookieStore.delete(POST_AUTH_NEXT_COOKIE);

  const next = sanitizeNext(
    cookieNext ? decodeURIComponent(cookieNext) : searchParams.get('next')
  );

  const leave = (path: string) => NextResponse.redirect(`${origin}${path}`);

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
    if (!error && data.user) {
      const isOAuth = data.user.app_metadata?.provider !== 'email';
      const hasTenant = !!data.user.user_metadata?.tenant_id;

      // OAuth new user → onboarding. /admin es la excepción: no depende de un
      // tenant, y mandar al dueño del SaaS a inventarse un negocio para entrar
      // a su propio panel no tiene sentido.
      if (isOAuth && !hasTenant) {
        return leave(next === '/admin' ? '/admin' : '/auth/onboard');
      }
      // Resto de flujos (OAuth ya dado de alta, magic link, email) → `next`,
      // que por defecto ya es /dashboard.
      return leave(next);
    }
  }

  // ── 2. Token-hash flow (cross-device email links: signup confirmation, etc.) ──
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return leave(next);
    }
  }

  return leave('/auth/login?error=auth_failed');
}
