// backend/src/modules/cadmin/loyalty/cadminLoyalty.controller.js (do not remove this comment)
// backend/src/modules/cadmin/loyalty/cadminLoyalty.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  getLoyaltyConfigRaw,
  updateLoyaltyConfig,
} from "../../loyalty/loyalty.config.service.js";

function getActor(req) {
  return {
    cadminId: req.cadmin?.cadmin_id ?? null,
    cadminName: req.cadmin?.name ?? req.cadmin?.username ?? "Unknown",
  };
}

export async function handleGetLoyaltyConfig(req, res) {
  try {
    const config = await getLoyaltyConfigRaw();
    return success(res, { config }, "Loyalty configuration fetched successfully");
  } catch (err) {
    console.error("[CAdmin Loyalty] Fetch error:", err);
    return fail(res, "Failed to retrieve loyalty configuration", 500);
  }
}

export async function handleUpdateLoyaltyConfig(req, res) {
  const updates = req.body;

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return fail(res, "Invalid payload: updates must be an object", 400);
  }

  try {
    const config = await updateLoyaltyConfig(updates, getActor(req));
    return success(res, { config }, "Loyalty configuration updated successfully");
  } catch (err) {
    console.error("[CAdmin Loyalty] Update error:", err);
    if (err.code === "VALIDATION_ERROR") {
      return fail(res, err.message, 400);
    }
    return fail(res, "Failed to update loyalty configuration", 500);
  }
}