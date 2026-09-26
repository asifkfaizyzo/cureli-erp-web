// backend/src/modules/setup/setup.controller.js (do not remove this comment)
// src/modules/setup/setup.controller.js
import { success, fail } from "../../utils/response.js";
import {
  getSetupStatus,
  checkUsernameAvailability,
  checkPhoneAvailability,
  completeSetup,
} from "./setup.service.js";
import * as audit from "../audit/index.js";

/**
 * GET /setup/status
 * Check if setup is complete for the current shop
 */
export async function getSetupStatusController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const user_id = req.user.user_id;

    if (!shop_id) {
      return fail(res, "Shop not found. Please complete registration first.", 400);
    }

    const status = await getSetupStatus(shop_id, user_id);

    return success(res, status);
  } catch (err) {
    console.error("getSetupStatusController error:", err);
    return fail(res, "Failed to fetch setup status", 500);
  }
}

/**
 * POST /setup/check-username
 * Check if a username is available
 */
export async function checkUsernameController(req, res) {
  try {
    const { username } = req.validated;

    const result = await checkUsernameAvailability(username);

    return success(res, result);
  } catch (err) {
    console.error("checkUsernameController error:", err);
    return fail(res, "Failed to check username availability", 500);
  }
}

/**
 * POST /setup/check-phone
 * Check if a phone number is already registered
 */
export async function checkPhoneController(req, res) {
  try {
    const { phone_number } = req.validated;

    const result = await checkPhoneAvailability(phone_number);

    return success(res, result);
  } catch (err) {
    console.error("checkPhoneController error:", err);
    return fail(res, "Failed to check phone availability", 500);
  }
}

/**
 * POST /setup/complete
 * Submit all setup data (branches + users) in one transaction
 */
export async function completeSetupController(req, res) {
  try {
    const { branches, users } = req.validated;
    const shop_id = req.user.shop_id;
    const user_id = req.user.user_id;

    if (!shop_id) {
      return fail(res, "Shop not found. Please complete registration first.", 400);
    }

    // Check if setup is already complete
    const status = await getSetupStatus(shop_id, user_id);
    if (status.is_complete) {
      return fail(res, "Setup has already been completed", 400);
    }

    // Extract audit context
    const auditContext = audit.extractRequestContext(req);

    // Complete the setup
    const result = await completeSetup({
      shop_id,
      user_id,
      branches,
      users,
      auditContext,
    });

    return success(
      res,
      {
        branches_created: result.branches_created,
        users_created: result.users_created,
        setup_complete: true,
      },
      "Setup completed successfully!"
    );
  } catch (err) {
    console.error("completeSetupController error:", err);

    // Handle specific errors
    if (err.code === "BRANCH_LIMIT_EXCEEDED") {
      return fail(res, err.message, 400);
    }
    if (err.code === "USER_LIMIT_EXCEEDED") {
      return fail(res, err.message, 400);
    }
    if (err.code === "USERNAME_TAKEN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "PHONE_TAKEN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "NO_SUBSCRIPTION") {
      return fail(res, err.message, 400);
    }
    if (err.code === "DUPLICATE_BRANCH_ADMIN") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to complete setup. Please try again.", 500);
  }
}