/**
 * Server-side Supabase client factory (Server Components, API Routes, Server Actions).
 *
 * IMPORTANT: Call createServerClient() once per request — never share instances
 * across requests. The cookies() call ties the client to the current request's
 * auth session, preventing token bleed between tenants.
 */
import 'server-only';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can be called from Server Components where mutation is
            // not allowed — safe to ignore; middleware handles session refresh.
          }
        },
      },
    }
  );
}

/**
 * Service-role client for operations that bypass RLS.
 * ONLY use this in trusted server-side contexts (migrations, admin jobs).
 * NEVER expose the service role key to the browser.
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
