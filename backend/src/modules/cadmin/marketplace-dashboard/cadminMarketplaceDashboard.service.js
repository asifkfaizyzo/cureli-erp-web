// backend/src/modules/cadmin/marketplace-dashboard/cadminMarketplaceDashboard.service.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace-dashboard/cadminMarketplaceDashboard.service.js

import prisma from "../../../config/prisma.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// ─────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────

export async function getMarketplaceKpis() {
  const monthStart = startOfMonth();
  const todayStart = startOfToday();

  const [
    totalAppUsers,
    activeAppUsers,
    totalOrders,
    activeOrders,
    ordersToday,
    revenueThisMonth,
    revenueToday,
    completedOrders,
    rejectedOrders,
    pendingPrescriptionOrders,
  ] = await Promise.all([
    // Total registered mobile users (not deleted)
    prisma.cureliMobileUser.count({
      where: { deleted_at: null },
    }),

    // Active mobile users
    prisma.cureliMobileUser.count({
      where: { deleted_at: null, status: "active" },
    }),

    // All marketplace orders (all time)
    prisma.marketplaceOrder.count(),

    // Active orders = PLACED + ACCEPTED + READY_FOR_PICKUP
    prisma.marketplaceOrder.count({
      where: {
        status: { in: ["PLACED", "ACCEPTED", "READY_FOR_PICKUP"] },
      },
    }),

    // Orders placed today
    prisma.marketplaceOrder.count({
      where: { placed_at: { gte: todayStart } },
    }),

    // Revenue this month (completed orders only)
    prisma.marketplaceOrder.aggregate({
      where: {
        status: "COMPLETED",
        completed_at: { gte: monthStart },
      },
      _sum: { total_amount: true },
    }),

    // Revenue today
    prisma.marketplaceOrder.aggregate({
      where: {
        status: "COMPLETED",
        completed_at: { gte: todayStart },
      },
      _sum: { total_amount: true },
    }),

    // Completed orders count
    prisma.marketplaceOrder.count({
      where: { status: "COMPLETED" },
    }),

    // Rejected orders count
    prisma.marketplaceOrder.count({
      where: { status: "REJECTED" },
    }),

    // Orders requiring prescription that are still pending
    prisma.marketplaceOrder.count({
      where: {
        requires_prescription: true,
        status: { in: ["PLACED", "ACCEPTED"] },
      },
    }),
  ]);

  return {
    total_app_users: totalAppUsers,
    active_app_users: activeAppUsers,
    total_orders: totalOrders,
    active_orders: activeOrders,
    orders_today: ordersToday,
    revenue_this_month: Number(revenueThisMonth._sum.total_amount ?? 0),
    revenue_today: Number(revenueToday._sum.total_amount ?? 0),
    completed_orders: completedOrders,
    rejected_orders: rejectedOrders,
    pending_prescription_orders: pendingPrescriptionOrders,
  };
}

// ─────────────────────────────────────────────
// RECENT ORDERS
// ─────────────────────────────────────────────

export async function getRecentMarketplaceOrders(limit = 10) {
  const orders = await prisma.marketplaceOrder.findMany({
    orderBy: { placed_at: "desc" },
    take: limit,
    select: {
      order_id: true,
      order_number: true,
      status: true,
      customer_name_snapshot: true,
      customer_phone_snapshot: true,
      total_amount: true,
      requires_prescription: true,
      payment_method: true,
      payment_status: true,
      placed_at: true,
      shop: {
        select: {
          business_name: true,
          city: true,
        },
      },
      branch: {
        select: {
          branch_name: true,
        },
      },
      _count: {
        select: {
          items: true,
          prescriptions: true,
        },
      },
    },
  });

  return orders.map((o) => ({
    order_id: o.order_id,
    order_number: o.order_number,
    status: o.status,
    customer_name: o.customer_name_snapshot,
    customer_phone: o.customer_phone_snapshot,
    total_amount: Number(o.total_amount),
    item_count: o._count.items,
    prescription_count: o._count.prescriptions,
    requires_prescription: o.requires_prescription,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    shop_name: o.shop?.business_name ?? null,
    shop_city: o.shop?.city ?? null,
    branch_name: o.branch?.branch_name ?? null,
    placed_at: o.placed_at,
  }));
}

// ─────────────────────────────────────────────
// RECENT SIGN-UPS
// ─────────────────────────────────────────────

export async function getRecentSignups(limit = 10) {
  const users = await prisma.cureliMobileUser.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      phone: true,
      full_name: true,
      email: true,
      status: true,
      phone_verified: true,
      profile_complete: true,
      created_at: true,
      last_seen_at: true,
      _count: {
        select: {
          marketplaceOrders: true,
          addresses: true,
        },
      },
    },
  });

  return users.map((u) => ({
    user_id: u.id,
    phone: u.phone,
    full_name: u.full_name,
    email: u.email,
    status: u.status,
    phone_verified: u.phone_verified,
    profile_complete: u.profile_complete,
    total_orders: u._count.marketplaceOrders,
    saved_addresses: u._count.addresses,
    created_at: u.created_at,
    last_seen_at: u.last_seen_at,
  }));
}

// ─────────────────────────────────────────────
// MARKETPLACE SHOP STATS
// ─────────────────────────────────────────────

export async function getMarketplaceShopStats() {
  const [
    totalShops,
    liveShops,
    totalBranches,
    enabledBranches,
    totalListings,
    liveListings,
  ] = await Promise.all([
    prisma.marketplaceProfile.count(),
    prisma.marketplaceProfile.count({ where: { is_live: true } }),
    prisma.branchMarketplaceSettings.count(),
    prisma.branchMarketplaceSettings.count({ where: { marketplace_enabled: true } }),
    prisma.marketplaceListing.count(),
    prisma.marketplaceListing.count({ where: { is_visible: true, stock_status: "IN_STOCK" } }),
  ]);

  return {
    total_shops: totalShops,
    live_shops: liveShops,
    total_branches: totalBranches,
    enabled_branches: enabledBranches,
    total_listings: totalListings,
    live_listings: liveListings,
  };
}

// ─────────────────────────────────────────────
// ORDER STATUS BREAKDOWN
// ─────────────────────────────────────────────

export async function getOrderStatusBreakdown() {
  const statuses = [
    "PLACED",
    "ACCEPTED",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
  ];

  const grouped = await prisma.marketplaceOrder.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const counts = Object.fromEntries(statuses.map((s) => [s, 0]));
  for (const row of grouped) {
    if (counts[row.status] !== undefined) {
      counts[row.status] = row._count.status;
    }
  }

  return counts;
}

// ─────────────────────────────────────────────
// FULL DASHBOARD PAYLOAD
// ─────────────────────────────────────────────

export async function getMarketplaceDashboard() {
  const [kpis, recentOrders, recentSignups, shopStats, orderStatuses] =
    await Promise.all([
      getMarketplaceKpis(),
      getRecentMarketplaceOrders(10),
      getRecentSignups(10),
      getMarketplaceShopStats(),
      getOrderStatusBreakdown(),
    ]);

  return {
    kpis,
    shop_stats: shopStats,
    order_statuses: orderStatuses,
    recent_orders: recentOrders,
    recent_signups: recentSignups,
    generated_at: new Date().toISOString(),
  };
}