/**
 * Browser-side Supabase client (used in Client Components).
 * One instance per browser session — never carries tenant context,
 * tenant isolation is enforced server-side and via RLS.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
