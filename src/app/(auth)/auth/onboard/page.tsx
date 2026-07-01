import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import OnboardForm from './OnboardForm';

export const metadata = { title: 'Configura tu negocio — Fideliza' };

export default async function OnboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Already onboarded → go straight to dashboard
  if (user.user_metadata?.tenant_id) redirect('/dashboard');

  const displayName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OnboardForm displayName={displayName} />
    </div>
  );
}
