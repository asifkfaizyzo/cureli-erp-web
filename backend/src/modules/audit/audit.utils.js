// backend/src/modules/audit/audit.utils.js (do not remove this comment)
// ============================================
// backend\src\modules\audit\audit.utils.js
// ============================================

import { ActorType } from './audit.constants.js';

/**
 * Extract audit context from Express request object
 * 
 * Use in controllers to build audit payloads consistently.
 * 
 * @param {import('express').Request} req - Express request object
 * @returns {Object} Partial audit payload with actor and request context
 * 
 * @example
 * // In a controller:
 * const context = extractRequestContext(req);
 * await audit.log({
 *   action: AuditAction.USER_CREATED,
 *   entity_type: EntityType.USER,
 *   entity_id: newUser.user_id,
 *   ...context,
 *   metadata: { ... }
 * });
 */
export function extractRequestContext(req) {
  // Determine actor type and details
  let actor_type = ActorType.SYSTEM;
  let actor_id = null;
  let actor_role = 'SYSTEM';
  let shop_id = null;
  let branch_id = null;

  // ERP User (from auth middleware)
  if (req.user) {
    actor_type = ActorType.ERP_USER;
    actor_id = req.user.user_id || null;
    actor_role = req.user.role || null;
    shop_id = req.user.shop_id || null;
    branch_id = req.user.branch_id || null;
  }
  // CAdmin (from cadmin auth middleware)
  else if (req.cadmin) {
    actor_type = ActorType.CADMIN;
    actor_id = req.cadmin.cadmin_id || null;
    actor_role = req.cadmin.is_super_cadmin ? "SUPER_CADMIN" : "CUSTOM_ROLE";
    // CAdmins don't have shop/branch context
    shop_id = null;
    branch_id = null;
  }

  // Extract IP address (handle proxies)
  const ip_address = extractIpAddress(req);

  // Extract user agent
  const user_agent = req.headers?.['user-agent'] || null;

  return {
    actor_type,
    actor_id,
    actor_role,
    shop_id,
    branch_id,
    ip_address,
    user_agent,
  };
}

/**
 * Extract client IP address from request
 * Handles common proxy headers
 * 
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export function extractIpAddress(req) {
  // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    // Take the first IP (original client)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || null;
  }

  // X-Real-IP (nginx)
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Direct connection
  return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Build a system actor context for cron jobs / background tasks
 * 
 * @param {string} [jobName] - Optional job identifier
 * @returns {Object} Partial audit payload for system actions
 * 
 * @example
 * // In a cron job:
 * const context = buildSystemContext('subscription-expiry-check');
 * await audit.log({
 *   action: AuditAction.SUBSCRIPTION_ENTERED_GRACE,
 *   entity_type: EntityType.SUBSCRIPTION,
 *   entity_id: subscription.subscription_id,
 *   ...context,
 * });
 */
export function buildSystemContext(jobName = null) {
  return {
    actor_type: ActorType.SYSTEM,
    actor_id: null,
    actor_role: jobName ? `SYSTEM:${jobName}` : 'SYSTEM',
    shop_id: null,
    branch_id: null,
    ip_address: null,
    user_agent: jobName ? `CronJob/${jobName}` : 'System/Internal',
  };
}

/**
 * Build CAdmin actor context manually (when req.cadmin is not available)
 * 
 * @param {Object} cadmin - CAdmin object
 * @param {string} cadmin.cadmin_id
 * @param {string} cadmin.role
 * @returns {Object} Partial audit payload
 */
export function buildCAdminContext(cadmin) {
  return {
    actor_type: ActorType.CADMIN,
    actor_id: cadmin.cadmin_id,
    actor_role: cadmin.is_super_cadmin ? "SUPER_CADMIN" : "CUSTOM_ROLE",
    shop_id: null,
    branch_id: null,
  };
}

/**
 * Build ERP User actor context manually
 * 
 * @param {Object} user - User object
 * @param {string} user.user_id
 * @param {string} user.role
 * @param {string} [user.shop_id]
 * @param {string} [user.branch_id]
 * @returns {Object} Partial audit payload
 */
export function buildUserContext(user) {
  return {
    actor_type: ActorType.ERP_USER,
    actor_id: user.user_id,
    actor_role: user.role,
    shop_id: user.shop_id || null,
    branch_id: user.branch_id || null,
  };
}