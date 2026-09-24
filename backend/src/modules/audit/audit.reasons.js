// backend/src/modules/audit/audit.reasons.js (do not remove this comment)
// backend/src/modules/audit/audit.reasons.js

// ============================================
// AUDIT REASON CODES
// ============================================
//
// Small, generic, reusable set of reason codes.
// Optional field — not every audit entry needs one.
//
// ============================================

export const AuditReasonCode = Object.freeze({
  /** Action initiated by user through UI/API */
  USER_REQUEST: "USER_REQUEST",

  /** Action performed by CAdmin */
  ADMIN_ACTION: "ADMIN_ACTION",

  /** System-enforced rule (policies, constraints) */
  SYSTEM_ENFORCEMENT: "SYSTEM_ENFORCEMENT",

  /** Plan limit exceeded, enforcement applied */
  PLAN_LIMIT_ENFORCEMENT: "PLAN_LIMIT_ENFORCEMENT",

  /** Payment failure, overdue, or billing issue */
  PAYMENT_ISSUE: "PAYMENT_ISSUE",

  /** Security-related action (password reset, suspension) */
  SECURITY_ACTION: "SECURITY_ACTION",

  /** Manual data correction by admin */
  DATA_CORRECTION: "DATA_CORRECTION",

  /** Automated process (cron, scheduled jobs) */
  AUTOMATION: "AUTOMATION",

  /**  NEW: Stock validation failure */
  STOCK_VALIDATION: "STOCK_VALIDATION",

  /**  NEW: Credit limit exceeded */
  CREDIT_LIMIT_EXCEEDED: "CREDIT_LIMIT_EXCEEDED",

  /**  NEW: Super admin override */
  SUPER_ADMIN_OVERRIDE: "SUPER_ADMIN_OVERRIDE",

  /** Reason not specified or not applicable */
  UNKNOWN: "UNKNOWN",
});

/**
 * Set for O(1) validation lookup
 */
export const VALID_REASONS = new Set(Object.values(AuditReasonCode));

/**
 * Validate if a reason code is valid
 * @param {string} reasonCode
 * @returns {boolean}
 */
export function isValidReasonCode(reasonCode) {
  return VALID_REASONS.has(reasonCode);
}
