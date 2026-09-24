import prisma from "../../../config/prisma.js";

// ── Shift & Week Window Helpers ──────────────────────────────
// Mirrors the 6AM–6AM IST logic from incentiveEngine.service.js.
// Assumes server timezone is Asia/Kolkata (confirmed by startup banner).

/**
 * Returns the 6AM–6AM shift window for a given date.
 * Reuses the exact same logic as the incentive engine.
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
 * Returns Monday 6:00 AM of the current week.
 * If today is Monday before 6AM, returns last Monday 6AM.
 */
function getWeekStartMonday6AM(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // days since Monday
  d.setDate(d.getDate() + diff);
  d.setHours(6, 0, 0, 0);

  // If we're before 6AM on Monday, the week started last Monday
  if (now < d) {
    d.setDate(d.getDate() - 7);
  }

  return d;
}

/**
 * Returns the shift date (YYYY-MM-DD UTC) for the current 6AM window.
 * Used to query rider_online_sessions.
 */
function getCurrentShiftDate(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// ── Period Stats Aggregation ─────────────────────────────────

/**
 * Fetches aggregated stats for a given time window.
 * Used for both "today" (shift) and "week" periods.
 */
async function fetchPeriodStats(riderId, periodStart, periodEnd, shiftDate) {
  // 1. Completed deliveries in period
  const deliveryStats = await prisma.delivery.aggregate({
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
    },
  });

  // 2. Incentive/bonus earnings from ledger in period
  const ledgerStats = await prisma.riderEarningLedger.aggregate({
    where: {
      rider_id: riderId,
      created_at: { gte: periodStart, lte: periodEnd },
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

  // 3. Online hours from sessions
  // For the current shift, include the open (in-progress) session
  const closedSessions = await prisma.riderOnlineSession.aggregate({
    where: {
      rider_id: riderId,
      went_offline_at: { not: null },
      // For daily: match shift_date. For weekly: match range.
      ...(shiftDate
        ? { shift_date: shiftDate }
        : { went_online_at: { gte: periodStart, lte: periodEnd } }),
    },
    _sum: { duration_minutes: true },
  });

  // Check for an open session (currently online) to add live duration
  let openSessionMinutes = 0;
  const openSession = await prisma.riderOnlineSession.findFirst({
    where: {
      rider_id: riderId,
      went_offline_at: null,
    },
    select: { went_online_at: true },
  });

  if (openSession) {
    const onlineSince = new Date(openSession.went_online_at);
    // Only count if the session started within our period
    if (onlineSince >= periodStart && onlineSince <= periodEnd) {
      openSessionMinutes =
        (Date.now() - onlineSince.getTime()) / 60_000;
    }
  }

  const totalOnlineMinutes =
    Number(closedSessions._sum.duration_minutes || 0) + openSessionMinutes;
  const onlineHours = Math.round((totalOnlineMinutes / 60) * 10) / 10;

  // 4. Assemble
  const deliveryEarnings = Number(deliveryStats._sum.total_rider_earning || 0);
  const incentiveEarnings = Number(ledgerStats._sum.amount || 0);
  const tips = Number(deliveryStats._sum.tip_amount || 0);
  const surge = Number(deliveryStats._sum.surge_fee || 0);

  return {
    earnings: Math.round((deliveryEarnings + incentiveEarnings) * 100) / 100,
    deliveries_completed: deliveryStats._count.delivery_id,
    tips: Math.round(tips * 100) / 100,
    surge_earnings: Math.round(surge * 100) / 100,
    online_hours: onlineHours,
  };
}

// ── Active Incentive ─────────────────────────────────────────

async function fetchActiveIncentive(riderId, shiftStart, shiftEnd) {
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Find active schedules covering today
  const activeSchedules = await prisma.incentiveSchedule.findMany({
    where: {
      is_active: true,
      start_date: { lte: todayDate },
      end_date: { gte: todayDate },
    },
    include: {
      template: {
        include: {
          tiers: { orderBy: { tier_level: "asc" } },
        },
      },
    },
    orderBy: { start_date: "desc" },
  });

  if (activeSchedules.length === 0) return null;

  // Pick the first active schedule (most recent)
  const schedule = activeSchedules[0];
  const { template } = schedule;

  // 2. Calculate current progress for this shift
  let currentProgress = 0;

  if (template.metric_type === "ORDER_COUNT") {
    const count = await prisma.delivery.count({
      where: {
        rider_id: riderId,
        status: "DELIVERED",
        delivered_at: { gte: shiftStart, lte: shiftEnd },
      },
    });
    currentProgress = count;
  } else if (template.metric_type === "BASE_EARNINGS") {
    const stats = await prisma.delivery.aggregate({
      where: {
        rider_id: riderId,
        status: "DELIVERED",
        delivered_at: { gte: shiftStart, lte: shiftEnd },
      },
      _sum: {
        pickup_fee: true,
        drop_fee: true,
      },
    });
    currentProgress =
      Number(stats._sum.pickup_fee || 0) + Number(stats._sum.drop_fee || 0);
  }

  // 3. Build tier progress
  const tiers = template.tiers.map((tier) => ({
    level: tier.tier_level,
    target: Number(tier.target_value),
    reward: Number(tier.reward_amount),
    achieved: currentProgress >= Number(tier.target_value),
  }));

  return {
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
  };
}

// ── Main Dashboard ───────────────────────────────────────────

export async function getDashboard(riderId) {
  const now = new Date();

  // Time windows
  const { shiftStart, shiftEnd } = getShiftWindowForDate(now);
  const weekStart = getWeekStartMonday6AM(now);
  const shiftDate = getCurrentShiftDate(now);

  // Fetch all stats in parallel
  const [today, week, active_incentive] = await Promise.all([
    fetchPeriodStats(riderId, shiftStart, now, shiftDate),
    fetchPeriodStats(riderId, weekStart, now, null),
    fetchActiveIncentive(riderId, shiftStart, shiftEnd),
  ]);

  return { today, week, active_incentive };
}