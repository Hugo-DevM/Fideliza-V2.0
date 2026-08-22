import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth/admin-session';

/**
 * Guard de las páginas de /admin: cuenta de ADMIN_EMAIL + segundo factor.
 *
 * Vive aquí y no copiado en cada página porque ahora son dos, y duplicar dos
 * comprobaciones es la forma clásica de que una de ellas se quede con solo una.
 *
 * Las Server Actions NO pasan por aquí: tienen su propio verifyAdmin() en
 * actions.ts, porque son endpoints POST invocables sin tocar ninguna página.
 */
export async function requireAdminPage(currentPath: string): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect(`/auth/login?next=${encodeURIComponent(currentPath)}`);
  }

  const jar = await cookies();
  if (!verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value, process.env.ADMIN_SECRET)) {
    redirect('/admin/verify');
  }
}
