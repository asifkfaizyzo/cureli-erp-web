// backend/src/modules/cadmin/fleet-incentives/incentiveScheduler.service.js

import prisma from "../../../config/prisma.js";

/**
 * Normalizes date to UTC YYYY-MM-DD Date object.
 */
function normalizeDate(dateInput) {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Retrieves scheduled quests for a calendar month or date range.
 */
export async function getCalendarSchedule({ start_date, end_date }) {
  const where = { is_active: true };

  if (start_date && end_date) {
    where.OR = [
      {
        start_date: { lte: normalizeDate(end_date) },
        end_date: { gte: normalizeDate(start_date) },
      },
    ];
  }

  const schedules = await prisma.incentiveSchedule.findMany({
    where,
    include: {
      template: {
        include: { tiers: { orderBy: { tier_level: "asc" } } },
      },
    },
    orderBy: [{ start_date: "asc" }, { is_featured: "desc" }],
  });

  return schedules.map((s) => ({
    schedule_id: s.schedule_id,
    template_id: s.template_id,
    template_title: s.template.title,
    period_type: s.template.period_type,
    metric_type: s.template.metric_type,
    start_date: s.start_date.toISOString().split("T")[0],
    end_date: s.end_date.toISOString().split("T")[0],
    is_featured: s.is_featured,
    custom_tag: s.custom_tag,
    is_active: s.is_active,
    tiers: s.template.tiers.map((t) => ({
      tier_level: t.tier_level,
      target_value: Number(t.target_value),
      reward_amount: Number(t.reward_amount),
    })),
  }));
}

/**
 * Assigns an incentive template to a specific date or date range.
 */
export async function assignIncentiveSchedule(data, adminId) {
  const template = await prisma.incentiveTemplate.findUnique({
    where: { template_id: data.template_id },
  });

  if (!template) throw new Error("Incentive template not found");
  if (!template.is_active) throw new Error("Cannot schedule an inactive template");

  const startDate = normalizeDate(data.start_date);
  const endDate = normalizeDate(data.end_date || data.start_date);

  if (endDate < startDate) {
    throw new Error("End date cannot be earlier than start date");
  }

  const created = await prisma.incentiveSchedule.create({
    data: {
      template_id: data.template_id,
      start_date: startDate,
      end_date: endDate,
      is_featured: Boolean(data.is_featured),
      custom_tag: data.custom_tag || null,
      is_active: true,
      created_by: adminId,
    },
    include: {
      template: {
        include: { tiers: { orderBy: { tier_level: "asc" } } },
      },
    },
  });

  return {
    schedule_id: created.schedule_id,
    template_id: created.template_id,
    template_title: created.template.title,
    start_date: created.start_date.toISOString().split("T")[0],
    end_date: created.end_date.toISOString().split("T")[0],
    is_featured: created.is_featured,
    custom_tag: created.custom_tag,
  };
}

/**
 * Bulk assigns templates across a 7-day week schedule.
 * payload: { assignments: [ { date: "2026-10-01", template_id: "..." }, ... ] }
 */
export async function bulkAssignWeekSchedule(assignments = [], adminId) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new Error("Assignments array cannot be empty");
  }

  return await prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of assignments) {
      const normalized = normalizeDate(item.date);

      // Remove existing non-featured daily assignment on this date to replace cleanly
      await tx.incentiveSchedule.deleteMany({
        where: {
          start_date: normalized,
          end_date: normalized,
          is_featured: false,
        },
      });

      const created = await tx.incentiveSchedule.create({
        data: {
          template_id: item.template_id,
          start_date: normalized,
          end_date: normalized,
          is_featured: Boolean(item.is_featured),
          custom_tag: item.custom_tag || null,
          created_by: adminId,
        },
      });
      results.push(created);
    }
    return results;
  });
}

/**
 * Deletes or cancels a scheduled assignment.
 */
export async function deleteIncentiveSchedule(scheduleId) {
  const schedule = await prisma.incentiveSchedule.findUnique({
    where: { schedule_id: scheduleId },
  });

  if (!schedule) throw new Error("Scheduled incentive not found");

  await prisma.incentiveSchedule.delete({
    where: { schedule_id: scheduleId },
  });

  return { success: true };
}