// cadmin-web/src/api/cadminSubscriptions.js (do not remove this comment)
import CAdminAPI from "./axios";

// ============================================
// AT-RISK SUBSCRIPTIONS
// ============================================

/**
 * Get at-risk subscriptions (expiring, grace period, suspended)
 * @param {Object} params - { range: 7|14|30 }
 * @returns {Promise} { expiring: [], gracePeriod: [], suspended: [], counts: {} }
 */
export function getAtRiskSubscriptions(params = {}) {
  return CAdminAPI.get("/subscriptions/at-risk", { params });
}

/**
 * Get single subscription with full details
 * @param {string} subscriptionId 
 */
export function getSubscriptionById(subscriptionId) {
  return CAdminAPI.get(`/subscriptions/${subscriptionId}`);
}

// ============================================
// SUBSCRIPTION ACTIONS
// ============================================

/**
 * Send payment reminder to shop owner
 * @param {string} subscriptionId 
 * @param {Object} data - { method: "email" | "sms" | "both" }
 */
export function sendPaymentReminder(subscriptionId, data) {
  return CAdminAPI.post(`/subscriptions/${subscriptionId}/remind`, data);
}

/**
 * Extend grace period for a subscription
 * @param {string} subscriptionId 
 * @param {Object} data - { days: number, reason: string }
 */
export function extendGracePeriod(subscriptionId, data) {
  return CAdminAPI.post(`/subscriptions/${subscriptionId}/extend-grace`, data);
}

/**
 * Force suspend a subscription immediately
 * @param {string} subscriptionId 
 * @param {Object} data - { reason: string }
 */
export function forceSuspendSubscription(subscriptionId, data) {
  return CAdminAPI.post(`/subscriptions/${subscriptionId}/suspend`, data);
}

/**
 * Reactivate a suspended subscription
 * @param {string} subscriptionId 
 * @param {Object} data - { reason: string, extend_days?: number }
 */
export function reactivateSubscription(subscriptionId, data) {
  return CAdminAPI.post(`/subscriptions/${subscriptionId}/reactivate`, data);
}