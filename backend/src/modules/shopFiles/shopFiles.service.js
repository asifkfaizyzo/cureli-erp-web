// backend/src/modules/shopFiles/shopFiles.service.js (do not remove this comment)
// backend/src/modules/shopFiles/shopFiles.service.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";

/**
 * UPLOAD SHOP FILE (Initial upload during onboarding)
 */
export async function uploadShopFile(fileData) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id: fileData.shop_id },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "NO_SHOP";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const file = await tx.shopFile.create({
      data: {
        shop_id: fileData.shop_id,
        file_type: fileData.file_type,
        storage_key: fileData.storage_key,
        original_name: fileData.original_name,
        mime_type: fileData.mime_type,
        file_size: fileData.file_size,
        uploaded_by: fileData.user_id,
        status: "uploaded",
      },
    });

    await tx.shop.update({
      where: { shop_id: fileData.shop_id },
      data: { verification_status: "pending_review" },
    });

    //  AUDIT: Document uploaded by owner
    await audit.log(
      {
        action: audit.AuditAction.SHOP_DOCUMENT_UPLOADED,
        entity_type: audit.EntityType.DOCUMENT,
        entity_id: file.file_id,
        shop_id: fileData.shop_id,
        ...fileData.auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          file_type: file.file_type,
          original_name: file.original_name,
          mime_type: file.mime_type,
          file_size: file.file_size,
        },
      },
      { tx },
    );

    return file;
  });

  // Update onboarding step (outside transaction)
  const mapping = {
    drug_license: 7,
    pharmacy_registration: 8,
    business_registration_proof: 9,
    shop_establishment_license: 10,
    pan_card: 11,
    address_proof: 12,
  };

  const targetStep = mapping[fileData.file_type];

  if (targetStep) {
    const user = await prisma.user.findUnique({
      where: { user_id: fileData.user_id },
    });
    if (user && (user.onboarding_step || 4) < targetStep) {
      await prisma.user.update({
        where: { user_id: fileData.user_id },
        data: { onboarding_step: targetStep },
      });
    }
  }

  return result;
}

/**
 * LIST REJECTED FILES FOR SHOP
 */
export async function listRejectedFilesForShop(shop_id) {
  return prisma.shopFile.findMany({
    where: { shop_id, status: "rejected" },
    select: {
      file_id: true,
      file_type: true,
      original_name: true,
      status: true,
      verification_notes: true,
      resubmission_count: true,
      uploaded_at: true,
      rejected_at: true,
      last_resubmitted_at: true,
    },
    orderBy: { rejected_at: "desc" },
  });
}

/**
 * RESUBMIT FILE (Owner resubmits a rejected file)
 */
export async function resubmitFile({
  file_id,
  shop_id,
  storage_key,
  original_name,
  mime_type,
  file_size,
  owner_message = null,
  auditContext = {},
}) {
  const old = await prisma.shopFile.findUnique({ where: { file_id } });

  if (!old) {
    const err = new Error("File not found");
    err.code = "FILE_NOT_FOUND";
    throw err;
  }

  if (old.shop_id !== shop_id) {
    const err = new Error("Forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.shopFile.update({
      where: { file_id },
      data: {
        storage_key,
        original_name,
        mime_type,
        file_size,
        status: "uploaded",
        verification_notes: null,
        verified_at: null,
        rejected_at: null,
        last_resubmitted_at: new Date(),
        resubmission_count: { increment: 1 },
        uploaded_at: new Date(),
      },
    });

    await tx.shop.update({
      where: { shop_id },
      data: { verification_status: "pending_review" },
    });

    const shop = await tx.shop.findUnique({
      where: { shop_id },
      select: { owner_user_id: true },
    });

    if (shop?.owner_user_id) {
      await tx.user.update({
        where: { user_id: shop.owner_user_id },
        data: {
          status: "pending_verification",
          first_login_after_verification: false,
        },
      });
     
    }

    // Legacy log (for backward compatibility with UI that reads this table)
    await tx.fileVerificationLog.create({
      data: {
        file_id,
        shop_id,
        actor_type: "owner",
        action: "resubmitted",
        reason: owner_message || "File resubmitted by owner",
      },
    });

    //  AUDIT: Document resubmitted
    await audit.log(
      {
        action: audit.AuditAction.SHOP_DOCUMENT_RESUBMITTED,
        entity_type: audit.EntityType.DOCUMENT,
        entity_id: file_id,
        shop_id: shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          file_type: old.file_type,
          resubmission_count: updated.resubmission_count,
          owner_message: owner_message,
          previous_status: old.status,
          new_status: updated.status,
        },
      },
      { tx },
    );

    return updated;
  });

  return result;
}

/**
 * OWNER MESSAGE TO ADMIN
 * (Legacy feature — creates FileVerificationLog only, not audited)
 */
export async function ownerMessage({ file_id, shop_id, message }) {
  const file = await prisma.shopFile.findUnique({ where: { file_id } });

  if (!file || file.shop_id !== shop_id) {
    const err = new Error("Forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }

  if (!message || !message.trim()) {
    const err = new Error("Message is required");
    err.code = "INVALID";
    throw err;
  }

  // Legacy log only (not critical enough for audit trail)
  await prisma.fileVerificationLog.create({
    data: {
      file_id,
      shop_id,
      actor_type: "owner",
      action: "owner_message",
      reason: message.trim(),
    },
  });

  return { success: true };
}
