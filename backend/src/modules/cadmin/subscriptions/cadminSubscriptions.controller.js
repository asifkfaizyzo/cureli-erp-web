// backend/src/modules/cadmin/subscriptions/cadminSubscriptions.controller.js (do not remove this comment)
// ============================================
// backend\src\modules\cadmin\subscriptions\cadminSubscriptions.controller.js
// ============================================

import * as svc from "./cadminSubscriptions.service.js";
import { success, fail } from "../../../utils/response.js";
import * as audit from "../../audit/index.js";

// ============================================
// GET AT-RISK SUBSCRIPTIONS
// ============================================

/**
 * GET /cadmin/subscriptions/at-risk
 * Get subscriptions expiring soon, in grace period, or suspended
 */
export async function getAtRiskController(req, res) {
  try {
    const { range = 30 } = req.query;

    const validRanges = [7, 14, 30];
    const rangeDays = validRanges.includes(Number(range)) ? Number(range) : 30;

    const result = await svc.getAtRiskSubscriptions(rangeDays);

    return success(res, result, "At-risk subscriptions fetched successfully");
  } catch (err) {
    console.error("getAtRiskController error:", err);
    return fail(res, err.message || "Failed to fetch at-risk subscriptions", 500);
  }
}

// ============================================
// GET SUBSCRIPTION BY ID
// ============================================

/**
 * GET /cadmin/subscriptions/:subscription_id
 * Get detailed subscription information
 */
export async function getSubscriptionByIdController(req, res) {
  try {
    const { subscription_id } = req.params;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    const result = await svc.getSubscriptionById(subscription_id);

    return success(res, result, "Subscription fetched successfully");
  } catch (err) {
    console.error("getSubscriptionByIdController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to fetch subscription", 500);
  }
}

// ============================================
// SEND PAYMENT REMINDER
// ============================================

/**
 * POST /cadmin/subscriptions/:subscription_id/remind
 * Send payment reminder to shop owner
 */
export async function sendReminderController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { method = "email" } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    const validMethods = ["email", "sms", "both"];
    if (!validMethods.includes(method)) {
      return fail(res, `Method must be one of: ${validMethods.join(", ")}`, 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.sendPaymentReminder(subscription_id, method, cadmin_id, auditContext);

    return success(res, result, "Payment reminder sent successfully");
  } catch (err) {
    console.error("sendReminderController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "ALREADY_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    if (err.code === "NO_EMAIL" || err.code === "NO_PHONE" || err.code === "MISSING_CONTACT") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to send reminder", 500);
  }
}

// ============================================
// EXTEND GRACE PERIOD
// ============================================

/**
 * POST /cadmin/subscriptions/:subscription_id/extend-grace
 * Extend grace period for a subscription
 */
export async function extendGraceController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { days, reason } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    if (!days || typeof days !== "number") {
      return fail(res, "Days (number) is required", 400);
    }

    if (!reason || typeof reason !== "string") {
      return fail(res, "Reason (string) is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.extendGracePeriod(subscription_id, days, reason, cadmin_id, auditContext);

    return success(res, result, "Grace period extended successfully");
  } catch (err) {
    console.error("extendGraceController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "VALIDATION_ERROR" || err.code === "ALREADY_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to extend grace period", 500);
  }
}

// ============================================
// FORCE SUSPEND SUBSCRIPTION
// ============================================

/**
 * POST /cadmin/subscriptions/:subscription_id/suspend
 * Force suspend a subscription
 */
export async function forceSuspendController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { reason } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    if (!reason || typeof reason !== "string") {
      return fail(res, "Reason (string) is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.forceSuspendSubscription(subscription_id, reason, cadmin_id, auditContext);

    return success(res, result, "Subscription suspended successfully");
  } catch (err) {
    console.error("forceSuspendController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "VALIDATION_ERROR" || err.code === "ALREADY_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to suspend subscription", 500);
  }
}

// ============================================
// REACTIVATE SUBSCRIPTION
// ============================================

/**
 * POST /cadmin/subscriptions/:subscription_id/reactivate
 * Reactivate a suspended subscription
 */
export async function reactivateController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { reason, extend_days = 30 } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    if (!reason || typeof reason !== "string") {
      return fail(res, "Reason (string) is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.reactivateSubscription(
      subscription_id,
      reason,
      extend_days,
      cadmin_id,
      auditContext
    );

    return success(res, result, "Subscription reactivated successfully");
  } catch (err) {
    console.error("reactivateController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "VALIDATION_ERROR" || err.code === "ALREADY_ACTIVE") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to reactivate subscription", 500);
  }
}