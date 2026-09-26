// backend/src/modules/users/users.service.js (do not remove this comment)
// src/modules/users/users.service.js

import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import * as audit from "../audit/index.js";

/**
 * ============================================
 * GET USERS (with filtering & pagination)
 * ============================================
 */
export async function getUsers({
  shop_id,
  branch_id,
  role,
  status,
  search,
  page,
  limit,
  sort_by,
  sort_order,
  requester_role,
  requester_branch_id,
}) {
  // Build where clause
  const where = {
    shop_id,
    // Exclude super_admin from list
    role: { in: ["branch_admin", "staff"] },
  };

  // Branch filtering
  if (requester_role === "super_admin") {
    if (branch_id) {
      where.branch_id = branch_id;
    }
  } else {
    // BA forced to their own branch
    where.branch_id = requester_branch_id;
  }

  // Role filter
  if (role) {
    where.role = role;
  }

  // Status filter
  if (status === "active") {
    where.is_active = true;
  } else if (status === "inactive") {
    where.is_active = false;
  }

  // Search filter
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { phone_number: { contains: search } },
    ];
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get paginated results
  const users = await prisma.user.findMany({
    where,
    select: {
      user_id: true,
      full_name: true,
      first_name: true,
      last_name: true,
      username: true,
      phone_number: true,
      email: true,
      role: true,
      status: true,
      is_active: true,
      branch_id: true,
      created_at: true,
      last_login_at: true,
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
    orderBy: { [sort_by]: sort_order },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Transform results
  const transformedUsers = users.map((user) => ({
    user_id: user.user_id,
    full_name: user.full_name,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    phone_number: user.phone_number,
    email: user.email,
    role: user.role,
    status: user.status,
    is_active: user.is_active,
    branch_id: user.branch_id,
    branch_name: user.branch?.branch_name || null,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  }));

  return {
    users: transformedUsers,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * ============================================
 * GET SINGLE USER
 * ============================================
 */
export async function getUserById(user_id, shop_id) {
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
    select: {
      user_id: true,
      full_name: true,
      first_name: true,
      last_name: true,
      username: true,
      phone_number: true,
      email: true,
      role: true,
      status: true,
      is_active: true,
      branch_id: true,
      created_at: true,
      updated_at: true,
      last_login_at: true,
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    user_id: user.user_id,
    full_name: user.full_name,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    phone_number: user.phone_number,
    email: user.email,
    role: user.role,
    status: user.status,
    is_active: user.is_active,
    branch_id: user.branch_id,
    branch_name: user.branch?.branch_name || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.last_login_at,
  };
}

/**
 * ============================================
 * GET USER LIMITS
 * ============================================
 */
export async function getUserLimits(shop_id) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: true,
      _count: {
        select: {
          users: {
            where: {
              is_active: true,
              role: { in: ["staff", "branch_admin"] },
            },
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
      current_count: shop._count.users,
      max_allowed: 0,
      can_add: false,
      remaining: 0,
    };
  }

  const maxAllowed = subscription.user_limit_snapshot;
  const currentCount = shop._count.users;

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

/**
 * ============================================
 * CHECK USERNAME AVAILABILITY
 * ============================================
 */
export async function checkUsernameAvailability(
  username,
  exclude_user_id = null,
) {
  const where = {
    username: username.toLowerCase(),
  };

  if (exclude_user_id) {
    where.user_id = { not: exclude_user_id };
  }

  const existingUser = await prisma.user.findFirst({
    where,
    select: { user_id: true },
  });

  return {
    available: !existingUser,
    username: username.toLowerCase(),
  };
}

/**
 * ============================================
 * CHECK PHONE AVAILABILITY
 * ============================================
 */
export async function checkPhoneAvailability(
  phone_number,
  exclude_user_id = null,
) {
  const where = {
    phone_number,
  };

  if (exclude_user_id) {
    where.user_id = { not: exclude_user_id };
  }

  const existingUser = await prisma.user.findFirst({
    where,
    select: { user_id: true },
  });

  return {
    available: !existingUser,
    phone_number,
  };
}

/**
 * ============================================
 * CHECK IF BRANCH HAS BRANCH ADMIN
 * ============================================
 */
export async function branchHasBranchAdmin(branch_id, exclude_user_id = null) {
  const where = {
    branch_id,
    role: "branch_admin",
    is_active: true,
  };

  if (exclude_user_id) {
    where.user_id = { not: exclude_user_id };
  }

  const existingBA = await prisma.user.findFirst({
    where,
    select: { user_id: true, full_name: true },
  });

  return existingBA;
}

/**
 * ============================================
 * CREATE USER
 * ============================================
 */
export async function createUser({
  shop_id,
  branch_id,
  full_name,
  phone_number,
  username,
  password,
  role,
  email,
  auditContext = {}, //  Accept audit context
}) {
  // Validate branch belongs to shop
  const branch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
      is_active: true,
    },
  });

  if (!branch) {
    const err = new Error("Branch not found or inactive");
    err.code = "INVALID_BRANCH";
    throw err;
  }

  // Check plan limits
  const limits = await getUserLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `User limit reached. Your plan allows ${limits.max_allowed} users.`,
    );
    err.code = "USER_LIMIT_EXCEEDED";
    throw err;
  }

  // Check: Only one Branch Admin per branch
  if (role === "branch_admin") {
    const existingBA = await branchHasBranchAdmin(branch_id);
    if (existingBA) {
      const err = new Error(
        `This branch already has a Branch Admin (${existingBA.full_name}). Only one Branch Admin is allowed per branch.`,
      );
      err.code = "BRANCH_ADMIN_EXISTS";
      throw err;
    }
  }

  // Check username availability
  const usernameCheck = await checkUsernameAvailability(username);
  if (!usernameCheck.available) {
    const err = new Error("Username is already taken");
    err.code = "USERNAME_TAKEN";
    throw err;
  }

  // Check phone availability
  const phoneCheck = await checkPhoneAvailability(phone_number);
  if (!phoneCheck.available) {
    const err = new Error("Phone number is already registered");
    err.code = "PHONE_TAKEN";
    throw err;
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Parse name
  const nameParts = full_name.trim().split(/\s+/);
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(" ") || "";

  // Create user within transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        shop_id,
        branch_id,
        first_name,
        last_name,
        full_name: full_name.trim(),
        username: username.toLowerCase(),
        phone_number,
        email: email || null,
        password_hash,
        login_provider: "password",
        role,
        status: "verified",
        is_active: true,
        onboarding_step: 12, // Completed
      },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        phone_number: true,
        email: true,
        role: true,
        branch_id: true,
        is_active: true,
        created_at: true,
      },
    });

    //  AUDIT LOG: User created
    await audit.log(
      {
        action: audit.AuditAction.USER_CREATED,
        entity_type: audit.EntityType.USER,
        entity_id: newUser.user_id,
        shop_id,
        branch_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          username: newUser.username,
          role: newUser.role,
          email: newUser.email,
          phone_number: newUser.phone_number,
          branch_id,
          created_by_role: auditContext.actor_role,
        },
      },
      { tx },
    );

    return newUser;
  });

  return user;
}

/**
 * ============================================
 * UPDATE USER
 * ============================================
 */
export async function updateUser(
  user_id,
  shop_id,
  updates,
  auditContext = {}, //  Accept audit context
) {
  // Get existing user
  const existingUser = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
  });

  if (!existingUser) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Cannot update super_admin
  if (existingUser.role === "super_admin") {
    const err = new Error("Cannot modify super admin through this endpoint");
    err.code = "CANNOT_MODIFY_SA";
    throw err;
  }

  // Build update data & track changes for audit
  const updateData = {};
  const changesSummary = [];

  // Name update
  if (updates.full_name) {
    const nameParts = updates.full_name.trim().split(/\s+/);
    updateData.first_name = nameParts[0];
    updateData.last_name = nameParts.slice(1).join(" ") || "";
    updateData.full_name = updates.full_name.trim();

    if (existingUser.full_name !== updateData.full_name) {
      changesSummary.push("full_name");
    }
  }

  // Phone update
  if (
    updates.phone_number &&
    updates.phone_number !== existingUser.phone_number
  ) {
    const phoneCheck = await checkPhoneAvailability(
      updates.phone_number,
      user_id,
    );
    if (!phoneCheck.available) {
      const err = new Error("Phone number is already registered");
      err.code = "PHONE_TAKEN";
      throw err;
    }
    updateData.phone_number = updates.phone_number;
    changesSummary.push("phone_number");
  }

  // Username update
  if (updates.username && updates.username !== existingUser.username) {
    const usernameCheck = await checkUsernameAvailability(
      updates.username,
      user_id,
    );
    if (!usernameCheck.available) {
      const err = new Error("Username is already taken");
      err.code = "USERNAME_TAKEN";
      throw err;
    }
    updateData.username = updates.username.toLowerCase();
    changesSummary.push("username");
  }

  // Email update
  if (updates.email !== undefined && updates.email !== existingUser.email) {
    updateData.email = updates.email || null;
    changesSummary.push("email");
  }

  // Role update (SA only - with BA limit check)
  if (updates.role && updates.role !== existingUser.role) {
    // If changing TO branch_admin, check if branch already has one
    if (updates.role === "branch_admin") {
      const targetBranchId = updates.branch_id || existingUser.branch_id;
      const existingBA = await branchHasBranchAdmin(targetBranchId, user_id);
      if (existingBA) {
        const err = new Error(
          `This branch already has a Branch Admin (${existingBA.full_name}). Only one Branch Admin is allowed per branch.`,
        );
        err.code = "BRANCH_ADMIN_EXISTS";
        throw err;
      }
    }
    updateData.role = updates.role;
    changesSummary.push("role");
  }

  // Branch update (SA only)
  if (updates.branch_id && updates.branch_id !== existingUser.branch_id) {
    // Validate branch
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id: updates.branch_id,
        shop_id,
        is_active: true,
      },
    });

    if (!branch) {
      const err = new Error("Branch not found or inactive");
      err.code = "INVALID_BRANCH";
      throw err;
    }

    // If user is/will be branch_admin, check target branch
    const finalRole = updates.role || existingUser.role;
    if (finalRole === "branch_admin") {
      const existingBA = await branchHasBranchAdmin(updates.branch_id, user_id);
      if (existingBA) {
        const err = new Error(
          `Target branch already has a Branch Admin (${existingBA.full_name}). Only one Branch Admin is allowed per branch.`,
        );
        err.code = "BRANCH_ADMIN_EXISTS";
        throw err;
      }
    }

    updateData.branch_id = updates.branch_id;
    changesSummary.push("branch_id");
  }

  // Active status update (SA only)
  if (
    updates.is_active !== undefined &&
    updates.is_active !== existingUser.is_active
  ) {
    updateData.is_active = updates.is_active;

    if (updates.is_active === true) {
      updateData.status = "verified";
    } else {
      updateData.status = "inactive";
    }
    changesSummary.push("is_active");
  }

  // If no changes, skip update
  if (Object.keys(updateData).length === 0) {
    return getUserById(user_id, shop_id);
  }

  // Perform update within transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { user_id },
      data: updateData,
      select: {
        user_id: true,
        full_name: true,
        username: true,
        phone_number: true,
        email: true,
        role: true,
        branch_id: true,
        is_active: true,
        updated_at: true,
        branch: {
          select: {
            branch_name: true,
          },
        },
      },
    });

    //  AUDIT LOG: User profile updated
    await audit.log(
      {
        action: audit.AuditAction.USER_PROFILE_UPDATED,
        entity_type: audit.EntityType.USER,
        entity_id: user_id,
        shop_id,
        branch_id: existingUser.branch_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          changed_fields: changesSummary,
          previous_role:
            existingUser.role !== updateData.role
              ? existingUser.role
              : undefined,
          new_role: updateData.role,
          previous_branch_id:
            existingUser.branch_id !== updateData.branch_id
              ? existingUser.branch_id
              : undefined,
          new_branch_id: updateData.branch_id,
          updated_by_role: auditContext.actor_role,
        },
      },
      { tx },
    );

    //  AUDIT LOG: Role changed (if applicable)
    if (updateData.role && existingUser.role !== updateData.role) {
      await audit.log(
        {
          action: audit.AuditAction.USER_ROLE_CHANGED,
          entity_type: audit.EntityType.USER,
          entity_id: user_id,
          shop_id,
          branch_id: existingUser.branch_id,
          ...auditContext,
          reason_code: audit.AuditReasonCode.ADMIN_ACTION,
          metadata: {
            previous_role: existingUser.role,
            new_role: updateData.role,
          },
        },
        { tx },
      );
    }

    //  AUDIT LOG: Branch changed (if applicable)
    if (
      updateData.branch_id &&
      existingUser.branch_id !== updateData.branch_id
    ) {
      await audit.log(
        {
          action: audit.AuditAction.USER_BRANCH_CHANGED,
          entity_type: audit.EntityType.USER,
          entity_id: user_id,
          shop_id,
          branch_id: existingUser.branch_id,
          ...auditContext,
          reason_code: audit.AuditReasonCode.ADMIN_ACTION,
          metadata: {
            previous_branch_id: existingUser.branch_id,
            new_branch_id: updateData.branch_id,
          },
        },
        { tx },
      );
    }

    return updated;
  });

  return {
    ...updatedUser,
    branch_name: updatedUser.branch?.branch_name || null,
  };
}

/**
 * ============================================
 * DELETE (DEACTIVATE) USER
 * ============================================
 */
export async function deleteUser(
  user_id,
  shop_id,
  requester_user_id,
  auditContext = {}, //  Accept audit context
) {
  // Get user
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
    include: {
      shop: {
        select: {
          owner_user_id: true,
        },
      },
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Cannot delete self
  if (user_id === requester_user_id) {
    const err = new Error("Cannot deactivate your own account");
    err.code = "CANNOT_DELETE_SELF";
    throw err;
  }

  // Cannot delete shop owner
  if (user.shop.owner_user_id === user_id) {
    const err = new Error("Cannot deactivate shop owner");
    err.code = "CANNOT_DELETE_OWNER";
    throw err;
  }

  // Cannot delete super_admin
  if (user.role === "super_admin") {
    const err = new Error("Cannot deactivate super admin");
    err.code = "CANNOT_DELETE_SA";
    throw err;
  }

  // Soft delete within transaction
  await prisma.$transaction(async (tx) => {
    // Update user
    await tx.user.update({
      where: { user_id },
      data: {
        is_active: false,
        status: "inactive",
      },
    });

    // Invalidate all sessions
    await tx.userSession.updateMany({
      where: {
        user_id,
        is_active: true,
      },
      data: {
        is_active: false,
        ended_at: new Date(),
        ended_reason: "admin_force",
      },
    });

    //  AUDIT LOG: User deactivated
    await audit.log(
      {
        action: audit.AuditAction.USER_DEACTIVATED,
        entity_type: audit.EntityType.USER,
        entity_id: user_id,
        shop_id,
        branch_id: user.branch_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          deactivated_user_role: user.role,
          deactivated_user_username: user.username,
          sessions_terminated: true,
        },
      },
      { tx },
    );
  });

  return { success: true };
}

/**
 * ============================================
 * REACTIVATE USER
 * ============================================
 */
export async function reactivateUser(
  user_id,
  shop_id,
  auditContext = {}, //  Accept audit context
) {
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (user.is_active) {
    const err = new Error("User is already active");
    err.code = "ALREADY_ACTIVE";
    throw err;
  }

  // If user is branch_admin, check if branch already has one
  if (user.role === "branch_admin") {
    const existingBA = await branchHasBranchAdmin(user.branch_id, user_id);
    if (existingBA) {
      const err = new Error(
        `Cannot reactivate. Branch already has a Branch Admin (${existingBA.full_name}).`,
      );
      err.code = "BRANCH_ADMIN_EXISTS";
      throw err;
    }
  }

  // Check plan limits
  const limits = await getUserLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `Cannot reactivate. User limit reached (${limits.max_allowed} users).`,
    );
    err.code = "USER_LIMIT_EXCEEDED";
    throw err;
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { user_id },
      data: {
        is_active: true,
        status: "verified",
      },
      select: {
        user_id: true,
        full_name: true,
        is_active: true,
      },
    });

    //  AUDIT LOG: User reactivated
    await audit.log(
      {
        action: audit.AuditAction.USER_REACTIVATED,
        entity_type: audit.EntityType.USER,
        entity_id: user_id,
        shop_id,
        branch_id: user.branch_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          reactivated_user_role: user.role,
          reactivated_user_username: user.username,
        },
      },
      { tx },
    );

    return updated;
  });

  return updatedUser;
}

/**
 * ============================================
 * RESET PASSWORD
 * ============================================
 */
export async function resetUserPassword(
  user_id,
  shop_id,
  new_password,
  auditContext = {}, //  Accept audit context
) {
  // Get user
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Cannot reset super_admin password
  if (user.role === "super_admin") {
    const err = new Error(
      "Cannot reset super admin password through this endpoint",
    );
    err.code = "CANNOT_RESET_SA";
    throw err;
  }

  // Hash new password
  const password_hash = await hashPassword(new_password);

  await prisma.$transaction(async (tx) => {
    // Update password
    await tx.user.update({
      where: { user_id },
      data: { password_hash },
    });

    // Invalidate all sessions
    await tx.userSession.updateMany({
      where: {
        user_id,
        is_active: true,
      },
      data: {
        is_active: false,
        ended_at: new Date(),
        ended_reason: "admin_force",
      },
    });

    //  AUDIT LOG: Password reset by admin (SECURITY ACTION)
    await audit.log(
      {
        action: audit.AuditAction.USER_PASSWORD_RESET_BY_ADMIN,
        entity_type: audit.EntityType.USER,
        entity_id: user_id,
        shop_id,
        branch_id: user.branch_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.SECURITY_ACTION,
        metadata: {
          reset_by_role: auditContext.actor_role,
          target_user_role: user.role,
          target_username: user.username,
          sessions_terminated: true,
        },
      },
      { tx },
    );
  });

  return { success: true };
}

/**
 * ============================================
 * HELPER: Check if user belongs to branch
 * ============================================
 */
export async function userBelongsToBranch(user_id, branch_id) {
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      branch_id,
    },
    select: { user_id: true },
  });

  return !!user;
}
