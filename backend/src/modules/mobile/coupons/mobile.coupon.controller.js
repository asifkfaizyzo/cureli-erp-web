// backend/src/modules/mobile/coupons/mobile.coupon.controller.js (do not remove this comment)
// backend/src/modules/mobile/coupons/mobile.coupon.controller.js

import { success, fail } from "../../../utils/response.js";
import { validateCouponForCustomer } from "../../coupons/coupon.service.js";

export async function handleValidateCoupon(req, res) {
  const { code, subtotal } = req.body;
  const customer_id = req.mobileUser.id;

  if (!code || typeof code !== "string") {
    return fail(res, "Coupon code is required", 400);
  }

  if (typeof subtotal !== "number" || subtotal <= 0) {
    return fail(res, "Valid order subtotal is required", 400);
  }

  try {
    const result = await validateCouponForCustomer({
      code,
      customer_id,
      subtotal,
    });

    if (!result.valid) {
      return fail(res, result.reason || "Coupon cannot be applied", 400);
    }

    return success(res, result, "Coupon validated successfully");
  } catch (err) {
    console.error("[Mobile Coupons] Validation error:", err);
    return fail(res, "Failed to validate coupon", 500);
  }
}