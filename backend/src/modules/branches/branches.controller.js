// backend/src/modules/branches/branches.controller.js (do not remove this comment)
// src/modules/branches/branches.controller.js

import { success, fail } from "../../utils/response.js";
import * as audit from "../audit/index.js";

import {
  getBranchesByShop,
  getBranchById,
  getBranchesForDropdown,
  canAccessBranch,
  getBranchLimits,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchActiveUsers,
  reactivateBranch,
  getBranchesForReassignment,
  getCurrentBranchWithShop, //  ADD THIS IMPORT
} from "./branches.service.js";

//  REMOVE the old `branchService` import - it doesn't exist

/**
 * GET /api/branches/current
 * Get current branch with shop details (for print headers, etc.)
 */
/**
 * GET /api/branches/current
 * Get current branch with shop details (for print headers, etc.)
 */
export async function getCurrentBranchController(req, res) {
  try {
    const { shop_id, branch_id, role } = req.user;

    // Check header for branch context (SA branch switching)
    let effectiveBranchId = branch_id;
    const headerBranchId =
      req.headers["x-branch-id"] || req.headers["x-current-branch"];
    if (!effectiveBranchId && headerBranchId) {
      effectiveBranchId = headerBranchId;
    }

   

    //  Call the SERVICE function
    const data = await getCurrentBranchWithShop(shop_id, effectiveBranchId);

    if (!data.branch && !data.shop) {
      return success(res, {
        branch: null,
        shop: null,
        message: "No branch or shop found",
      });
    }

    return success(res, data);
  } catch (error) {
    console.error("Get current branch error:", error);
    return fail(res, "Failed to fetch current branch", 500);
  }
}

//  REMOVE the duplicate getCurrentBranch function you added earlier
// Keep only getCurrentBranchController

/**
 * ============================================
 * REST OF YOUR EXISTING CONTROLLERS BELOW
 * (No changes needed to other controllers)
 * ============================================
 */

export async function getBranchesController(req, res) {
  try {
    const { shop_id, role, branch_id } = req.user;
    const { include_inactive } = req.query;

    if (!shop_id) {
      return fail(res, "Shop ID not found", 400);
    }

    // Super admin gets all branches
    if (role === "super_admin") {
      const branches = await getBranchesByShop(shop_id, {
        include_inactive: include_inactive === "true",
      });

      return success(res, {
        branches,
        total: branches.length,
      });
    }

    // Other roles only see their own branch
    if (!branch_id) {
      return success(res, {
        branches: [],
        total: 0,
      });
    }

    const branch = await getBranchById(branch_id, shop_id);

    return success(res, {
      branches: branch ? [branch] : [],
      total: branch ? 1 : 0,
    });
  } catch (error) {
    console.error("Get branches error:", error);
    return fail(res, "Failed to fetch branches", 500);
  }
}

export async function getBranchesDropdownController(req, res) {
  try {
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop ID not found", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Access denied", 403);
    }

    const branches = await getBranchesForDropdown(shop_id);

    return success(res, { branches });
  } catch (error) {
    console.error("Get branches dropdown error:", error);
    return fail(res, "Failed to fetch branches", 500);
  }
}

export async function getBranchController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role, branch_id: userBranchId } = req.user;

    // Check access
    if (role !== "super_admin" && userBranchId !== branch_id) {
      return fail(res, "Access denied to this branch", 403);
    }

    const branch = await getBranchById(branch_id, shop_id);

    if (!branch) {
      return fail(res, "Branch not found", 404);
    }

    return success(res, { branch });
  } catch (error) {
    console.error("Get branch error:", error);
    return fail(res, "Failed to fetch branch", 500);
  }
}

export async function switchBranchController(req, res) {
  try {
    const { branch_id } = req.validated || req.body;
    const { user_id, shop_id, role } = req.user;

    if (role !== "super_admin") {
      return fail(res, "Only Super Admin can switch branches", 403);
    }

    const hasAccess = await canAccessBranch(user_id, branch_id, shop_id);

    if (!hasAccess) {
      return fail(res, "Cannot access this branch", 403);
    }

    const branch = await getBranchById(branch_id, shop_id);

    if (!branch) {
      return fail(res, "Branch not found", 404);
    }

    if (!branch.is_active) {
      return fail(res, "Cannot switch to inactive branch", 400);
    }

    return success(
      res,
      {
        branch_id: branch.branch_id,
        branch_name: branch.branch_name,
        is_main: branch.is_main,
      },
      "Branch switched successfully",
    );
  } catch (error) {
    console.error("Switch branch error:", error);
    return fail(res, "Failed to switch branch", 500);
  }
}

export async function getBranchLimitsController(req, res) {
  try {
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const limits = await getBranchLimits(shop_id);

    return success(res, limits);
  } catch (err) {
    console.error("getBranchLimitsController error:", err);
    return fail(res, "Failed to fetch branch limits", 500);
  }
}

export async function getBranchUsersController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super admin can view this
    if (role !== "super_admin") {
      return fail(res, "Access denied", 403);
    }

    // Verify branch belongs to shop
    const branch = await getBranchById(branch_id, shop_id);
    if (!branch) {
      return fail(res, "Branch not found", 404);
    }

    const users = await getBranchActiveUsers(branch_id);

    return success(res, { users, count: users.length });
  } catch (err) {
    console.error("getBranchUsersController error:", err);
    return fail(res, "Failed to fetch branch users", 500);
  }
}

export async function getReassignmentOptionsController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super admin can view this
    if (role !== "super_admin") {
      return fail(res, "Access denied", 403);
    }

    const branches = await getBranchesForReassignment(shop_id, branch_id);

    return success(res, { branches });
  } catch (err) {
    console.error("getReassignmentOptionsController error:", err);
    return fail(res, "Failed to fetch reassignment options", 500);
  }
}

/**
 * ============================================
 * AUDITABLE CONTROLLERS
 * ============================================
 */

export async function createBranchController(req, res) {
  try {
    const { shop_id, role } = req.user;
    const data = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Only Super Admin can create branches", 403);
    }

    const auditContext = audit.extractRequestContext(req);
    const branch = await createBranch(shop_id, data, auditContext);

    return success(res, { branch }, "Branch created successfully", 201);
  } catch (err) {
    console.error("createBranchController error:", err);

    if (err.code === "BRANCH_LIMIT_EXCEEDED") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BRANCH_NAME_EXISTS") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to create branch", 500);
  }
}

export async function updateBranchController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role, branch_id: userBranchId } = req.user;
    const data = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role === "branch_admin" && branch_id !== userBranchId) {
      return fail(res, "You can only edit your own branch", 403);
    }

    const auditContext = audit.extractRequestContext(req);
    const branch = await updateBranch(branch_id, shop_id, data, auditContext);

    return success(res, { branch }, "Branch updated successfully");
  } catch (err) {
    console.error("updateBranchController error:", err);

    if (err.code === "BRANCH_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "BRANCH_NAME_EXISTS") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to update branch", 500);
  }
}

export async function deleteBranchController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Only Super Admin can delete branches", 403);
    }

    const auditContext = audit.extractRequestContext(req);
    await deleteBranch(branch_id, shop_id, auditContext);

    return success(res, null, "Branch deactivated successfully");
  } catch (err) {
    console.error("deleteBranchController error:", err);

    if (err.code === "BRANCH_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "CANNOT_DELETE_MAIN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BRANCH_HAS_USERS") {
      return fail(res, err.message, 400, {
        code: err.code,
        user_count: err.user_count,
      });
    }

    return fail(res, "Failed to delete branch", 500);
  }
}

export async function reactivateBranchController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Only Super Admin can reactivate branches", 403);
    }

    const auditContext = audit.extractRequestContext(req);
    const branch = await reactivateBranch(branch_id, shop_id, auditContext);

    return success(res, { branch }, "Branch reactivated successfully");
  } catch (err) {
    console.error("reactivateBranchController error:", err);

    if (err.code === "BRANCH_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "ALREADY_ACTIVE") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BRANCH_LIMIT_EXCEEDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to reactivate branch", 500);
  }
}
