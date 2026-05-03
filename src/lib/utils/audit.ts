/**
 * Audit logging — writes security-sensitive events to the audit_events table.
 *
 * All inserts use the service-role client (bypasses RLS) so the app can
 * always write audit records regardless of the authenticated user's role.
 *
 * Events are IMMUTABLE once written — no updates or deletes are possible
 * (enforced by DB triggers in migration 007).
 *
 * Usage:
 *   await auditLog({
 *     tenantId,
 *     eventType: 'transaction.earn',
 *     resourceType: 'customer',
 *     resourceId: customerId,
 *     metadata: { points_delta: 50, program_id: '...' },
 *     requestId: 'r_k3x7p2',
 *   });
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { Json } from '@/lib/supabase/database.types';

export interface AuditEventInput {
  tenantId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  requestId?: string | null;
}

/**
 * Write a single audit event.
 *
 * Fire-and-forget safe: errors are logged but never thrown,
 * so a failed audit write never disrupts the business operation.
 */
export async function auditLog(input: AuditEventInput): Promise<void> {
  try {
    const db = createServiceRoleClient();
    const { error } = await db.from('audit_events').insert({
      tenant_id:     input.tenantId,
      actor_id:      input.actorId   ?? null,
      actor_email:   input.actorEmail ?? null,
      event_type:    input.eventType,
      resource_type: input.resourceType ?? null,
      resource_id:   input.resourceId  ?? null,
      metadata:      (input.metadata ?? {}) as unknown as Json,
      ip_address:    input.ipAddress   ?? null,
      request_id:    input.requestId   ?? null,
    });

    if (error) {
      logger.warn('audit_log write failed', {
        error: error.message,
        event_type: input.eventType,
        tenantId: input.tenantId,
      });
    }
  } catch (err) {
    // Never let an audit failure break the calling operation
    logger.warn('audit_log threw unexpectedly', {
      error: String(err),
      event_type: input.eventType,
    });
  }
}

/**
 * Well-known event type constants — use these to avoid typos.
 */
export const AuditEvent = {
  // Auth
  AUTH_LOGIN_SUCCESS:   'auth.login_success',
  AUTH_LOGIN_FAILED:    'auth.login_failed',
  AUTH_LOGOUT:          'auth.logout',

  // Customers
  CUSTOMER_CREATED:      'customer.created',
  CUSTOMER_UPDATED:      'customer.updated',
  CUSTOMER_DEACTIVATED:  'customer.deactivated',
  CUSTOMER_REACTIVATED:  'customer.reactivated',

  // Programs
  PROGRAM_CREATED:        'program.created',
  PROGRAM_STATUS_CHANGED: 'program.status_changed',
  PROGRAM_ARCHIVED:       'program.archived',

  // Transactions
  TRANSACTION_EARN:       'transaction.earn',
  TRANSACTION_REDEEM:     'transaction.redeem',
  TRANSACTION_ADJUSTMENT: 'transaction.adjustment',
  TRANSACTION_REFUND:     'transaction.refund',

  // Rewards
  REWARD_VERIFIED:             'reward.verified',
  REWARD_VERIFICATION_FAILED:  'reward.verification_failed',

  // Settings
  SETTINGS_UPDATED: 'settings.updated',
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];
