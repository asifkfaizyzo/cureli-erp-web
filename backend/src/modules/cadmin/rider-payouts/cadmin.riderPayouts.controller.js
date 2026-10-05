//backend\src\modules\cadmin\rider-payouts\cadmin.riderPayouts.controller.js
import * as service from "./cadmin.riderPayouts.service.js";
import { success, fail } from "../../../utils/response.js";

export async function listRiderPayoutsHandler(req, res) {
  try {
    const result = await service.getRiderPayoutsList(
      req.query.week_start,
      req.query
    );
    return success(res, result, "Rider payouts fetched successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch rider payouts", 500);
  }
}

export async function getRiderPayoutDetailHandler(req, res) {
  try {
    const { riderId } = req.params;
    const { week_start } = req.query;
    if (!week_start) return fail(res, "week_start query param is required", 400);
    const result = await service.getRiderPayoutDetail(riderId, week_start);
    return success(res, result, "Rider payout detail fetched");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message || "Failed to fetch detail", 500);
  }
}

export async function refreshRiderPayoutHandler(req, res) {
  try {
    const { riderId } = req.params;
    const { week_start } = req.body;
    const adminId = req.cadmin?.cadmin_id;
    const result = await service.refreshRiderPayout(riderId, week_start, adminId);
    return success(res, result, "Rider payout recalculated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to refresh", 500);
  }
}

export async function refreshAllRiderPayoutsHandler(req, res) {
  try {
    const { week_start, rider_type } = req.body;
    const adminId = req.cadmin?.cadmin_id;
    const result = await service.refreshAllRiderPayouts(week_start, rider_type, adminId);
    return success(res, result, "Bulk rider payout refresh completed");
  } catch (err) {
    return fail(res, err.message || "Failed to refresh all", 500);
  }
}

export async function finalizeWeekHandler(req, res) {
  try {
    const { week_start } = req.body;
    const result = await service.finalizeRiderPayoutWeek(week_start);
    return success(res, result, "Rider payout week finalized");
  } catch (err) {
    if (err.code === "WEEK_NOT_ENDED") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to finalize", 500);
  }
}

export async function processPayoutHandler(req, res) {
  try {
    const result = await service.transitionRiderPayoutStatus(
      req.params.payoutId, "PROCESSING", req.body, req.cadmin?.cadmin_id
    );
    return success(res, result, "Rider payout moved to processing");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    if (err.code === "BANK_DETAILS_MISSING") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to process", 500);
  }
}

export async function completePayoutHandler(req, res) {
  try {
    const result = await service.transitionRiderPayoutStatus(
      req.params.payoutId, "COMPLETED", req.body, req.cadmin?.cadmin_id
    );
    return success(res, result, "Rider payout marked as completed");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to complete", 500);
  }
}

export async function failPayoutHandler(req, res) {
  try {
    const result = await service.transitionRiderPayoutStatus(
      req.params.payoutId, "FAILED", req.body, req.cadmin?.cadmin_id
    );
    return success(res, result, "Rider payout marked as failed");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to update", 500);
  }
}

export async function retryPayoutHandler(req, res) {
  try {
    const result = await service.transitionRiderPayoutStatus(
      req.params.payoutId, "PROCESSING", req.body, req.cadmin?.cadmin_id
    );
    return success(res, result, "Rider payout retry initiated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to retry", 500);
  }
}

export async function updateDeductionsHandler(req, res) {
  try {
    const result = await service.updateRiderPayoutDeductions(
      req.params.payoutId, req.body.deductions
    );
    return success(res, result, "Rider payout deductions updated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to update deductions", 500);
  }
}

export async function addNoteHandler(req, res) {
  try {
    const result = await service.addRiderPayoutNote(
      req.params.payoutId, req.cadmin?.cadmin_id, req.body.text
    );
    return success(res, result, "Note added to rider payout");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message || "Failed to add note", 500);
  }
}

export async function createTeamPayoutHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const result = await service.createTeamPayout(req.body, adminId);
    return success(res, result, "Team rider payout created", 201);
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_RIDER_TYPE") return fail(res, err.message, 400);
    if (err.code === "ALREADY_EXISTS") return fail(res, err.message, 409);
    return fail(res, err.message || "Failed to create team payout", 500);
  }
}

export async function updateTeamAmountHandler(req, res) {
  try {
    const { payoutId } = req.params;
    const adminId = req.cadmin?.cadmin_id;
    const result = await service.updateTeamPayoutAmount(
      payoutId,
      req.body.amount,
      adminId
    );
    return success(res, result, "Team payout amount updated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "INVALID_RIDER_TYPE") return fail(res, err.message, 400);
    if (err.code === "INVALID_TRANSITION") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to update amount", 500);
  }
}

export async function getRiderAttendanceHandler(req, res) {
  try {
    const { riderId } = req.params;
    const { week_start } = req.query;
    if (!week_start) return fail(res, "week_start query param is required", 400);
    const result = await service.getRiderAttendance(riderId, week_start);
    return success(res, result, "Attendance data fetched");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message || "Failed to fetch attendance", 500);
  }
}


export async function bulkProcessHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const result = await service.bulkProcessRiderPayouts(req.body, adminId);
    return success(res, result, "Bulk processing completed");
  } catch (err) {
    return fail(res, err.message || "Failed to bulk process", 500);
  }
}

export async function bulkCompleteHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const result = await service.bulkCompleteRiderPayouts(req.body, adminId);
    return success(res, result, "Bulk payment completion completed");
  } catch (err) {
    return fail(res, err.message || "Failed to bulk complete", 500);
  }
}

export async function getRiderHistoryHandler(req, res) {
  try {
    const { riderId } = req.params;
    const result = await service.getRiderPayoutHistory(riderId, req.query);
    return success(res, result, "Rider payout history fetched");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch history", 500);
  }
}

export async function exportPayoutsCSVHandler(req, res) {
  try {
    const { week_start, rider_type, status } = req.query;
    if (!week_start) return fail(res, "week_start query param is required", 400);

    const csvData = await service.exportRiderPayoutsCSV(week_start, { rider_type, status });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rider_payouts_${week_start}.csv"`
    );
    return res.status(200).send(csvData);
  } catch (err) {
    return fail(res, err.message || "Failed to export CSV", 500);
  }
}