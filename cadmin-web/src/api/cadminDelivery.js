//cadmin-web\src\api\cadminDelivery.js
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

/**
 * Unassign the current rider from a delivery order (CAdmin override).
 * @param {string} orderId
 */
export function unassignRiderFromOrder(orderId) {
  return CAdminAPI.post("/delivery/unassign", {
    order_id: orderId,
  });
}

// ── Same Day Batch Assignment ──────────────────────────────

/**
 * Get available TEAM riders for Same Day batch assignment.
 */
export function getAvailableTeamRiders() {
  return CAdminAPI.get("/delivery/available-team-riders");
}

/**
 * Assign multiple Same Day orders to a team rider as a batch.
 * @param {string[]} orderIds
 * @param {string} riderId
 */
export function batchAssignOrders(orderIds, riderId) {
  return CAdminAPI.post("/delivery/batch-assign", {
    order_ids: orderIds,
    rider_id: riderId,
  });
}

/**
 * Add a single order to a rider's existing Same Day batch.
 * @param {string} orderId
 * @param {string} riderId
 */
export function addOrderToBatch(orderId, riderId) {
  return CAdminAPI.post("/delivery/add-to-batch", {
    order_id: orderId,
    rider_id: riderId,
  });
}

/**
 * Reassign a single order from one rider's batch to another.
 * @param {string} deliveryId
 * @param {string} newRiderId
 */
export function reassignBatchOrder(deliveryId, newRiderId) {
  return CAdminAPI.post("/delivery/reassign-batch-order", {
    delivery_id: deliveryId,
    new_rider_id: newRiderId,
  });
}

/**
 * Get all orders in a Same Day batch.
 * @param {string} batchGroupId
 */
export function getBatchOrders(batchGroupId) {
  return CAdminAPI.get("/delivery/batch-orders", {
    params: { batch_group_id: batchGroupId },
  });
}

// APPEND to end of cadmin-web/src/api/cadminDelivery.js

/**
 * Get all active Same Day batches across team riders.
 */
export function getActiveBatches() {
  return CAdminAPI.get("/delivery/active-batches");
}

/**
 * Remove a single order from its Same Day batch.
 * @param {string} deliveryId
 */
export function removeOrderFromBatch(deliveryId) {
  return CAdminAPI.post("/delivery/remove-from-batch", {
    delivery_id: deliveryId,
  });
}

/**
 * Get paginated Same Day batch history (completed/cancelled batches) for
 * a given IST calendar date.
 * @param {Object} params - { date: "YYYY-MM-DD", page, limit }
 */
export function getBatchHistory({ date, page = 1, limit = 20 } = {}) {
  return CAdminAPI.get("/delivery/batch-history", {
    params: { date, page, limit },
  });
}