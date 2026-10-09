// backend/src/modules/cadmin/pharmacy-payouts/cadmin.pharmacyPayouts.controller.js
import * as service from "./cadmin.pharmacyPayouts.service.js";

function ok(res, data, message = "Success") {
  return res.json({ success: true, message, data });
}

export async function revertToDraft(req, res) {
  try {
    const result = await service.transitionPharmacyPayoutStatus(
      req.params.payoutId, "DRAFT", req.body, getCadminId(req),
    );
    return ok(res, result, "Payout reverted to draft");
  } catch (err) {
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  }
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

function getCadminId(req) {
  return req.cadmin?.cadmin_id || req.user?.cadmin_id || null;
}

// ── List ─────────────────────────────────────────────────────────

export async function listPayouts(req, res) {
  try {
    const { week_start, status, search, page, limit } = req.query;
    if (!week_start) return fail(res, "week_start is required");
    const result = await service.getPharmacyPayoutsList(week_start, { status, search, page, limit });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── Detail ───────────────────────────────────────────────────────

export async function getPayoutDetail(req, res) {
  try {
    const { shopId } = req.params;
    const { week_start } = req.query;
    if (!week_start) return fail(res, "week_start is required");
    const result = await service.getPharmacyPayoutDetail(shopId, week_start);
    return ok(res, result);
  } catch (err) {
    const status = err.code === "NOT_FOUND" ? 404 : 500;
    return fail(res, err.message, status);
  }
}

// ── Refresh ──────────────────────────────────────────────────────

export async function refreshPayout(req, res) {
  try {
    const { shopId } = req.params;
    const { week_start } = req.body;
    if (!week_start) return fail(res, "week_start is required");
    const result = await service.refreshPharmacyPayout(shopId, week_start, getCadminId(req));
    return ok(res, result, "Payout recalculated");
  } catch (err) {
    const status = err.code === "NOT_FOUND" ? 404 : err.code === "INVALID_TRANSITION" ? 400 : 500;
    return fail(res, err.message, status);
  }
}

export async function refreshAllPayouts(req, res) {
  try {
    const { week_start } = req.body;
    if (!week_start) return fail(res, "week_start is required");
    const result = await service.refreshAllPharmacyPayouts(week_start, getCadminId(req));
    return ok(res, result, "All payouts refreshed");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── Finalize ─────────────────────────────────────────────────────

export async function finalizeWeek(req, res) {
  try {
    const { week_start } = req.body;
    if (!week_start) return fail(res, "week_start is required");
    const result = await service.finalizePharmacyPayoutWeek(week_start);
    return ok(res, result, "Week finalized");
  } catch (err) {
    const status = err.code === "WEEK_NOT_ENDED" ? 400 : 500;
    return fail(res, err.message, status);
  }
}

// ── Status Transitions ───────────────────────────────────────────

export async function processPayout(req, res) {
  try {
    const result = await service.transitionPharmacyPayoutStatus(
      req.params.payoutId, "PROCESSING", req.body, getCadminId(req),
    );
    return ok(res, result, "Payout marked as processing");
  } catch (err) {
    const status = err.code === "NOT_FOUND" ? 404 : err.code === "BANK_DETAILS_MISSING" ? 400 : 400;
    return fail(res, err.message, status);
  }
}

export async function completePayout(req, res) {
  try {
    const result = await service.transitionPharmacyPayoutStatus(
      req.params.payoutId, "COMPLETED", req.body, getCadminId(req),
    );
    return ok(res, result, "Payout completed");
  } catch (err) {
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  }
}

export async function failPayout(req, res) {
  try {
    const result = await service.transitionPharmacyPayoutStatus(
      req.params.payoutId, "FAILED", req.body, getCadminId(req),
    );
    return ok(res, result, "Payout marked as failed");
  } catch (err) {
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  }
}

export async function retryPayout(req, res) {
  try {
    const result = await service.transitionPharmacyPayoutStatus(
      req.params.payoutId, "PROCESSING", req.body, getCadminId(req),
    );
    return ok(res, result, "Payout retry initiated");
  } catch (err) {
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  }
}

// ── Adjustments & Notes ──────────────────────────────────────────

export async function updateAdjustments(req, res) {
  try {
    const { adjustments } = req.body;
    if (!Array.isArray(adjustments)) return fail(res, "adjustments must be an array");
    const result = await service.updatePharmacyPayoutAdjustments(req.params.payoutId, adjustments);
    return ok(res, result, "Adjustments updated");
  } catch (err) {
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  }
}

export async function addNote(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) return fail(res, "Note text is required");
    const result = await service.addPharmacyPayoutNote(req.params.payoutId, getCadminId(req), text.trim());
    return ok(res, result, "Note added");
  } catch (err) {
    return fail(res, err.message, err.code === "NOT_FOUND" ? 404 : 500);
  }
}

// ── Bulk ─────────────────────────────────────────────────────────

export async function bulkProcess(req, res) {
  try {
    const result = await service.bulkProcessPharmacyPayouts(req.body, getCadminId(req));
    return ok(res, result, "Bulk process completed");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function bulkComplete(req, res) {
  try {
    const result = await service.bulkCompletePharmacyPayouts(req.body, getCadminId(req));
    return ok(res, result, "Bulk complete finished");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

// ── History & Export ─────────────────────────────────────────────

export async function getHistory(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await service.getPharmacyPayoutHistory(req.params.shopId, { page, limit });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function exportCSV(req, res) {
  try {
    const { week_start, status, search } = req.query;
    if (!week_start) return fail(res, "week_start is required");
    const csv = await service.exportPharmacyPayoutsCSV(week_start, { status, search });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="pharmacy-payouts-${week_start}.csv"`);
    return res.send(csv);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}