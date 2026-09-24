// cadmin-web/src/api/cadminMarketplaceOrders.js (do not remove this comment)
// cadmin-web/src/api/cadminMarketplaceOrders.js

import CAdminAPI from "./axios";

/**
 * List all marketplace orders (paginated, filterable).
 * @param {Object} params - { page, limit, search, status }
 */
export function getMarketplaceOrders(params = {}) {
  return CAdminAPI.get("/marketplace-orders", { params });
}

/**
 * Get full detail of a single order.
 * @param {string} orderId
 */
export function getMarketplaceOrderById(orderId) {
  return CAdminAPI.get(`/marketplace-orders/${orderId}`);
}

/**
 * CAdmin override: update order status.
 * @param {string} orderId
 * @param {string} status - PLACED | ACCEPTED | READY_FOR_PICKUP | COMPLETED | REJECTED | CANCELLED
 * @param {string} [reason] - required for REJECTED / CANCELLED
 */
export function updateMarketplaceOrderStatus(orderId, status, reason = "") {
  return CAdminAPI.patch(`/marketplace-orders/${orderId}/status`, {
    status,
    reason,
  });
}

/**
 * CAdmin override: update payment status.
 * @param {string} orderId
 * @param {string} paymentStatus - PENDING | PAID | FAILED | REFUNDED | PARTIALLY_REFUNDED
 * @param {string} [reason] - required for REFUNDED / PARTIALLY_REFUNDED
 */
export function updateMarketplaceOrderPaymentStatus(
  orderId,
  paymentStatus,
  reason = ""
) {
  return CAdminAPI.patch(`/marketplace-orders/${orderId}/payment-status`, {
    payment_status: paymentStatus,
    reason,
  });
}