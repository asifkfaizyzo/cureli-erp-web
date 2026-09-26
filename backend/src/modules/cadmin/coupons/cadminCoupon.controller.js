// backend/src/modules/cadmin/coupons/cadminCoupon.controller.js (do not remove this comment)
// backend/src/modules/cadmin/coupons/cadminCoupon.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  createCoupon,
  listCoupons,
  getCouponDetail,
  updateCoupon,
  deleteCoupon,
} from "../../coupons/coupon.service.js";

function getActor(req) {
  return {
    cadminId: req.cadmin?.cadmin_id ?? null,
    cadminName: req.cadmin?.name ?? req.cadmin?.username ?? "Unknown",
  };
}

export async function handleListCoupons(req, res) {
  try {
    const { page, limit, search, status } = req.query;
    const result = await listCoupons({ page, limit, search, status });
    return success(res, result, "Coupons retrieved successfully");
  } catch (err) {
    console.error("[CAdmin Coupons] List error:", err);
    return fail(res, "Failed to retrieve coupons", 500);
  }
}

export async function handleGetCouponDetail(req, res) {
  const { id } = req.params;
  try {
    const coupon = await getCouponDetail(id);
    return success(res, { coupon }, "Coupon details fetched");
  } catch (err) {
    console.error("[CAdmin Coupons] Detail error:", err);
    return fail(res, err.message || "Failed to fetch coupon detail", 404);
  }
}

export async function handleCreateCoupon(req, res) {
  try {
    const coupon = await createCoupon(req.body, getActor(req));
    return success(res, { coupon }, "Coupon created successfully", 201);
  } catch (err) {
    console.error("[CAdmin Coupons] Create error:", err);
    if (err.code === "VALIDATION_ERROR" || err.code === "DUPLICATE_ERROR") {
      return fail(res, err.message, 400);
    }
    return fail(res, "Failed to create coupon", 500);
  }
}

export async function handleUpdateCoupon(req, res) {
  const { id } = req.params;
  try {
    const coupon = await updateCoupon(id, req.body, getActor(req));
    return success(res, { coupon }, "Coupon updated successfully");
  } catch (err) {
    console.error("[CAdmin Coupons] Update error:", err);
    return fail(res, err.message || "Failed to update coupon", 400);
  }
}

export async function handleToggleCouponActive(req, res) {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== "boolean") {
    return fail(res, "is_active must be a boolean", 400);
  }

  try {
    const coupon = await updateCoupon(id, { is_active }, getActor(req));
    return success(
      res,
      { coupon },
      is_active ? "Coupon activated" : "Coupon deactivated",
    );
  } catch (err) {
    console.error("[CAdmin Coupons] Toggle error:", err);
    return fail(res, "Failed to update coupon status", 400);
  }
}

export async function handleDeleteCoupon(req, res) {
  const { id } = req.params;
  try {
    await deleteCoupon(id, getActor(req));
    return success(res, null, "Coupon deleted successfully");
  } catch (err) {
    console.error("[CAdmin Coupons] Delete error:", err);
    return fail(res, err.message || "Failed to delete coupon", 400);
  }
}