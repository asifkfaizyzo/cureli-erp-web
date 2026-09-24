// backend/src/modules/mobile/users/mobile.users.controller.js (do not remove this comment)
// src/modules/mobile/users/mobile.users.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  updateMobileProfile,
  listMobileAddresses,
  createMobileAddress,
  updateMobileAddress,
  setDefaultMobileAddress,
  deleteMobileAddress,
  sendDeleteAccountOtp,
  confirmDeleteAccount,
} from "./mobile.users.service.js";

// ── Profile ───────────────────────────────────────────────────

/**
 * PATCH /mobile/users/profile
 */
export async function handleUpdateProfile(req, res) {
  try {
    const user = await updateMobileProfile(req.mobileUser.id, req.body);
    return success(res, { user }, "Profile updated");
  } catch (err) {
    const statusMap = {
      NO_FIELDS: 400,
      EMAIL_TAKEN: 409,
    };
    return fail(res, err.message, statusMap[err.code] || 400);
  }
}

// ── Addresses ─────────────────────────────────────────────────

/**
 * GET /mobile/users/addresses
 */
export async function handleListAddresses(req, res) {
  try {
    const addresses = await listMobileAddresses(req.mobileUser.id);
    return success(res, { addresses }, "Addresses fetched");
  } catch {
    return fail(res, "Failed to fetch addresses", 500);
  }
}

/**
 * POST /mobile/users/addresses
 */
export async function handleCreateAddress(req, res) {
  try {
    const address = await createMobileAddress(req.mobileUser.id, req.body);
    return success(res, { address }, "Address saved", 201);
  } catch (err) {
    const statusMap = {
      ADDRESS_LIMIT: 400,
    };
    return fail(res, err.message, statusMap[err.code] || 400);
  }
}

/**
 * PATCH /mobile/users/addresses/:id
 */
export async function handleUpdateAddress(req, res) {
  try {
    const address = await updateMobileAddress(
      req.mobileUser.id,
      req.params.id,
      req.body,
    );
    return success(res, { address }, "Address updated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}

/**
 * PATCH /mobile/users/addresses/:id/default
 */
export async function handleSetDefaultAddress(req, res) {
  try {
    const address = await setDefaultMobileAddress(
      req.mobileUser.id,
      req.params.id,
    );
    return success(res, { address }, "Default address updated");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}

/**
 * DELETE /mobile/users/addresses/:id
 */
export async function handleDeleteAddress(req, res) {
  try {
    await deleteMobileAddress(req.mobileUser.id, req.params.id);
    return success(res, {}, "Address removed");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}
/**
 * POST /mobile/users/account/delete/send-otp
 */
export async function handleSendDeleteOtp(req, res) {
  try {
    const result = await sendDeleteAccountOtp(req.mobileUser.id);
    return success(res, result, "OTP sent to your registered phone number");
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      ACCOUNT_INACTIVE: 403,
    };
    return fail(res, err.message, statusMap[err.code] || 500);
  }
}

/**
 * POST /mobile/users/account/delete/confirm
 */
export async function handleConfirmDeleteAccount(req, res) {
  try {
    await confirmDeleteAccount(req.mobileUser.id, req.body.otp);
    return success(res, {}, "Account permanently deleted");
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      NO_OTP: 400,
      OTP_EXPIRED: 400,
      OTP_INVALID: 400,
    };
    return fail(res, err.message, statusMap[err.code] || 500);
  }
}