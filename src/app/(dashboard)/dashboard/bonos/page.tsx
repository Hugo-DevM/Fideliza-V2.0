import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';
import type { SupabaseClient } from '@supabase/supabase-js';
import BonusClient from './BonusClient';
import ProUpgradeOverlay from '@/components/dashboard/ProUpgradeOverlay';

export const metadata = { title: 'Bonos — Fideliza' };

// Units are program-type agnostic: the same value maps to points / stamps / visits /
// cashback cents depending on whichever program the customer transacts in next.

export default async function BonusPage() {
  const { tenantId, effectivePlan, settings } = await getAuthenticatedTenant();

  if (!getPlanLimits(effectivePlan).birthdayRewards) {
    const defaultCfg = {
      birthday_bonus_points: 50, birthday_bonus_stamps: 1, birthday_bonus_visits: 1, birthday_bonus_expiry_days: 30,
      reactivation_bonus_points: 50, reactivation_bonus_stamps: 1, reactivation_bonus_visits: 1, reactivation_bonus_expiry_days: 30,
    };
    return (
      <ProUpgradeOverlay
        title="Bonos de fidelización"
        description="Regala bonos automáticos de cumpleaños y reactivación por WhatsApp para traer de vuelta a tus clientes. Disponible en el plan Pro."
        icon={<GiftIcon className="h-10 w-10 text-indigo-400" />}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bonos de fidelización</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configura cuántas unidades se regalan en cada campaña y por cuánto tiempo son válidas.
            </p>
          </div>
          <BonusClient cfg={defaultCfg} pendingRows={[]} />
        </div>
      </ProUpgradeOverlay>
    );
  }

  const db = createServiceRoleClient() as unknown as SupabaseClient;

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

  const s = settings;
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

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}
