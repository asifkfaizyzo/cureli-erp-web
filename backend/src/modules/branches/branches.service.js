// backend/src/modules/branches/branches.service.js (do not remove this comment)
// src/modules/branches/branches.service.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";

/**
 * ============================================
 * READ-ONLY FUNCTIONS (NO AUDIT NEEDED)
 * ============================================
 */

export async function getBranchesByShop(shop_id, options = {}) {
  const { include_inactive = false } = options;

  const where = { shop_id };

  if (!include_inactive) {
    where.is_active = true;
  }

  const branches = await prisma.branch.findMany({
    where,
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      created_at: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
  });

  return branches.map((branch) => ({
    ...branch,
    is_main: branch.branch_type === "main",
    user_count: branch._count.users,
    _count: undefined,
  }));
}

export async function getBranchById(branch_id, shop_id) {
  const branch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!branch) return null;

  return {
    ...branch,
    is_main: branch.branch_type === "main",
    user_count: branch._count.users,
    _count: undefined,
  };
}

export async function getBranchesForDropdown(shop_id) {
  const branches = await prisma.branch.findMany({
    where: {
      shop_id,
      is_active: true,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      is_active: true,
    },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
  });

  return branches.map((branch) => ({
    branch_id: branch.branch_id,
    branch_name: branch.branch_name,
    is_main: branch.branch_type === "main",
    is_active: branch.is_active,
  }));
}

export async function canAccessBranch(user_id, branch_id, shop_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      role: true,
      shop_id: true,
      branch_id: true,
    },
  });

  if (!user) return false;

  if (user.role === "super_admin" && user.shop_id === shop_id) {
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id,
        shop_id,
        is_active: true,
      },
    });
    return !!branch;
  }

  return user.branch_id === branch_id;
}

export async function getBranchLimits(shop_id) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: true,
      _count: {
        select: {
          branches: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  const subscription = shop.currentSubscription;

  if (!subscription) {
    return {
      current_count: shop._count.branches,
      max_allowed: 0,
      can_add: false,
      remaining: 0,
    };
  }

  const maxAllowed = subscription.branch_limit_snapshot;
  const currentCount = shop._count.branches;

  const canAdd = maxAllowed === -1 || currentCount < maxAllowed;
  const remaining =
    maxAllowed === -1 ? -1 : Math.max(0, maxAllowed - currentCount);

  return {
    current_count: currentCount,
    max_allowed: maxAllowed,
    can_add: canAdd,
    remaining: remaining,
  };
}

export async function isBranchNameUnique(
  shop_id,
  branch_name,
  exclude_branch_id = null,
) {
  const where = {
    shop_id,
    branch_name: {
      equals: branch_name.trim(),
      mode: "insensitive",
    },
    is_active: true,
  };

  if (exclude_branch_id) {
    where.branch_id = { not: exclude_branch_id };
  }

  const existing = await prisma.branch.findFirst({
    where,
    select: { branch_id: true },
  });

  return !existing;
}

export async function getBranchActiveUsers(branch_id) {
  const users = await prisma.user.findMany({
    where: {
      branch_id,
      is_active: true,
    },
    select: {
      user_id: true,
      full_name: true,
      role: true,
    },
  });

  return users;
}

export async function getBranchesForReassignment(shop_id, exclude_branch_id) {
  const branches = await prisma.branch.findMany({
    where: {
      shop_id,
      is_active: true,
      branch_id: { not: exclude_branch_id },
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
    },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
  });

  return branches.map((b) => ({
    ...b,
    is_main: b.branch_type === "main",
  }));
}

/**
 * ============================================
 * AUDITABLE FUNCTIONS
 * ============================================
 */

export async function createBranch(shop_id, data, auditContext, options = {}) {
  const { tx } = options;
  const db = tx || prisma;

  // Check plan limits
  const limits = await getBranchLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `Branch limit reached. Your plan allows ${limits.max_allowed} branches.`,
    );
    err.code = "BRANCH_LIMIT_EXCEEDED";
    throw err;
  }

  // Check name uniqueness
  const isUnique = await isBranchNameUnique(shop_id, data.branch_name);
  if (!isUnique) {
    const err = new Error("A branch with this name already exists");
    err.code = "BRANCH_NAME_EXISTS";
    throw err;
  }

  // Check if this is the first branch (make it main)
  const existingBranches = await db.branch.count({
    where: { shop_id, is_active: true },
  });
  const isFirstBranch = existingBranches === 0;

  // Create branch
  const branch = await db.branch.create({
    data: {
      shop_id,
      branch_name: data.branch_name.trim(),
      branch_type: isFirstBranch ? "main" : "branch",
      address_line_1: data.address_line_1 || null,
      address_line_2: data.address_line_2 || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      contact_number: data.contact_number || null,
      alternate_number: data.alternate_number || null,
      is_active: true,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      created_at: true,
    },
  });

  // Audit: Branch created
  await audit.log(
    {
      action: audit.AuditAction.BRANCH_CREATED,
      entity_type: audit.EntityType.BRANCH,
      entity_id: branch.branch_id,
      shop_id: shop_id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        branch_name: branch.branch_name,
        branch_type: branch.branch_type,
        city: branch.city,
        state: branch.state,
        is_first_branch: isFirstBranch,
      },
    },
    { tx },
  );

  return {
    ...branch,
    is_main: branch.branch_type === "main",
    user_count: 0,
  };
}

export async function updateBranch(
  branch_id,
  shop_id,
  data,
  auditContext,
  options = {},
) {
  const { tx } = options;
  const db = tx || prisma;

  // Get existing branch
  const existingBranch = await db.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
  });

  if (!existingBranch) {
    const err = new Error("Branch not found");
    err.code = "BRANCH_NOT_FOUND";
    throw err;
  }

  // Check name uniqueness if name is being changed
  const nameChanged =
    data.branch_name &&
    data.branch_name.trim().toLowerCase() !==
      existingBranch.branch_name.toLowerCase();

  if (nameChanged) {
    const isUnique = await isBranchNameUnique(
      shop_id,
      data.branch_name,
      branch_id,
    );
    if (!isUnique) {
      const err = new Error("A branch with this name already exists");
      err.code = "BRANCH_NAME_EXISTS";
      throw err;
    }
  }

  // Build update data
  const updateData = {};
  const changedFields = [];

  if (data.branch_name !== undefined) {
    updateData.branch_name = data.branch_name.trim();
    if (nameChanged) changedFields.push("branch_name");
  }
  if (data.address_line_1 !== undefined) {
    updateData.address_line_1 = data.address_line_1 || null;
    if (updateData.address_line_1 !== existingBranch.address_line_1) {
      changedFields.push("address_line_1");
    }
  }
  if (data.address_line_2 !== undefined) {
    updateData.address_line_2 = data.address_line_2 || null;
    if (updateData.address_line_2 !== existingBranch.address_line_2) {
      changedFields.push("address_line_2");
    }
  }
  if (data.city !== undefined) {
    updateData.city = data.city || null;
    if (updateData.city !== existingBranch.city) changedFields.push("city");
  }
  if (data.state !== undefined) {
    updateData.state = data.state || null;
    if (updateData.state !== existingBranch.state) changedFields.push("state");
  }
  if (data.pincode !== undefined) {
    updateData.pincode = data.pincode || null;
    if (updateData.pincode !== existingBranch.pincode)
      changedFields.push("pincode");
  }
  if (data.contact_number !== undefined) {
    updateData.contact_number = data.contact_number || null;
    if (updateData.contact_number !== existingBranch.contact_number) {
      changedFields.push("contact_number");
    }
  }
  if (data.alternate_number !== undefined) {
    updateData.alternate_number = data.alternate_number || null;
    if (updateData.alternate_number !== existingBranch.alternate_number) {
      changedFields.push("alternate_number");
    }
  }

  // Update branch
  const updatedBranch = await db.branch.update({
    where: { branch_id },
    data: updateData,
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      updated_at: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  // Audit: Branch renamed (if name changed) or general update
  if (nameChanged) {
    await audit.log(
      {
        action: audit.AuditAction.BRANCH_RENAMED,
        entity_type: audit.EntityType.BRANCH,
        entity_id: branch_id,
        shop_id: shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          previous_name: existingBranch.branch_name,
          new_name: updatedBranch.branch_name,
          changed_fields: changedFields,
        },
      },
      { tx },
    );
  } else if (changedFields.length > 0) {
    // Log general update if other fields changed
    await audit.log(
      {
        action: audit.AuditAction.BRANCH_RENAMED, // Reusing this action for updates
        entity_type: audit.EntityType.BRANCH,
        entity_id: branch_id,
        shop_id: shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          changed_fields: changedFields,
          branch_name: updatedBranch.branch_name,
        },
      },
      { tx },
    );
  }

  return {
    ...updatedBranch,
    is_main: updatedBranch.branch_type === "main",
    user_count: updatedBranch._count.users,
    _count: undefined,
  };
}

export async function deleteBranch(
  branch_id,
  shop_id,
  auditContext,
  options = {},
) {
  const { tx } = options;
  const db = tx || prisma;

  // Get branch
  const branch = await db.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
    include: {
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!branch) {
    const err = new Error("Branch not found");
    err.code = "BRANCH_NOT_FOUND";
    throw err;
  }

  // Cannot delete main branch
  if (branch.branch_type === "main") {
    const err = new Error("Cannot delete the main branch");
    err.code = "CANNOT_DELETE_MAIN";
    throw err;
  }

  // Check for active users
  if (branch._count.users > 0) {
    const err = new Error(
      `Cannot delete branch with active users. Please reassign ${branch._count.users} user(s) first.`,
    );
    err.code = "BRANCH_HAS_USERS";
    err.user_count = branch._count.users;
    throw err;
  }

  // Soft delete
  await db.branch.update({
    where: { branch_id },
    data: { is_active: false },
  });

  // Audit: Branch deactivated
  await audit.log(
    {
      action: audit.AuditAction.BRANCH_DEACTIVATED,
      entity_type: audit.EntityType.BRANCH,
      entity_id: branch_id,
      shop_id: shop_id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        branch_name: branch.branch_name,
        reason: "User requested deletion",
      },
    },
    { tx },
  );

  return { success: true };
}

export async function reactivateBranch(
  branch_id,
  shop_id,
  auditContext,
  options = {},
) {
  const { tx } = options;
  const db = tx || prisma;

  const branch = await db.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
  });

  if (!branch) {
    const err = new Error("Branch not found");
    err.code = "BRANCH_NOT_FOUND";
    throw err;
  }

  if (branch.is_active) {
    const err = new Error("Branch is already active");
    err.code = "ALREADY_ACTIVE";
    throw err;
  }

  // Check plan limits
  const limits = await getBranchLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `Cannot reactivate. Branch limit reached (${limits.max_allowed} branches).`,
    );
    err.code = "BRANCH_LIMIT_EXCEEDED";
    throw err;
  }

  const updatedBranch = await db.branch.update({
    where: { branch_id },
    data: { is_active: true },
    select: {
      branch_id: true,
      branch_name: true,
      is_active: true,
    },
  });

  // Audit: Branch reactivated
  await audit.log(
    {
      action: audit.AuditAction.BRANCH_REACTIVATED,
      entity_type: audit.EntityType.BRANCH,
      entity_id: branch_id,
      shop_id: shop_id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        branch_name: updatedBranch.branch_name,
      },
    },
    { tx },
  );

  return updatedBranch;
}

export async function getCurrentBranchController(req, res) {
  try {
    const { user_id, shop_id, branch_id, role } = req.user;

    //  For Super Admin, also check for branch context in headers or session
    // Some systems store the "switched" branch differently
    let effectiveBranchId = branch_id;

    // Check if branch context is passed in header (common pattern for SA branch switching)
    const headerBranchId =
      req.headers["x-branch-id"] || req.headers["x-current-branch"];
    if (!effectiveBranchId && headerBranchId) {
      effectiveBranchId = headerBranchId;
    }

   

    // If still no branch, try to get the main branch for the shop
    if (!effectiveBranchId && shop_id) {
     

      const mainBranch = await prisma.branch.findFirst({
        where: {
          shop_id,
          branch_type: "main",
          is_active: true,
        },
        select: {
          branch_id: true,
        },
      });

      if (mainBranch) {
        effectiveBranchId = mainBranch.branch_id;
      }
    }

    // If still no branch, try to get ANY active branch for the shop
    if (!effectiveBranchId && shop_id) {
     

      const anyBranch = await prisma.branch.findFirst({
        where: {
          shop_id,
          is_active: true,
        },
        select: {
          branch_id: true,
        },
      });

      if (anyBranch) {
        effectiveBranchId = anyBranch.branch_id;
       
      }
    }

    if (!effectiveBranchId) {
      // Still no branch - return shop data at least
      if (shop_id) {
        const shop = await prisma.shop.findUnique({
          where: { shop_id },
          select: {
            shop_id: true,
            business_name: true,
            legal_name: true,
            address_line_1: true,
            address_line_2: true,
            city: true,
            state: true,
            pincode: true,
          },
        });

        return success(res, {
          branch: null,
          shop: shop,
          message: "No branch selected, returning shop info",
        });
      }

      return success(res, {
        branch: null,
        shop: null,
        message: "No branch selected",
      });
    }

    //  Fetch branch and shop data
    const branch = await prisma.branch.findUnique({
      where: { branch_id: effectiveBranchId },
      select: {
        branch_id: true,
        branch_name: true,
        branch_type: true,
        address_line_1: true,
        address_line_2: true,
        city: true,
        state: true,
        pincode: true,
        contact_number: true,
        alternate_number: true,
        is_active: true,
        shop_id: true,
      },
    });

    if (!branch) {
      return fail(res, "Branch not found", 404);
    }

    // Fetch shop data
    const shop = await prisma.shop.findUnique({
      where: { shop_id: branch.shop_id },
      select: {
        shop_id: true,
        business_name: true,
        legal_name: true,
        address_line_1: true,
        address_line_2: true,
        city: true,
        state: true,
        pincode: true,
      },
    });

    return success(res, {
      branch: {
        ...branch,
        is_main: branch.branch_type === "main",
      },
      shop: shop,
    });
  } catch (error) {
    console.error("Get current branch error:", error);
    return fail(res, "Failed to fetch current branch", 500);
  }
}
/**
 * Get current branch with shop details for printing/display
 * @param {string} shop_id - Shop ID
 * @param {string} branch_id - Branch ID (optional)
 * @returns {Object} - { branch, shop }
 */
export async function getCurrentBranchWithShop(shop_id, branch_id = null) {
  try {
    let effectiveBranchId = branch_id;

    // If no branch_id provided, try to get main branch for shop
    if (!effectiveBranchId && shop_id) {
      const mainBranch = await prisma.branch.findFirst({
        where: {
          shop_id,
          branch_type: "main",
          is_active: true,
        },
        select: { branch_id: true },
      });

      if (mainBranch) {
        effectiveBranchId = mainBranch.branch_id;
      }
    }

    // If still no branch, try any active branch
    if (!effectiveBranchId && shop_id) {
      const anyBranch = await prisma.branch.findFirst({
        where: { shop_id, is_active: true },
        select: { branch_id: true },
      });

      if (anyBranch) {
        effectiveBranchId = anyBranch.branch_id;
      }
    }

    // If still no branch, return shop data only
    if (!effectiveBranchId) {
      if (shop_id) {
        const shop = await prisma.shop.findUnique({
          where: { shop_id },
          select: {
            shop_id: true,
            business_name: true,
            legal_name: true,
            address_line_1: true,
            address_line_2: true,
            city: true,
            state: true,
            pincode: true,
          },
        });

        return { branch: null, shop };
      }

      return { branch: null, shop: null };
    }

    // Fetch branch data
    const branch = await prisma.branch.findUnique({
      where: { branch_id: effectiveBranchId },
      select: {
        branch_id: true,
        branch_name: true,
        branch_type: true,
        address_line_1: true,
        address_line_2: true,
        city: true,
        state: true,
        pincode: true,
        contact_number: true,
        alternate_number: true,
        is_active: true,
        shop_id: true,
      },
    });

    if (!branch) {
      return { branch: null, shop: null };
    }

    // Fetch shop data
    const shop = await prisma.shop.findUnique({
      where: { shop_id: branch.shop_id },
      select: {
        shop_id: true,
        business_name: true,
        legal_name: true,
        address_line_1: true,
        address_line_2: true,
        city: true,
        state: true,
        pincode: true,
      },
    });

    return {
      branch: {
        ...branch,
        is_main: branch.branch_type === "main",
      },
      shop,
    };
  } catch (error) {
    console.error("getCurrentBranchWithShop error:", error);
    throw error;
  }
}
