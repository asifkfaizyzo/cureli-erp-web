// backend/src/modules/cadmin/pharmacy-payouts/cadmin.pharmacyPayouts.service.js
import prisma from "../../../config/prisma.js";
import { getEffectiveRateForShop } from "../commission/cadmin.commission.service.js";

// ── Helpers ──────────────────────────────────────────────────────

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMondayDate(weekStartStr) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function getWeekWindow(weekStartStr) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const weekStart = new Date(y, m - 1, d, 6, 0, 0, 0);
  const weekEnd = new Date(y, m - 1, d + 7, 6, 0, 0, 0);
  const weekEndDate = new Date(Date.UTC(y, m - 1, d + 6));
  return { weekStart, weekEnd, weekEndDate };
}

function isWeekEnded(weekStartStr) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const nextMonday6AM = new Date(y, m - 1, d + 7, 6, 0, 0, 0);
  return new Date() >= nextMonday6AM;
}

function isCurrentWeek(weekStartStr) {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const inputMonday = new Date(y, m - 1, d);
  return (
    thisMonday.getFullYear() === inputMonday.getFullYear() &&
    thisMonday.getMonth() === inputMonday.getMonth() &&
    thisMonday.getDate() === inputMonday.getDate()
  );
}

function captureBankSnapshot(profile) {
  if (!profile) return null;
  if (!profile.bank_account_number && !profile.bank_ifsc) return null;
  return {
    account_number: profile.bank_account_number,
    ifsc: profile.bank_ifsc,
    holder_name: profile.bank_account_holder,
    bank_name: profile.bank_name,
    branch_name: profile.bank_branch_name,
    vpa: profile.bank_vpa,
  };
}

/**
 * Compute commission for a single order.
 * Uses snapshot if available; falls back to provided legacy rate.
 */
function computeOrderCommission(order, legacyRatePercent) {
  const subtotal = Number(order.subtotal);

  if (
    order.commission_amount_snapshot !== null &&
    order.commission_amount_snapshot !== undefined
  ) {
    const commission = Number(order.commission_amount_snapshot);
    return {
      subtotal,
      rate: Number(order.commission_rate_snapshot || 0),
      commission,
      earning: round2(subtotal - commission),
      source: "snapshot",
    };
  }

  const commission = round2(subtotal * legacyRatePercent / 100);
  return {
    subtotal,
    rate: legacyRatePercent,
    commission,
    earning: round2(subtotal - commission),
    source: "legacy",
  };
}

// ── Core Calculation ─────────────────────────────────────────────

export async function calculateEarningsBreakdown(shopId, weekStartStr) {
  const { weekStart, weekEnd } = getWeekWindow(weekStartStr);
  const [y, m, d] = weekStartStr.split("-").map(Number);

  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      shop_id: shopId,
      status: "COMPLETED",
      payment_status: "PAID",
      completed_at: { gte: weekStart, lt: weekEnd },
    },
    select: {
      order_id: true,
      order_number: true,
      branch_id: true,
      subtotal: true,
      completed_at: true,
      payment_status: true,
      commission_rate_snapshot: true,
      commission_amount_snapshot: true,
      branch: { select: { branch_name: true } },
    },
    orderBy: { completed_at: "asc" },
  });

  // Resolve current effective rate for legacy orders (no snapshot)
  let legacyRate = 0;
  try {
    const effectiveRate = await getEffectiveRateForShop(shopId);
    if (effectiveRate.has_commission && !effectiveRate.is_suspended) {
      legacyRate = Number(effectiveRate.flat_percent || 0);
    }
  } catch {
    // If commission resolution fails, default to 0
  }

  const orderBreakdowns = orders.map((order) => {
    const calc = computeOrderCommission(order, legacyRate);
    return {
      order_id: order.order_id,
      order_number: order.order_number,
      branch_id: order.branch_id,
      branch_name: order.branch?.branch_name || "Unknown",
      ...calc,
      completed_at: order.completed_at,
    };
  });

  // Aggregate by branch
  const branchMap = new Map();
  for (const ob of orderBreakdowns) {
    if (!branchMap.has(ob.branch_id)) {
      branchMap.set(ob.branch_id, {
        branch_id: ob.branch_id,
        branch_name: ob.branch_name,
        orders: 0,
        subtotal: 0,
        commission: 0,
        net: 0,
      });
    }
    const b = branchMap.get(ob.branch_id);
    b.orders += 1;
    b.subtotal = round2(b.subtotal + ob.subtotal);
    b.commission = round2(b.commission + ob.commission);
    b.net = round2(b.net + ob.earning);
  }

  // Aggregate by day
  const dayBuckets = Array.from({ length: 7 }, () => ({
    orders: 0,
    subtotal: 0,
    commission: 0,
  }));

  for (const ob of orderBreakdowns) {
    const dt = new Date(ob.completed_at);
    const diffMs = dt.getTime() - new Date(y, m - 1, d, 6, 0, 0, 0).getTime();
    const dayIndex = Math.max(0, Math.min(6, Math.floor(diffMs / (24 * 60 * 60 * 1000))));
    const bucket = dayBuckets[dayIndex];
    bucket.orders += 1;
    bucket.subtotal = round2(bucket.subtotal + ob.subtotal);
    bucket.commission = round2(bucket.commission + ob.commission);
  }

  const daily = dayBuckets.map((bucket, i) => ({
    date: new Date(Date.UTC(y, m - 1, d + i)).toISOString().split("T")[0],
    day_name: DAY_NAMES[i],
    orders: bucket.orders,
    subtotal: bucket.subtotal,
    commission: bucket.commission,
  }));

  const grossTotal = round2(orderBreakdowns.reduce((s, o) => s + o.subtotal, 0));
  const commissionTotal = round2(orderBreakdowns.reduce((s, o) => s + o.commission, 0));
  const netTotal = round2(grossTotal - commissionTotal);

  return {
    total_orders: orders.length,
    gross_total: grossTotal,
    commission_total: commissionTotal,
    net_total: netTotal,
    branches: Array.from(branchMap.values()),
    daily,
    orders: orderBreakdowns,
  };
}

// ── List ─────────────────────────────────────────────────────────

export async function getPharmacyPayoutsList(weekStartStr, filters = {}) {
  const { weekStart, weekEnd, weekEndDate } = getWeekWindow(weekStartStr);
  const weekStartDate = getMondayDate(weekStartStr);
  const { status, search, page = 1, limit = 25 } = filters;

  // Find all shops with eligible orders this week
  const orderAggs = await prisma.marketplaceOrder.groupBy({
    by: ["shop_id"],
    where: {
      status: "COMPLETED",
      payment_status: "PAID",
      completed_at: { gte: weekStart, lt: weekEnd },
    },
    _count: { order_id: true },
    _sum: { subtotal: true },
  });

  const shopIds = orderAggs.map((a) => a.shop_id);
  if (shopIds.length === 0) {
    return buildEmptyList(weekStartStr, weekEndDate, page, limit);
  }

  // Fetch existing payouts
  const payouts = await prisma.pharmacyPayout.findMany({
    where: { week_start: weekStartDate, shop_id: { in: shopIds } },
  });
  const payoutMap = new Map(payouts.map((p) => [p.shop_id, p]));

  // Fetch shop details
  const shopWhere = { shop_id: { in: shopIds } };
  if (search) {
    shopWhere.OR = [
      { business_name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const shops = await prisma.shop.findMany({
    where: shopWhere,
    select: {
      shop_id: true,
      business_name: true,
      city: true,
      state: true,
      marketplaceProfile: {
        select: {
          bank_account_number: true,
          bank_ifsc: true,
        },
      },
    },
  });

  const shopMap = new Map(shops.map((s) => [s.shop_id, s]));
  const aggMap = new Map(orderAggs.map((a) => [a.shop_id, a]));

  const results = [];
  for (const shop of shops) {
    const agg = aggMap.get(shop.shop_id);
    if (!agg) continue;

    const payout = payoutMap.get(shop.shop_id);
    const grossFromOrders = Number(agg._sum.subtotal || 0);

    results.push({
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      city: shop.city,
      state: shop.state,
      payout_id: payout?.payout_id || null,
      status: payout?.status || null,
      gross_amount: payout ? Number(payout.gross_amount) : grossFromOrders,
      commission_amount: payout ? Number(payout.commission_amount) : 0,
      net_amount: payout ? Number(payout.net_amount) : grossFromOrders,
      total_orders: payout?.breakdown_snapshot?.total_orders ?? agg._count.order_id,
      is_finalized: payout?.is_finalized || false,
      last_refreshed_at: payout?.last_refreshed_at?.toISOString() || null,
      bank_details_complete: !!(
        shop.marketplaceProfile?.bank_account_number &&
        shop.marketplaceProfile?.bank_ifsc
      ),
    });
  }

  let filtered = results;
  if (status) {
    if (status === "NOT_CALCULATED") {
      filtered = results.filter((r) => !r.status);
    } else {
      filtered = results.filter((r) => r.status === status);
    }
  }

  filtered.sort((a, b) => b.gross_amount - a.gross_amount);

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return {
    week_start: weekStartStr,
    week_end: weekEndDate.toISOString().split("T")[0],
    is_current_week: isCurrentWeek(weekStartStr),
    is_week_ended: isWeekEnded(weekStartStr),
    shops: paginated,
    pagination: { page, limit, total, totalPages },
    summary: {
      total_shops: total,
      total_gross: round2(filtered.reduce((s, r) => s + r.gross_amount, 0)),
      total_commission: round2(filtered.reduce((s, r) => s + r.commission_amount, 0)),
      total_net: round2(filtered.reduce((s, r) => s + r.net_amount, 0)),
      pending_count: filtered.filter((r) => r.status === "PENDING").length,
      processing_count: filtered.filter((r) => r.status === "PROCESSING").length,
      completed_count: filtered.filter((r) => r.status === "COMPLETED").length,
    },
  };
}

function buildEmptyList(weekStartStr, weekEndDate, page, limit) {
  return {
    week_start: weekStartStr,
    week_end: weekEndDate.toISOString().split("T")[0],
    is_current_week: isCurrentWeek(weekStartStr),
    is_week_ended: isWeekEnded(weekStartStr),
    shops: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
    summary: {
      total_shops: 0,
      total_gross: 0,
      total_commission: 0,
      total_net: 0,
      pending_count: 0,
      processing_count: 0,
      completed_count: 0,
    },
  };
}

// ── Detail ───────────────────────────────────────────────────────

export async function getPharmacyPayoutDetail(shopId, weekStartStr) {
  const weekStartDate = getMondayDate(weekStartStr);
  const { weekEndDate } = getWeekWindow(weekStartStr);

  const shop = await prisma.shop.findUnique({
    where: { shop_id: shopId },
    select: {
      shop_id: true,
      business_name: true,
      city: true,
      state: true,
      marketplaceProfile: {
        select: {
          bank_account_holder: true,
          bank_name: true,
          bank_branch_name: true,
          bank_ifsc: true,
          bank_account_number: true,
          bank_vpa: true,
        },
      },
    },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const payout = await prisma.pharmacyPayout.findUnique({
    where: {
      pharmacy_week_unique: { shop_id: shopId, week_start: weekStartDate },
    },
    include: {
      orderLineItems: { orderBy: { completed_at: "asc" } },
    },
  });

  return {
    shop: {
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      city: shop.city,
      state: shop.state,
      bank_details: shop.marketplaceProfile
        ? {
            account_number: shop.marketplaceProfile.bank_account_number,
            ifsc: shop.marketplaceProfile.bank_ifsc,
            holder_name: shop.marketplaceProfile.bank_account_holder,
            bank_name: shop.marketplaceProfile.bank_name,
            branch_name: shop.marketplaceProfile.bank_branch_name,
            vpa: shop.marketplaceProfile.bank_vpa,
          }
        : null,
    },
    week_start: weekStartStr,
    week_end: weekEndDate.toISOString().split("T")[0],
    is_current_week: isCurrentWeek(weekStartStr),
    is_week_ended: isWeekEnded(weekStartStr),
    payout: payout
      ? {
          payout_id: payout.payout_id,
          status: payout.status,
          gross_amount: Number(payout.gross_amount),
          commission_amount: Number(payout.commission_amount),
          net_amount: Number(payout.net_amount),
          is_finalized: payout.is_finalized,
          finalized_at: payout.finalized_at?.toISOString() || null,
          breakdown_snapshot: payout.breakdown_snapshot,
          adjustments: payout.adjustments,
          internal_notes: payout.internal_notes,
          payment_method: payout.payment_method,
          manual_reference: payout.manual_reference,
          manual_notes: payout.manual_notes,
          manual_payment_date: payout.manual_payment_date
            ? new Date(payout.manual_payment_date).toISOString().split("T")[0]
            : null,
          manual_bank_used: payout.manual_bank_used,
          bank_snapshot: payout.bank_snapshot,
          processed_by: payout.processed_by,
          processed_at: payout.processed_at?.toISOString() || null,
          failed_reason: payout.failed_reason,
          last_refreshed_at: payout.last_refreshed_at?.toISOString() || null,
          created_at: payout.created_at.toISOString(),
          updated_at: payout.updated_at.toISOString(),
        }
      : null,
    order_line_items: payout
      ? payout.orderLineItems.map((o) => ({
          id: o.id,
          order_id: o.order_id,
          order_number: o.order_number,
          branch_id: o.branch_id,
          subtotal: Number(o.subtotal),
          commission_rate_percent: Number(o.commission_rate_percent),
          commission_amount: Number(o.commission_amount),
          pharmacy_earning: Number(o.pharmacy_earning),
          completed_at: o.completed_at?.toISOString() || null,
        }))
      : [],
  };
}

// ── Refresh ──────────────────────────────────────────────────────

export async function refreshPharmacyPayout(shopId, weekStartStr, adminId) {
  const weekStartDate = getMondayDate(weekStartStr);
  const { weekEndDate } = getWeekWindow(weekStartStr);

  const shop = await prisma.shop.findUnique({
    where: { shop_id: shopId },
    select: {
      shop_id: true,
      marketplaceProfile: {
        select: {
          bank_account_holder: true,
          bank_name: true,
          bank_branch_name: true,
          bank_ifsc: true,
          bank_account_number: true,
          bank_vpa: true,
        },
      },
    },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const existing = await prisma.pharmacyPayout.findUnique({
    where: {
      pharmacy_week_unique: { shop_id: shopId, week_start: weekStartDate },
    },
  });

  if (existing) {
    if (existing.status === "PROCESSING" || existing.status === "COMPLETED") {
      const err = new Error(`Cannot refresh payout in ${existing.status} status`);
      err.code = "INVALID_TRANSITION";
      throw err;
    }
  }

  const breakdown = await calculateEarningsBreakdown(shopId, weekStartStr);

  const existingAdjustments = existing?.adjustments || [];
  const adjustmentTotal = Array.isArray(existingAdjustments)
    ? existingAdjustments.reduce(
        (s, a) => s + (a.type === "ADDITION" ? Number(a.amount) : -Number(a.amount)),
        0,
      )
    : 0;

  const netAmount = round2(breakdown.net_total + adjustmentTotal);
  breakdown.adjustments_total = round2(adjustmentTotal);
  breakdown.net_total = netAmount;

  const payout = await prisma.pharmacyPayout.upsert({
    where: {
      pharmacy_week_unique: { shop_id: shopId, week_start: weekStartDate },
    },
    create: {
      shop_id: shopId,
      week_start: weekStartDate,
      week_end: weekEndDate,
      gross_amount: breakdown.gross_total,
      commission_amount: breakdown.commission_total,
      net_amount: netAmount,
      status: "DRAFT",
      breakdown_snapshot: breakdown,
      adjustments: existingAdjustments,
      bank_snapshot: captureBankSnapshot(shop.marketplaceProfile),
      last_refreshed_at: new Date(),
      refreshed_by: adminId,
    },
    update: {
      gross_amount: breakdown.gross_total,
      commission_amount: breakdown.commission_total,
      net_amount: netAmount,
      breakdown_snapshot: breakdown,
      bank_snapshot: captureBankSnapshot(shop.marketplaceProfile),
      last_refreshed_at: new Date(),
      refreshed_by: adminId,
    },
  });

  return { payout_id: payout.payout_id, status: payout.status, breakdown };
}

// ── Refresh All ──────────────────────────────────────────────────

export async function refreshAllPharmacyPayouts(weekStartStr, adminId) {
  const { weekStart, weekEnd } = getWeekWindow(weekStartStr);

  const orderAggs = await prisma.marketplaceOrder.groupBy({
    by: ["shop_id"],
    where: {
      status: "COMPLETED",
      payment_status: "PAID",
      completed_at: { gte: weekStart, lt: weekEnd },
    },
  });

  const shopIds = orderAggs.map((a) => a.shop_id);
  let refreshed = 0;
  let failed = 0;

  for (let i = 0; i < shopIds.length; i += 10) {
    const batch = shopIds.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((id) => refreshPharmacyPayout(id, weekStartStr, adminId)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") refreshed++;
      else failed++;
    }
  }

  return { total: shopIds.length, refreshed, failed };
}

// ── Finalize Week ────────────────────────────────────────────────

export async function finalizePharmacyPayoutWeek(weekStartStr) {
  if (!isWeekEnded(weekStartStr)) {
    const err = new Error("Cannot finalize a week that has not ended yet");
    err.code = "WEEK_NOT_ENDED";
    throw err;
  }

  const weekStartDate = getMondayDate(weekStartStr);

  const drafts = await prisma.pharmacyPayout.findMany({
    where: { week_start: weekStartDate, status: "DRAFT" },
    select: { payout_id: true, shop_id: true },
  });

  let finalized = 0;

  for (const draft of drafts) {
    try {
      const breakdown = await calculateEarningsBreakdown(draft.shop_id, weekStartStr);

      const existingPayout = await prisma.pharmacyPayout.findUnique({
        where: { payout_id: draft.payout_id },
        select: { adjustments: true },
      });

      const existingAdjustments = existingPayout?.adjustments || [];
      const adjustmentTotal = Array.isArray(existingAdjustments)
        ? existingAdjustments.reduce(
            (s, a) => s + (a.type === "ADDITION" ? Number(a.amount) : -Number(a.amount)),
            0,
          )
        : 0;

      // Check for negative rollover from previous week
      const prevMonday = new Date(weekStartDate);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const prevPayout = await prisma.pharmacyPayout.findUnique({
        where: {
          pharmacy_week_unique: { shop_id: draft.shop_id, week_start: prevMonday },
        },
        select: { net_amount: true, week_start: true },
      });

      let rolloverAdjustment = null;
      if (prevPayout && Number(prevPayout.net_amount) < 0) {
        const debit = Math.abs(Number(prevPayout.net_amount));
        rolloverAdjustment = {
          id: `rollover-${prevMonday.toISOString().split("T")[0]}`,
          type: "DEDUCTION",
          label: `Carried debit from week ${prevMonday.toISOString().split("T")[0]}`,
          amount: debit,
          note: "Auto-rolled negative balance from previous week",
          by: "system",
          at: new Date().toISOString(),
        };
      }

      const allAdjustments = rolloverAdjustment
        ? [...existingAdjustments, rolloverAdjustment]
        : existingAdjustments;

      const finalAdjustmentTotal = round2(
        adjustmentTotal + (rolloverAdjustment ? -rolloverAdjustment.amount : 0),
      );
      const netAmount = round2(breakdown.net_total + finalAdjustmentTotal);
      breakdown.adjustments_total = finalAdjustmentTotal;
      breakdown.net_total = netAmount;

      await prisma.$transaction(async (tx) => {
        await tx.pharmacyPayout.update({
          where: { payout_id: draft.payout_id },
          data: {
            gross_amount: breakdown.gross_total,
            commission_amount: breakdown.commission_total,
            net_amount: netAmount,
            breakdown_snapshot: breakdown,
            adjustments: allAdjustments,
            is_finalized: true,
            finalized_at: new Date(),
            status: "PENDING",
            last_refreshed_at: new Date(),
          },
        });

        // Delete old line items (in case of re-finalization)
        await tx.pharmacyPayoutOrder.deleteMany({
          where: { payout_id: draft.payout_id },
        });

        // Create per-order line items
        if (breakdown.orders && breakdown.orders.length > 0) {
          await tx.pharmacyPayoutOrder.createMany({
            data: breakdown.orders.map((o) => ({
              payout_id: draft.payout_id,
              order_id: o.order_id,
              branch_id: o.branch_id,
              order_number: o.order_number,
              subtotal: o.subtotal,
              commission_rate_percent: o.rate,
              commission_amount: o.commission,
              pharmacy_earning: o.earning,
              payment_status_at_calculation: "PAID",
              completed_at: o.completed_at,
            })),
          });
        }
      });

      finalized++;
    } catch (err) {
      console.error(
        `Failed to finalize pharmacy payout ${draft.payout_id}:`,
        err.message,
      );
    }
  }

  return { total_drafts: drafts.length, finalized };
}

// ── Status Transitions ───────────────────────────────────────────

const VALID_TRANSITIONS = {
  DRAFT: ["PENDING"],
  PENDING: ["PROCESSING", "DRAFT"],
  PROCESSING: ["COMPLETED", "FAILED"],
  FAILED: ["PROCESSING"],
  COMPLETED: [],
};

export async function transitionPharmacyPayoutStatus(payoutId, targetStatus, data, adminId) {
  const payout = await prisma.pharmacyPayout.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    const err = new Error("Pharmacy payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const allowed = VALID_TRANSITIONS[payout.status] || [];
  if (!allowed.includes(targetStatus)) {
    const err = new Error(`Cannot transition from ${payout.status} to ${targetStatus}`);
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  const updateData = { status: targetStatus };

  if (targetStatus === "PROCESSING") {
    if (!payout.bank_snapshot) {
      const err = new Error("Pharmacy bank details are missing. Cannot start processing.");
      err.code = "BANK_DETAILS_MISSING";
      throw err;
    }
    updateData.manual_reference = data.manual_reference;
    updateData.manual_bank_used = data.manual_bank_used || null;
    updateData.manual_notes = data.manual_notes || null;
    updateData.processed_by = adminId;
    updateData.processed_at = new Date();
  }

  if (targetStatus === "COMPLETED") {
    if (data.manual_payment_date) {
      const [y, m, d] = data.manual_payment_date.split("-").map(Number);
      updateData.manual_payment_date = new Date(Date.UTC(y, m - 1, d));
    }
    if (data.manual_reference) {
      updateData.manual_reference = data.manual_reference;
    }
  }

  if (targetStatus === "FAILED") {
    updateData.failed_reason = data.failed_reason;
  }

  if (targetStatus === "DRAFT" && payout.status === "PENDING") {
    updateData.is_finalized = false;
    updateData.finalized_at = null;
  }

  const updated = await prisma.pharmacyPayout.update({
    where: { payout_id: payoutId },
    data: updateData,
  });

  return {
    payout_id: updated.payout_id,
    status: updated.status,
    previous_status: payout.status,
  };
}

// ── Adjustments ──────────────────────────────────────────────────

export async function updatePharmacyPayoutAdjustments(payoutId, adjustments) {
  const payout = await prisma.pharmacyPayout.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    const err = new Error("Pharmacy payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (payout.status === "PROCESSING" || payout.status === "COMPLETED") {
    const err = new Error(`Cannot modify adjustments in ${payout.status} status`);
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  const adjustmentTotal = adjustments.reduce(
    (s, a) => s + (a.type === "ADDITION" ? Number(a.amount) : -Number(a.amount)),
    0,
  );
  const netAmount = round2(
    Number(payout.gross_amount) - Number(payout.commission_amount) + adjustmentTotal,
  );

  let updatedBreakdown = payout.breakdown_snapshot;
  if (updatedBreakdown && typeof updatedBreakdown === "object") {
    updatedBreakdown = {
      ...updatedBreakdown,
      adjustments_total: round2(adjustmentTotal),
      net_total: netAmount,
    };
  }

  const updated = await prisma.pharmacyPayout.update({
    where: { payout_id: payoutId },
    data: {
      adjustments,
      net_amount: netAmount,
      breakdown_snapshot: updatedBreakdown,
    },
  });

  return {
    payout_id: updated.payout_id,
    gross_amount: Number(updated.gross_amount),
    commission_amount: Number(updated.commission_amount),
    net_amount: Number(updated.net_amount),
    adjustments: updated.adjustments,
  };
}

// ── Internal Notes ───────────────────────────────────────────────

export async function addPharmacyPayoutNote(payoutId, adminId, text) {
  const payout = await prisma.pharmacyPayout.findUnique({
    where: { payout_id: payoutId },
    select: { internal_notes: true },
  });

  if (!payout) {
    const err = new Error("Pharmacy payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const existingNotes = Array.isArray(payout.internal_notes)
    ? payout.internal_notes
    : [];

  const updated = await prisma.pharmacyPayout.update({
    where: { payout_id: payoutId },
    data: {
      internal_notes: [
        ...existingNotes,
        { by: adminId, at: new Date().toISOString(), text },
      ],
    },
  });

  return { payout_id: updated.payout_id, notes: updated.internal_notes };
}

// ── History ──────────────────────────────────────────────────────

export async function getPharmacyPayoutHistory(shopId, { page = 1, limit = 10 }) {
  const where = { shop_id: shopId };

  const [total, payouts] = await Promise.all([
    prisma.pharmacyPayout.count({ where }),
    prisma.pharmacyPayout.findMany({
      where,
      select: {
        payout_id: true,
        week_start: true,
        week_end: true,
        gross_amount: true,
        commission_amount: true,
        net_amount: true,
        status: true,
        manual_reference: true,
        manual_bank_used: true,
        manual_payment_date: true,
        processed_at: true,
        created_at: true,
      },
      orderBy: { week_start: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    payouts: payouts.map((p) => ({
      payout_id: p.payout_id,
      week_start: new Date(p.week_start).toISOString().split("T")[0],
      week_end: new Date(p.week_end).toISOString().split("T")[0],
      gross_amount: Number(p.gross_amount),
      commission_amount: Number(p.commission_amount),
      net_amount: Number(p.net_amount),
      status: p.status,
      manual_reference: p.manual_reference || null,
      manual_bank_used: p.manual_bank_used || null,
      manual_payment_date: p.manual_payment_date
        ? new Date(p.manual_payment_date).toISOString().split("T")[0]
        : null,
      processed_at: p.processed_at?.toISOString() || null,
      created_at: p.created_at.toISOString(),
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Bulk Actions ─────────────────────────────────────────────────

export async function bulkProcessPharmacyPayouts(data, adminId) {
  const { payout_ids, manual_reference, manual_bank_used, manual_notes } = data;

  const payouts = await prisma.pharmacyPayout.findMany({
    where: { payout_id: { in: payout_ids } },
  });

  let successCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const p of payouts) {
    if (p.status !== "PENDING" && p.status !== "FAILED") {
      skippedCount++;
      continue;
    }
    if (!p.bank_snapshot) {
      skippedCount++;
      errors.push(`Payout ${p.payout_id}: Missing bank details`);
      continue;
    }
    try {
      await prisma.pharmacyPayout.update({
        where: { payout_id: p.payout_id },
        data: {
          status: "PROCESSING",
          manual_reference,
          manual_bank_used: manual_bank_used || null,
          manual_notes: manual_notes || null,
          processed_by: adminId,
          processed_at: new Date(),
        },
      });
      successCount++;
    } catch (err) {
      errors.push(`Payout ${p.payout_id}: ${err.message}`);
    }
  }

  return { total: payout_ids.length, processed: successCount, skipped: skippedCount, errors };
}

export async function bulkCompletePharmacyPayouts(data, adminId) {
  const { payout_ids, manual_payment_date, manual_reference } = data;
  const [y, m, d] = manual_payment_date.split("-").map(Number);
  const paymentDate = new Date(Date.UTC(y, m - 1, d));

  const payouts = await prisma.pharmacyPayout.findMany({
    where: { payout_id: { in: payout_ids } },
  });

  let successCount = 0;
  let skippedCount = 0;

  for (const p of payouts) {
    if (p.status !== "PROCESSING") {
      skippedCount++;
      continue;
    }
    await prisma.pharmacyPayout.update({
      where: { payout_id: p.payout_id },
      data: {
        status: "COMPLETED",
        manual_payment_date: paymentDate,
        ...(manual_reference ? { manual_reference } : {}),
      },
    });
    successCount++;
  }

  return { total: payout_ids.length, completed: successCount, skipped: skippedCount };
}

// ── CSV Export ───────────────────────────────────────────────────

export async function exportPharmacyPayoutsCSV(weekStartStr, filters = {}) {
  const result = await getPharmacyPayoutsList(weekStartStr, { ...filters, limit: 5000, page: 1 });
  const rows = result.shops || [];

  const shopIds = rows.map((r) => r.shop_id);
  const shops = await prisma.shop.findMany({
    where: { shop_id: { in: shopIds } },
    select: {
      shop_id: true,
      marketplaceProfile: {
        select: {
          bank_account_holder: true,
          bank_account_number: true,
          bank_ifsc: true,
          bank_name: true,
        },
      },
    },
  });
  const bankMap = new Map(shops.map((s) => [s.shop_id, s.marketplaceProfile]));

  const payouts = await prisma.pharmacyPayout.findMany({
    where: { week_start: getMondayDate(weekStartStr), shop_id: { in: shopIds } },
    select: {
      shop_id: true,
      manual_reference: true,
      manual_bank_used: true,
      manual_payment_date: true,
    },
  });
  const payoutDetailsMap = new Map(payouts.map((p) => [p.shop_id, p]));

  const headers = [
    "Shop ID", "Shop Name", "City", "Status", "Orders",
    "Gross (INR)", "Commission (INR)", "Net (INR)",
    "Account Holder", "Account Number", "IFSC", "Bank",
    "UTR / Reference", "Bank Used", "Payment Date",
  ];

  const esc = (val) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const bank = bankMap.get(row.shop_id) || {};
    const details = payoutDetailsMap.get(row.shop_id) || {};

    csvRows.push([
      esc(row.shop_id), esc(row.business_name), esc(row.city),
      esc(row.status || "NOT_CALCULATED"), esc(row.total_orders),
      esc(row.gross_amount), esc(row.commission_amount), esc(row.net_amount),
      esc(bank.bank_account_holder || "—"), esc(bank.bank_account_number || "—"),
      esc(bank.bank_ifsc || "—"), esc(bank.bank_name || "—"),
      esc(details.manual_reference || "—"), esc(details.manual_bank_used || "—"),
      esc(details.manual_payment_date
        ? new Date(details.manual_payment_date).toISOString().split("T")[0]
        : "—"),
    ].join(","));
  }

  return csvRows.join("\n");
}