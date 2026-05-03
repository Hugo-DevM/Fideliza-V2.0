export {
  resolveTenant,
  getTenantProfile,
  getTenantBySubdomainPublic,
  onboardTenant,
  modifyTenant,
} from './tenant.service';
export type { Tenant, TenantSettings, TenantPlan } from '@/lib/types';
