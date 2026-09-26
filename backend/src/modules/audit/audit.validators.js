// backend/src/modules/audit/audit.validators.js (do not remove this comment)
// ============================================
// backend\src\modules\audit\audit.validators.js
// ============================================

import { VALID_ACTIONS } from './audit.actions.js';
import { VALID_REASONS } from './audit.reasons.js';
import { VALID_ACTOR_TYPES, VALID_ENTITY_TYPES } from './audit.constants.js';

/**
 * UUID v4 regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUUID(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Validation error class for audit-specific errors
 */
export class AuditValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'AuditValidationError';
    this.field = field;
  }
}

/**
 * Validate a single audit payload
 * 
 * @param {Object} payload - Audit log payload
 * @throws {AuditValidationError} On validation failure
 * @returns {{ valid: true, warnings: string[] }}
 */
export function validateAuditPayload(payload) {
  const warnings = [];

  // ========================================
  // REQUIRED FIELDS — STRICT VALIDATION
  // ========================================

  // action (REQUIRED)
  if (!payload.action) {
    throw new AuditValidationError('action is required', 'action');
  }
  if (!VALID_ACTIONS.has(payload.action)) {
    throw new AuditValidationError(
      `Invalid action: "${payload.action}". Must be a valid AuditAction.`,
      'action'
    );
  }

  // actor_type (REQUIRED)
  if (!payload.actor_type) {
    throw new AuditValidationError('actor_type is required', 'actor_type');
  }
  if (!VALID_ACTOR_TYPES.has(payload.actor_type)) {
    throw new AuditValidationError(
      `Invalid actor_type: "${payload.actor_type}". Must be one of: ${[...VALID_ACTOR_TYPES].join(', ')}`,
      'actor_type'
    );
  }

  // entity_type (REQUIRED)
  if (!payload.entity_type) {
    throw new AuditValidationError('entity_type is required', 'entity_type');
  }
  if (!VALID_ENTITY_TYPES.has(payload.entity_type)) {
    throw new AuditValidationError(
      `Invalid entity_type: "${payload.entity_type}". Must be one of: ${[...VALID_ENTITY_TYPES].join(', ')}`,
      'entity_type'
    );
  }

  // ========================================
  // OPTIONAL FIELDS — VALIDATED IF PRESENT
  // ========================================

  // actor_id (optional, but expected for non-system actors)
  if (payload.actor_id !== null && payload.actor_id !== undefined) {
    if (!isValidUUID(payload.actor_id)) {
      throw new AuditValidationError(
        `Invalid actor_id: "${payload.actor_id}". Must be a valid UUID.`,
        'actor_id'
      );
    }
  } else if (payload.actor_type !== 'system') {
    // Warn if actor_id missing for non-system actors
    warnings.push(`actor_id is missing for actor_type="${payload.actor_type}"`);
  }

  // entity_id (optional)
  if (payload.entity_id !== null && payload.entity_id !== undefined) {
    if (!isValidUUID(payload.entity_id)) {
      throw new AuditValidationError(
        `Invalid entity_id: "${payload.entity_id}". Must be a valid UUID.`,
        'entity_id'
      );
    }
  }

  // shop_id (optional)
  if (payload.shop_id !== null && payload.shop_id !== undefined) {
    if (!isValidUUID(payload.shop_id)) {
      throw new AuditValidationError(
        `Invalid shop_id: "${payload.shop_id}". Must be a valid UUID.`,
        'shop_id'
      );
    }
  }

  // branch_id (optional)
  if (payload.branch_id !== null && payload.branch_id !== undefined) {
    if (!isValidUUID(payload.branch_id)) {
      throw new AuditValidationError(
        `Invalid branch_id: "${payload.branch_id}". Must be a valid UUID.`,
        'branch_id'
      );
    }
  }

  // correlation_id (optional)
  if (payload.correlation_id !== null && payload.correlation_id !== undefined) {
    if (!isValidUUID(payload.correlation_id)) {
      throw new AuditValidationError(
        `Invalid correlation_id: "${payload.correlation_id}". Must be a valid UUID.`,
        'correlation_id'
      );
    }
  }

  // reason_code (optional)
  if (payload.reason_code !== null && payload.reason_code !== undefined) {
    if (!VALID_REASONS.has(payload.reason_code)) {
      throw new AuditValidationError(
        `Invalid reason_code: "${payload.reason_code}". Must be a valid AuditReasonCode.`,
        'reason_code'
      );
    }
  }

  // metadata (optional, must be object or null)
  if (payload.metadata !== null && payload.metadata !== undefined) {
    if (typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
      throw new AuditValidationError(
        'metadata must be a plain object or null',
        'metadata'
      );
    }
  }

  // actor_role (optional, string)
  if (payload.actor_role !== null && payload.actor_role !== undefined) {
    if (typeof payload.actor_role !== 'string') {
      throw new AuditValidationError(
        'actor_role must be a string',
        'actor_role'
      );
    }
  }

  // ip_address (optional, string)
  if (payload.ip_address !== null && payload.ip_address !== undefined) {
    if (typeof payload.ip_address !== 'string') {
      throw new AuditValidationError(
        'ip_address must be a string',
        'ip_address'
      );
    }
  }

  // user_agent (optional, string)
  if (payload.user_agent !== null && payload.user_agent !== undefined) {
    if (typeof payload.user_agent !== 'string') {
      throw new AuditValidationError(
        'user_agent must be a string',
        'user_agent'
      );
    }
  }

  return { valid: true, warnings };
}

/**
 * Normalize payload — set defaults for optional fields
 * 
 * @param {Object} payload - Raw audit payload
 * @returns {Object} Normalized payload ready for DB insert
 */
export function normalizeAuditPayload(payload) {
  return {
    action: payload.action,
    actor_type: payload.actor_type,
    actor_id: payload.actor_id ?? null,
    actor_role: payload.actor_role ?? (payload.actor_type === 'system' ? 'SYSTEM' : null),
    entity_type: payload.entity_type,
    entity_id: payload.entity_id ?? null,
    shop_id: payload.shop_id ?? null,
    branch_id: payload.branch_id ?? null,
    correlation_id: payload.correlation_id ?? null,
    reason_code: payload.reason_code ?? null,
    metadata: payload.metadata ?? null,
    ip_address: payload.ip_address ?? null,
    user_agent: payload.user_agent ?? null,
  };
}