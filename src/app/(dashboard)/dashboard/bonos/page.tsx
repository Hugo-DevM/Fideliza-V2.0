import { redirect } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';
import BonusClient from './BonusClient';

export const metadata = { title: 'Bonos — Fideliza' };

// Units are program-type agnostic: the same value maps to points / stamps / visits /
// cashback cents depending on whichever program the customer transacts in next.

export default async function BonusPage() {
  const { tenantId, effectivePlan, settings } = await getAuthenticatedTenant();

  if (!getPlanLimits(effectivePlan).birthdayRewards) {
    redirect('/dashboard/settings');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // Fetch pending (unclaimed, non-expired) bonus credits for this tenant
  const { data: pendingRows } = await db
    .from('customer_bonus_credits')
    .select('id, customer_id, bonus_type, units, expires_at, created_at, customers(name, access_code)')
    .eq('tenant_id', tenantId)
    .is('claimed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(200) as {
      data: Array<{
        id: string;
        customer_id: string;
        bonus_type: 'birthday' | 'reactivation';
        units: number;
        expires_at: string;
        created_at: string;
        customers: { name: string; access_code: string } | null;
      }> | null;
    };

  const s = settings as any;
  const cfg = {
    birthday_bonus_points:          s.birthday_bonus_points          ?? 50,
    birthday_bonus_stamps:          s.birthday_bonus_stamps          ?? 1,
    birthday_bonus_visits:          s.birthday_bonus_visits          ?? 1,
    birthday_bonus_expiry_days:     s.birthday_bonus_expiry_days     ?? 30,
    reactivation_bonus_points:      s.reactivation_bonus_points      ?? 50,
    reactivation_bonus_stamps:      s.reactivation_bonus_stamps      ?? 1,
    reactivation_bonus_visits:      s.reactivation_bonus_visits      ?? 1,
    reactivation_bonus_expiry_days: s.reactivation_bonus_expiry_days ?? 30,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bonos de fidelización</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configura cuántas unidades se regalan en cada campaña y por cuánto tiempo son válidas.
          Los bonos se acreditan automáticamente cuando el cliente realiza su próxima visita.
        </p>
      </div>

      <BonusClient cfg={cfg} pendingRows={pendingRows ?? []} />
    </div>
  );
}
