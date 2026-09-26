// cadmin-web/src/api/cadminDelivery.js (do not remove this comment)
import CAdminAPI from "./axios";

/**
 * Get available riders for an order with their distances to the pharmacy.
 * @param {string} orderId
 * @param {Object} [params] - { rider_type, search }
 */
export function getAvailableRidersForOrder(orderId, params = {}) {
  return CAdminAPI.get("/delivery/available-riders", {
    params: {
      order_id: orderId,
      ...params,
    },
  });
}

/**
 * Assign a rider to a delivery order.
 * @param {string} orderId
 * @param {string} riderId
 */
export function assignRiderToOrder(orderId, riderId) {
  return CAdminAPI.post("/delivery/assign", {
    order_id: orderId,
    rider_id: riderId,
  });
}