// backend/src/modules/shop/shop.services.js (do not remove this comment)
// src/modules/shop/shop.services.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";

/**
 * Update shop basic info (business_name, address_line_1, address_line_2, city, state, pincode)
 * Also advances user's onboarding_step to at least 5.
 */
export async function updateShopInfo(user_id, data, auditContext) {
  const user = await prisma.user.findUnique({ 
    where: { user_id },
    select: {
      shop_id: true,
      role: true,
      branch_id: true,
      onboarding_step: true,
    }
  });
  
  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.shop_id) {
    const err = new Error("Shop not found for user");
    err.code = "NO_SHOP";
    throw err;
  }

  // Get current shop data for before/after comparison
  const currentShop = await prisma.shop.findUnique({
    where: { shop_id: user.shop_id },
    select: {
      business_name: true,
      legal_name: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
    },
  });

  await prisma.shop.update({
    where: { shop_id: user.shop_id },
    data: {
      business_name: data.business_name,
      legal_name: data.legal_name || null,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    },
  });

  // Advance onboarding_step to 5 if it's less than 5
  if ((user.onboarding_step || 4) < 5) {
    await prisma.user.update({
      where: { user_id },
      data: { onboarding_step: 5 },
    });
  }

  // Audit: Shop details updated
  const changedFields = [];
  if (currentShop.business_name !== data.business_name) changedFields.push('business_name');
  if (currentShop.legal_name !== (data.legal_name || null)) changedFields.push('legal_name');
  if (currentShop.address_line_1 !== data.address_line_1) changedFields.push('address_line_1');
  if (currentShop.address_line_2 !== (data.address_line_2 || null)) changedFields.push('address_line_2');
  if (currentShop.city !== data.city) changedFields.push('city');
  if (currentShop.state !== data.state) changedFields.push('state');
  if (currentShop.pincode !== data.pincode) changedFields.push('pincode');

  await audit.log({
    action: audit.AuditAction.SHOP_DETAILS_UPDATED,
    entity_type: audit.EntityType.SHOP,
    entity_id: user.shop_id,
    shop_id: user.shop_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user_id,
    actor_role: user.role,
    branch_id: user.branch_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      changed_fields: changedFields,
      before: {
        business_name: currentShop.business_name,
        legal_name: currentShop.legal_name,
        address_line_1: currentShop.address_line_1,
        city: currentShop.city,
        state: currentShop.state,
        pincode: currentShop.pincode,
      },
      after: {
        business_name: data.business_name,
        legal_name: data.legal_name || null,
        address_line_1: data.address_line_1,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    },
  });

  return true;
}

/**
 * Update GST + business type and advance onboarding_step to 6 if needed.
 */
export async function updateShopGst(user_id, data, auditContext) {
  const user = await prisma.user.findUnique({ 
    where: { user_id },
    select: {
      shop_id: true,
      role: true,
      branch_id: true,
      onboarding_step: true,
    }
  });
  
  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.shop_id) {
    const err = new Error("Shop not found for user");
    err.code = "NO_SHOP";
    throw err;
  }

  // Get current shop data
  const currentShop = await prisma.shop.findUnique({
    where: { shop_id: user.shop_id },
    select: {
      gst_number: true,
      business_type: true,
      legal_name: true,
    },
  });

  await prisma.shop.update({
    where: { shop_id: user.shop_id },
    data: {
      gst_number: data.gst_number || null,
      business_type: data.business_type || null,
      legal_name: data.legal_name || undefined,
    },
  });

  // Advance onboarding_step to 6 if it's less than 6
  if ((user.onboarding_step || 4) < 6) {
    await prisma.user.update({
      where: { user_id },
      data: { onboarding_step: 6 },
    });
  }

  // Audit: Shop details updated (GST)
  const changedFields = [];
  if (currentShop.gst_number !== (data.gst_number || null)) changedFields.push('gst_number');
  if (currentShop.business_type !== (data.business_type || null)) changedFields.push('business_type');
  if (data.legal_name && currentShop.legal_name !== data.legal_name) changedFields.push('legal_name');

  await audit.log({
    action: audit.AuditAction.SHOP_DETAILS_UPDATED,
    entity_type: audit.EntityType.SHOP,
    entity_id: user.shop_id,
    shop_id: user.shop_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user_id,
    actor_role: user.role,
    branch_id: user.branch_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      changed_fields: changedFields,
      before: {
        gst_number: currentShop.gst_number,
        business_type: currentShop.business_type,
      },
      after: {
        gst_number: data.gst_number || null,
        business_type: data.business_type || null,
      },
    },
  });

  return true;
}