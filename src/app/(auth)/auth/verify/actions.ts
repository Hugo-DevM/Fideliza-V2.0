'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function verifyEmailAction(formData: FormData) {
  const tokenHash = formData.get('token_hash') as string;
  const type      = formData.get('type') as EmailOtpType;

  if (!tokenHash || !type) {
    redirect('/auth/login?error=auth_failed');
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()                { return cookieStore.getAll(); },
        setAll(cookiesToSet)    {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    redirect('/auth/login?error=auth_failed');
  }

  redirect('/auth/confirmed');
}
