// backend/src/modules/rider/dashboard/rider.dashboard.service.js

import prisma from "../../../config/prisma.js";

// ── Shift & Week Window Helpers ──────────────────────────────
// Mirrors the 6AM-6AM IST logic from incentiveEngine.service.js.
// Assumes server timezone is Asia/Kolkata (confirmed by startup banner).

/**
 * Returns the 6AM-6AM shift window for a given date.
 */
function getShiftWindowForDate(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();

  const shiftStart = new Date(year, month, date, 6, 0, 0, 0);
  const shiftEnd = new Date(year, month, date + 1, 5, 59, 59, 999);

  return { shiftStart, shiftEnd };
}

/**
 * Returns the shift window for the PREVIOUS 6AM-6AM period.
 * If currently before 6AM, "yesterday" is the day before yesterday's shift.
 */
function getPreviousShiftWindow(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 2);
  } else {
    d.setDate(d.getDate() - 1);
  }
  return getShiftWindowForDate(d);
}

/**
 * Returns Monday 6:00 AM of the current week.
 * If today is Monday before 6AM, returns last Monday 6AM.
 */
function getWeekStartMonday6AM(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(6, 0, 0, 0);

  if (now < d) {
    d.setDate(d.getDate() - 7);
  }

  return d;
}

/**
 * Returns the shift date (YYYY-MM-DD UTC) for the current 6AM window.
 */
function getCurrentShiftDate(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Converts a Date to its 6AM-shift date string (YYYY-MM-DD).
 * Used for counting distinct "days online."
 */
function toShiftDateStr(date) {
  const d = new Date(date);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Computes delta percentage. Returns null when yesterday was 0 and today > 0
 * (frontend shows "New activity today" instead of infinity).
 */
function deltaPct(today, yesterday) {
  if (yesterday === 0 && today === 0) return 0;
  if (yesterday === 0 && today > 0) return null; // "New activity today"
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

// ── Common Stats Fetchers ────────────────────────────────────

/**
 * Fetches delivery count and optional earnings for a time window.
 */
async function fetchDeliveryStats(riderId, periodStart, periodEnd) {
  const stats = await prisma.delivery.aggregate({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { gte: periodStart, lte: periodEnd },
    },
    _count: { delivery_id: true },
    _sum: {
      total_rider_earning: true,
      tip_amount: true,
      surge_fee: true,
      pickup_fee: true,
      drop_fee: true,
      floor_topup_fee: true,
    },
  });

  return {
    count: stats._count.delivery_id,
    total_earning: Number(stats._sum.total_rider_earning || 0),
    tips: Number(stats._sum.tip_amount || 0),
    surge: Number(stats._sum.surge_fee || 0),
    pickup_fee: Number(stats._sum.pickup_fee || 0),
    drop_fee: Number(stats._sum.drop_fee || 0),
    floor_topup: Number(stats._sum.floor_topup_fee || 0),
  };
}

/**
 * Fetches online hours for a time window.
 * Includes live duration from any open (in-progress) session.
 */
async function fetchOnlineHours(
  riderId,
  periodStart,
  periodEnd,
  shiftDate = null,
) {
  const closedSessions = await prisma.riderOnlineSession.aggregate({
    where: {
      rider_id: riderId,
      went_offline_at: { not: null },
      ...(shiftDate
        ? { shift_date: shiftDate }
        : { went_online_at: { gte: periodStart, lte: periodEnd } }),
    },
    _sum: { duration_minutes: true },
  });

  let openSessionMinutes = 0;
  const openSession = await prisma.riderOnlineSession.findFirst({
    where: { rider_id: riderId, went_offline_at: null },
    select: { went_online_at: true },
  });

  if (openSession) {
    const onlineSince = new Date(openSession.went_online_at);
    if (onlineSince >= periodStart && onlineSince <= periodEnd) {
      openSessionMinutes = (Date.now() - onlineSince.getTime()) / 60_000;
    }
  }

  const totalMinutes =
    Number(closedSessions._sum.duration_minutes || 0) + openSessionMinutes;
  return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * Fetches order action stats (accepted, denied, cancelled) and rates.
 *
 * Definitions:
 *  - Denied: rider rejected incoming alert (REJECTED) or timed out (TIMEOUT)
 *  - Cancelled: rider cancelled mid-delivery after accepting (Delivery.status = CANCELLED)
 *  - Acceptance rate: accepted / (accepted + denied)
 *  - Completion rate: delivered / (delivered + failed + cancelled)
 */
async function fetchOrderActionStats(riderId, periodStart, periodEnd) {
  const [logs, cancelledCount, failedCount, deliveredCount] = await Promise.all(
    [
      prisma.deliveryAssignmentLog.findMany({
        where: {
          rider_id: riderId,
          created_at: { gte: periodStart, lte: periodEnd },
          action: { in: ["ACCEPTED", "REJECTED", "TIMEOUT"] },
        },
        select: { action: true },
      }),
      prisma.delivery.count({
        where: {
          rider_id: riderId,
          status: "CANCELLED",
          updated_at: { gte: periodStart, lte: periodEnd },
        },
      }),
      prisma.delivery.count({
        where: {
          rider_id: riderId,
          status: "FAILED",
          updated_at: { gte: periodStart, lte: periodEnd },
        },
      }),
      prisma.delivery.count({
        where: {
          rider_id: riderId,
          status: "DELIVERED",
          delivered_at: { gte: periodStart, lte: periodEnd },
        },
      }),
    ],
  );

  let accepted = 0;
  let denied = 0;
  for (const log of logs) {
    if (log.action === "ACCEPTED") accepted++;
    else denied++; // REJECTED + TIMEOUT
  }

  const totalAssignments = accepted + denied;
  const acceptanceRate =
    totalAssignments > 0
      ? Math.round((accepted / totalAssignments) * 1000) / 10
      : 100;

  const totalCompleted = deliveredCount + failedCount + cancelledCount;
  const completionRate =
    totalCompleted > 0
      ? Math.round((deliveredCount / totalCompleted) * 1000) / 10
      : 100;

  return {
    accepted,
    denied,
    cancelled: cancelledCount,
    acceptance_rate: acceptanceRate,
    completion_rate: completionRate,
  };
}

/**
 * Counts distinct shift dates with at least 1 completed delivery.
 * "Days online" = days the rider actually delivered, not just toggled online.
 */
async function fetchDaysWithDeliveries(riderId, periodStart, periodEnd) {
  const deliveries = await prisma.delivery.findMany({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { gte: periodStart, lte: periodEnd },
    },
    select: { delivered_at: true },
  });

  const uniqueDates = new Set();
  for (const d of deliveries) {
    uniqueDates.add(toShiftDateStr(d.delivered_at));
  }
  return uniqueDates.size;
}

// ── Gating Evaluation (shared with incentive engine logic) ───

/**
 * Computes live gating metrics for a rider within a time period.
 * Used by the dashboard to show real-time incentive eligibility.
 */
async function computeGatingMetrics(riderId, periodStart, periodEnd) {
  const [orderStats, onlineHours] = await Promise.all([
    fetchOrderActionStats(riderId, periodStart, periodEnd),
    fetchOnlineHours(riderId, periodStart, periodEnd),
  ]);

  return {
    online_hours: onlineHours,
    denial_count: orderStats.denied,
    cancellation_count: orderStats.cancelled,
    acceptance_rate: orderStats.acceptance_rate,
    completion_rate: orderStats.completion_rate,
  };
}

/**
 * Evaluates all 5 gating conditions against live rider metrics.
 * Returns eligibility boolean and human-readable warnings.
 */
function evaluateLiveGating(template, metrics) {
  const warnings = [];
  let isEligible = true;

  // 1. Min online hours
  if (template.min_online_hours != null) {
    const min = Number(template.min_online_hours);
    if (metrics.online_hours < min) {
      isEligible = false;
      warnings.push(
        `Online hours: ${metrics.online_hours.toFixed(1)}h / ${min}h minimum`,
      );
    }
  }

  // 2. Max denial count
  if (template.max_denial_count != null) {
    const max = template.max_denial_count;
    if (metrics.denial_count > max) {
      isEligible = false;
      warnings.push(`Denied orders: ${metrics.denial_count} / max ${max}`);
    } else if (max > 0 && metrics.denial_count >= Math.ceil(max * 0.7)) {
      warnings.push(
        `${max - metrics.denial_count} more denials and you lose eligibility`,
      );
    }
  }

  // 3. Max cancellation count
  if (template.max_cancellation_count != null) {
    const max = template.max_cancellation_count;
    if (metrics.cancellation_count > max) {
      isEligible = false;
      warnings.push(
        `Cancellations: ${metrics.cancellation_count} / max ${max}`,
      );
    } else if (max > 0 && metrics.cancellation_count >= Math.ceil(max * 0.7)) {
      warnings.push(
        `${max - metrics.cancellation_count} more cancellations and you lose eligibility`,
      );
    }
  }

  // 4. Min acceptance rate
  if (template.min_acceptance_rate != null) {
    const min = Number(template.min_acceptance_rate);
    if (metrics.acceptance_rate < min) {
      isEligible = false;
      warnings.push(
        `Acceptance rate: ${metrics.acceptance_rate}% / ${min}% minimum`,
      );
    } else if (metrics.acceptance_rate < min + 5) {
      warnings.push(
        `Acceptance rate ${metrics.acceptance_rate}% is close to ${min}% minimum`,
      );
    }
  }

  // 5. Min completion rate
  if (template.min_completion_rate != null) {
    const min = Number(template.min_completion_rate);
    if (metrics.completion_rate < min) {
      isEligible = false;
      warnings.push(
        `Completion rate: ${metrics.completion_rate}% / ${min}% minimum`,
      );
    } else if (metrics.completion_rate < min + 5) {
      warnings.push(
        `Completion rate ${metrics.completion_rate}% is close to ${min}% minimum`,
      );
    }
  }

  return {
    online_hours_met:
      template.min_online_hours == null ||
      metrics.online_hours >= Number(template.min_online_hours),
    denial_count_ok:
      template.max_denial_count == null ||
      metrics.denial_count <= template.max_denial_count,
    cancellation_count_ok:
      template.max_cancellation_count == null ||
      metrics.cancellation_count <= template.max_cancellation_count,
    acceptance_rate_ok:
      template.min_acceptance_rate == null ||
      metrics.acceptance_rate >= Number(template.min_acceptance_rate),
    completion_rate_ok:
      template.min_completion_rate == null ||
      metrics.completion_rate >= Number(template.min_completion_rate),
    is_eligible: isEligible,
    warnings,
  };
}

// ── INDEPENDENT-Only Fetchers ────────────────────────────────

/**
 * Fetches active surge rule (if any).
 * Shows even when rider is offline so they know to go online.
 */
async function fetchActiveSurge() {
  const now = new Date();
  const rule = await prisma.riderSurgeRule.findFirst({
    where: {
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }],
    },
    select: {
      rule_id: true,
      name: true,
      calc_type: true,
      value: true,
      expires_at: true,
    },
    orderBy: { activated_at: "desc" },
  });

  if (!rule) {
    return {
      is_active: false,
      rule_name: null,
      calc_type: null,
      value: null,
      expires_at: null,
    };
  }

  return {
    is_active: true,
    rule_name: rule.name,
    calc_type: rule.calc_type,
    value: Number(rule.value),
    expires_at: rule.expires_at ? rule.expires_at.toISOString() : null,
  };
}

/**
 * Fetches all active incentives (daily + weekly) with live progress and gating.
 * Returns array sorted: DAILY first, then WEEKLY, then CUSTOM_PERIOD.
 */
async function fetchAllActiveIncentives(riderId, todayShiftStart, todayShiftEnd, weekStart, now, shiftDate) {
  // Use the pre-computed shift date (UTC midnight) for matching @db.Date columns.
  // Local midnight in IST is 18:30 UTC the previous day, which breaks date comparisons.
  const todayDate = shiftDate;

  const activeSchedules = await prisma.incentiveSchedule.findMany({
    where: {
      is_active: true,
      start_date: { lte: todayDate },
      end_date: { gte: todayDate },
    },
    include: {
      template: {
        include: { tiers: { orderBy: { tier_level: "asc" } } },
      },
    },
  });

  if (activeSchedules.length === 0) return [];

  const results = [];

  for (const schedule of activeSchedules) {
    const { template } = schedule;
    const isDaily = template.period_type === "DAILY";

    // DAILY incentives track progress within the current shift
    // WEEKLY incentives track progress within the current week
    const periodStart = isDaily ? todayShiftStart : weekStart;
    const periodEnd = now;

    // Compute progress
    let currentProgress = 0;
    if (template.metric_type === "ORDER_COUNT") {
      currentProgress = await prisma.delivery.count({
        where: {
          rider_id: riderId,
          status: "DELIVERED",
          delivered_at: { gte: periodStart, lte: periodEnd },
        },
      });
    } else if (template.metric_type === "BASE_EARNINGS") {
      const stats = await prisma.delivery.aggregate({
        where: {
          rider_id: riderId,
          status: "DELIVERED",
          delivered_at: { gte: periodStart, lte: periodEnd },
        },
        _sum: { pickup_fee: true, drop_fee: true },
      });
      currentProgress =
        Number(stats._sum.pickup_fee || 0) + Number(stats._sum.drop_fee || 0);
    }

    // Compute live gating for the same period
    const gatingMetrics = await computeGatingMetrics(
      riderId,
      periodStart,
      periodEnd,
    );
    const gating = evaluateLiveGating(template, gatingMetrics);

    // Build tier progress
    const tiers = template.tiers.map((tier) => ({
      level: tier.tier_level,
      target: Number(tier.target_value),
      reward: Number(tier.reward_amount),
      achieved: currentProgress >= Number(tier.target_value),
    }));

    // Determine end time
    let endsAt;
    if (isDaily) {
      endsAt = todayShiftEnd.toISOString();
    } else {
      // Week ends next Monday 6AM
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      endsAt = weekEnd.toISOString();
    }

    results.push({
      schedule_id: schedule.schedule_id,
      template_id: template.template_id,
      title: template.title,
      description: template.description,
      period: template.period_type,
      metric_type: template.metric_type,
      current_progress: Math.round(currentProgress * 100) / 100,
      is_featured: schedule.is_featured,
      custom_tag: schedule.custom_tag,
      tiers,
      gating,
      ends_at: endsAt,
    });
  }

  // Sort: DAILY first, then WEEKLY, then CUSTOM_PERIOD
  const periodOrder = { DAILY: 0, WEEKLY: 1, CUSTOM_PERIOD: 2 };
  results.sort(
    (a, b) => (periodOrder[a.period] ?? 99) - (periodOrder[b.period] ?? 99),
  );

  return results;
}

/**
 * Fetches payout info: current week accumulated + last payout.
 */
async function fetchPayoutInfo(riderId, currentWeekStart) {
  const [currentWeekEarnings, lastPayout] = await Promise.all([
    prisma.riderEarningLedger.aggregate({
      where: {
        rider_id: riderId,
        week_start: currentWeekStart,
        is_paid: false,
      },
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

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    current_week: {
      week_start: currentWeekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      accumulated_amount:
        Math.round(Number(currentWeekEarnings._sum.amount || 0) * 100) / 100,
    },
    last_payout: lastPayout
      ? {
          week_start: new Date(lastPayout.week_start)
            .toISOString()
            .split("T")[0],
          week_end: new Date(lastPayout.week_end).toISOString().split("T")[0],
          gross_amount: Number(lastPayout.gross_amount),
          status: lastPayout.status,
          processed_at: lastPayout.processed_at
            ? lastPayout.processed_at.toISOString()
            : null,
        }
      : null,
  };
}

// ── TEAM-Only Fetchers ───────────────────────────────────────

/**
 * Fetches monthly stats for TEAM riders (calendar month).
 */
async function fetchMonthlyStats(riderId, now) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 6, 0, 0, 0);

  const [deliveries, onlineHours] = await Promise.all([
    fetchDeliveryStats(riderId, monthStart, now),
    fetchOnlineHours(riderId, monthStart, now),
  ]);

  return {
    deliveries_completed: deliveries.count,
    online_hours: onlineHours,
    tips: Math.round(deliveries.tips * 100) / 100,
  };
}

// ── Main Dashboard ───────────────────────────────────────────

export async function getDashboard(riderId) {
  const now = new Date();

  // 1. Fetch rider info
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_type: true,
      rating: true,
      total_ratings: true,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const isIndependent = rider.rider_type === "INDEPENDENT";

  // 2. Compute time windows
  const { shiftStart: todayStart, shiftEnd: todayEnd } =
    getShiftWindowForDate(now);
  const { shiftStart: yesterdayStart, shiftEnd: yesterdayEnd } =
    getPreviousShiftWindow(now);
  const weekStart = getWeekStartMonday6AM(now);
  const lastWeekStart = getWeekStartMonday6AM(
    new Date(weekStart.getTime() - 1000),
  );
  const shiftDate = getCurrentShiftDate(now);

  // 3. Fetch common stats in parallel
  const [
    todayDeliveries,
    yesterdayDeliveries,
    weekDeliveries,
    todayHours,
    yesterdayHours,
    weekHours,
    weekDaysOnline,
    todayOrderActions,
  ] = await Promise.all([
    fetchDeliveryStats(riderId, todayStart, now),
    fetchDeliveryStats(riderId, yesterdayStart, yesterdayEnd),
    fetchDeliveryStats(riderId, weekStart, now),
    fetchOnlineHours(riderId, todayStart, now, shiftDate),
    fetchOnlineHours(riderId, yesterdayStart, yesterdayEnd),
    fetchOnlineHours(riderId, weekStart, now),
    fetchDaysWithDeliveries(riderId, weekStart, now),
    fetchOrderActionStats(riderId, todayStart, now),
  ]);

  // 4. Build common response
  const response = {
    rider_type: rider.rider_type,

    today: {
      deliveries_completed: todayDeliveries.count,
      online_hours: todayHours,
      tips: Math.round(todayDeliveries.tips * 100) / 100,
    },

    yesterday: {
      deliveries_completed: yesterdayDeliveries.count,
      online_hours: yesterdayHours,
      deliveries_delta_pct: deltaPct(
        todayDeliveries.count,
        yesterdayDeliveries.count,
      ),
      online_hours_delta_pct: deltaPct(todayHours, yesterdayHours),
    },

    orders: todayOrderActions,

    week: {
      deliveries_completed: weekDeliveries.count,
      online_hours: weekHours,
      days_online: weekDaysOnline,
      tips: Math.round(weekDeliveries.tips * 100) / 100,
    },

    rating: {
      stars: rider.rating,
      total_ratings: rider.total_ratings,
    },
  };

  // 5. INDEPENDENT-only fields
  if (isIndependent) {
    // Fetch incentive earnings from ledger for today and week
    const [todayLedger, weekLedger, lastWeekDeliveries] = await Promise.all([
      prisma.riderEarningLedger.aggregate({
        where: {
          rider_id: riderId,
          created_at: { gte: todayStart, lte: now },
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
      }),
      prisma.riderEarningLedger.aggregate({
        where: {
          rider_id: riderId,
          created_at: { gte: weekStart, lte: now },
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
      }),
      fetchDeliveryStats(riderId, lastWeekStart, weekStart),
    ]);

    const todayIncentiveEarnings = Number(todayLedger._sum.amount || 0);
    const weekIncentiveEarnings = Number(weekLedger._sum.amount || 0);

    const todayTotalEarnings =
      todayDeliveries.total_earning + todayIncentiveEarnings;
    const weekTotalEarnings =
      weekDeliveries.total_earning + weekIncentiveEarnings;
    const lastWeekTotalEarnings = lastWeekDeliveries.total_earning;

    response.yesterday.earnings =
      Math.round(yesterdayDeliveries.total_earning * 100) / 100;
    response.yesterday.earnings_delta_pct = deltaPct(
      Math.round(todayTotalEarnings * 100) / 100,
      Math.round(yesterdayDeliveries.total_earning * 100) / 100,
    );

    response.earnings = {
      today: {
        total: Math.round(todayTotalEarnings * 100) / 100,
        base_fee:
          Math.round(
            (todayDeliveries.pickup_fee + todayDeliveries.drop_fee) * 100,
          ) / 100,
        surge_fee: Math.round(todayDeliveries.surge * 100) / 100,
        floor_topup_fee: Math.round(todayDeliveries.floor_topup * 100) / 100,
        tips: Math.round(todayDeliveries.tips * 100) / 100,
        incentive_earnings: Math.round(todayIncentiveEarnings * 100) / 100,
        per_order_avg:
          todayDeliveries.count > 0
            ? Math.round((todayTotalEarnings / todayDeliveries.count) * 100) /
              100
            : 0,
      },
      week: {
        total: Math.round(weekTotalEarnings * 100) / 100,
        per_order_avg:
          weekDeliveries.count > 0
            ? Math.round((weekTotalEarnings / weekDeliveries.count) * 100) / 100
            : 0,
        delta_pct_vs_last_week: deltaPct(
          Math.round(weekTotalEarnings * 100) / 100,
          Math.round(lastWeekTotalEarnings * 100) / 100,
        ),
      },
    };

    // Fetch surge, incentives, and payout in parallel
    const [surge, activeIncentives, payout] = await Promise.all([
      fetchActiveSurge(),
            fetchAllActiveIncentives(riderId, todayStart, todayEnd, weekStart, now, shiftDate),
      fetchPayoutInfo(riderId, weekStart),
    ]);

    response.surge = surge;
    response.active_incentives = activeIncentives;
    response.payout = payout;
  }

  // 6. TEAM-only fields
  if (!isIndependent) {
    const monthly = await fetchMonthlyStats(riderId, now);
    response.team = { month: monthly };
  }

  return response;
}
