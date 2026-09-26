// backend/src/modules/cadmin/plans/cadminPlans.controller.js (do not remove this comment)
// ============================================
// backend\src\modules\cadmin\plans\cadminPlans.controller.js
// ============================================

import * as svc from "./cadminPlans.service.js";
import { success, fail } from "../../../utils/response.js";
import * as audit from "../../audit/index.js";

// ============================================
// LIST PLANS
// ============================================

/**
 * GET /cadmin/plans
 * List plans with filters, search, and pagination
 */
export async function listPlansController(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
      has_active_promo = false,
      sort_by = "created_at",
      sort_order = "desc",
      include_deleted = false,
    } = req.query;

    const result = await svc.listPlans({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      type,
      has_active_promo,
      sort_by,
      sort_order,
      include_deleted,
    });

    return success(res, result, "Plans fetched successfully");
  } catch (err) {
    console.error("listPlansController error:", err);
    return fail(res, err.message || "Failed to fetch plans", 500);
  }
}

// ============================================
// GET PLAN STATS
// ============================================

/**
 * GET /cadmin/plans/stats
 * Returns count of plans by status
 */
export async function getPlanStatsController(req, res) {
  try {
    const stats = await svc.getPlanStats();
    return success(res, stats, "Plan stats fetched successfully");
  } catch (err) {
    console.error("getPlanStatsController error:", err);
    return fail(res, err.message || "Failed to fetch stats", 500);
  }
}

// ============================================
// GET SINGLE PLAN
// ============================================

/**
 * GET /cadmin/plans/:plan_id
 * Get plan details with subscriber count
 */
export async function getPlanByIdController(req, res) {
  try {
    const { plan_id } = req.params;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const plan = await svc.getPlanById(plan_id);

    return success(res, plan, "Plan fetched successfully");
  } catch (err) {
    console.error("getPlanByIdController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to fetch plan", 500);
  }
}

// ============================================
// CREATE PLAN
// ============================================

/**
 * POST /cadmin/plans
 * Create new plan (always creates as DRAFT)
 */
export async function createPlanController(req, res) {
  try {
    const cadmin_id = req.cadmin?.cadmin_id;
    const data = req.body;

    if (!cadmin_id) {
      return fail(res, "Admin authentication required", 401);
    }

    const auditContext = audit.extractRequestContext(req);
    const plan = await svc.createPlan(data, cadmin_id, auditContext);

    return success(res, plan, "Plan created successfully", 201);
  } catch (err) {
    console.error("createPlanController error:", err);

    if (err.code === "VALIDATION_ERROR") {
      return fail(res, err.message, 400);
    }

    if (err.code === "SHOP_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to create plan", 500);
  }
}

// ============================================
// UPDATE PLAN
// ============================================

/**
 * PATCH /cadmin/plans/:plan_id
 * Update plan details (DRAFT plans only)
 */
export async function updatePlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;
    const updates = req.body;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, "No fields to update", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const plan = await svc.updatePlan(plan_id, updates, cadmin_id, auditContext);

    return success(res, plan, "Plan updated successfully");
  } catch (err) {
    console.error("updatePlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "NOT_DRAFT") {
      return fail(res, err.message, 400);
    }

    if (err.code === "DELETED") {
      return fail(res, err.message, 400);
    }

    if (err.code === "VALIDATION_ERROR") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to update plan", 500);
  }
}

// ============================================
// ACTIVATE PLAN
// ============================================

/**
 * POST /cadmin/plans/:plan_id/activate
 * Transition: DRAFT -> ACTIVE
 */
export async function activatePlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const plan = await svc.activatePlan(plan_id, cadmin_id, auditContext);

    return success(res, plan, "Plan activated successfully");
  } catch (err) {
    console.error("activatePlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "NOT_DRAFT") {
      return fail(res, err.message, 400);
    }

    if (err.code === "NAME_CONFLICT") {
      return fail(res, err.message, 409);
    }

    if (err.code === "DELETED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to activate plan", 500);
  }
}

// ============================================
// SUSPEND PLAN
// ============================================

/**
 * POST /cadmin/plans/:plan_id/suspend
 * Transition: ACTIVE -> DEPRECATED (if subscribers) or SUSPENDED (if none)
 */
export async function suspendPlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.suspendPlan(plan_id, cadmin_id, auditContext);

    const message = result.subscriber_count > 0
      ? `Plan deprecated. ${result.subscriber_count} active subscribers will continue until their term ends.`
      : "Plan suspended successfully";

    return success(res, result, message);
  } catch (err) {
    console.error("suspendPlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "NOT_ACTIVE") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to suspend plan", 500);
  }
}

// ============================================
// REACTIVATE PLAN
// ============================================

/**
 * POST /cadmin/plans/:plan_id/reactivate
 * Transition: SUSPENDED -> ACTIVE
 */
export async function reactivatePlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const plan = await svc.reactivatePlan(plan_id, cadmin_id, auditContext);

    return success(res, plan, "Plan reactivated successfully");
  } catch (err) {
    console.error("reactivatePlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "NOT_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    if (err.code === "HAS_SUBSCRIBERS") {
      return fail(res, err.message, 400);
    }

    if (err.code === "NAME_CONFLICT") {
      return fail(res, err.message, 409);
    }

    return fail(res, err.message || "Failed to reactivate plan", 500);
  }
}

// ============================================
// CLONE PLAN
// ============================================

/**
 * POST /cadmin/plans/:plan_id/clone
 * Creates a new DRAFT plan with copied values
 */
export async function clonePlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;
    const { name: customName } = req.body;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const plan = await svc.clonePlan(plan_id, cadmin_id, customName, auditContext);

    return success(res, plan, "Plan cloned successfully", 201);
  } catch (err) {
    console.error("clonePlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "DELETED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to clone plan", 500);
  }
}

// ============================================
// DELETE PLAN
// ============================================

/**
 * DELETE /cadmin/plans/:plan_id
 * Soft delete (DRAFT plans only)
 */
export async function deletePlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const plan = await svc.softDeletePlan(plan_id, cadmin_id, auditContext);

    return success(res, plan, "Plan deleted successfully");
  } catch (err) {
    console.error("deletePlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "NOT_DRAFT") {
      return fail(res, err.message, 400);
    }

    if (err.code === "ALREADY_DELETED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to delete plan", 500);
  }
}