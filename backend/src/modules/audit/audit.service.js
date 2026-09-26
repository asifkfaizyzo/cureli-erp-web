// backend/src/modules/audit/audit.service.js (do not remove this comment)
// ============================================
// Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\audit\audit.service.js
// ============================================
//
// Centralized, append-only audit logging system.
// Records irreversible business facts.
//
// ============================================

import prisma from '../../config/prisma.js';
import { isSecurityAction } from './audit.constants.js';
import {
  validateAuditPayload,
  normalizeAuditPayload,
  AuditValidationError,
} from './audit.validators.js';

/**
 * Log a single audit event
 * 
 * @param {Object} payload - Audit event data
 * @param {string} payload.action - Action from AuditAction (REQUIRED)
 * @param {string} payload.actor_type - 'erp_user' | 'cadmin' | 'system' (REQUIRED)
 * @param {string|null} [payload.actor_id] - UUID of the actor
 * @param {string|null} [payload.actor_role] - Role snapshot at time of action
 * @param {string} payload.entity_type - Entity type from EntityType (REQUIRED)
 * @param {string|null} [payload.entity_id] - UUID of affected entity
 * @param {string|null} [payload.shop_id] - Shop context
 * @param {string|null} [payload.branch_id] - Branch context
 * @param {string|null} [payload.correlation_id] - For grouping related events
 * @param {string|null} [payload.reason_code] - From AuditReasonCode
 * @param {Object|null} [payload.metadata] - Additional context (flexible structure)
 * @param {string|null} [payload.ip_address] - Request IP
 * @param {string|null} [payload.user_agent] - Request user agent
 * 
 * @param {Object} [options] - Options
 * @param {Object} [options.tx] - Prisma transaction client
 * 
 * @returns {Promise<{ success: boolean, audit_id?: string, error?: string }>}
 * 
 * @throws {AuditValidationError} Always throws on validation errors
 * @throws {Error} Throws on DB errors for security actions
 * 
 * @example
 * // Basic usage
 * await audit.log({
 *   action: AuditAction.USER_CREATED,
 *   actor_type: ActorType.ERP_USER,
 *   actor_id: currentUser.user_id,
 *   actor_role: currentUser.role,
 *   entity_type: EntityType.USER,
 *   entity_id: newUser.user_id,
 *   shop_id: shop.shop_id,
 *   reason_code: AuditReasonCode.USER_REQUEST,
 *   metadata: { invited_via: 'dashboard' },
 * });
 * 
 * @example
 * // With transaction
 * await prisma.$transaction(async (tx) => {
 *   const user = await tx.user.create({ ... });
 *   await audit.log({
 *     action: AuditAction.USER_CREATED,
 *     ...context,
 *   }, { tx });
 * });
 */
export async function log(payload, options = {}) {
  const { tx } = options;
  const db = tx || prisma;

  // ========================================
  // VALIDATION (Always throws on error)
  // ========================================
  const { warnings } = validateAuditPayload(payload);

  // Log warnings (non-blocking)
  if (warnings.length > 0) {
    console.warn('[Audit] Validation warnings:', warnings.join('; '), {
      action: payload.action,
    });
  }

  // ========================================
  // NORMALIZE PAYLOAD
  // ========================================
  const normalizedPayload = normalizeAuditPayload(payload);

  // ========================================
  // DATABASE INSERT
  // ========================================
  const isSecurityCritical = isSecurityAction(payload.action);

  try {
    const auditLog = await db.auditLog.create({
      data: normalizedPayload,
    });

    return {
      success: true,
      audit_id: auditLog.audit_id,
    };
  } catch (error) {
    // Security actions: MUST throw (caller must handle)
    if (isSecurityCritical) {
      console.error('[Audit] CRITICAL: Failed to log security action', {
        action: payload.action,
        error: error.message,
      });
      throw error;
    }

    // Non-security actions: log and return failure
    console.error('[Audit] Failed to log audit event', {
      action: payload.action,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Log multiple audit events in a batch
 * 
 * @param {Object[]} payloads - Array of audit event payloads
 * @param {Object} [options] - Options
 * @param {Object} [options.tx] - Prisma transaction client
 * @param {string} [options.correlation_id] - Shared correlation ID for all events
 * 
 * @returns {Promise<{ success: boolean, count?: number, errors?: Array<{index: number, error: string}> }>}
 * 
 * @throws {AuditValidationError} If ANY payload has validation errors
 * @throws {Error} If ANY security action fails to insert
 * 
 * @example
 * // Bulk disable users due to plan downgrade
 * const correlationId = crypto.randomUUID();
 * await audit.logMany(
 *   disabledUsers.map(user => ({
 *     action: AuditAction.USER_DEACTIVATED,
 *     actor_type: ActorType.SYSTEM,
 *     entity_type: EntityType.USER,
 *     entity_id: user.user_id,
 *     shop_id: shop.shop_id,
 *     reason_code: AuditReasonCode.PLAN_LIMIT_ENFORCEMENT,
 *     metadata: { reason: 'Plan downgrade', new_limit: 5 },
 *   })),
 *   { tx, correlation_id: correlationId }
 * );
 */
export async function logMany(payloads, options = {}) {
  const { tx, correlation_id } = options;
  const db = tx || prisma;

  if (!Array.isArray(payloads) || payloads.length === 0) {
    return { success: true, count: 0 };
  }

  // ========================================
  // VALIDATE ALL PAYLOADS FIRST
  // ========================================
  const allWarnings = [];
  let hasSecurityAction = false;

  for (let i = 0; i < payloads.length; i++) {
    try {
      const { warnings } = validateAuditPayload(payloads[i]);
      if (warnings.length > 0) {
        allWarnings.push({ index: i, warnings });
      }
      if (isSecurityAction(payloads[i].action)) {
        hasSecurityAction = true;
      }
    } catch (error) {
      // Re-throw with index context
      error.message = `Payload[${i}]: ${error.message}`;
      throw error;
    }
  }

  // Log warnings
  if (allWarnings.length > 0) {
    console.warn('[Audit] Batch validation warnings:', allWarnings);
  }

  // ========================================
  // NORMALIZE ALL PAYLOADS
  // ========================================
  const normalizedPayloads = payloads.map(payload => {
    const normalized = normalizeAuditPayload(payload);
    // Apply shared correlation_id if provided
    if (correlation_id && !normalized.correlation_id) {
      normalized.correlation_id = correlation_id;
    }
    return normalized;
  });

  // ========================================
  // BATCH INSERT
  // ========================================
  try {
    const result = await db.auditLog.createMany({
      data: normalizedPayloads,
    });

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    // If any security action was in batch, this is critical
    if (hasSecurityAction) {
      console.error('[Audit] CRITICAL: Batch insert failed with security actions', {
        payloadCount: payloads.length,
        error: error.message,
      });
      throw error;
    }

    console.error('[Audit] Batch insert failed', {
      payloadCount: payloads.length,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a scoped logger with pre-filled context
 * Useful when logging multiple events with same actor/shop context
 * 
 * @param {Object} baseContext - Base context to apply to all logs
 * @returns {Object} Scoped audit logger with log() and logMany()
 * 
 * @example
 * const scopedAudit = audit.withContext({
 *   actor_type: ActorType.CADMIN,
 *   actor_id: cadmin.cadmin_id,
 *   actor_role: cadmin.is_super_cadmin ? "SUPER_CADMIN" : "CUSTOM_ROLE",,
 *   ip_address: req.ip,
 *   user_agent: req.headers['user-agent'],
 * });
 * 
 * await scopedAudit.log({
 *   action: AuditAction.PLAN_CREATED,
 *   entity_type: EntityType.PLAN,
 *   entity_id: plan.plan_id,
 * });
 */
export function withContext(baseContext) {
  return {
    /**
     * Log with merged context
     * @param {Object} payload
     * @param {Object} [options]
     */
    log: (payload, options = {}) => {
      return log({ ...baseContext, ...payload }, options);
    },

    /**
     * Log many with merged context
     * @param {Object[]} payloads
     * @param {Object} [options]
     */
    logMany: (payloads, options = {}) => {
      const mergedPayloads = payloads.map(p => ({ ...baseContext, ...p }));
      return logMany(mergedPayloads, options);
    },
  };
}