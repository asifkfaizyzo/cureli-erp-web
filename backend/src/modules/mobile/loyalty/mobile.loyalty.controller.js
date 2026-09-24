// backend/src/modules/mobile/loyalty/mobile.loyalty.controller.js (do not remove this comment)
// backend/src/modules/mobile/loyalty/mobile.loyalty.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  getCustomerLoyaltyBalance,
  getCustomerLoyaltyHistory,
} from "../../loyalty/loyalty.service.js";

export async function handleGetLoyaltySummary(req, res) {
  try {
    const customer_id = req.mobileUser.id;
    const data = await getCustomerLoyaltyBalance(customer_id);
    return success(res, data, "Loyalty summary retrieved");
  } catch (err) {
    console.error("[Mobile Loyalty] Get summary error:", err);
    return fail(res, "Failed to retrieve loyalty summary", 500);
  }
}

export async function handleGetLoyaltyHistory(req, res) {
  try {
    const customer_id = req.mobileUser.id;
    const { page, limit } = req.query;
    const result = await getCustomerLoyaltyHistory(customer_id, { page, limit });
    return success(res, result, "Loyalty history retrieved");
  } catch (err) {
    console.error("[Mobile Loyalty] Get history error:", err);
    return fail(res, "Failed to retrieve loyalty history", 500);
  }
}