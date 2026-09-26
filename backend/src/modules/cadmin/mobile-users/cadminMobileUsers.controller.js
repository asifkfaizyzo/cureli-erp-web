// backend/src/modules/cadmin/mobile-users/cadminMobileUsers.controller.js (do not remove this comment)
// backend/src/modules/cadmin/mobile-users/cadminMobileUsers.controller.js

import { success, fail } from "../../../utils/response.js";
import * as Service from "./cadminMobileUsers.service.js";

// ─────────────────────────────────────────────
// GET /cadmin/mobile-users
// ─────────────────────────────────────────────
export const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
    } = req.query;

    const data = await Service.listMobileUsers({
      page: Math.max(1, parseInt(page)),
      limit: Math.min(100, parseInt(limit)),
      search: search.trim(),
      status,
    });

    return success(res, data, "Mobile users fetched");
  } catch (err) {
    console.error("[cadminMobileUsers] listUsers:", err.message);
    return fail(res, err.message, 500);
  }
};

// ─────────────────────────────────────────────
// GET /cadmin/mobile-users/:user_id
// ─────────────────────────────────────────────
export const getUser = async (req, res) => {
  try {
    const data = await Service.getMobileUserDetail(req.params.user_id);
    return success(res, data, "User detail fetched");
  } catch (err) {
    console.error("[cadminMobileUsers] getUser:", err.message);
    return fail(
      res,
      err.message,
      err.message === "User not found" ? 404 : 500
    );
  }
};

// ─────────────────────────────────────────────
// PATCH /cadmin/mobile-users/:user_id
// Edit full_name and/or email
// ─────────────────────────────────────────────
export const editUser = async (req, res) => {
  try {
    const data = await Service.editMobileUser(req.params.user_id, req.body);
    return success(res, data, "User updated");
  } catch (err) {
    console.error("[cadminMobileUsers] editUser:", err.message);

    const statusMap = {
      "User not found": 404,
      "Cannot edit a deleted account": 403,
      "No valid fields provided to update": 400,
    };

    const httpStatus =
      err.code === "EMAIL_TAKEN"
        ? 409
        : statusMap[err.message] || 400;

    return fail(res, err.message, httpStatus);
  }
};

// ─────────────────────────────────────────────
// PATCH /cadmin/mobile-users/:user_id/phone
// Change phone number (admin override, no OTP)
// ─────────────────────────────────────────────
export const editUserPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return fail(res, "phone is required", 400);
    }

    const data = await Service.editMobileUserPhone(
      req.params.user_id,
      phone
    );

    return success(res, data, "Phone number updated");
  } catch (err) {
    console.error("[cadminMobileUsers] editUserPhone:", err.message);

    const statusMap = {
      "User not found": 404,
      "Cannot edit a deleted account": 403,
      "New phone number is the same as current": 400,
    };

    const httpStatus =
      err.code === "PHONE_TAKEN"
        ? 409
        : statusMap[err.message] || 400;

    return fail(res, err.message, httpStatus);
  }
};

// ─────────────────────────────────────────────
// PATCH /cadmin/mobile-users/:user_id/block
// block: true = suspend, false = reactivate
// ─────────────────────────────────────────────
export const blockUser = async (req, res) => {
  try {
    const { block, reason = "" } = req.body;

    if (typeof block !== "boolean") {
      return fail(res, "block must be a boolean", 400);
    }

    const cadmin_name = req.cadmin?.username || "CAdmin";

    const data = await Service.setBlockStatus(
      req.params.user_id,
      block,
      reason,
      cadmin_name
    );

    return success(
      res,
      data,
      block ? "User suspended successfully" : "User reactivated successfully"
    );
  } catch (err) {
    console.error("[cadminMobileUsers] blockUser:", err.message);

    const statusMap = {
      "User not found": 404,
      "Cannot modify a deleted account": 403,
    };

    const httpStatus =
      err.code === "ALREADY_SUSPENDED" || err.code === "ALREADY_ACTIVE"
        ? 409
        : statusMap[err.message] || 400;

    return fail(res, err.message, httpStatus);
  }
};

// ─────────────────────────────────────────────
// POST /cadmin/mobile-users/:user_id/revoke-sessions
// Force logout from all devices
// Account stays active — only sessions are killed
// ─────────────────────────────────────────────
export const revokeSessions = async (req, res) => {
  try {
    const data = await Service.forceRevokeAllSessions(req.params.user_id);
    return success(
      res,
      data,
      `Revoked ${data.sessions_revoked} active session(s)`
    );
  } catch (err) {
    console.error("[cadminMobileUsers] revokeSessions:", err.message);

    const statusMap = {
      "User not found": 404,
      "Cannot modify a deleted account": 403,
    };

    return fail(res, err.message, statusMap[err.message] || 500);
  }
};

// ─────────────────────────────────────────────
// DELETE /cadmin/mobile-users/:user_id
// Permanently delete account + create tombstone
// ─────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const { reason = "" } = req.body;

    const data = await Service.deleteMobileUserAccount(
      req.params.user_id,
      reason
    );

    return success(res, data, "Account permanently deleted");
  } catch (err) {
    console.error("[cadminMobileUsers] deleteUser:", err.message);

    const statusMap = {
      "User not found": 404,
      "Account is already deleted": 409,
    };

    return fail(res, err.message, statusMap[err.message] || 500);
  }
};