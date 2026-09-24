// backend/src/modules/marketplace-dashboard/marketplaceDashboard.service.js (do not remove this comment)
// backend/src/modules/marketplace-dashboard/marketplaceDashboard.service.js

import prisma from "../../config/prisma.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 10;

const ALL_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the start of today in UTC.
 * placed_at is stored as Timestamptz — comparing against UTC midnight is correct.
 */
function startOfToday() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Returns the start of N days ago in UTC.
 */
function startOfDaysAgo(n) {
  const d = startOfToday();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/**
 * Build the base Prisma where clause for orders,
 * scoped by shop and optionally by branch.
 */
function orderWhere(shop_id, branch_id = null, extra = {}) {
  return {
    shop_id,
    ...(branch_id ? { branch_id } : {}),
    ...extra,
  };
}

/**
 * Build the base Prisma where clause for listings,
 * scoped by shop and optionally by branch.
 */
function listingWhere(shop_id, branch_id = null, extra = {}) {
  return {
    shop_id,
    ...(branch_id ? { branch_id } : {}),
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Overview ──────────────────────────────────────────────────────────────

async function fetchOverview(shop_id) {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: {
      marketplace_status: true,
      is_live: true,
      onboarding_completed: true,
      storefront_name: true,
      support_phone: true,
      logo_url: true,
      banner_url: true,
    },
  });

  if (!profile) {
    return {
      marketplace_status: "NOT_STARTED",
      is_live: false,
      onboarding_completed: false,
      storefront_name: null,
      support_phone: null,
      logo_url: null,
      banner_url: null,
      enabled_branches: 0,
      total_branches: 0,
    };
  }

  const [enabledCount, totalCount] = await Promise.all([
    prisma.branchMarketplaceSettings.count({
      where: {
        marketplaceProfile: { shop_id },
        marketplace_enabled: true,
      },
    }),
    prisma.branchMarketplaceSettings.count({
      where: { marketplaceProfile: { shop_id } },
    }),
  ]);

  return {
    marketplace_status: profile.marketplace_status,
    is_live: profile.is_live,
    onboarding_completed: profile.onboarding_completed,
    storefront_name: profile.storefront_name,
    support_phone: profile.support_phone,
    logo_url: profile.logo_url,
    banner_url: profile.banner_url,
    enabled_branches: enabledCount,
    total_branches: totalCount,
  };
}

// ── 2. Order status counts ────────────────────────────────────────────────────

async function fetchOrderStatusCounts(shop_id, branch_id) {
  const grouped = await prisma.marketplaceOrder.groupBy({
    by: ["status"],
    where: orderWhere(shop_id, branch_id),
    _count: { status: true },
  });

  // Ensure every status is present even if count = 0
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
  for (const row of grouped) {
    counts[row.status] = row._count.status;
  }

  return counts;
}

// ── 3. KPIs ───────────────────────────────────────────────────────────────────

async function fetchKpis(shop_id, branch_id, statusCounts) {
  const todayStart = startOfToday();

  const [todayResult, totalValueResult] = await Promise.all([
    // Orders placed today: count + sum
    prisma.marketplaceOrder.aggregate({
      where: orderWhere(shop_id, branch_id, {
        placed_at: { gte: todayStart },
      }),
      _count: { order_id: true },
      _sum: { total_amount: true },
    }),

    // Total completed order value (all time)
    prisma.marketplaceOrder.aggregate({
      where: orderWhere(shop_id, branch_id, {
        status: "COMPLETED",
      }),
      _sum: { total_amount: true },
    }),
  ]);

  return {
    pending_action: statusCounts["PLACED"],
    ready_for_pickup: statusCounts["READY_FOR_PICKUP"],
    completed_total: statusCounts["COMPLETED"],
    rejected_total: statusCounts["REJECTED"],
    cancelled_total: statusCounts["CANCELLED"],
    orders_today: todayResult._count.order_id,
    order_value_today: Number(todayResult._sum.total_amount ?? 0),
    order_value_total: Number(totalValueResult._sum.total_amount ?? 0),
  };
}

// ── 4. Listings health ────────────────────────────────────────────────────────

async function fetchListingsHealth(shop_id, branch_id) {
  const baseWhere = listingWhere(shop_id, branch_id);

  const [
    totalLinked,
    liveCount,
    hiddenCount,
    outOfStockCount,
    prescriptionCount,
  ] = await Promise.all([
    prisma.marketplaceListing.count({ where: baseWhere }),
    prisma.marketplaceListing.count({
      where: { ...baseWhere, is_visible: true, stock_status: "IN_STOCK" },
    }),
    prisma.marketplaceListing.count({
      where: { ...baseWhere, is_visible: false },
    }),
    prisma.marketplaceListing.count({
      where: { ...baseWhere, stock_status: "OUT_OF_STOCK" },
    }),
    prisma.marketplaceListing.count({
      where: { ...baseWhere, requires_prescription: true },
    }),
  ]);

  // ── Exact low stock via raw JOIN ──────────────────────────────────────────
  // JOIN inventory to marketplace_listings on (medicine_id, branch_id).
  // Aggregate stock per (medicine_id, branch_id) pair.
  // A medicine is low stock when total available_stock is between 1 and threshold.
  // branch_id filter applied via tagged template — never string interpolated.

  let lowStockRows;

  if (branch_id) {
    lowStockRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS low_stock_count
      FROM (
        SELECT
          i.medicine_id,
          i.branch_id,
          SUM(i.available_stock) AS total_stock
        FROM inventory i
        INNER JOIN marketplace_listings ml
          ON  ml.medicine_id = i.medicine_id
          AND ml.branch_id   = i.branch_id
        WHERE ml.shop_id   = ${shop_id}::uuid
          AND ml.branch_id = ${branch_id}::uuid
          AND i.is_active  = true
          AND i.is_expired = false
        GROUP BY i.medicine_id, i.branch_id
        HAVING SUM(i.available_stock) > 0
           AND SUM(i.available_stock) <= ${LOW_STOCK_THRESHOLD}
      ) sub
    `;
  } else {
    lowStockRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS low_stock_count
      FROM (
        SELECT
          i.medicine_id,
          i.branch_id,
          SUM(i.available_stock) AS total_stock
        FROM inventory i
        INNER JOIN marketplace_listings ml
          ON  ml.medicine_id = i.medicine_id
          AND ml.branch_id   = i.branch_id
        WHERE ml.shop_id  = ${shop_id}::uuid
          AND i.is_active  = true
          AND i.is_expired = false
        GROUP BY i.medicine_id, i.branch_id
        HAVING SUM(i.available_stock) > 0
           AND SUM(i.available_stock) <= ${LOW_STOCK_THRESHOLD}
      ) sub
    `;
  }

  const lowStockCount = Number(lowStockRows[0]?.low_stock_count ?? 0);

  return {
    total_linked: totalLinked,
    live: liveCount,
    hidden: hiddenCount,
    out_of_stock: outOfStockCount,
    low_stock: lowStockCount,
    requires_prescription: prescriptionCount,
  };
}

// ── 5. Branch performance ─────────────────────────────────────────────────────

async function fetchBranchPerformance(shop_id, branch_id) {
  // Fetch branch marketplace settings scoped to this shop
  const branchSettings = await prisma.branchMarketplaceSettings.findMany({
    where: {
      marketplaceProfile: { shop_id },
      ...(branch_id ? { branch_id } : {}),
    },
    select: {
      branch_id: true,
      marketplace_enabled: true,
      pickup_enabled: true,
      delivery_enabled: true,
      is_24_hours: true,
      opening_time: true,
      closing_time: true,
      latitude: true,
      longitude: true,
      branch: {
        select: {
          branch_name: true,
        },
      },
    },
    orderBy: { branch: { branch_name: "asc" } },
  });

  // For each branch, fetch listing counts + order stats in parallel
  const branches = await Promise.all(
    branchSettings.map(async (bs) => {
      const bId = bs.branch_id;

      const listingBase = { shop_id, branch_id: bId };

      const [
        liveListings,
        hiddenListings,
        outOfStockListings,
        totalListings,
        pendingOrders,
        completedOrders,
        orderValueResult,
      ] = await Promise.all([
        prisma.marketplaceListing.count({
          where: { ...listingBase, is_visible: true, stock_status: "IN_STOCK" },
        }),
        prisma.marketplaceListing.count({
          where: { ...listingBase, is_visible: false },
        }),
        prisma.marketplaceListing.count({
          where: { ...listingBase, stock_status: "OUT_OF_STOCK" },
        }),
        prisma.marketplaceListing.count({
          where: listingBase,
        }),
        prisma.marketplaceOrder.count({
          where: { shop_id, branch_id: bId, status: "PLACED" },
        }),
        prisma.marketplaceOrder.count({
          where: { shop_id, branch_id: bId, status: "COMPLETED" },
        }),
        prisma.marketplaceOrder.aggregate({
          where: { shop_id, branch_id: bId, status: "COMPLETED" },
          _sum: { total_amount: true },
        }),
      ]);

      return {
        branch_id: bId,
        branch_name: bs.branch?.branch_name ?? "Unknown",
        marketplace_enabled: bs.marketplace_enabled,
        has_location: bs.latitude !== null && bs.longitude !== null,
        pickup_enabled: bs.pickup_enabled,
        delivery_enabled: bs.delivery_enabled,
        is_24_hours: bs.is_24_hours,
        opening_time: bs.opening_time,
        closing_time: bs.closing_time,
        live_listings: liveListings,
        hidden_listings: hiddenListings,
        out_of_stock_listings: outOfStockListings,
        total_listings: totalListings,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        order_value_total: Number(orderValueResult._sum.total_amount ?? 0),
      };
    }),
  );

  return branches;
}

// ── 6. Recent orders ──────────────────────────────────────────────────────────

async function fetchRecentOrders(shop_id, branch_id) {
  const orders = await prisma.marketplaceOrder.findMany({
    where: orderWhere(shop_id, branch_id),
    orderBy: { placed_at: "desc" },
    take: 5,
    select: {
      order_id: true,
      order_number: true,
      status: true,
      customer_name_snapshot: true,
      total_amount: true,
      requires_prescription: true,
      placed_at: true,
      branch: {
        select: { branch_name: true },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return orders.map((o) => ({
    order_id: o.order_id,
    order_number: o.order_number,
    status: o.status,
    customer_name: o.customer_name_snapshot,
    total_amount: Number(o.total_amount),
    item_count: o._count.items,
    requires_prescription: o.requires_prescription,
    placed_at: o.placed_at,
    branch_name: o.branch?.branch_name ?? null,
  }));
}

// ── 7. 7-day trend ────────────────────────────────────────────────────────────

async function fetchTrend7d(shop_id, branch_id) {
  const since = startOfDaysAgo(6); // 6 days ago + today = 7 data points

  // $queryRaw for DATE_TRUNC grouping — Prisma groupBy does not support this natively
  // We pass branch_id as a separate condition to avoid string interpolation SQL injection.
  // Both shop_id and branch_id are UUIDs validated by auth middleware upstream.

  let rows;

  if (branch_id) {
    rows = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', placed_at AT TIME ZONE 'UTC') AS day,
        COUNT(*)::int                                   AS order_count,
        COALESCE(SUM(total_amount), 0)::float           AS order_value
      FROM marketplace_orders
      WHERE shop_id   = ${shop_id}::uuid
        AND branch_id = ${branch_id}::uuid
        AND placed_at >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', placed_at AT TIME ZONE 'UTC') AS day,
        COUNT(*)::int                                   AS order_count,
        COALESCE(SUM(total_amount), 0)::float           AS order_value
      FROM marketplace_orders
      WHERE shop_id   = ${shop_id}::uuid
        AND placed_at >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;
  }

  // Fill in missing days with zero values so chart always has 7 points
  const filled = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDaysAgo(i);
    const dateStr = d.toISOString().split("T")[0]; // "2025-06-01"
    const match = rows.find(
      (r) => new Date(r.day).toISOString().split("T")[0] === dateStr,
    );
    filled.push({
      date: dateStr,
      order_count: match ? Number(match.order_count) : 0,
      order_value: match ? Number(match.order_value) : 0,
    });
  }

  return filled;
}

// ── 8. Alerts ─────────────────────────────────────────────────────────────────

function computeAlerts(overview, kpis, listings, branches) {
  const alerts = [];

  if (overview.marketplace_status === "SUSPENDED") {
    alerts.push({
      type: "danger",
      code: "MARKETPLACE_SUSPENDED",
      message: "Your marketplace is suspended. Customers cannot place orders.",
    });
  }

  if (kpis.pending_action > 0) {
    alerts.push({
      type: "warning",
      code: "ORDERS_PENDING",
      message: `${kpis.pending_action} order${kpis.pending_action > 1 ? "s are" : " is"} waiting for your action.`,
    });
  }

  if (kpis.ready_for_pickup > 0) {
    alerts.push({
      type: "info",
      code: "ORDERS_READY",
      message: `${kpis.ready_for_pickup} order${kpis.ready_for_pickup > 1 ? "s are" : " is"} ready for pickup.`,
    });
  }

  if (listings.out_of_stock > 0) {
    alerts.push({
      type: "warning",
      code: "OUT_OF_STOCK",
      message: `${listings.out_of_stock} listed medicine${listings.out_of_stock > 1 ? "s are" : " is"} out of stock.`,
    });
  }

  if (listings.low_stock > 0) {
    alerts.push({
      type: "info",
      code: "LOW_STOCK",
      message: `${listings.low_stock} medicine${listings.low_stock > 1 ? "s are" : " is"} running low (≤${LOW_STOCK_THRESHOLD} units).`,
    });
  }

  const disabledBranches = branches.filter((b) => !b.marketplace_enabled);
  if (disabledBranches.length > 0) {
    alerts.push({
      type: "info",
      code: "BRANCH_DISABLED",
      message: `${disabledBranches.length} branch${disabledBranches.length > 1 ? "es are" : " is"} not enabled for marketplace.`,
    });
  }

  const branchesWithNoLocation = branches.filter(
    (b) => b.marketplace_enabled && !b.has_location,
  );
  if (branchesWithNoLocation.length > 0) {
    alerts.push({
      type: "warning",
      code: "BRANCH_NO_LOCATION",
      message: `${branchesWithNoLocation.length} enabled branch${branchesWithNoLocation.length > 1 ? "es are" : " is"} missing location data.`,
    });
  }

  if (!overview.logo_url) {
    alerts.push({
      type: "info",
      code: "MISSING_LOGO",
      message: "Your storefront is missing a logo.",
    });
  }

  if (!overview.support_phone) {
    alerts.push({
      type: "info",
      code: "MISSING_SUPPORT_PHONE",
      message: "No support phone number is set on your storefront.",
    });
  }

  return alerts;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the full marketplace dashboard payload for a given shop.
 *
 * @param {string}      shop_id
 * @param {string|null} branch_id  - null for super_admin (all branches)
 */
export async function getMarketplaceDashboard(shop_id, branch_id = null) {
  // Run all independent sections in parallel where possible.
  // statusCounts is needed by kpis so those two are sequential.

  const [overview, statusCounts, recentOrders, trend7d] = await Promise.all([
    fetchOverview(shop_id),
    fetchOrderStatusCounts(shop_id, branch_id),
    fetchRecentOrders(shop_id, branch_id),
    fetchTrend7d(shop_id, branch_id),
  ]);

  // kpis depends on statusCounts — fetch after
  const [kpis, listings, branches] = await Promise.all([
    fetchKpis(shop_id, branch_id, statusCounts),
    fetchListingsHealth(shop_id, branch_id),
    fetchBranchPerformance(shop_id, branch_id),
  ]);

  const alerts = computeAlerts(overview, kpis, listings, branches);

  return {
    overview,
    kpis,
    order_status_counts: statusCounts,
    listings,
    branches,
    recent_orders: recentOrders,
    trend_7d: trend7d,
    alerts,
  };
}
