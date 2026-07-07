/**
 * Tenant-scoped cache tags.
 *
 * Rarely-changing per-tenant data (tenant record, settings, portal branding,
 * rewards catalog) is cached with `unstable_cache` under these tags, so that
 * N customers of the same business hitting the portal produce 1 DB query
 * instead of N. Every mutation of that data must call
 * `revalidateTenantCache()` so changes are visible immediately.
 */

import { revalidateTag } from 'next/cache';

/** Tag for caches keyed by tenant id (tenant record, settings, rewards…). */
export const tenantTag = (tenantId: string) => `tenant:${tenantId}`;

/** Tag for the public subdomain → tenant lookup used by the portal. */
export const tenantSubdomainTag = (subdomain: string) =>
  `tenant-sub:${subdomain.toLowerCase()}`;

/**
 * Invalidates all cached data for a tenant. Call from any server action or
 * route handler that mutates `tenants` or `tenant_settings`.
 * Pass the subdomain when available to also refresh the public portal lookup.
 */
export function revalidateTenantCache(tenantId: string, subdomain?: string | null) {
  revalidateTag(tenantTag(tenantId), 'max');
  if (subdomain) revalidateTag(tenantSubdomainTag(subdomain), 'max');
}
