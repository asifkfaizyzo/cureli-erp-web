// backend/src/modules/cadmin/broadcast/email/emailBroadcast.recipients.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/emailBroadcast.recipients.js

import prisma from "../../../../config/prisma.js";
import { filterUnsubscribedRecipients } from "./emailBroadcast.unsubscribe.js";

// ── Main Resolver ─────────────────────────────────────────────────────────────

export async function resolveRecipients(
  filters = {},
  targetUsers = true,
  targetCAdmins = false,
  excludeUnsubscribed = true,
) {
  const recipients = [];

  if (targetUsers) {
    const shopOwners = await resolveShopOwners(filters);
    recipients.push(...shopOwners);
  }

  if (targetCAdmins) {
    const cadmins = await resolveCAdmins(filters);
    recipients.push(...cadmins);
  }

  // Deduplicate by email (case-insensitive)
  const seen = new Set();
  const deduplicated = recipients.filter((r) => {
    const key = r.email.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (excludeUnsubscribed) {
    return filterUnsubscribedRecipients(deduplicated);
  }

  return deduplicated;
}

// ── Shop Owner Resolver ───────────────────────────────────────────────────────

async function resolveShopOwners(filters) {
  const {
    shop_ids,
    plan_ids,
    filter_mode = "OR",
    registration_date_from,
    registration_date_to,
  } = filters;

  const hasShopFilter = Array.isArray(shop_ids) && shop_ids.length > 0;
  const hasPlanFilter = Array.isArray(plan_ids) && plan_ids.length > 0;

  let shops = [];

  if (hasShopFilter && hasPlanFilter) {
    if (filter_mode === "AND") {
      // Shop must be in shop_ids AND have one of the plan_ids active
      shops = await prisma.shop.findMany({
        where: {
          is_active: true,
          shop_id: { in: shop_ids },
          currentSubscription: {
            plan_id: { in: plan_ids },
            status: "active",
            is_active: true,
          },
        },
        include: { owner: ownerSelect() },
      });
    } else {
      // OR: shop in shop_ids OR shop has one of the plan_ids
      const [byId, byPlan] = await Promise.all([
        prisma.shop.findMany({
          where: { is_active: true, shop_id: { in: shop_ids } },
          include: { owner: ownerSelect() },
        }),
        prisma.shop.findMany({
          where: {
            is_active: true,
            currentSubscription: {
              plan_id: { in: plan_ids },
              status: "active",
              is_active: true,
            },
          },
          include: { owner: ownerSelect() },
        }),
      ]);

      const shopMap = new Map();
      [...byId, ...byPlan].forEach((s) => shopMap.set(s.shop_id, s));
      shops = Array.from(shopMap.values());
    }
  } else if (hasShopFilter) {
    shops = await prisma.shop.findMany({
      where: { is_active: true, shop_id: { in: shop_ids } },
      include: { owner: ownerSelect() },
    });
  } else if (hasPlanFilter) {
    shops = await prisma.shop.findMany({
      where: {
        is_active: true,
        currentSubscription: {
          plan_id: { in: plan_ids },
          status: "active",
          is_active: true,
        },
      },
      include: { owner: ownerSelect() },
    });
  } else {
    // No filter — all active shops
    shops = await prisma.shop.findMany({
      where: { is_active: true },
      include: { owner: ownerSelect() },
    });
  }

  // Apply registration date filter in JS (simpler than Prisma nested date filter on shop.created_at)
  if (registration_date_from || registration_date_to) {
    shops = shops.filter((shop) => {
      const shopDate = new Date(shop.created_at);

      if (registration_date_from) {
        if (shopDate < new Date(registration_date_from)) return false;
      }
      if (registration_date_to) {
        const end = new Date(registration_date_to);
        end.setHours(23, 59, 59, 999);
        if (shopDate > end) return false;
      }

      return true;
    });
  }

  const recipients = [];

  for (const shop of shops) {
    // Only send to the shop's super_admin (shop owner role in ERP)
    if (!shop.owner) continue;
    if (!shop.owner.is_active) continue;
    if (!shop.owner.email) continue;
    if (shop.owner.role !== "super_admin") continue;

    recipients.push({
      email: shop.owner.email,
      name: shop.owner.full_name || shop.business_name || "Shop Owner",
      user_id: shop.owner.user_id,
      shop_id: shop.shop_id,
      shop_name: shop.business_name,
      type: "user",
    });
  }

  return recipients;
}

function ownerSelect() {
  return {
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      is_active: true,
    },
  };
}

// ── CAdmin Resolver ───────────────────────────────────────────────────────────
//
//  CAdmin model has NO `role` column.
//    Roles live in CAdminRoleAssignment → CAdminCustomRole.
//    cadmin_roles filter contains role NAME strings (from getCAdminRoles below).

async function resolveCAdmins(filters) {
  const { cadmin_roles } = filters;

  const hasRoleFilter = Array.isArray(cadmin_roles) && cadmin_roles.length > 0;

  let cadmins;

  if (hasRoleFilter) {
    // Filter cadmins who have at least one role whose NAME matches the filter
    cadmins = await prisma.cAdmin.findMany({
      where: {
        is_active: true,
        roleAssignments: {
          some: {
            role: {
              name: { in: cadmin_roles },
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
    // No role filter — all active cadmins
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

  return cadmins
    .filter((c) => c.email)
    .map((cadmin) => ({
      email: cadmin.email,
      name: cadmin.name || "Admin",
      cadmin_id: cadmin.cadmin_id,
      roles: cadmin.roleAssignments.map((a) => a.role.name),
      type: "cadmin",
    }));
}

// ── Preview ───────────────────────────────────────────────────────────────────

export async function previewRecipients(
  filters = {},
  targetUsers = true,
  targetCAdmins = false,
) {
  const recipients = await resolveRecipients(
    filters,
    targetUsers,
    targetCAdmins,
    false, // don't exclude unsubscribed yet — we count them separately
  );

  const unsubscribedCount = await countUnsubscribedInList(recipients);

  const byType = {
    users: recipients.filter((r) => r.type === "user").length,
    cadmins: recipients.filter((r) => r.type === "cadmin").length,
  };

  const byShop = {};
  recipients
    .filter((r) => r.type === "user" && r.shop_id)
    .forEach((r) => {
      if (!byShop[r.shop_id]) {
        byShop[r.shop_id] = { name: r.shop_name, count: 0 };
      }
      byShop[r.shop_id].count++;
    });

  return {
    total: recipients.length,
    total_after_unsubscribe: recipients.length - unsubscribedCount,
    unsubscribed_count: unsubscribedCount,
    by_type: byType,
    by_shop: byShop,
  };
}

async function countUnsubscribedInList(recipients) {
  if (recipients.length === 0) return 0;

  const emails = recipients.map((r) => r.email.toLowerCase().trim());

  return prisma.emailUnsubscribe.count({
    where: { email: { in: emails } },
  });
}

// ── Filter Helpers ────────────────────────────────────────────────────────────

export async function getShopsForFilter(search = "", page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const where = {
    is_active: true,
    ...(search && {
      business_name: { contains: search, mode: "insensitive" },
    }),
  };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      select: {
        shop_id: true,
        business_name: true,
        created_at: true,
        owner: {
          select: { full_name: true, email: true },
        },
      },
      orderBy: { business_name: "asc" },
      skip,
      take: limit,
    }),
    prisma.shop.count({ where }),
  ]);

  return {
    shops: shops.map((shop) => ({
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      owner_name: shop.owner?.full_name || "N/A",
      owner_email: shop.owner?.email || "N/A",
      created_at: shop.created_at,
    })),
    pagination: { page, limit, total },
  };
}

export async function getActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { status: "ACTIVE", deleted_at: null },
    select: { plan_id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  return { plans };
}

/**
 *  Dynamic from DB — reads CAdminCustomRole table.
 *    Returns role NAME as value (matches what resolveCAdmins filters by).
 */
export async function getCAdminRoles() {
  const roles = await prisma.cAdminCustomRole.findMany({
    where: { is_deleted: false },
    select: { name: true, description: true },
    orderBy: { name: "asc" },
  });

  return roles.map((r) => ({
    value: r.name,
    label: r.name,
    description: r.description || null,
  }));
}

export default {
  resolveRecipients,
  previewRecipients,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
};
