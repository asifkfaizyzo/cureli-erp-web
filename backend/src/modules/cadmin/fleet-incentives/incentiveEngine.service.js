// backend/src/modules/cadmin/fleet-incentives/incentiveEngine.service.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-incentives/incentiveEngine.service.js

import prisma from "../../../config/prisma.js";

/**
 * Computes the 24-hour shift window (6:00 AM to 5:59:59.999 AM next day) for a given date.
 *
 * @param {Date|string} dateInput
 * @returns {{ shiftStart: Date, shiftEnd: Date, shiftDateStr: string }}
 */
export function getShiftWindowForDate(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();

  const shiftStart = new Date(year, month, date, 6, 0, 0, 0);
  const shiftEnd = new Date(year, month, date + 1, 5, 59, 59, 999);
  const shiftDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

  return { shiftStart, shiftEnd, shiftDateStr };
}

/**
 * Evaluates gating conditions (Online hours, denial count, cancellations).
 * Returns true if rider passes all active criteria.
 */
function evaluateGatingConditions(conditions, riderMetrics) {
  if (!conditions) return true;

  if (conditions.min_online_hours !== null && conditions.min_online_hours !== undefined) {
    if ((riderMetrics.online_hours || 0) < Number(conditions.min_online_hours)) return false;
  }
  if (conditions.max_denial_count !== null && conditions.max_denial_count !== undefined) {
    if ((riderMetrics.denial_count || 0) > conditions.max_denial_count) return false;
  }
  if (conditions.max_cancellation_count !== null && conditions.max_cancellation_count !== undefined) {
    if ((riderMetrics.cancellation_count || 0) > conditions.max_cancellation_count) return false;
  }

  return true;
}

/**
 * Determines Monday date for earning ledger grouping.
 */
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
}

/**
 * Evaluates and credits incentives for all independent riders for a given completed shift date.
 *
 * @param {Date|string} targetDate - The calendar day whose 6AM-6AM shift completed.
 * @returns {Promise<Object>} Summary of evaluations and ledger payouts.
 */
export async function evaluateDailyIncentivesForShift(targetDate = new Date()) {
  const { shiftStart, shiftEnd, shiftDateStr } = getShiftWindowForDate(targetDate);
  const normalizedTargetDate = new Date(shiftDateStr);

  // 1. Fetch all active schedules covering this shift date
  const activeSchedules = await prisma.incentiveSchedule.findMany({
    where: {
      is_active: true,
      start_date: { lte: normalizedTargetDate },
      end_date: { gte: normalizedTargetDate },
    },
    include: {
      template: {
        include: { tiers: { orderBy: { tier_level: "desc" } } },
      },
    },
  });

  if (activeSchedules.length === 0) {
    return { shift_date: shiftDateStr, processed: 0, awarded: 0, message: "No active incentive schedules for shift" };
  }

  // 2. Fetch all INDEPENDENT riders who completed at least 1 delivery during this shift
  const completedDeliveries = await prisma.delivery.findMany({
    where: {
      status: "DELIVERED",
      delivered_at: { gte: shiftStart, lte: shiftEnd },
      rider: { rider_type: "INDEPENDENT", status: "ACTIVE" },
    },
    select: {
      delivery_id: true,
      rider_id: true,
      total_rider_earning: true,
      pickup_fee: true,
      drop_fee: true,
    },
  });

  // Group performance metrics by rider
  const riderMetricsMap = new Map();

  for (const del of completedDeliveries) {
    if (!del.rider_id) continue;
    const current = riderMetricsMap.get(del.rider_id) || {
      rider_id: del.rider_id,
      completed_orders: 0,
      base_earnings: 0,
      online_hours: 0, // Placeholder until telemetry cron is active
      denial_count: 0,
      cancellation_count: 0,
    };

    current.completed_orders += 1;
    current.base_earnings += Number(del.pickup_fee || 0) + Number(del.drop_fee || 0);
    riderMetricsMap.set(del.rider_id, current);
  }

  const payoutsToCredit = [];
  const weekStart = getWeekStartDate(normalizedTargetDate);

  // 3. For each active rider, evaluate each schedule & resolve highest payout (Anti-Stacking)
  for (const [riderId, metrics] of riderMetricsMap.entries()) {
    let bestQualifyingReward = 0;
    let winningSchedule = null;
    let winningTier = null;

    for (const schedule of activeSchedules) {
      const { template } = schedule;

      // Check Gating Conditions
      const passesGating = evaluateGatingConditions(
        {
          min_online_hours: template.min_online_hours,
          max_denial_count: template.max_denial_count,
          max_cancellation_count: template.max_cancellation_count,
        },
        metrics
      );

      if (!passesGating) continue;

      // Evaluate metric value
      const metricVal = template.metric_type === "ORDER_COUNT" ? metrics.completed_orders : metrics.base_earnings;

      // Find highest achieved tier (tiers ordered descending by level)
      for (const tier of template.tiers) {
        if (metricVal >= Number(tier.target_value)) {
          const reward = Number(tier.reward_amount);
          if (reward > bestQualifyingReward) {
            bestQualifyingReward = reward;
            winningSchedule = schedule;
            winningTier = tier;
          }
          break; // Highest matching tier found for this template
        }
      }
    }

    // 4. If rider qualified for a payout, prepare ledger credit
    if (bestQualifyingReward > 0 && winningSchedule && winningTier) {
      const desc = `Incentive Reward: ${winningSchedule.template.title} (Tier ${winningTier.tier_level} - Target: ${Number(winningTier.target_value)}) for Shift ${shiftDateStr}`;

      payoutsToCredit.push({
        rider_id: riderId,
        amount: bestQualifyingReward,
        description: desc,
        week_start: weekStart,
        type: winningSchedule.is_featured ? "WEEKLY_CHALLENGE" : "STREAK_BONUS",
      });
    }
  }

  // 5. Atomic ledger insert (prevents duplicate credits for same shift/description)
  let awardedCount = 0;
  await prisma.$transaction(async (tx) => {
    for (const item of payoutsToCredit) {
      const existing = await tx.riderEarningLedger.findFirst({
        where: {
          rider_id: item.rider_id,
          description: item.description,
        },
      });

      if (!existing) {
        await tx.riderEarningLedger.create({
          data: {
            rider_id: item.rider_id,
            amount: item.amount,
            description: item.description,
            type: item.type,
            week_start: item.week_start,
            is_paid: false,
          },
        });
        awardedCount += 1;
      }
    }
  });

  return {
    shift_date: shiftDateStr,
    total_active_riders: riderMetricsMap.size,
    awarded_count: awardedCount,
    total_incentive_payout: payoutsToCredit.reduce((sum, p) => sum + p.amount, 0),
  };
}