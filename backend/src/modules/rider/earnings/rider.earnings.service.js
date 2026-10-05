// backend/src/modules/rider/earnings/rider.earnings.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";

// ── Shift & Week Helpers (mirrors dashboard service) ─────────

function getShiftWindowForDate(dateInput) {
  const d = new Date(dateInput);
  const shiftStart = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    6,
    0,
    0,
    0,
  );
  const shiftEnd = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + 1,
    5,
    59,
    59,
    999,
  );
  return { shiftStart, shiftEnd };
}

function getWeekStartMonday6AM(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(6, 0, 0, 0);
  if (now < d) d.setDate(d.getDate() - 7);
  return d;
}

function deltaPct(current, previous) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0 && current > 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Guard ────────────────────────────────────────────────────

async function ensureIndependent(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: { rider_type: true },
  });
  if (!rider) {
    const err = new Error("Rider not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (rider.rider_type !== "INDEPENDENT") {
    const err = new Error("Earnings are only available for independent riders");
    err.code = "FORBIDDEN";
    throw err;
  }
  return rider;
}

// ── Shared Aggregation ───────────────────────────────────────

async function sumEarnings(riderId, gte, lte) {
  const stats = await prisma.delivery.aggregate({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { gte, lte },
    },
    _count: { delivery_id: true },
    _sum: {
      total_rider_earning: true,
      tip_amount: true,
      pickup_fee: true,
      drop_fee: true,
      surge_fee: true,
      floor_topup_fee: true,
    },
  });

  return {
    count: stats._count.delivery_id,
    total_rider_earning: Number(stats._sum.total_rider_earning || 0),
    tips: Number(stats._sum.tip_amount || 0),
    pickup_fee: Number(stats._sum.pickup_fee || 0),
    drop_fee: Number(stats._sum.drop_fee || 0),
    surge: Number(stats._sum.surge_fee || 0),
    floor_topup: Number(stats._sum.floor_topup_fee || 0),
  };
}

async function sumIncentiveEarnings(riderId, gte, lte) {
  const result = await prisma.riderEarningLedger.aggregate({
    where: {
      rider_id: riderId,
      created_at: { gte, lte },
      type: {
        in: [
          "STREAK_BONUS",
          "WEEKLY_CHALLENGE",
          "SHIFT_BONUS",
          "REFERRAL_BONUS",
          "MANUAL_ADJUSTMENT",
        ],
      },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount || 0);
}

// ── 1. GET /overview ─────────────────────────────────────────

export async function getOverview(riderId) {
  await ensureIndependent(riderId);

  const now = new Date();
  const weekStart = getWeekStartMonday6AM(now);
  const lastWeekStart = getWeekStartMonday6AM(
    new Date(weekStart.getTime() - 1000),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);

  // All-time (no upper bound — use `now`)
  const veryBeginning = new Date("2020-01-01T00:00:00Z");
  const [allTimeDeliveries, allTimeIncentives] = await Promise.all([
    sumEarnings(riderId, veryBeginning, now),
    sumIncentiveEarnings(riderId, veryBeginning, now),
  ]);

  const allTimeTotal =
    allTimeDeliveries.total_rider_earning + allTimeIncentives;

  // Current week
  const [cwDeliveries, cwIncentives] = await Promise.all([
    sumEarnings(riderId, weekStart, now),
    sumIncentiveEarnings(riderId, weekStart, now),
  ]);
  const cwTotal = cwDeliveries.total_rider_earning + cwIncentives;

  // Last week (full closed window)
  const [lwDeliveries, lwIncentives] = await Promise.all([
    sumEarnings(riderId, lastWeekStart, lastWeekEnd),
    sumIncentiveEarnings(riderId, lastWeekStart, lastWeekEnd),
  ]);
  const lwTotal = lwDeliveries.total_rider_earning + lwIncentives;

  // ── Weekly breakdown by category ────────────────────────────
  const cwBreakdown = {
    base_fee: round2(cwDeliveries.pickup_fee + cwDeliveries.drop_fee),
    surge_fee: round2(cwDeliveries.surge),
    floor_topup_fee: round2(cwDeliveries.floor_topup),
    tips: round2(cwDeliveries.tips),
    incentive_earnings: round2(cwIncentives),
    total: round2(cwTotal),
  };

  // Payout summary
  const [currentWeekAccumulated, lastPayout] = await Promise.all([
    prisma.riderEarningLedger.aggregate({
      where: { rider_id: riderId, week_start: weekStart, is_paid: false },
      _sum: { amount: true },
    }),
    prisma.riderPayout.findFirst({
      where: { rider_id: riderId },
      orderBy: { week_end: "desc" },
      select: {
        week_start: true,
        week_end: true,
        gross_amount: true,
        status: true,
        processed_at: true,
      },
    }),
  ]);

  const cwEndDate = new Date(weekStart);
  cwEndDate.setDate(cwEndDate.getDate() + 6);

  return {
    all_time: {
      total_earnings: round2(allTimeTotal),
      total_deliveries: allTimeDeliveries.count,
      total_tips: round2(allTimeDeliveries.tips),
    },
    current_week: {
      week_start: weekStart.toISOString().split("T")[0],
      week_end: cwEndDate.toISOString().split("T")[0],
      total_earnings: round2(cwTotal),
      total_deliveries: cwDeliveries.count,
      per_order_avg:
        cwDeliveries.count > 0 ? round2(cwTotal / cwDeliveries.count) : 0,
      delta_pct_vs_last_week: deltaPct(round2(cwTotal), round2(lwTotal)),
    },
    current_week_breakdown: cwBreakdown,
    payout: {
      current_week_accumulated: round2(currentWeekAccumulated._sum.amount || 0),
      last_payout: lastPayout
        ? {
            week_start: new Date(lastPayout.week_start)
              .toISOString()
              .split("T")[0],
            week_end: new Date(lastPayout.week_end).toISOString().split("T")[0],
            gross_amount: round2(lastPayout.gross_amount),
            status: lastPayout.status,
            processed_at: lastPayout.processed_at
              ? lastPayout.processed_at.toISOString()
              : null,
          }
        : null,
    },
  };
}

// ── 2. GET /weekly ───────────────────────────────────────────

export async function getWeeklyData(riderId, weekStartStr) {
  await ensureIndependent(riderId);

  // Parse the Monday date → Monday 6 AM local
  const parts = weekStartStr.split("-");
  const monday6AM = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
    6,
    0,
    0,
    0,
  );

  const nextMonday6AM = new Date(monday6AM);
  nextMonday6AM.setDate(nextMonday6AM.getDate() + 7);

  // Fetch all DELIVERED deliveries in this week window in one query
  const deliveries = await prisma.delivery.findMany({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { gte: monday6AM, lt: nextMonday6AM },
    },
    select: {
      delivered_at: true,
      total_rider_earning: true,
    },
  });

  // Bucket into 7 days by shift date
  const dayBuckets = Array.from({ length: 7 }, () => ({
    earnings: 0,
    deliveries: 0,
  }));

  for (const d of deliveries) {
    const dt = new Date(d.delivered_at);
    // Shift date: if before 6 AM, belongs to previous calendar day
    const shiftDt = new Date(dt);
    if (shiftDt.getHours() < 6) shiftDt.setDate(shiftDt.getDate() - 1);

    // Day index 0=Mon … 6=Sun
    const jsDay = shiftDt.getDay(); // 0=Sun,1=Mon…6=Sat
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    if (dayIndex >= 0 && dayIndex < 7) {
      dayBuckets[dayIndex].earnings += Number(d.total_rider_earning || 0);
      dayBuckets[dayIndex].deliveries += 1;
    }
  }

  // Also add incentive earnings from ledger for this week
  const incentiveTotal = await sumIncentiveEarnings(
    riderId,
    monday6AM,
    nextMonday6AM,
  );

  // Distribute incentive earnings proportionally across days that have deliveries
  // (or add to the total without per-day breakdown — simpler approach)
  const totalDeliveryEarnings = dayBuckets.reduce((s, b) => s + b.earnings, 0);
  const totalEarnings = totalDeliveryEarnings + incentiveTotal;
  const totalDeliveries = dayBuckets.reduce((s, b) => s + b.deliveries, 0);

  // Build days array
  let bestDay = null;
  const days = dayBuckets.map((bucket, i) => {
    const dayDate = new Date(monday6AM);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = dayDate.toISOString().split("T")[0];
    const earnings = round2(bucket.earnings);

    if (!bestDay || earnings > bestDay.earnings) {
      bestDay = { date: dateStr, earnings };
    }

    return {
      date: dateStr,
      day_name: DAY_NAMES[i],
      earnings,
      deliveries: bucket.deliveries,
    };
  });

  // If all days are 0, best_day is null
  if (bestDay && bestDay.earnings === 0) bestDay = null;

  // has_older_data: any DELIVERED delivery before this week?
  const olderDelivery = await prisma.delivery.findFirst({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { lt: monday6AM },
    },
    select: { delivery_id: true },
  });

  const cwEndDate = new Date(monday6AM);
  cwEndDate.setDate(cwEndDate.getDate() + 6);

  return {
    week_start: monday6AM.toISOString().split("T")[0],
    week_end: cwEndDate.toISOString().split("T")[0],
    days,
    total_earnings: round2(totalEarnings),
    total_deliveries: totalDeliveries,
    best_day: bestDay,
    per_order_avg:
      totalDeliveries > 0 ? round2(totalEarnings / totalDeliveries) : 0,
    has_older_data: !!olderDelivery,
  };
}

// ── 3. GET /orders ───────────────────────────────────────────

export async function getOrders(riderId, { from, to, day, page, limit }) {
  await ensureIndependent(riderId);

  let gte, lte;

  if (day) {
    // Single-day filter: 6AM-6AM shift window
    const parts = day.split("-");
    const dayDate = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
      6,
      0,
      0,
      0,
    );
    gte = dayDate;
    lte = new Date(dayDate);
    lte.setDate(lte.getDate() + 1);
  } else {
    // Date range (lazy-load window, typically 2 months)
    if (from) {
      const f = from.split("-");
      gte = new Date(Number(f[0]), Number(f[1]) - 1, Number(f[2]), 0, 0, 0, 0);
    } else {
      gte = new Date("2020-01-01T00:00:00Z");
    }
    if (to) {
      const t = to.split("-");
      lte = new Date(
        Number(t[0]),
        Number(t[1]) - 1,
        Number(t[2]),
        23,
        59,
        59,
        999,
      );
    } else {
      lte = new Date();
    }
  }

  const where = {
    rider_id: riderId,
    status: "DELIVERED",
    delivered_at: { gte, lte },
  };

  const [total, deliveries] = await Promise.all([
    prisma.delivery.count({ where }),
    prisma.delivery.findMany({
      where,
      select: {
        delivery_id: true,
        delivered_at: true,
        total_distance_km: true,
        pickup_fee: true,
        drop_fee: true,
        surge_fee: true,
        floor_topup_fee: true,
        tip_amount: true,
        total_rider_earning: true,
        order: {
          select: {
            order_number: true,
            shop: {
              select: { business_name: true },
            },
          },
        },
      },
      orderBy: { delivered_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const orders = deliveries.map((d) => ({
    delivery_id: d.delivery_id,
    order_number: d.order?.order_number || "—",
    pharmacy_name: d.order?.shop?.business_name || null,
    delivered_at: d.delivered_at.toISOString(),
    total_distance_km: Number(d.total_distance_km || 0),
    earnings: {
      pickup_fee: round2(d.pickup_fee),
      drop_fee: round2(d.drop_fee),
      surge_fee: round2(d.surge_fee),
      floor_topup_fee: round2(d.floor_topup_fee),
      tip_amount: round2(d.tip_amount),
      total_earning: round2(d.total_rider_earning),
    },
  }));

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── 4. GET /payouts ──────────────────────────────────────────

export async function getPayouts(riderId, { page, limit }) {
  await ensureIndependent(riderId);

  const where = { rider_id: riderId };

  const [total, payouts] = await Promise.all([
    prisma.riderPayout.count({ where }),
    prisma.riderPayout.findMany({
      where,
      select: {
        payout_id: true,
        week_start: true,
        week_end: true,
        gross_amount: true,
        status: true,
        payment_method: true,
        processed_at: true,
      },
      orderBy: { week_end: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    payouts: payouts.map((p) => ({
      payout_id: p.payout_id,
      week_start: new Date(p.week_start).toISOString().split("T")[0],
      week_end: new Date(p.week_end).toISOString().split("T")[0],
      gross_amount: round2(p.gross_amount),
      status: p.status,
      payment_method: p.payment_method,
      processed_at: p.processed_at ? p.processed_at.toISOString() : null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
