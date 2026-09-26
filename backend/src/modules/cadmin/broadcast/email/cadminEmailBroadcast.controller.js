// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.controller.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.controller.js

import { success, fail } from "../../../../utils/response.js";
import * as audit from "../../../audit/index.js";
import * as service from "./cadminEmailBroadcast.service.js";
import * as fileStorage from "../../../../services/fileStorage.service.js"; //  NEW

const FOLDER = "email_attachments"; //  Define folder constant

// ============================================
// PREVIEW RECIPIENTS
// ============================================

export async function previewRecipientCountController(req, res) {
  try {
    const result = await service.previewRecipientCount(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Preview failed:", err);
    return fail(
      res,
      err.message || "Failed to preview recipients",
      err.status || 500,
    );
  }
}

// ============================================
// CREATE DRAFT
// ============================================

export async function createDraftController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);

    const result = await service.createDraft(req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });

    await audit.log({
      action: audit.AuditAction.SYSTEM_BROADCAST_CREATED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: result.campaign_id,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: "email_draft",
        subject: req.validated.subject,
        recipient_count: result.recipient_count,
        channel: "email",
      },
    });

    return success(res, result, "Draft created successfully", 201);
  } catch (err) {
    console.error("[Email Broadcast Controller] Create draft failed:", err);
    return fail(
      res,
      err.message || "Failed to create draft",
      err.status || 500,
    );
  }
}

// ============================================
// UPDATE DRAFT
// ============================================

export async function updateDraftController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await service.updateDraft(id, req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });

    return success(res, result, "Draft updated successfully");
  } catch (err) {
    console.error("[Email Broadcast Controller] Update draft failed:", err);
    return fail(
      res,
      err.message || "Failed to update draft",
      err.status || 500,
    );
  }
}

// ============================================
// SCHEDULE CAMPAIGN
// ============================================

export async function scheduleCampaignController(req, res) {
  try {
    const { id } = req.params;
    const { scheduled_for } = req.validated;
    const auditContext = audit.extractRequestContext(req);

    const result = await service.scheduleCampaign(id, scheduled_for, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });

    await audit.log({
      action: audit.AuditAction.SYSTEM_BROADCAST_CREATED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: id,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: "email_scheduled",
        campaign_id: id,
        scheduled_for,
        subject: result.subject,
        channel: "email",
      },
    });

    return success(res, result, "Campaign scheduled successfully");
  } catch (err) {
    console.error("[Email Broadcast Controller] Schedule failed:", err);
    return fail(
      res,
      err.message || "Failed to schedule campaign",
      err.status || 500,
    );
  }
}

// ============================================
// SEND IMMEDIATELY
// ============================================

export async function sendImmediateController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);

    const result = await service.sendImmediate(req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });

    await audit.log({
      action: audit.AuditAction.SYSTEM_BROADCAST_SENT,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: result.campaign_id,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: "email_immediate",
        subject: req.validated.subject,
        recipient_count: result.recipient_count,
        channel: "email",
      },
    });

    return success(res, result, "Emails are being sent");
  } catch (err) {
    console.error("[Email Broadcast Controller] Send immediate failed:", err);
    return fail(res, err.message || "Failed to send emails", err.status || 500);
  }
}

// ============================================
// SEND TEST EMAIL
// ============================================

export async function sendTestEmailController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);

    const result = await service.sendTestEmail(req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });

    return success(res, result, "Test email sent");
  } catch (err) {
    console.error("[Email Broadcast Controller] Test email failed:", err);
    return fail(
      res,
      err.message || "Failed to send test email",
      err.status || 500,
    );
  }
}

// ============================================
// CANCEL CAMPAIGN
// ============================================

export async function cancelCampaignController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await service.cancelCampaign(id, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
    });

    return success(res, result, "Campaign cancelled");
  } catch (err) {
    console.error("[Email Broadcast Controller] Cancel failed:", err);
    return fail(
      res,
      err.message || "Failed to cancel campaign",
      err.status || 500,
    );
  }
}

// ============================================
// DELETE DRAFT
// ============================================

export async function deleteDraftController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await service.deleteDraft(id, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
    });

    return success(res, result, "Draft deleted");
  } catch (err) {
    console.error("[Email Broadcast Controller] Delete draft failed:", err);
    return fail(
      res,
      err.message || "Failed to delete draft",
      err.status || 500,
    );
  }
}

// ============================================
// LIST ENDPOINTS
// ============================================

export async function getDraftsController(req, res) {
  try {
    const result = await service.getDrafts(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get drafts failed:", err);
    return fail(
      res,
      err.message || "Failed to fetch drafts",
      err.status || 500,
    );
  }
}

export async function getScheduledController(req, res) {
  try {
    const result = await service.getScheduled(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get scheduled failed:", err);
    return fail(
      res,
      err.message || "Failed to fetch scheduled campaigns",
      err.status || 500,
    );
  }
}

export async function getHistoryController(req, res) {
  try {
    const result = await service.getHistory(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get history failed:", err);
    return fail(
      res,
      err.message || "Failed to fetch history",
      err.status || 500,
    );
  }
}

export async function getCampaignByIdController(req, res) {
  try {
    const { id } = req.params;
    const result = await service.getCampaignById(id);
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get campaign failed:", err);
    return fail(
      res,
      err.message || "Failed to fetch campaign",
      err.status || 404,
    );
  }
}

// ============================================
// QUOTA STATUS
// ============================================

export async function getQuotaStatusController(req, res) {
  try {
    const result = await service.getQuotaStatus();
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get quota failed:", err);
    return fail(
      res,
      err.message || "Failed to fetch quota status",
      err.status || 500,
    );
  }
}

// ============================================
// FILTER OPTIONS
// ============================================

export async function getShopsForFilterController(req, res) {
  try {
    const { search = "", page = 1, limit = 50 } = req.query;

    const result = await service.getShopsForFilter(
      search,
      Number(page),
      Number(limit),
    );

    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get shops failed:", err);
    return fail(res, err.message || "Failed to fetch shops", err.status || 500);
  }
}

export async function getActivePlansController(req, res) {
  try {
    const result = await service.getActivePlans();

    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get plans failed:", err);
    return fail(res, err.message || "Failed to fetch plans", err.status || 500);
  }
}

export async function getCAdminRolesController(req, res) {
  try {
    const result = await service.getCAdminRoles(); //  Add await
    return success(res, result);
  } catch (err) {
    console.error("[Email Broadcast Controller] Get CAdmin roles failed:", err);
    return fail(
      res,
      err.message || "Failed to fetch CAdmin roles",
      err.status || 500,
    );
  }
}

// ============================================
// FILE UPLOAD - INLINE IMAGE
// ============================================

export async function uploadInlineImageController(req, res) {
  try {
    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    const { buffer, originalname, mimetype, size } = req.file;

    // Verify it's an image
    if (!isImageFile(mimetype)) {
      return fail(res, "Only image files are allowed for inline images", 400);
    }

    //  NEW: Upload using fileStorage service
    const uploadResult = await fileStorage.uploadFile({
      buffer,
      folder: FOLDER,
      originalName: originalname,
      mimetype,
      size,
    });

    const url = fileStorage.getPublicUrl({
      folder: FOLDER,
      filename: uploadResult.storage_key,
    });

    return success(
      res,
      {
        filename: uploadResult.storage_key,
        original_name: originalname,
        mime_type: mimetype,
        size,
        size_formatted: fileStorage.formatFileSize(size),
        url,
        type: "inline_image",
      },
      "Image uploaded successfully",
    );
  } catch (err) {
    console.error(
      "[Email Broadcast Controller] Upload inline image failed:",
      err,
    );
    return fail(res, err.message || "Failed to upload image", 500);
  }
}

// ============================================
// FILE UPLOAD - ATTACHMENT
// ============================================

export async function uploadAttachmentController(req, res) {
  try {
    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    const { buffer, originalname, mimetype, size } = req.file;

    //  NEW: Upload using fileStorage service
    const uploadResult = await fileStorage.uploadFile({
      buffer,
      folder: FOLDER,
      originalName: originalname,
      mimetype,
      size,
    });

    const url = fileStorage.getPublicUrl({
      folder: FOLDER,
      filename: uploadResult.storage_key,
    });

    return success(
      res,
      {
        filename: uploadResult.storage_key,
        original_name: originalname,
        mime_type: mimetype,
        size,
        size_formatted: fileStorage.formatFileSize(size),
        url,
        type: isImageFile(mimetype) ? "image" : "file",
      },
      "File uploaded successfully",
    );
  } catch (err) {
    console.error(
      "[Email Broadcast Controller] Upload attachment failed:",
      err,
    );
    return fail(res, err.message || "Failed to upload file", 500);
  }
}

// ============================================
// DELETE ATTACHMENT
// ============================================

export async function deleteAttachmentController(req, res) {
  try {
    const { filename } = req.params;

    if (!filename) {
      return fail(res, "Filename is required", 400);
    }

    // Security: Validate filename format
    const safeFilenameRegex = /^email-\d+-[a-z0-9]+\.[a-z0-9]+$/i;
    if (!safeFilenameRegex.test(filename)) {
      return fail(res, "Invalid filename format", 400);
    }

    //  NEW: Check if file exists using fileStorage
    const exists = await fileStorage.fileExists({ folder: FOLDER, filename });

    if (!exists) {
      return success(res, { deleted: true, filename }, "File already deleted");
    }

    //  NEW: Delete using fileStorage
    await fileStorage.deleteFile({ folder: FOLDER, filename });

    return success(
      res,
      {
        deleted: true,
        filename,
      },
      "File deleted successfully",
    );
  } catch (err) {
    console.error(
      "[Email Broadcast Controller] Delete attachment failed:",
      err,
    );
    return fail(res, err.message || "Failed to delete file", 500);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if file is an image
 */
function isImageFile(mimetype) {
  return mimetype.startsWith("image/");
}

// ============================================
// MULTER ERROR HANDLER MIDDLEWARE
// ============================================

export function handleMulterError(err, req, res, next) {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return fail(res, "File too large. Maximum size is 10MB.", 400);
    }
    if (err.code === "INVALID_FILE_TYPE" || err.code === "INVALID_MIME_TYPE") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BLOCKED_EXTENSION") {
      return fail(res, err.message, 400);
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return fail(res, "Too many files. Maximum is 6 files.", 400);
    }
    return fail(res, err.message || "File upload failed", 400);
  }
  next();
}

export default {
  previewRecipientCountController,
  createDraftController,
  updateDraftController,
  scheduleCampaignController,
  sendImmediateController,
  sendTestEmailController,
  cancelCampaignController,
  deleteDraftController,
  getDraftsController,
  getScheduledController,
  getHistoryController,
  getCampaignByIdController,
  getQuotaStatusController,
  getShopsForFilterController,
  getActivePlansController,
  getCAdminRolesController,
  uploadInlineImageController,
  uploadAttachmentController,
  deleteAttachmentController,
  handleMulterError,
};
