//backend\src\modules\cadmin\rider-payouts\cadmin.riderPayouts.service.js

import prisma from "../../../config/prisma.js";

// ── Helpers ────────────────────────────────────────────────────

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

function captureBankSnapshot(rider) {
  if (!rider.bank_account_number && !rider.bank_ifsc) return null;
  return {
    account_number: rider.bank_account_number,
    ifsc: rider.bank_ifsc,
    holder_name: rider.bank_holder_name,
    bank_name: rider.bank_name,
    verified: rider.bank_verified,
  };
}

// ── Core Calculation ───────────────────────────────────────────

export async function calculateEarningsBreakdown(riderId, weekStartStr) {
  const { weekStart, weekEnd } = getWeekWindow(weekStartStr);
  const weekStartDate = getMondayDate(weekStartStr);

  const deliveries = await prisma.delivery.findMany({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { gte: weekStart, lt: weekEnd },
    },
    select: {
      delivered_at: true,
      pickup_fee: true,
      drop_fee: true,
      surge_fee: true,
      floor_topup_fee: true,
      tip_amount: true,
    },
  });

  const dayBuckets = Array.from({ length: 7 }, () => ({
    deliveries: 0,
    base: 0,
    surge: 0,
    floor_topup: 0,
    tips: 0,
  }));

  for (const d of deliveries) {
    const dt = new Date(d.delivered_at);
    const shiftDt = new Date(dt);
    if (shiftDt.getHours() < 6) shiftDt.setDate(shiftDt.getDate() - 1);

    const jsDay = shiftDt.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    if (dayIndex >= 0 && dayIndex < 7) {
      const b = dayBuckets[dayIndex];
      b.deliveries += 1;
      b.base += Number(d.pickup_fee || 0) + Number(d.drop_fee || 0);
      b.surge += Number(d.surge_fee || 0);
      b.floor_topup += Number(d.floor_topup_fee || 0);
      b.tips += Number(d.tip_amount || 0);
    }
  }

  const incentiveResult = await prisma.riderEarningLedger.aggregate({
    where: {
      rider_id: riderId,
      week_start: weekStartDate,
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
  const incentiveTotal = Number(incentiveResult._sum.amount || 0);

  const baseFee = round2(dayBuckets.reduce((s, b) => s + b.base, 0));
  const surgeFee = round2(dayBuckets.reduce((s, b) => s + b.surge, 0));
  const floorTopup = round2(dayBuckets.reduce((s, b) => s + b.floor_topup, 0));
  const tips = round2(dayBuckets.reduce((s, b) => s + b.tips, 0));
  const totalDeliveries = dayBuckets.reduce((s, b) => s + b.deliveries, 0);
  const grossTotal = round2(baseFee + surgeFee + floorTopup + tips + incentiveTotal);

  const [y, m, d] = weekStartStr.split("-").map(Number);
  const daily = dayBuckets.map((bucket, i) => {
    const dayDate = new Date(Date.UTC(y, m - 1, d + i));
    return {
      date: dayDate.toISOString().split("T")[0],
      day_name: DAY_NAMES[i],
      deliveries: bucket.deliveries,
      base: round2(bucket.base),
      surge: round2(bucket.surge),
      floor_topup: round2(bucket.floor_topup),
      tips: round2(bucket.tips),
      incentive: 0,
      total: round2(bucket.base + bucket.surge + bucket.floor_topup + bucket.tips),
    };
  });

  return {
    total_deliveries: totalDeliveries,
    base_fee: baseFee,
    surge_fee: surgeFee,
    floor_topup_fee: floorTopup,
    tips,
    incentive_earnings: round2(incentiveTotal),
    gross_total: grossTotal,
    deductions: [],
    net_total: grossTotal,
    daily,
  };
}

// ── List ───────────────────────────────────────────────────────

export async function getRiderPayoutsList(weekStartStr, filters = {}) {
  const { weekStart, weekEnd, weekEndDate } = getWeekWindow(weekStartStr);
  const weekStartDate = getMondayDate(weekStartStr);
  const {
    rider_type = "INDEPENDENT",
    status,
    search,
    page = 1,
    limit = 25,
  } = filters;

  if (rider_type === "TEAM") {
    return getTeamPayoutsList(weekStartStr, weekStartDate, filters);
  }

  const deliveryAggs = await prisma.delivery.groupBy({
    by: ["rider_id"],
    where: {
      status: "DELIVERED",
      delivered_at: { gte: weekStart, lt: weekEnd },
      rider_id: { not: null },
    },
    _count: { delivery_id: true },
    _sum: { total_rider_earning: true, tip_amount: true },
  });

  const riderIds = deliveryAggs.map((a) => a.rider_id).filter(Boolean);
  if (riderIds.length === 0) {
    return buildEmptyList(weekStartStr, weekEndDate, page, limit);
  }

  const payouts = await prisma.riderPayout.findMany({
    where: { week_start: weekStartDate, rider_id: { in: riderIds } },
  });
  const payoutMap = new Map(payouts.map((p) => [p.rider_id, p]));

  const riderWhere = {
    rider_id: { in: riderIds },
    rider_type: "INDEPENDENT",
  };
  if (search) {
    riderWhere.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const riders = await prisma.rider.findMany({
    where: riderWhere,
    select: {
      rider_id: true,
      full_name: true,
      phone: true,
      rider_type: true,
      status: true,
      bank_account_number: true,
      bank_ifsc: true,
    },
  });

  const riderMap = new Map(riders.map((r) => [r.rider_id, r]));
  const results = [];

  for (const agg of deliveryAggs) {
    const rider = riderMap.get(agg.rider_id);
    if (!rider) continue;

    const payout = payoutMap.get(agg.rider_id);
    const deliveryTotal =
      Number(agg._sum.total_rider_earning || 0) +
      Number(agg._sum.tip_amount || 0);

    results.push({
      rider_id: rider.rider_id,
      full_name: rider.full_name,
      phone: rider.phone,
      rider_type: rider.rider_type,
      rider_status: rider.status,
      payout_id: payout?.payout_id || null,
      status: payout?.status || null,
      gross_amount: payout ? Number(payout.gross_amount) : round2(deliveryTotal),
      net_amount: payout ? Number(payout.net_amount) : round2(deliveryTotal),
      total_deliveries:
        payout?.breakdown_snapshot?.total_deliveries ?? agg._count.delivery_id,
      is_finalized: payout?.is_finalized || false,
      last_refreshed_at: payout?.last_refreshed_at?.toISOString() || null,
      bank_details_complete: !!(rider.bank_account_number && rider.bank_ifsc),
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
    riders: paginated,
    pagination: { page, limit, total, totalPages },
    summary: {
      total_riders: total,
      total_gross: round2(filtered.reduce((s, r) => s + r.gross_amount, 0)),
      total_net: round2(filtered.reduce((s, r) => s + r.net_amount, 0)),
      pending_count: filtered.filter((r) => r.status === "PENDING").length,
      processing_count: filtered.filter((r) => r.status === "PROCESSING").length,
      completed_count: filtered.filter((r) => r.status === "COMPLETED").length,
    },
  };
}

async function getTeamPayoutsList(weekStartStr, weekStartDate, filters) {
  const { weekEndDate } = getWeekWindow(weekStartStr);
  const { status, search, page = 1, limit = 25 } = filters;

  const riderWhere = { rider_type: "TEAM" };
  if (search) {
    riderWhere.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const riders = await prisma.rider.findMany({
    where: riderWhere,
    select: {
      rider_id: true,
      full_name: true,
      phone: true,
      rider_type: true,
      status: true,
      bank_account_number: true,
      bank_ifsc: true,
    },
  });

  const riderIds = riders.map((r) => r.rider_id);
  const payouts = riderIds.length
    ? await prisma.riderPayout.findMany({
        where: { week_start: weekStartDate, rider_id: { in: riderIds } },
      })
    : [];
  const payoutMap = new Map(payouts.map((p) => [p.rider_id, p]));

  let results = riders.map((rider) => {
    const payout = payoutMap.get(rider.rider_id);
    return {
      rider_id: rider.rider_id,
      full_name: rider.full_name,
      phone: rider.phone,
      rider_type: rider.rider_type,
      rider_status: rider.status,
      payout_id: payout?.payout_id || null,
      status: payout?.status || null,
      gross_amount: payout ? Number(payout.gross_amount) : 0,
      net_amount: payout ? Number(payout.net_amount) : 0,
      total_deliveries: 0,
      is_finalized: payout?.is_finalized || false,
      last_refreshed_at: payout?.last_refreshed_at?.toISOString() || null,
      bank_details_complete: !!(rider.bank_account_number && rider.bank_ifsc),
    };
  });

  if (status) {
    results = results.filter((r) =>
      status === "NOT_CALCULATED" ? !r.status : r.status === status
    );
  }

  const total = results.length;
  const totalPages = Math.ceil(total / limit);

  return {
    week_start: weekStartStr,
    week_end: weekEndDate.toISOString().split("T")[0],
    is_current_week: isCurrentWeek(weekStartStr),
    is_week_ended: isWeekEnded(weekStartStr),
    riders: results.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages },
    summary: {
      total_riders: total,
      total_gross: round2(results.reduce((s, r) => s + r.gross_amount, 0)),
      total_net: round2(results.reduce((s, r) => s + r.net_amount, 0)),
      pending_count: results.filter((r) => r.status === "PENDING").length,
      processing_count: results.filter((r) => r.status === "PROCESSING").length,
      completed_count: results.filter((r) => r.status === "COMPLETED").length,
    },
  };
}

function buildEmptyList(weekStartStr, weekEndDate, page, limit) {
  return {
    week_start: weekStartStr,
    week_end: weekEndDate.toISOString().split("T")[0],
    is_current_week: isCurrentWeek(weekStartStr),
    is_week_ended: isWeekEnded(weekStartStr),
    riders: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
    summary: {
      total_riders: 0,
      total_gross: 0,
      total_net: 0,
      pending_count: 0,
      processing_count: 0,
      completed_count: 0,
    },
  };
}

// ── Detail ─────────────────────────────────────────────────────

export async function getRiderPayoutDetail(riderId, weekStartStr) {
  const weekStartDate = getMondayDate(weekStartStr);
  const { weekEndDate } = getWeekWindow(weekStartStr);

  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      full_name: true,
      phone: true,
      rider_type: true,
      status: true,
      bank_account_number: true,
      bank_ifsc: true,
      bank_holder_name: true,
      bank_name: true,
      bank_verified: true,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const payout = await prisma.riderPayout.findUnique({
    where: {
      rider_week_unique: { rider_id: riderId, week_start: weekStartDate },
    },
    include: {
      ledgerEntries: { orderBy: { created_at: "desc" } },
    },
  });

  return {
    rider: {
      rider_id: rider.rider_id,
      full_name: rider.full_name,
      phone: rider.phone,
      rider_type: rider.rider_type,
      rider_status: rider.status,
      bank_details: {
        account_number: rider.bank_account_number,
        ifsc: rider.bank_ifsc,
        holder_name: rider.bank_holder_name,
        bank_name: rider.bank_name,
        verified: rider.bank_verified,
      },
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
          net_amount: Number(payout.net_amount),
          is_finalized: payout.is_finalized,
          finalized_at: payout.finalized_at?.toISOString() || null,
          breakdown_snapshot: payout.breakdown_snapshot,
          deductions: payout.deductions,
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
    ledger_entries: payout
      ? payout.ledgerEntries.map((e) => ({
          ledger_id: e.ledger_id,
          type: e.type,
          amount: Number(e.amount),
          description: e.description,
          is_paid: e.is_paid,
          created_at: e.created_at.toISOString(),
        }))
      : [],
  };
}

// ── Refresh ────────────────────────────────────────────────────

export async function refreshRiderPayout(riderId, weekStartStr, adminId) {
  const weekStartDate = getMondayDate(weekStartStr);
  const { weekEndDate } = getWeekWindow(weekStartStr);

  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      rider_type: true,
      bank_account_number: true,
      bank_ifsc: true,
      bank_holder_name: true,
      bank_name: true,
      bank_verified: true,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const existing = await prisma.riderPayout.findUnique({
    where: {
      rider_week_unique: { rider_id: riderId, week_start: weekStartDate },
    },
  });

  if (existing) {
    if (existing.status === "PROCESSING" || existing.status === "COMPLETED") {
      const err = new Error(
        `Cannot refresh payout in ${existing.status} status`
      );
      err.code = "INVALID_TRANSITION";
      throw err;
    }
  }

  if (rider.rider_type === "INDEPENDENT") {
    const breakdown = await calculateEarningsBreakdown(riderId, weekStartStr);
    const existingDeductions = existing?.deductions || [];
    const deductionTotal = Array.isArray(existingDeductions)
      ? existingDeductions.reduce((s, d) => s + Number(d.amount || 0), 0)
      : 0;
    const netAmount = round2(breakdown.gross_total - deductionTotal);
    breakdown.deductions = existingDeductions;
    breakdown.net_total = netAmount;

    const payout = await prisma.riderPayout.upsert({
      where: {
        rider_week_unique: { rider_id: riderId, week_start: weekStartDate },
      },
      create: {
        rider_id: riderId,
        week_start: weekStartDate,
        week_end: weekEndDate,
        gross_amount: breakdown.gross_total,
        net_amount: netAmount,
        status: "DRAFT",
        breakdown_snapshot: breakdown,
        deductions: existingDeductions,
        bank_snapshot: captureBankSnapshot(rider),
        last_refreshed_at: new Date(),
        refreshed_by: adminId,
      },
      update: {
        gross_amount: breakdown.gross_total,
        net_amount: netAmount,
        breakdown_snapshot: breakdown,
        bank_snapshot: captureBankSnapshot(rider),
        last_refreshed_at: new Date(),
        refreshed_by: adminId,
      },
    });

    return { payout_id: payout.payout_id, status: payout.status, breakdown };
  }

  // TEAM rider — update attendance only
  const attendance = await getRiderAttendanceData(riderId, weekStartStr);
  const existingAmount = existing ? Number(existing.gross_amount) : 0;
  const netAmount = existing ? Number(existing.net_amount) : 0;

  const payout = await prisma.riderPayout.upsert({
    where: {
      rider_week_unique: { rider_id: riderId, week_start: weekStartDate },
    },
    create: {
      rider_id: riderId,
      week_start: weekStartDate,
      week_end: weekEndDate,
      gross_amount: existingAmount,
      net_amount: netAmount,
      status: "DRAFT",
      breakdown_snapshot: { type: "TEAM_SALARY", attendance },
      bank_snapshot: captureBankSnapshot(rider),
      last_refreshed_at: new Date(),
      refreshed_by: adminId,
    },
    update: {
      breakdown_snapshot: {
        ...(existing?.breakdown_snapshot || {}),
        type: "TEAM_SALARY",
        attendance,
      },
      bank_snapshot: captureBankSnapshot(rider),
      last_refreshed_at: new Date(),
      refreshed_by: adminId,
    },
  });

  return { payout_id: payout.payout_id, status: payout.status, attendance };
}

// ── Refresh All ────────────────────────────────────────────────

export async function refreshAllRiderPayouts(weekStartStr, riderType, adminId) {
  const { weekStart, weekEnd } = getWeekWindow(weekStartStr);

  let riderIds = [];

  if (!riderType || riderType === "INDEPENDENT") {
    const aggs = await prisma.delivery.groupBy({
      by: ["rider_id"],
      where: {
        status: "DELIVERED",
        delivered_at: { gte: weekStart, lt: weekEnd },
        rider_id: { not: null },
        rider: { rider_type: "INDEPENDENT" },
      },
    });
    riderIds = aggs.map((a) => a.rider_id).filter(Boolean);
  }

  if (riderType === "TEAM") {
    const teamRiders = await prisma.rider.findMany({
      where: { rider_type: "TEAM" },
      select: { rider_id: true },
    });
    riderIds = teamRiders.map((r) => r.rider_id);
  }

  let refreshed = 0;
  let failed = 0;

  for (let i = 0; i < riderIds.length; i += 10) {
    const batch = riderIds.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((id) => refreshRiderPayout(id, weekStartStr, adminId))
    );
    for (const r of results) {
      if (r.status === "fulfilled") refreshed++;
      else failed++;
    }
  }

  return { total: riderIds.length, refreshed, failed };
}

// ── Finalize Week ──────────────────────────────────────────────

export async function finalizeRiderPayoutWeek(weekStartStr) {
  if (!isWeekEnded(weekStartStr)) {
    const err = new Error("Cannot finalize a week that has not ended yet");
    err.code = "WEEK_NOT_ENDED";
    throw err;
  }

  const weekStartDate = getMondayDate(weekStartStr);

  const drafts = await prisma.riderPayout.findMany({
    where: { week_start: weekStartDate, status: "DRAFT" },
    select: { payout_id: true, rider_id: true },
  });

  let finalized = 0;

  for (const draft of drafts) {
    try {
      const breakdown = await calculateEarningsBreakdown(
        draft.rider_id,
        weekStartStr
      );

      const existingPayout = await prisma.riderPayout.findUnique({
        where: { payout_id: draft.payout_id },
        select: { deductions: true },
      });

      const existingDeductions = existingPayout?.deductions || [];
      const deductionTotal = Array.isArray(existingDeductions)
        ? existingDeductions.reduce((s, d) => s + Number(d.amount || 0), 0)
        : 0;
      const netAmount = round2(breakdown.gross_total - deductionTotal);
      breakdown.deductions = existingDeductions;
      breakdown.net_total = netAmount;

      await prisma.$transaction(async (tx) => {
        await tx.riderPayout.update({
          where: { payout_id: draft.payout_id },
          data: {
            gross_amount: breakdown.gross_total,
            net_amount: netAmount,
            breakdown_snapshot: breakdown,
            is_finalized: true,
            finalized_at: new Date(),
            status: "PENDING",
            last_refreshed_at: new Date(),
          },
        });

        await tx.riderEarningLedger.updateMany({
          where: {
            rider_id: draft.rider_id,
            week_start: weekStartDate,
            is_paid: false,
          },
          data: {
            is_paid: true,
            payout_id: draft.payout_id,
          },
        });
      });

      finalized++;
    } catch (err) {
      console.error(
        `Failed to finalize rider payout ${draft.payout_id}:`,
        err.message
      );
    }
  }

  return { total_drafts: drafts.length, finalized };
}

// ── Status Transitions ─────────────────────────────────────────

const VALID_TRANSITIONS = {
  DRAFT: ["PENDING"],
  PENDING: ["PROCESSING", "DRAFT"],
  PROCESSING: ["COMPLETED", "FAILED"],
  FAILED: ["PROCESSING"],
  COMPLETED: [],
};

export async function transitionRiderPayoutStatus(payoutId, targetStatus, data, adminId) {
  const payout = await prisma.riderPayout.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    const err = new Error("Rider payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const allowed = VALID_TRANSITIONS[payout.status] || [];
  if (!allowed.includes(targetStatus)) {
    const err = new Error(
      `Cannot transition from ${payout.status} to ${targetStatus}`
    );
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  const updateData = { status: targetStatus };

  if (targetStatus === "PROCESSING") {
    if (!payout.bank_snapshot) {
      const err = new Error(
        "Rider bank details are missing. Cannot start processing."
      );
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
    const [y, m, d] = data.manual_payment_date.split("-").map(Number);
    updateData.manual_payment_date = new Date(Date.UTC(y, m - 1, d));
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

  const updated = await prisma.riderPayout.update({
    where: { payout_id: payoutId },
    data: updateData,
  });

  return {
    payout_id: updated.payout_id,
    status: updated.status,
    previous_status: payout.status,
  };
}

// ── Deductions ─────────────────────────────────────────────────

export async function updateRiderPayoutDeductions(payoutId, deductions) {
  const payout = await prisma.riderPayout.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    const err = new Error("Rider payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (payout.status === "PROCESSING" || payout.status === "COMPLETED") {
    const err = new Error(
      `Cannot modify deductions in ${payout.status} status`
    );
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  const deductionTotal = deductions.reduce(
    (s, d) => s + Number(d.amount || 0),
    0
  );
  const netAmount = round2(Number(payout.gross_amount) - deductionTotal);

  let updatedBreakdown = payout.breakdown_snapshot;
  if (updatedBreakdown && typeof updatedBreakdown === "object") {
    updatedBreakdown = { ...updatedBreakdown, deductions, net_total: netAmount };
  }

  const updated = await prisma.riderPayout.update({
    where: { payout_id: payoutId },
    data: {
      deductions,
      net_amount: netAmount,
      breakdown_snapshot: updatedBreakdown,
    },
  });

  return {
    payout_id: updated.payout_id,
    gross_amount: Number(updated.gross_amount),
    net_amount: Number(updated.net_amount),
    deductions: updated.deductions,
  };
}

// ── Internal Notes ─────────────────────────────────────────────

export async function addRiderPayoutNote(payoutId, adminId, text) {
  const payout = await prisma.riderPayout.findUnique({
    where: { payout_id: payoutId },
    select: { internal_notes: true },
  });

  if (!payout) {
    const err = new Error("Rider payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const existingNotes = Array.isArray(payout.internal_notes)
    ? payout.internal_notes
    : [];

  const updated = await prisma.riderPayout.update({
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

// ── Attendance (TEAM) ──────────────────────────────────────────

export async function getRiderAttendanceData(riderId, weekStartStr) {
  const { weekStart, weekEnd } = getWeekWindow(weekStartStr);
  const [y, m, d] = weekStartStr.split("-").map(Number);

  const sessions = await prisma.riderOnlineSession.findMany({
    where: {
      rider_id: riderId,
      went_online_at: { gte: weekStart, lt: weekEnd },
    },
    select: {
      went_online_at: true,
      duration_minutes: true,
      shift_date: true,
    },
  });

  const deliveries = await prisma.delivery.findMany({
    where: {
      rider_id: riderId,
      status: "DELIVERED",
      delivered_at: { gte: weekStart, lt: weekEnd },
    },
    select: { delivered_at: true },
  });

  const dayMap = new Map();
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(Date.UTC(y, m - 1, d + i));
    dayMap.set(dayDate.toISOString().split("T")[0], {
      date: dayDate.toISOString().split("T")[0],
      day_name: DAY_NAMES[i],
      online_hours: 0,
      orders: 0,
    });
  }

  for (const s of sessions) {
    const dateStr = new Date(s.shift_date).toISOString().split("T")[0];
    const entry = dayMap.get(dateStr);
    if (entry) {
      entry.online_hours = round2(
        entry.online_hours + Number(s.duration_minutes || 0) / 60
      );
    }
  }

  for (const del of deliveries) {
    const dt = new Date(del.delivered_at);
    if (dt.getHours() < 6) dt.setDate(dt.getDate() - 1);
    const dateStr = dt.toISOString().split("T")[0];
    const entry = dayMap.get(dateStr);
    if (entry) entry.orders += 1;
  }

  const daily = Array.from(dayMap.values());

  return {
    days_active: daily.filter((d) => d.online_hours > 0).length,
    total_hours: round2(daily.reduce((s, d) => s + d.online_hours, 0)),
    total_orders: daily.reduce((s, d) => s + d.orders, 0),
    daily,
  };
}

export async function createTeamPayout(data, adminId) {
  const { rider_id, week_start: weekStartStr, amount, notes } = data;
  const weekStartDate = getMondayDate(weekStartStr);
  const { weekEndDate } = getWeekWindow(weekStartStr);

  const rider = await prisma.rider.findUnique({
    where: { rider_id },
    select: {
      rider_id: true,
      rider_type: true,
      full_name: true,
      bank_account_number: true,
      bank_ifsc: true,
      bank_holder_name: true,
      bank_name: true,
      bank_verified: true,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (rider.rider_type !== "TEAM") {
    const err = new Error("This endpoint is only for TEAM riders");
    err.code = "INVALID_RIDER_TYPE";
    throw err;
  }

  // Check if payout already exists for this week
  const existing = await prisma.riderPayout.findUnique({
    where: {
      rider_week_unique: { rider_id, week_start: weekStartDate },
    },
  });

  if (existing) {
    const err = new Error(
      "A payout already exists for this rider and week. Use the edit amount option instead."
    );
    err.code = "ALREADY_EXISTS";
    throw err;
  }

  // Fetch attendance data
  const attendance = await getRiderAttendanceData(rider_id, weekStartStr);

  const breakdown = {
    type: "TEAM_SALARY",
    manual_amount: amount,
    deductions: [],
    net_total: amount,
    attendance,
  };

  const internalNotes = notes
    ? [{ by: adminId, at: new Date().toISOString(), text: notes }]
    : [];

  const payout = await prisma.riderPayout.create({
    data: {
      rider_id,
      week_start: weekStartDate,
      week_end: weekEndDate,
      gross_amount: amount,
      net_amount: amount,
      status: "PENDING",
      is_finalized: true,
      finalized_at: new Date(),
      breakdown_snapshot: breakdown,
      deductions: [],
      internal_notes: internalNotes,
      bank_snapshot: captureBankSnapshot(rider),
      last_refreshed_at: new Date(),
      refreshed_by: adminId,
    },
  });

  return {
    payout_id: payout.payout_id,
    rider_id: payout.rider_id,
    rider_name: rider.full_name,
    status: payout.status,
    gross_amount: Number(payout.gross_amount),
    net_amount: Number(payout.net_amount),
  };
}

// ── Update TEAM Amount ─────────────────────────────────────────

export async function updateTeamPayoutAmount(payoutId, amount, adminId) {
  const payout = await prisma.riderPayout.findUnique({
    where: { payout_id: payoutId },
    include: {
      rider: { select: { rider_type: true } },
    },
  });

  if (!payout) {
    const err = new Error("Rider payout not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (payout.rider.rider_type !== "TEAM") {
    const err = new Error("Amount editing is only for TEAM rider payouts");
    err.code = "INVALID_RIDER_TYPE";
    throw err;
  }

  if (payout.status === "PROCESSING" || payout.status === "COMPLETED") {
    const err = new Error(
      `Cannot modify amount in ${payout.status} status`
    );
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  // Recalculate net with existing deductions
  const existingDeductions = Array.isArray(payout.deductions)
    ? payout.deductions
    : [];
  const deductionTotal = existingDeductions.reduce(
    (s, d) => s + Number(d.amount || 0),
    0
  );
  const netAmount = round2(amount - deductionTotal);

  let updatedBreakdown = payout.breakdown_snapshot;
  if (updatedBreakdown && typeof updatedBreakdown === "object") {
    updatedBreakdown = {
      ...updatedBreakdown,
      manual_amount: amount,
      net_total: netAmount,
    };
  }

  // Add internal note about the change
  const existingNotes = Array.isArray(payout.internal_notes)
    ? payout.internal_notes
    : [];
  const changeNote = {
    by: adminId,
    at: new Date().toISOString(),
    text: `Amount changed from ₹${Number(payout.gross_amount)} to ₹${amount}`,
  };

  const updated = await prisma.riderPayout.update({
    where: { payout_id: payoutId },
    data: {
      gross_amount: amount,
      net_amount: netAmount,
      breakdown_snapshot: updatedBreakdown,
      internal_notes: [...existingNotes, changeNote],
      last_refreshed_at: new Date(),
      refreshed_by: adminId,
    },
  });

  return {
    payout_id: updated.payout_id,
    gross_amount: Number(updated.gross_amount),
    net_amount: Number(updated.net_amount),
  };
}

// ── Standalone Attendance Endpoint ─────────────────────────────

export async function getRiderAttendance(riderId, weekStartStr) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: { rider_id: true, rider_type: true, full_name: true },
  });

  if (!rider) {
    const err = new Error("Rider not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const attendance = await getRiderAttendanceData(riderId, weekStartStr);

  return {
    rider_id: rider.rider_id,
    full_name: rider.full_name,
    rider_type: rider.rider_type,
    week_start: weekStartStr,
    attendance,
  };
}

// ── Bulk Status Transitions ────────────────────────────────────

export async function bulkProcessRiderPayouts(data, adminId) {
  const { payout_ids, manual_reference, manual_bank_used, manual_notes } = data;

  const payouts = await prisma.riderPayout.findMany({
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
      await prisma.riderPayout.update({
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

export async function bulkCompleteRiderPayouts(data, adminId) {
  const { payout_ids, manual_payment_date, manual_reference } = data;
  const [y, m, d] = manual_payment_date.split("-").map(Number);
  const paymentDate = new Date(Date.UTC(y, m - 1, d));

  const payouts = await prisma.riderPayout.findMany({
    where: { payout_id: { in: payout_ids } },
  });

  let successCount = 0;
  let skippedCount = 0;

  for (const p of payouts) {
    if (p.status !== "PROCESSING") {
      skippedCount++;
      continue;
    }

    await prisma.riderPayout.update({
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

// ── Rider Payout History (Past Weeks) ──────────────────────────

export async function getRiderPayoutHistory(riderId, { page = 1, limit = 10 }) {
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

// ── CSV Export ─────────────────────────────────────────────────

export async function exportRiderPayoutsCSV(weekStartStr, filters = {}) {
  const result = await getRiderPayoutsList(weekStartStr, { ...filters, limit: 5000, page: 1 });
  const rows = result.riders || [];

  // Fetch bank details for these riders
  const riderIds = rows.map((r) => r.rider_id);
  const riders = await prisma.rider.findMany({
    where: { rider_id: { in: riderIds } },
    select: {
      rider_id: true,
      bank_account_number: true,
      bank_ifsc: true,
      bank_holder_name: true,
      bank_name: true,
    },
  });
  const bankMap = new Map(riders.map((r) => [r.rider_id, r]));

  // Fetch payout details (UTR reference, payment date)
  const payouts = await prisma.riderPayout.findMany({
    where: { week_start: getMondayDate(weekStartStr), rider_id: { in: riderIds } },
    select: {
      rider_id: true,
      manual_reference: true,
      manual_bank_used: true,
      manual_payment_date: true,
    },
  });
  const payoutDetailsMap = new Map(payouts.map((p) => [p.rider_id, p]));

  const headers = [
    "Rider ID",
    "Rider Name",
    "Phone",
    "Rider Type",
    "Status",
    "Deliveries",
    "Gross Amount (INR)",
    "Deductions (INR)",
    "Net Amount (INR)",
    "Account Holder Name",
    "Account Number",
    "IFSC Code",
    "Bank Name",
    "UTR / Reference",
    "Bank Used",
    "Payment Date",
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const bank = bankMap.get(row.rider_id) || {};
    const details = payoutDetailsMap.get(row.rider_id) || {};
    const deductions = round2(row.gross_amount - row.net_amount);

    const line = [
      escapeCSV(row.rider_id),
      escapeCSV(row.full_name || "—"),
      escapeCSV(row.phone),
      escapeCSV(row.rider_type),
      escapeCSV(row.status || "NOT_CALCULATED"),
      escapeCSV(row.total_deliveries),
      escapeCSV(row.gross_amount),
      escapeCSV(deductions),
      escapeCSV(row.net_amount),
      escapeCSV(bank.bank_holder_name || "—"),
      escapeCSV(bank.bank_account_number || "—"),
      escapeCSV(bank.bank_ifsc || "—"),
      escapeCSV(bank.bank_name || "—"),
      escapeCSV(details.manual_reference || "—"),
      escapeCSV(details.manual_bank_used || "—"),
      escapeCSV(
        details.manual_payment_date
          ? new Date(details.manual_payment_date).toISOString().split("T")[0]
          : "—"
      ),
    ];
    csvRows.push(line.join(","));
  }

  return csvRows.join("\n");
}