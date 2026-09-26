// backend/src/modules/shop/shop.controller.js (do not remove this comment)
// backend/src/modules/shop/shop.controller.js

import prisma from "../../config/prisma.js";
import { success, fail } from "../../utils/response.js";
import { updateShopInfo, updateShopGst } from "./shop.services.js";
import * as audit from "../audit/index.js";

/**
 * GET /api/shop/verification-status
 * Returns verification status for the current user's shop
 */
export async function getVerificationStatusController(req, res) {
  try {
    const user_id = req.user.user_id;
    const shop_id = req.user.shop_id;

    if (!shop_id) {
      return fail(res, "No shop associated with your account", 400);
    }

    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: {
        shop_id: true,
        business_name: true,
        verification_status: true,
        verification_notes: true,
      },
    });

    if (!shop) {
      return fail(res, "Shop not found", 404);
    }

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        status: true,
        first_login_after_verification: true,
      },
    });

    return success(res, {
      verification_status: shop.verification_status,
      user_status: user?.status,
      first_login_after_verification: user?.first_login_after_verification,
      shop_id: shop.shop_id,
      business_name: shop.business_name,
    });

  } catch (err) {
    console.error("shop.getVerificationStatus", err);
    return fail(res, "Failed to get verification status", 500);
  }
}

export async function updateShopInfoController(req, res) {
  try {
    const data = req.validated;
    const user_id = req.user.user_id;
    const auditContext = audit.extractRequestContext(req);

    await updateShopInfo(user_id, data, auditContext);

    return success(res, {}, "Business information updated");
  } catch (err) {
    console.error(err);
    return fail(res, err.message || "Failed to update business info", 400);
  }
}

export async function updateShopGstController(req, res) {
  try {
    const data = req.validated;
    const user_id = req.user.user_id;
    const auditContext = audit.extractRequestContext(req);

    await updateShopGst(user_id, data, auditContext);

    return success(res, {}, "Business GST updated");
  } catch (err) {
    console.error(err);
    return fail(res, err.message || "Failed to update GST info", 400);
  }
}



/**
 * GET /api/shop/profile
 * Returns full shop profile for invoice printing
 */
export async function getShopProfileController(req, res) {
  try {
    const shop_id = req.user.shop_id;

    if (!shop_id) {
      return fail(res, "No shop associated with your account", 400);
    }

    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: {
        shop_id: true,
        business_name: true,
        legal_name: true,
        address_line_1: true,
        address_line_2: true,
        city: true,
        state: true,
        pincode: true,
        gst_number: true,
        // Get contact from owner user
        owner: {
          select: {
            phone_number: true,
            email: true,
          },
        },
      },
    });

    if (!shop) {
      return fail(res, "Shop not found", 404);
    }

    const addressParts = [
      shop.address_line_1,
      shop.address_line_2,
      shop.city,
      shop.state,
      shop.pincode,
    ].filter(Boolean);

    const profile = {
      shop_id: shop.shop_id,
      business_name: shop.business_name || "",
      legal_name: shop.legal_name || shop.business_name || "",
      address_line_1: shop.address_line_1 || "",
      address_line_2: shop.address_line_2 || "",
      city: shop.city || "",
      state: shop.state || "",
      pincode: shop.pincode || "",
      full_address: addressParts.join(", "),
      gst_number: shop.gst_number || "",
      drug_license_no: "", // Not stored on Shop model - can be added later
      phone: shop.owner?.phone_number || "",
      email: shop.owner?.email || "",
    };

    return success(res, profile, "Shop profile retrieved");
  } catch (err) {
    console.error("shop.getProfile ERROR:", err);
    return fail(res, "Failed to get shop profile", 500);
  }
}