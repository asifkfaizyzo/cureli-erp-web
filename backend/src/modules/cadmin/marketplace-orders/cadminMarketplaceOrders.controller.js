// backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.controller.js (do not remove this comment)
import {
  listAllOrders,
  getOrderDetail,
  updateOrderStatus,
  updatePaymentStatus,
} from "./cadminMarketplaceOrders.service.js";
import { success, fail } from "../../../utils/response.js";

/**
 * GET /cadmin/marketplace-orders
 * List all marketplace orders across all shops.
 * Query: page, limit, search, status
 */
export async function listOrders(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();

    const result = await listAllOrders({ page, limit, search, status });
    return success(res, result, "Orders fetched");
  } catch (err) {
    console.error("[CAdmin Orders] listOrders error:", err.message);
    return fail(res, "Failed to fetch orders", 500);
  }
}

/**
 * GET /cadmin/marketplace-orders/:orderId
 */
export async function getOrder(req, res) {
  try {
    const order = await getOrderDetail(req.params.orderId);
    return success(res, order, "Order fetched");
  } catch (err) {
    console.error("[CAdmin Orders] getOrder error:", err.message);
    if (err.message === "Order not found") {
      return fail(res, "Order not found", 404);
    }
    return fail(res, "Failed to fetch order", 500);
  }
}

/**
 * PATCH /cadmin/marketplace-orders/:orderId/status
 * Body: { status, reason? }
 */
export async function updateStatus(req, res) {
  try {
    const { status, reason = "" } = req.body || {};

    if (!status) {
      return fail(res, "status is required", 400);
    }

    const cadmin_name =
      req.cadmin?.username || req.cadmin?.full_name || "CAdmin";

    const data = await updateOrderStatus({
      order_id: req.params.orderId,
      new_status: status,
      reason,
      cadmin_name,
    });

    return success(res, data, "Order status updated");
  } catch (err) {
    console.error("[CAdmin Orders] updateStatus error:", err.message);

    const statusMap = {
      NOT_FOUND: 404,
      INVALID_STATUS: 400,
      TERMINAL_STATE: 409,
      SAME_STATUS: 409,
      REASON_REQUIRED: 400,
    };

    return fail(res, err.message, statusMap[err.code] || 500);
  }
}

/**
 * PATCH /cadmin/marketplace-orders/:orderId/payment-status
 * Body: { payment_status, reason? }
 */
export async function updatePaymentStatusHandler(req, res) {
  try {
    const { payment_status, reason = "" } = req.body || {};

    if (!payment_status) {
      return fail(res, "payment_status is required", 400);
    }

    const cadmin_name =
      req.cadmin?.username || req.cadmin?.full_name || "CAdmin";

    const data = await updatePaymentStatus({
      order_id: req.params.orderId,
      new_payment_status: payment_status,
      reason,
      cadmin_name,
    });

    return success(res, data, "Payment status updated");
  } catch (err) {
    console.error("[CAdmin Orders] updatePaymentStatus error:", err.message);

    const statusMap = {
      NOT_FOUND: 404,
      INVALID_PAYMENT_STATUS: 400,
      SAME_STATUS: 409,
      REASON_REQUIRED: 400,
    };

    return fail(res, err.message, statusMap[err.code] || 500);
  }
}