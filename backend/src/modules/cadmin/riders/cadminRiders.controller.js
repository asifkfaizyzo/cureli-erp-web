// backend/src/modules/cadmin/riders/cadminRiders.controller.js (do not remove this comment)

import { fail, success } from "../../../utils/response.js";
import {
  listRiders,
  getRiderDetail,
  reviewDocument,
  approveRider,
  rejectRider,
  suspendRider,
  reactivateRider,
  createRiderByAdmin,
  convertRiderType,
  getPendingReviews as listPendingReviews,
  listZones,
  createZone,
  updateZone,
} from "./cadminRiders.service.js";

// ── Riders ────────────────────────────────────────────────────

export async function getRiders(req, res) {
  try {
    const result = await listRiders(req.query);
    return success(res, result, "Riders retrieved");
  } catch {
    return fail(res, "Failed to fetch riders", 500);
  }
}

export async function getRider(req, res) {
  try {
    const rider = await getRiderDetail(req.params.riderId);
    return success(res, rider, "Rider retrieved");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to fetch rider", 500);
  }
}

export async function reviewRiderDocument(req, res) {
  const { action, rejection_reason } = req.body;
  try {
    const result = await reviewDocument(
      req.params.riderId,
      req.params.documentId,
      action,
      rejection_reason,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Document reviewed");
  } catch (err) {
    const map = { INVALID_ACTION: 400, REASON_REQUIRED: 400, NOT_FOUND: 404 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function approveRiderApplication(req, res) {
  try {
    const result = await approveRider(req.params.riderId, req.cadmin.cadmin_id);
    return success(res, result, "Rider approved and activated");
  } catch (err) {
    const map = { NOT_FOUND: 404, DOCUMENTS_PENDING: 400 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function rejectRiderApplication(req, res) {
  const { reason } = req.body;
  try {
    const result = await rejectRider(
      req.params.riderId,
      reason,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Rider application rejected");
  } catch (err) {
    const map = { REASON_REQUIRED: 400, NOT_FOUND: 404 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function suspendRiderAccount(req, res) {
  const { reason } = req.body;
  try {
    const result = await suspendRider(
      req.params.riderId,
      reason,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Rider suspended");
  } catch (err) {
    const map = { REASON_REQUIRED: 400, NOT_FOUND: 404 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function reactivateRiderAccount(req, res) {
  try {
    const result = await reactivateRider(req.params.riderId);
    return success(res, result, "Rider reactivated");
  } catch (err) {
    const map = { NOT_FOUND: 404, INVALID_STATUS: 400 };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

export async function createRider(req, res) {
  const { phone, initial_password } = req.body;

  if (!phone) {
    return fail(res, "Phone number is required", 400);
  }
  if (!initial_password || initial_password.length < 8) {
    return fail(res, "Initial password must be at least 8 characters", 400);
  }

  try {
    const rider = await createRiderByAdmin(
      req.body,
      req.files || {},
      req.cadmin.cadmin_id,
    );
    return success(
      res,
      rider,
      `${rider.rider_type === "TEAM" ? "Team" : "Independent"} rider created and pre-approved successfully`,
      201,
    );
  } catch (err) {
    if (err.code === "ALREADY_EXISTS") {
      return fail(res, err.message, 409);
    }
    if (err.code === "DOCUMENTS_REQUIRED") {
      return fail(res, err.message, 400);
    }
    console.error("[CadminRiders] Create Rider failed:", err);
    return fail(res, err.message || "Failed to create rider", 500);
  }
}

export async function convertRiderTypeController(req, res) {
  const { new_type } = req.body;

  if (!new_type) {
    return fail(res, "new_type is required (TEAM or INDEPENDENT)", 400);
  }

  try {
    const result = await convertRiderType(req.params.riderId, new_type);
    return success(res, result, `Rider converted to ${new_type}`);
  } catch (err) {
    const map = {
      NOT_FOUND: 404,
      SAME_TYPE: 400,
      INVALID_TYPE: 400,
      ACTIVE_DELIVERIES: 409,
    };
    return fail(res, err.message, map[err.code] ?? 500);
  }
}

// ── Zones ─────────────────────────────────────────────────────

export async function getZones(req, res) {
  try {
    const zones = await listZones(req.query);
    return success(res, zones, "Zones retrieved");
  } catch {
    return fail(res, "Failed to fetch zones", 500);
  }
}

export async function addZone(req, res) {
  const { name, city, state } = req.body;
  if (!name || !city || !state)
    return fail(res, "Name, city, and state are required", 400);
  try {
    const zone = await createZone({ name, city, state }, req.cadmin.cadmin_id);
    return success(res, zone, "Zone created", 201);
  } catch {
    return fail(res, "Failed to create zone", 500);
  }
}

export async function editZone(req, res) {
  try {
    const zone = await updateZone(req.params.zoneId, req.body);
    return success(res, zone, "Zone updated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to update zone", 500);
  }
}

export async function getPendingReviews(req, res) {
  try {
    const result = await listPendingReviews(req.query);
    return success(res, result, "Pending reviews retrieved");
  } catch {
    return fail(res, "Failed to fetch pending reviews", 500);
  }
}