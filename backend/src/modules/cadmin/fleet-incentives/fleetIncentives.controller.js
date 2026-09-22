// backend/src/modules/cadmin/fleet-incentives/fleetIncentives.controller.js

import * as templateService from "./fleetIncentives.service.js";
import * as schedulerService from "./incentiveScheduler.service.js";
import * as engineService from "./incentiveEngine.service.js";
import { success, fail } from "../../../utils/response.js";

// ── Template Handlers ────────────────────────────────────────────────────────
export async function getTemplatesHandler(req, res) {
  try {
    const templates = await templateService.getIncentiveTemplates(req.query);
    return success(res, templates, "Incentive templates fetched successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch templates", 500);
  }
}

export async function getTemplateDetailHandler(req, res) {
  try {
    const template = await templateService.getIncentiveTemplateById(req.params.id);
    return success(res, template, "Incentive template details fetched");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch template detail", 500);
  }
}

export async function createTemplateHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const created = await templateService.createIncentiveTemplate(req.body, adminId);
    return success(res, created, "Incentive template created successfully", 201);
  } catch (err) {
    return fail(res, err.message || "Failed to create template", 500);
  }
}

export async function updateTemplateHandler(req, res) {
  try {
    const updated = await templateService.updateIncentiveTemplate(req.params.id, req.body);
    return success(res, updated, "Incentive template updated successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to update template", 500);
  }
}

export async function toggleTemplateHandler(req, res) {
  try {
    const { is_active } = req.body;
    const updated = await templateService.toggleTemplateActive(req.params.id, Boolean(is_active));
    return success(res, updated, `Template ${is_active ? "activated" : "deactivated"} successfully`);
  } catch (err) {
    return fail(res, err.message || "Failed to toggle template", 500);
  }
}

// ── Calendar Scheduling Handlers ─────────────────────────────────────────────
export async function getCalendarScheduleHandler(req, res) {
  try {
    const calendar = await schedulerService.getCalendarSchedule(req.query);
    return success(res, calendar, "Incentive calendar fetched successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch calendar", 500);
  }
}

export async function assignScheduleHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const assignment = await schedulerService.assignIncentiveSchedule(req.body, adminId);
    return success(res, assignment, "Incentive schedule assigned successfully", 201);
  } catch (err) {
    return fail(res, err.message || "Failed to assign schedule", 500);
  }
}

export async function bulkAssignHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const result = await schedulerService.bulkAssignWeekSchedule(req.body.assignments, adminId);
    return success(res, result, "Weekly schedule assigned successfully", 201);
  } catch (err) {
    return fail(res, err.message || "Failed to bulk assign schedule", 500);
  }
}

export async function deleteScheduleHandler(req, res) {
  try {
    await schedulerService.deleteIncentiveSchedule(req.params.scheduleId);
    return success(res, null, "Scheduled assignment removed successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to delete schedule assignment", 500);
  }
}

// ── Shift Evaluation Handler (Manual / Re-run) ───────────────────────────────
export async function evaluateShiftHandler(req, res) {
  try {
    const { shift_date } = req.body;
    const result = await engineService.evaluateDailyIncentivesForShift(shift_date);
    return success(res, result, "Incentives evaluated and credited successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to evaluate incentives", 500);
  }
}