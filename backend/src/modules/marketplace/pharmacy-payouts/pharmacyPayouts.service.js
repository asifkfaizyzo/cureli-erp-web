import prisma from "../../../config/prisma.js";
import { calculateEarningsBreakdown } from "../../cadmin/pharmacy-payouts/cadmin.pharmacyPayouts.service.js";

// Secure validator to block malformed dev/test UUID configurations
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Prisma Model Resolver (Dynamic & Self-Healing) ─────────────────

function getPrismaModel(modelName) {
  if (!prisma) {
    console.error("[payouts service] Prisma database instance is not loaded.");
    return null;
  }

  // 1. Direct match check
  if (prisma[modelName]) return prisma[modelName];

  // 2. Normalised check (helps with singular/plural or case mismatch)
  const target = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Extract all property names on the prisma instance and prototype chain
  const keys = new Set();
  let obj = prisma;
  while (obj && obj !== Object.prototype) {
    Object.getOwnPropertyNames(obj).forEach(k => keys.add(k));
    obj = Object.getPrototypeOf(obj);
  }

  const keysArray = Array.from(keys);
  const foundKey = keysArray.find(k => {
    const norm = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    return norm === target || norm === target + "s" || target === norm + "s";
  });

  if (foundKey && prisma[foundKey]) {
    return prisma[foundKey];
  }

  // Debug Logger: Print what models are actually generated to help the developer
  const availableModels = keysArray.filter(k => 
    !k.startsWith("$") && 
    !k.startsWith("_") && 
    typeof prisma[k] === "object" && 
    prisma[k] !== null
  );
  
  console.error(
    `[payouts service] CRITICAL: Model "${modelName}" not found on Prisma Client.\n` +
    `Available models found: ${JSON.stringify(availableModels)}\n` +
    `👉 Please run: "npx prisma generate" to update your client schema.`
  );

  return null;
}

// ── Helpers & Safe Normalizers ────────────────────────────────────

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function safeFormatDate(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return typeof val === "string" ? val.split("T")[0] : null;
    }
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function safeFormatDateTime(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function parseJsonField(val, fallback) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

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

function getCurrentWeekStartStr() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

// ── Current Week Preview ────────────────────────────────────────

export async function getCurrentWeekPayout(shopId) {
  const weekStartStr = getCurrentWeekStartStr();
  const weekStartDate = getMondayDate(weekStartStr);
  const { weekEndDate } = getWeekWindow(weekStartStr);

  // Validate UUID to block malformed queries
  if (!shopId || !UUID_REGEX.test(shopId)) {
    console.warn(`[payouts service] getCurrentWeekPayout bypassed: "${shopId}" is not a valid UUID format.`);
    return {
      week_start: weekStartStr,
      week_end: safeFormatDate(weekEndDate) || weekStartStr,
      is_current_week: true,
      is_finalized: false,
      status: "LIVE_PREVIEW",
      gross_amount: 0,
      commission_amount: 0,
      net_amount: 0,
      total_orders: 0,
      branches: [],
      daily: [],
      adjustments: [],
    };
  }

  const model = getPrismaModel("PharmacyPayout");
  if (!model) {
    // Return mock fallback data if model does not exist yet to prevent system crash
    return {
      week_start: weekStartStr,
      week_end: safeFormatDate(weekEndDate) || weekStartStr,
      is_current_week: true,
      is_finalized: false,
      status: "LIVE_PREVIEW",
      gross_amount: 0,
      commission_amount: 0,
      net_amount: 0,
      total_orders: 0,
      branches: [],
      daily: [],
      adjustments: [],
    };
  }

  try {
    const payout = await model.findFirst({
      where: {
        shop_id: shopId,
        week_start: weekStartDate,
      },
    });

    // If no payout record exists yet for this week, generate a live preview
    if (!payout) {
      let breakdown = {
        gross_total: 0,
        commission_total: 0,
        net_total: 0,
        total_orders: 0,
        branches: [],
        daily: [],
      };

      try {
        breakdown = await calculateEarningsBreakdown(shopId, weekStartStr);
      } catch (err) {
        console.error("[payouts service] Live breakdown calculation exception:", err);
      }

      return {
        week_start: weekStartStr,
        week_end: safeFormatDate(weekEndDate) || weekStartStr,
        is_current_week: true,
        is_finalized: false,
        status: "LIVE_PREVIEW",
        gross_amount: Number(breakdown.gross_total || 0),
        commission_amount: Number(breakdown.commission_total || 0),
        net_amount: Number(breakdown.net_total || 0),
        total_orders: Number(breakdown.total_orders || 0),
        branches: Array.isArray(breakdown.branches) ? breakdown.branches : [],
        daily: Array.isArray(breakdown.daily) ? breakdown.daily : [],
        adjustments: [],
      };
    }

    const breakdown = parseJsonField(payout.breakdown_snapshot, {});
    const adjustments = parseJsonField(payout.adjustments, []);

    return {
      week_start: safeFormatDate(payout.week_start) || weekStartStr,
      week_end: safeFormatDate(payout.week_end) || safeFormatDate(weekEndDate),
      is_current_week: true,
      is_finalized: Boolean(payout.is_finalized),
      payout_id: payout.payout_id,
      status: payout.status || "DRAFT",
      gross_amount: Number(payout.gross_amount || 0),
      commission_amount: Number(payout.commission_amount || 0),
      net_amount: Number(payout.net_amount || 0),
      total_orders: Number(breakdown.total_orders || 0),
      branches: Array.isArray(breakdown.branches) ? breakdown.branches : [],
      daily: Array.isArray(breakdown.daily) ? breakdown.daily : [],
      adjustments: Array.isArray(adjustments) ? adjustments : [],
    };
  } catch (err) {
    console.error("[payouts service] Critical exception in getCurrentWeekPayout:", err);
    return {
      week_start: weekStartStr,
      week_end: safeFormatDate(weekEndDate) || weekStartStr,
      is_current_week: true,
      is_finalized: false,
      status: "LIVE_PREVIEW",
      gross_amount: 0,
      commission_amount: 0,
      net_amount: 0,
      total_orders: 0,
      branches: [],
      daily: [],
      adjustments: [],
    };
  }
}

// ── Payout History ──────────────────────────────────────────────

export async function getPayoutHistory(shopId, { page = 1, limit = 10 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skipNum = (pageNum - 1) * limitNum;

  // Validate UUID format of shopId
  if (!shopId || !UUID_REGEX.test(shopId)) {
    console.warn(`[payouts service] getPayoutHistory bypassed: "${shopId}" is not a valid UUID format.`);
    return {
      payouts: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const model = getPrismaModel("PharmacyPayout");
  if (!model) {
    return {
      payouts: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      },
    };
  }

  try {
    const where = { shop_id: shopId };

    const [total, payouts] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        orderBy: { week_start: "desc" },
        skip: skipNum,
        take: limitNum,
      }),
    ]);

    const mappedPayouts = payouts.map((p) => {
      try {
        const breakdown = parseJsonField(p.breakdown_snapshot, {});
        const adjustments = parseJsonField(p.adjustments, []);

        return {
          payout_id: p.payout_id,
          week_start: safeFormatDate(p.week_start),
          week_end: safeFormatDate(p.week_end),
          gross_amount: Number(p.gross_amount || 0),
          commission_amount: Number(p.commission_amount || 0),
          net_amount: Number(p.net_amount || 0),
          status: p.status || "DRAFT",
          is_finalized: Boolean(p.is_finalized),
          total_orders: Number(breakdown.total_orders || 0),
          payment_date: safeFormatDate(p.manual_payment_date),
          utr_reference: p.manual_reference || null,
          manual_bank_used: p.manual_bank_used || null,
          adjustment_count: Array.isArray(adjustments) ? adjustments.length : 0,
          created_at: safeFormatDateTime(p.created_at),
        };
      } catch (innerErr) {
        console.error(`[payouts service] Record mapping mismatch for payout_id ${p.payout_id}:`, innerErr);
        return {
          payout_id: p.payout_id,
          week_start: safeFormatDate(p.week_start),
          week_end: safeFormatDate(p.week_end),
          gross_amount: 0,
          commission_amount: 0,
          net_amount: 0,
          status: "DRAFT",
          is_finalized: false,
          total_orders: 0,
          payment_date: null,
          utr_reference: null,
          manual_bank_used: null,
          adjustment_count: 0,
          created_at: null,
        };
      }
    });

    return {
      payouts: mappedPayouts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  } catch (err) {
    console.error("[payouts service] Critical exception in getPayoutHistory query block:", err);
    return {
      payouts: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

// ── Payout Detail ───────────────────────────────────────────────

export async function getPayoutDetail(shopId, payoutId) {
  if (!shopId || !UUID_REGEX.test(shopId) || !payoutId || !UUID_REGEX.test(payoutId)) {
    const err = new Error("Invalid UUID identifiers passed to getPayoutDetail");
    err.code = "NOT_FOUND";
    throw err;
  }

  const model = getPrismaModel("PharmacyPayout");
  if (!model) {
    const err = new Error("Database table PharmacyPayout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  try {
    const payout = await model.findFirst({
      where: {
        payout_id: payoutId,
        shop_id: shopId,
      },
      include: {
        orderLineItems: { orderBy: { completed_at: "asc" } },
      },
    });

    if (!payout) {
      const err = new Error("Payout not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const breakdown = parseJsonField(payout.breakdown_snapshot, {});
    const adjustments = parseJsonField(payout.adjustments, []);

    return {
      payout_id: payout.payout_id,
      week_start: safeFormatDate(payout.week_start),
      week_end: safeFormatDate(payout.week_end),
      status: payout.status,
      is_finalized: Boolean(payout.is_finalized),
      gross_amount: Number(payout.gross_amount || 0),
      commission_amount: Number(payout.commission_amount || 0),
      net_amount: Number(payout.net_amount || 0),
      total_orders: Number(breakdown.total_orders || 0),
      branches: Array.isArray(breakdown.branches) ? breakdown.branches : [],
      daily: Array.isArray(breakdown.daily) ? breakdown.daily : [],
      adjustments: Array.isArray(adjustments) ? adjustments : [],
      payment_date: safeFormatDate(payout.manual_payment_date),
      utr_reference: payout.manual_reference || null,
      manual_bank_used: payout.manual_bank_used || null,
      order_line_items: Array.isArray(payout.orderLineItems)
        ? payout.orderLineItems.map((o) => ({
            id: o.id,
            order_id: o.order_id,
            order_number: o.order_number,
            subtotal: Number(o.subtotal || 0),
            commission_rate_percent: Number(o.commission_rate_percent || 0),
            commission_amount: Number(o.commission_amount || 0),
            pharmacy_earning: Number(o.pharmacy_earning || 0),
            completed_at: safeFormatDateTime(o.completed_at),
          }))
        : [],
    };
  } catch (err) {
    console.error("[payouts service] Error inside getPayoutDetail query:", err);
    throw err;
  }
}

// ── Earnings Summary (for dashboard widget) ─────────────────────

export async function getEarningsSummary(shopId) {
  if (!shopId || !UUID_REGEX.test(shopId)) {
    console.warn(`[payouts service] getEarningsSummary bypassed: "${shopId}" is not a valid UUID format.`);
    return {
      current_week: {
        week_start: getCurrentWeekStartStr(),
        week_end: safeFormatDate(new Date()) || "",
        is_current_week: true,
        is_finalized: false,
        status: "LIVE_PREVIEW",
        gross_amount: 0,
        commission_amount: 0,
        net_amount: 0,
        total_orders: 0,
        branches: [],
        daily: [],
        adjustments: [],
      },
      last_4_weeks: {
        total_gross: 0,
        total_commission: 0,
        total_net: 0,
        pending_amount: 0,
        payout_count: 0,
      },
    };
  }

  let currentWeekPayoutData = null;
  try {
    currentWeekPayoutData = await getCurrentWeekPayout(shopId);
  } catch (err) {
    console.error("[payouts service] Error fetching current week payout inside summary:", err);
  }

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const model = getPrismaModel("PharmacyPayout");
  let recentPayouts = [];
  
  if (model) {
    try {
      recentPayouts = await model.findMany({
        where: {
          shop_id: shopId,
          week_start: { gte: fourWeeksAgo },
          status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
        },
        select: {
          gross_amount: true,
          commission_amount: true,
          net_amount: true,
          status: true,
        },
      });
    } catch (err) {
      console.error("[payouts service] Error fetching recent payouts for summary block:", err);
    }
  }

  const totalGross = round2(recentPayouts.reduce((s, p) => s + Number(p.gross_amount || 0), 0));
  const totalCommission = round2(recentPayouts.reduce((s, p) => s + Number(p.commission_amount || 0), 0));
  const totalNet = round2(recentPayouts.reduce((s, p) => s + Number(p.net_amount || 0), 0));
  const pendingAmount = round2(
    recentPayouts
      .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((s, p) => s + Number(p.net_amount || 0), 0),
  );

  return {
    current_week: currentWeekPayoutData,
    last_4_weeks: {
      total_gross: totalGross,
      total_commission: totalCommission,
      total_net: totalNet,
      pending_amount: pendingAmount,
      payout_count: recentPayouts.length,
    },
  };
}