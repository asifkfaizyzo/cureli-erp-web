// backend/src/modules/notifications/notification.rules.js (do not remove this comment)
// backend/src/modules/notifications/notification.rules.js

import prisma from "../../config/prisma.js";

/**
 * Resolves recipients based on event type and context.
 *
 * For email channel : Returns array of { email, name, user_id?, ... }
 * For inapp channel : Returns array of { user_id, shop_id?, role, type }
 *                     — email is NOT required for in-app
 */
export async function resolveAudience(
  eventType,
  context,
  audienceFilters = {},
) {
  const { EVENT_CONFIG } = await import("./notification.events.js");
  const config = EVENT_CONFIG[eventType];

  if (!config) {
    console.warn(`[Notifications] Unknown event type: ${eventType}`);
    return [];
  }

  switch (config.audienceType) {
    case "direct_user":
      return resolveDirectUser(context);

    case "direct_cadmin":
      return resolveDirectCAdmin(context);

    case "shop_owner":
      return resolveShopOwner(context);

    case "shop_admins":
      return resolveShopAdmins(context);

    case "shop_users":
      return resolveShopUsers(context);

    case "shop_inventory_users":
      return resolveShopInventoryUsers(context);

    case "ticket_creator":
      return resolveTicketCreator(context);

    case "broadcast_filter":
      return resolveBroadcastAudience(audienceFilters);

    default:
      console.warn(
        `[Notifications] Unknown audience type: ${config.audienceType}`,
      );
      return [];
  }
}

// ─────────────────────────────────────────
// RESOLUTION STRATEGIES
// ─────────────────────────────────────────

async function resolveDirectUser(context) {
  if (context.email) {
    return [
      {
        email: context.email,
        name: context.name || context.full_name || "User",
        user_id: context.user_id || null,
        type: "user",
      },
    ];
  }

  if (context.user_id) {
    const user = await prisma.user.findUnique({
      where: { user_id: context.user_id },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        shop_id: true,
        branch_id: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) return [];

    return [
      {
        email: user.email,
        name: user.full_name || "User",
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id,
        type: "user",
      },
    ];
  }

  return [];
}

async function resolveDirectCAdmin(context) {
  if (context.email) {
    return [
      {
        email: context.email,
        name: context.name || "Admin",
        cadmin_id: context.cadmin_id || null,
        type: "cadmin",
      },
    ];
  }

  if (context.cadmin_id) {
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id: context.cadmin_id },
      select: { cadmin_id: true, email: true, name: true, is_active: true },
    });

    if (!admin || !admin.is_active) return [];

    return [
      {
        email: admin.email,
        name: admin.name || "Admin",
        cadmin_id: admin.cadmin_id,
        type: "cadmin",
      },
    ];
  }

  return [];
}

async function resolveShopOwner(context) {
  const { shop_id } = context;
  if (!shop_id) {
    console.warn("[Notifications] resolveShopOwner: No shop_id in context");
    return [];
  }

  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      owner: {
        select: {
          user_id: true,
          email: true,
          full_name: true,
          is_active: true,
        },
      },
    },
  });

  if (!shop?.owner?.is_active) return [];

  return [
    {
      email: shop.owner.email,
      name: shop.owner.full_name || "Shop Owner",
      user_id: shop.owner.user_id,
      shop_id: shop.shop_id,
      shop_name: shop.business_name,
      type: "user",
    },
  ];
}

async function resolveShopAdmins(context) {
  const { shop_id, exclude_user_id } = context;
  if (!shop_id) {
    console.warn("[Notifications] resolveShopAdmins: No shop_id in context");
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      shop_id,
      is_active: true,
      role: { in: ["super_admin", "branch_admin"] },
      ...(exclude_user_id && { user_id: { not: exclude_user_id } }),
    },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      branch_id: true,
    },
  });

  return users
    .filter((u) => u.email)
    .map((user) => ({
      email: user.email,
      name: user.full_name || "Admin",
      user_id: user.user_id,
      shop_id,
      branch_id: user.branch_id,
      role: user.role,
      type: "user",
    }));
}

async function resolveShopUsers(context) {
  const { shop_id } = context;
  if (!shop_id) {
    console.warn('[Notifications] resolveShopUsers: No shop_id in context');
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      shop_id,
      is_active: true,
    },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      branch_id: true,
    },
  });

  return users.map((user) => ({
    email: user.email || null,
    name: user.full_name || 'User',
    user_id: user.user_id,
    shop_id,
    branch_id: user.branch_id,
    role: user.role,
    type: 'user',
  }));
}

async function resolveShopInventoryUsers(context) {
  const { shop_id, branch_id } = context;
  if (!shop_id) {
    console.warn(
      "[Notifications] resolveShopInventoryUsers: No shop_id in context",
    );
    return [];
  }

  const where = {
    shop_id,
    is_active: true,
    role: { in: ["staff", "branch_admin", "super_admin"] },
    ...(branch_id && {
      OR: [{ branch_id }, { role: "super_admin" }],
    }),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      branch_id: true,
    },
  });

  return users
    .filter((u) => u.email)
    .map((user) => ({
      email: user.email,
      name: user.full_name || "User",
      user_id: user.user_id,
      shop_id,
      branch_id: user.branch_id,
      role: user.role,
      type: "user",
    }));
}

async function resolveTicketCreator(context) {
  const { ticket_id, user_id, email, name } = context;

  if (email) {
    return [
      {
        email,
        name: name || "Customer",
        user_id: user_id || null,
        type: "user",
      },
    ];
  }

  if (user_id) {
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        shop_id: true,
        branch_id: true,
        is_active: true,
      },
    });
    if (!user || !user.is_active) return [];
    return [
      {
        email: user.email,
        name: user.full_name || "Customer",
        user_id: user.user_id,
        shop_id: user.shop_id,
        branch_id: user.branch_id,
        type: "user",
      },
    ];
  }

  if (ticket_id) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      include: {
        created_by: {
          select: {
            user_id: true,
            email: true,
            full_name: true,
            shop_id: true,
            branch_id: true,
            is_active: true,
          },
        },
      },
    });
    if (!ticket?.created_by?.is_active) return [];
    return [
      {
        email: ticket.created_by.email,
        name: ticket.created_by.full_name || "Customer",
        user_id: ticket.created_by.user_id,
        shop_id: ticket.created_by.shop_id,
        branch_id: ticket.created_by.branch_id,
        type: "user",
      },
    ];
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST AUDIENCE RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves broadcast recipients from flexible filter object.
 *
 * Filter keys accepted (all optional):
 *   includeUsers            boolean  – include ERP users          (default true)
 *   includeCAdmins          boolean  – include CAdmin users        (default false)
 *   shop_ids                string[] – filter users by shop UUIDs
 *   plan_ids                string[] – filter by active subscription plan UUIDs
 *   roles                   string[] – filter by user.role values  (from DB, dynamic)
 *   cadmin_roles            string[] – filter CAdmins by custom role name
 *   registration_date_from  string   – ISO date, inclusive start
 *   registration_date_to    string   – ISO date, inclusive end (23:59:59)
 *
 * In-app vs email:
 *   - In-app only needs user_id / cadmin_id → we do NOT filter by email presence
 *   - Email channel needs email → caller is responsible for filtering
 *
 * Deduplication:
 *   - By user_id  for type='user'
 *   - By cadmin_id for type='cadmin'
 */
async function resolveBroadcastAudience(filters = {}) {
  // ── Destructure all recognised keys ────────────────────────────────────
  const {
    // Audience type toggles
    includeUsers = true,
    includeCAdmins = false,

    // User filters
    shop_ids,
    plan_ids,
    roles,
    registration_date_from,
    registration_date_to,

    // CAdmin filters
    // Accept BOTH camelCase (cadminRoles) and snake_case (cadmin_roles)
    cadmin_roles,
    cadminRoles,

    // Legacy / unused keys — silently ignored
    shopVerificationStatus,
    subscriptionStatus,
  } = filters;

  // Normalise cadmin role filter to one variable
  const cadminRoleFilter = cadmin_roles || cadminRoles || [];

  const userRecipients = [];
  const cadminRecipients = [];

  // ── 1. ERP USERS ────────────────────────────────────────────────────────
  if (includeUsers) {
    const userWhere = { is_active: true };

    // Role filter (values come from DB via getUserRoles(), fully dynamic)
    if (Array.isArray(roles) && roles.length > 0) {
      userWhere.role = { in: roles };
    }

    // Registration date range
    if (registration_date_from || registration_date_to) {
      userWhere.created_at = {};
      if (registration_date_from) {
        const d = new Date(registration_date_from);
        if (!isNaN(d)) userWhere.created_at.gte = d;
        else
          console.warn(
            "[Notifications] Invalid registration_date_from:",
            registration_date_from,
          );
      }
      if (registration_date_to) {
        const d = new Date(registration_date_to);
        if (!isNaN(d)) {
          d.setHours(23, 59, 59, 999);
          userWhere.created_at.lte = d;
        } else {
          console.warn(
            "[Notifications] Invalid registration_date_to:",
            registration_date_to,
          );
        }
      }
    }

    let users = [];

    // ── Strategy A: specific shops ───────────────────────────────────────
    if (Array.isArray(shop_ids) && shop_ids.length > 0) {
      console.log(`[Broadcast] Querying users in ${shop_ids.length} shop(s)`);
      users = await prisma.user.findMany({
        where: { ...userWhere, shop_id: { in: shop_ids } },
        select: {
          user_id: true,
          email: true,
          full_name: true,
          role: true,
          shop_id: true,
        },
      });
    }
    // ── Strategy B: specific subscription plans ──────────────────────────
    else if (Array.isArray(plan_ids) && plan_ids.length > 0) {
      console.log(`[Broadcast] Querying users on ${plan_ids.length} plan(s)`);
      users = await prisma.user.findMany({
        where: {
          ...userWhere,
          shop: {
            currentSubscription: {
              plan_id: { in: plan_ids },
              status: "active",
              is_active: true,
            },
          },
        },
        select: {
          user_id: true,
          email: true,
          full_name: true,
          role: true,
          shop_id: true,
        },
      });
    }
    // ── Strategy C: all active users (with optional legacy filters) ───────
    else {
      // Legacy shop verification filter
      if (shopVerificationStatus) {
        userWhere.shop = { verification_status: shopVerificationStatus };
      }
      // Legacy subscription status filter
      if (subscriptionStatus) {
        userWhere.shop = {
          ...(userWhere.shop || {}),
          currentSubscription: { status: subscriptionStatus },
        };
      }

      console.log("[Broadcast] Querying all active users");
      users = await prisma.user.findMany({
        where: userWhere,
        select: {
          user_id: true,
          email: true,
          full_name: true,
          role: true,
          shop_id: true,
        },
      });
    }

    // Do NOT filter by email — in-app only needs user_id
    for (const user of users) {
      userRecipients.push({
        email: user.email || null,
        name: user.full_name || "User",
        user_id: user.user_id,
        shop_id: user.shop_id || null,
        role: user.role,
        type: "user",
      });
    }

    console.log(
      `[Broadcast] Resolved ${userRecipients.length} user recipient(s)`,
    );
  }

  // ── 2. CADMINS ──────────────────────────────────────────────────────────
  if (includeCAdmins) {
    // CAdmin model has NO role column — roles live in CAdminRoleAssignment
    // We join through roleAssignments → role → name
    let cadmins = [];

    if (cadminRoleFilter.length > 0) {
      console.log(
        `[Broadcast] Querying cadmins with roles: ${cadminRoleFilter.join(", ")}`,
      );
      cadmins = await prisma.cAdmin.findMany({
        where: {
          is_active: true,
          roleAssignments: {
            some: {
              role: {
                name: { in: cadminRoleFilter },
                is_deleted: false,
              },
            },
          },
        },
        select: {
          cadmin_id: true,
          email: true,
          name: true,
          roleAssignments: {
            where: { role: { is_deleted: false } },
            select: { role: { select: { name: true } } },
          },
        },
      });
    } else {
      console.log("[Broadcast] Querying all active cadmins");
      cadmins = await prisma.cAdmin.findMany({
        where: { is_active: true },
        select: {
          cadmin_id: true,
          email: true,
          name: true,
          roleAssignments: {
            where: { role: { is_deleted: false } },
            select: { role: { select: { name: true } } },
          },
        },
      });
    }

    for (const admin of cadmins) {
      const roleNames = admin.roleAssignments.map((a) => a.role.name);

      cadminRecipients.push({
        email: admin.email || null,
        name: admin.name || "Admin",
        cadmin_id: admin.cadmin_id,
        roles: roleNames,
        type: "cadmin",
      });
    }

    console.log(
      `[Broadcast] Resolved ${cadminRecipients.length} cadmin recipient(s)`,
    );
  }

  // ── 3. DEDUPLICATE ──────────────────────────────────────────────────────
  // Deduplicate by user_id (users) and cadmin_id (cadmins) — NOT by email
  // because in-app recipients may have no email
  const seenUsers = new Set();
  const seenCAdmins = new Set();

  const deduplicatedUsers = userRecipients.filter((r) => {
    if (seenUsers.has(r.user_id)) return false;
    seenUsers.add(r.user_id);
    return true;
  });

  const deduplicatedCAdmins = cadminRecipients.filter((r) => {
    if (seenCAdmins.has(r.cadmin_id)) return false;
    seenCAdmins.add(r.cadmin_id);
    return true;
  });

  const final = [...deduplicatedUsers, ...deduplicatedCAdmins];

  console.log(
    `[Broadcast] Final audience: ${final.length} unique recipient(s)` +
      ` (${deduplicatedUsers.length} users, ${deduplicatedCAdmins.length} cadmins)`,
  );

  return final;
}

export default { resolveAudience };