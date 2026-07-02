import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import OnboardForm from './OnboardForm';

export const metadata = { title: 'Configura tu negocio — Fideliza' };

export default async function OnboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // If already onboarded, go to dashboard — but only when NOT coming from
  // the dashboard redirect (which would create a loop). We detect this by
  // checking if the tenant actually exists via the action, not just metadata.
  // To be safe, we never redirect back to dashboard from here; the form
  // submission action handles that redirect after verifying the tenant.

  const displayName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OnboardForm displayName={displayName} />
    </div>
  );
}
