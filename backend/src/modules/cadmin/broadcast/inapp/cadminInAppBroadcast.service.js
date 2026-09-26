// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.service.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.service.js

import prisma from "../../../../config/prisma.js";
import { Prisma } from "@prisma/client";
import { notify, NOTIFICATION_EVENTS } from "../../../notifications/index.js";
import { resolveAudience } from "../../../notifications/notification.rules.js";
import * as fileStorage from "../../../../services/fileStorage.service.js";
import * as audit from "../../../../modules/audit/index.js";

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Count notifications linked to a broadcast campaign via context->>'campaign_id'.
 * Uses Prisma.sql tagged template (imported from @prisma/client, NOT from the prisma instance).
 * context column is jsonb in PostgreSQL so ->> operator works correctly.
 */
async function countNotificationsByCampaign(campaignId, readOnly = false) {
  try {
    let result;

    if (readOnly) {
      result = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM notifications
        WHERE context->>'campaign_id' = ${campaignId}
        AND is_read = true
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM notifications
        WHERE context->>'campaign_id' = ${campaignId}
      `;
    }

    // BigInt returned by COUNT — convert to Number
    return Number(result[0]?.count ?? 0);
  } catch (err) {
    console.error(
      "[Broadcast] countNotificationsByCampaign failed:",
      err.message,
    );
    return 0;
  }
}

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function validatePriority(priority) {
  const allowed = ["low", "normal", "high", "critical"];
  return allowed.includes(priority) ? priority : "normal";
}

function validateAttachments(attachments) {
  if (!attachments || !Array.isArray(attachments)) return [];

  const validTypes = ["link", "image", "video"];
  const maxAttachments = 1;

  return attachments
    .filter(
      (att) => validTypes.includes(att.type) && (att.url || att.storage_key),
    )
    .slice(0, maxAttachments)
    .map((att) => {
      if (att.type === "link") {
        return {
          type: "LINK",
          link_url: att.url.trim(),
          link_label: att.label?.trim() || null,
        };
      }
      const filename =
        att.storage_key || (att.url ? att.url.split("/").pop() : null);
      return {
        type: att.type.toUpperCase(),
        storage_key: filename,
        original_name: att.original_name || filename,
        mime_type:
          att.mime_type || (att.type === "image" ? "image/jpeg" : "video/mp4"),
        file_size: att.size || att.file_size || 0,
      };
    });
}

function formatAttachmentsForAPI(attachments) {
  if (!attachments || attachments.length === 0) return [];

  return attachments
    .map((att) => {
      const attType = att.attachment_type || att.type;

      if (!attType) {
        console.warn("[Broadcast] Attachment missing type, skipping:", att);
        return null;
      }

      if (attType === "LINK") {
        return {
          type: "link",
          url: att.link_url,
          label: att.link_label,
        };
      }

      return {
        type: attType.toLowerCase(),
        url: fileStorage.getPublicUrl({
          folder: "broadcast_attachments",
          filename: att.storage_key,
        }),
        storage_key: att.storage_key,
        mime_type: att.mime_type,
        file_size: att.file_size,
      };
    })
    .filter(Boolean);
}

function validateFilters(filters) {
  if (!filters || typeof filters !== "object") {
    throw createError("target_filters must be an object");
  }

  const {
    shop_ids,
    plan_ids,
    roles,
    registration_date_from,
    registration_date_to,
  } = filters;

  if (
    shop_ids !== undefined &&
    (!Array.isArray(shop_ids) || shop_ids.length === 0)
  ) {
    throw createError("shop_ids must be a non-empty array");
  }
  if (
    plan_ids !== undefined &&
    (!Array.isArray(plan_ids) || plan_ids.length === 0)
  ) {
    throw createError("plan_ids must be a non-empty array");
  }
  if (roles !== undefined && (!Array.isArray(roles) || roles.length === 0)) {
    throw createError("roles must be a non-empty array");
  }
  if (registration_date_from && isNaN(Date.parse(registration_date_from))) {
    throw createError("registration_date_from must be a valid date");
  }
  if (registration_date_to && isNaN(Date.parse(registration_date_to))) {
    throw createError("registration_date_to must be a valid date");
  }

  return filters;
}

function extractAudienceFlags(rawFilters, topLevelUsers, topLevelCAdmins) {
  const {
    includeUsers: filtersIncludeUsers,
    includeCAdmins: filtersIncludeCAdmins,
    ...cleanFilters
  } = rawFilters || {};

  const includeUsers = topLevelUsers ?? filtersIncludeUsers ?? true;
  const includeCAdmins = topLevelCAdmins ?? filtersIncludeCAdmins ?? false;

  return { cleanFilters, includeUsers, includeCAdmins };
}

// ============================================
// PREVIEW
// ============================================

export async function previewRecipientCount(filters, includeDetails = false) {
  try {
    const {
      includeUsers = true,
      includeCAdmins = false,
      ...rest
    } = filters || {};

    validateFilters(rest);

    const audienceFilters = { ...rest, includeUsers, includeCAdmins };

   

    const recipients = await resolveAudience(
      NOTIFICATION_EVENTS.BROADCAST_INAPP,
      {},
      audienceFilters,
    );

   

    const shopIds = [
      ...new Set(recipients.filter((r) => r.shop_id).map((r) => r.shop_id)),
    ];
    let shopDetails = {};

    if (shopIds.length > 0 && includeDetails) {
      const shops = await prisma.shop.findMany({
        where: { shop_id: { in: shopIds } },
        select: { shop_id: true, business_name: true },
      });
      shops.forEach((s) => {
        shopDetails[s.shop_id] = { name: s.business_name, count: 0 };
      });
      recipients.forEach((r) => {
        if (r.shop_id && shopDetails[r.shop_id]) shopDetails[r.shop_id].count++;
      });
    } else {
      recipients.forEach((r) => {
        if (r.shop_id) {
          if (!shopDetails[r.shop_id])
            shopDetails[r.shop_id] = { name: null, count: 0 };
          shopDetails[r.shop_id].count++;
        }
      });
    }

    const byRole = {};
    recipients.forEach((r) => {
      const role = r.role || r.roles?.[0] || "unknown";
      byRole[role] = (byRole[role] || 0) + 1;
    });

    return {
      total: recipients.length,
      by_type: {
        users: recipients.filter((r) => r.type === "user").length,
        cadmins: recipients.filter((r) => r.type === "cadmin").length,
      },
      by_shop: shopDetails,
      by_role: byRole,
      filters_applied: audienceFilters,
    };
  } catch (error) {
    console.error("[Broadcast Service] Preview failed:", error);
    throw error;
  }
}

// ============================================
// SEND IMMEDIATE
// ============================================

export async function sendImmediate(data, auditContext = {}) {
  const {
    title,
    message,
    priority,
    target_filters,
    attachments,
    action_url,
    action_label,
    expires_in_hours,
    target_users = true,
    target_cadmins = false,
  } = data;

  try {
    if (!title?.trim() || title.trim().length < 3)
      throw createError("Title must be at least 3 characters");
    if (!message?.trim() || message.trim().length < 10)
      throw createError("Message must be at least 10 characters");
    if (message.length > 500)
      throw createError("Message must not exceed 500 characters");

    const { cleanFilters, includeUsers, includeCAdmins } = extractAudienceFlags(
      target_filters,
      target_users,
      target_cadmins,
    );

    validateFilters(cleanFilters);

    const validPriority = validatePriority(priority);
    const validatedAttachments = validateAttachments(attachments);
    const expiresAt = expires_in_hours
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
      : null;

    const audienceFilters = { ...cleanFilters, includeUsers, includeCAdmins };

    const recipients = await resolveAudience(
      NOTIFICATION_EVENTS.BROADCAST_INAPP,
      {},
      audienceFilters,
    );

    if (recipients.length === 0) {
      throw createError("No recipients match the selected filters", 400);
    }

   

    // Create campaign FIRST so we have campaign_id to pass into notification context
    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.broadcastCampaign.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          priority: validPriority,
          target_filters: audienceFilters,
          action_url: action_url?.trim() || null,
          action_label: action_label?.trim() || null,
          recipient_count: recipients.length,
          target_users: includeUsers,
          target_cadmins: includeCAdmins,
          expires_at: expiresAt,
          status: "sent",
          sent_at: new Date(),
          created_by_cadmin: auditContext.actor_id,
          cadmin_name: auditContext.actor_name || "CAdmin",
        },
      });

      if (validatedAttachments.length > 0) {
        await tx.broadcastAttachment.createMany({
          data: validatedAttachments.map((att) => ({
            campaign_id: newCampaign.campaign_id,
            attachment_type: att.type,
            storage_key: att.storage_key || null,
            original_name: att.original_name || null,
            mime_type: att.mime_type || null,
            file_size: att.file_size || null,
            link_url: att.link_url || null,
            link_label: att.link_label || null,
          })),
        });
      }

      return newCampaign;
    });

    const result = await notify({
      type: NOTIFICATION_EVENTS.BROADCAST_INAPP,
      context: {
        title: title.trim(),
        message: message.trim(),
        attachments: formatAttachmentsForAPI(validatedAttachments),
        action_url,
        action_label,
        expires_at: expiresAt,
        priority: validPriority,
        campaign_id: campaign.campaign_id, //  links notifications to campaign
      },
      channels: ["inapp"],
      audience: recipients,
      audienceFilters,
    });

    const deliveredCount = result.channels.inapp?.sent || 0;

    await prisma.broadcastCampaign.update({
      where: { campaign_id: campaign.campaign_id },
      data: { delivered_count: deliveredCount },
    });

    audit
      .log({
        action: audit.AuditAction.BROADCAST_SENT,
        entity_type: audit.EntityType.SYSTEM,
        entity_id: campaign.campaign_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          title,
          recipient_count: recipients.length,
          delivered_count: deliveredCount,
          priority: validPriority,
          broadcast_type: "inapp",
          sent_by_cadmin_id: auditContext.actor_id,
        },
      })
      .catch((err) => console.error("[AUDIT] Failed to log inapp send:", err));

    return {
      success: result.success,
      campaign_id: campaign.campaign_id,
      sent_to: recipients.length,
      delivered: deliveredCount,
      failed: result.channels.inapp?.failed || 0,
      by_type: {
        users: recipients.filter((r) => r.type === "user").length,
        cadmins: recipients.filter((r) => r.type === "cadmin").length,
      },
      errors: result.errors,
    };
  } catch (error) {
    console.error("[Broadcast Service] Immediate send failed:", error);
    throw error;
  }
}

// ============================================
// CREATE DRAFT
// ============================================

export async function createDraft(data, auditContext = {}) {
  const {
    title,
    message,
    priority,
    target_filters,
    attachments,
    action_url,
    action_label,
    expires_in_hours,
    target_users = true,
    target_cadmins = false,
  } = data;

  try {
    if (!title?.trim() || title.trim().length < 3)
      throw createError("Title must be at least 3 characters");
    if (!message?.trim() || message.trim().length < 10)
      throw createError("Message must be at least 10 characters");
    if (message.length > 500)
      throw createError("Message must not exceed 500 characters");

    const { cleanFilters, includeUsers, includeCAdmins } = extractAudienceFlags(
      target_filters,
      target_users,
      target_cadmins,
    );

    validateFilters(cleanFilters);

    const validPriority = validatePriority(priority);
    const validatedAttachments = validateAttachments(attachments);
    const audienceFilters = { ...cleanFilters, includeUsers, includeCAdmins };

    const preview = await previewRecipientCount(audienceFilters);

    const expiresAt = expires_in_hours
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
      : null;

    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.broadcastCampaign.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          priority: validPriority,
          target_filters: audienceFilters,
          action_url: action_url?.trim() || null,
          action_label: action_label?.trim() || null,
          recipient_count: preview.total,
          target_users: includeUsers,
          target_cadmins: includeCAdmins,
          expires_at: expiresAt,
          status: "draft",
          created_by_cadmin: auditContext.actor_id,
          cadmin_name: auditContext.actor_name || "CAdmin",
        },
      });

      if (validatedAttachments.length > 0) {
        await tx.broadcastAttachment.createMany({
          data: validatedAttachments.map((att) => ({
            campaign_id: newCampaign.campaign_id,
            attachment_type: att.type,
            storage_key: att.storage_key || null,
            original_name: att.original_name || null,
            mime_type: att.mime_type || null,
            file_size: att.file_size || null,
            link_url: att.link_url || null,
            link_label: att.link_label || null,
          })),
        });
      }

      return newCampaign;
    });

    audit
      .log({
        action: audit.AuditAction.BROADCAST_CREATED,
        entity_type: audit.EntityType.SYSTEM,
        entity_id: campaign.campaign_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          title: campaign.title,
          recipient_count: preview.total,
          priority: validPriority,
          broadcast_type: "inapp",
          status: "draft",
          created_by_cadmin_id: auditContext.actor_id,
        },
      })
      .catch((err) =>
        console.error("[AUDIT] Failed to log inapp draft creation:", err),
      );

    const campaignWithAttachments = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaign.campaign_id },
      include: { attachmentFiles: true },
    });

    return {
      campaign_id: campaignWithAttachments.campaign_id,
      title: campaignWithAttachments.title,
      message: campaignWithAttachments.message,
      priority: campaignWithAttachments.priority,
      target_filters: campaignWithAttachments.target_filters,
      attachments: formatAttachmentsForAPI(
        campaignWithAttachments.attachmentFiles,
      ),
      recipient_count: campaignWithAttachments.recipient_count,
      status: campaignWithAttachments.status,
      created_at: campaignWithAttachments.created_at,
    };
  } catch (error) {
    console.error("[Broadcast Service] Create draft failed:", error);
    throw error;
  }
}

// ============================================
// UPDATE DRAFT
// ============================================

export async function updateDraft(campaignId, data, auditContext = {}) {
  try {
    const existing = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) throw createError("Campaign not found", 404);
    if (existing.status === "sent")
      throw createError("Cannot edit a sent campaign", 400);
    if (existing.status === "cancelled")
      throw createError("Cannot edit a cancelled campaign", 400);

    const updateData = {};

    if (data.title !== undefined) {
      if (data.title.trim().length < 3)
        throw createError("Title must be at least 3 characters");
      updateData.title = data.title.trim();
    }
    if (data.message !== undefined) {
      if (data.message.trim().length < 10)
        throw createError("Message must be at least 10 characters");
      if (data.message.length > 500)
        throw createError("Message must not exceed 500 characters");
      updateData.message = data.message.trim();
    }
    if (data.priority !== undefined) {
      updateData.priority = validatePriority(data.priority);
    }

    if (data.target_filters !== undefined) {
      const topLevelUsers = data.target_users ?? undefined;
      const topLevelCAdmins = data.target_cadmins ?? undefined;

      const { cleanFilters, includeUsers, includeCAdmins } =
        extractAudienceFlags(
          data.target_filters,
          topLevelUsers,
          topLevelCAdmins,
        );

      validateFilters(cleanFilters);

      const audienceFilters = { ...cleanFilters, includeUsers, includeCAdmins };
      updateData.target_filters = audienceFilters;
      updateData.target_users = includeUsers;
      updateData.target_cadmins = includeCAdmins;

      const preview = await previewRecipientCount(audienceFilters);
      updateData.recipient_count = preview.total;
    }

    if (Object.keys(updateData).length === 0) {
      throw createError("No fields to update");
    }

    const updated = await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: updateData,
    });

    audit
      .log({
        action: audit.AuditAction.BROADCAST_CREATED,
        entity_type: audit.EntityType.SYSTEM,
        entity_id: campaignId,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: "draft_updated",
          broadcast_type: "inapp",
          changed_fields: Object.keys(updateData),
        },
      })
      .catch((err) =>
        console.error("[AUDIT] Failed to log inapp draft update:", err),
      );

    return {
      campaign_id: updated.campaign_id,
      title: updated.title,
      message: updated.message,
      priority: updated.priority,
      target_filters: updated.target_filters,
      recipient_count: updated.recipient_count,
      status: updated.status,
      scheduled_for: updated.scheduled_for,
      updated_at: updated.updated_at,
    };
  } catch (error) {
    console.error("[Broadcast Service] Update draft failed:", error);
    throw error;
  }
}

// ============================================
// SCHEDULE
// ============================================

export async function scheduleBroadcast(
  campaignId,
  scheduledFor,
  auditContext = {},
) {
  try {
    const existing = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) throw createError("Campaign not found", 404);
    if (existing.status !== "draft")
      throw createError("Only draft campaigns can be scheduled", 400);

    const scheduleTime = new Date(scheduledFor);
    if (isNaN(scheduleTime.getTime()))
      throw createError("Invalid scheduled_for date");
    if (scheduleTime <= new Date())
      throw createError("Scheduled time must be in the future");

    const updated = await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: { status: "scheduled", scheduled_for: scheduleTime },
    });

    audit
      .log({
        action: audit.AuditAction.BROADCAST_SCHEDULED,
        entity_type: audit.EntityType.SYSTEM,
        entity_id: campaignId,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          title: existing.title,
          scheduled_for: scheduledFor,
          recipient_count: existing.recipient_count,
          broadcast_type: "inapp",
        },
      })
      .catch((err) =>
        console.error("[AUDIT] Failed to log inapp schedule:", err),
      );

    return {
      campaign_id: updated.campaign_id,
      title: updated.title,
      status: updated.status,
      scheduled_for: updated.scheduled_for,
      recipient_count: updated.recipient_count,
    };
  } catch (error) {
    console.error("[Broadcast Service] Schedule failed:", error);
    throw error;
  }
}

// ============================================
// SEND SCHEDULED (cron-called)
// ============================================

export async function sendScheduled(campaignId) {
  try {
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) throw createError("Campaign not found", 404);
    if (campaign.status !== "scheduled")
      throw createError("Campaign is not scheduled", 400);

    const recipients = await resolveAudience(
      NOTIFICATION_EVENTS.BROADCAST_INAPP,
      {},
      campaign.target_filters,
    );

    if (recipients.length === 0) {
      console.warn(
        `[Broadcast Service] No recipients for campaign ${campaignId}`,
      );
      await prisma.broadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: { status: "sent", sent_at: new Date(), delivered_count: 0 },
      });
      return { sent: 0, recipients: 0 };
    }

    const result = await notify({
      type: NOTIFICATION_EVENTS.BROADCAST_INAPP,
      context: {
        title: campaign.title,
        message: campaign.message,
        action_url: campaign.action_url,
        action_label: campaign.action_label,
        expires_at: campaign.expires_at,
        priority: campaign.priority,
        campaign_id: campaign.campaign_id, //
      },
      channels: ["inapp"],
      audience: recipients,
      audienceFilters: campaign.target_filters,
    });

    const deliveredCount = result.channels.inapp?.sent || 0;

    await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: "sent",
        sent_at: new Date(),
        delivered_count: deliveredCount,
      },
    });

    const systemContext = audit.buildSystemContext("inapp-broadcast-scheduler");
    audit
      .log({
        action: audit.AuditAction.BROADCAST_SENT,
        entity_type: audit.EntityType.SYSTEM,
        entity_id: campaignId,
        ...systemContext,
        reason_code: audit.AuditReasonCode.AUTOMATION,
        metadata: {
          title: campaign.title,
          recipient_count: recipients.length,
          delivered_count: deliveredCount,
          broadcast_type: "inapp",
          triggered_by: "cron_scheduler",
        },
      })
      .catch((err) =>
        console.error("[AUDIT] Failed to log scheduled inapp send:", err),
      );

    return {
      sent: deliveredCount,
      failed: result.channels.inapp?.failed || 0,
      recipients: recipients.length,
    };
  } catch (error) {
    console.error(
      `[Broadcast Service] Send scheduled ${campaignId} failed:`,
      error,
    );
    await prisma.broadcastCampaign
      .update({
        where: { campaign_id: campaignId },
        data: { status: "cancelled" },
      })
      .catch((e) => console.error("Failed to mark campaign cancelled:", e));
    throw error;
  }
}

// ============================================
// CANCEL OR DELETE
// ============================================

export async function cancelOrDeleteCampaign(campaignId, auditContext = {}) {
  try {
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
      include: {
        attachmentFiles: {
          where: { attachment_type: { in: ["IMAGE", "VIDEO"] } },
        },
      },
    });

    if (!campaign) throw createError("Campaign not found", 404);
    if (campaign.status === "sent")
      throw createError("Cannot delete a sent campaign", 400);

    if (campaign.status === "scheduled") {
      const updated = await prisma.broadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: { status: "cancelled" },
      });

      audit
        .log({
          action: audit.AuditAction.BROADCAST_CANCELLED,
          entity_type: audit.EntityType.SYSTEM,
          entity_id: campaignId,
          ...auditContext,
          reason_code: audit.AuditReasonCode.ADMIN_ACTION,
          metadata: {
            title: campaign.title,
            previous_status: campaign.status,
            broadcast_type: "inapp",
            cancelled_by_cadmin_id: auditContext.actor_id,
          },
        })
        .catch((err) =>
          console.error("[AUDIT] Failed to log inapp cancel:", err),
        );

      return {
        campaign_id: updated.campaign_id,
        status: updated.status,
        message: "Scheduled campaign cancelled successfully",
      };
    }

    if (campaign.attachmentFiles.length > 0) {
      const filesToDelete = campaign.attachmentFiles.map((att) => ({
        folder: "broadcast_attachments",
        filename: att.storage_key,
      }));
      const deleteResult = await fileStorage.deleteFiles(filesToDelete);
      
    }

    await prisma.broadcastCampaign.delete({
      where: { campaign_id: campaignId },
    });

    audit
      .log({
        action: audit.AuditAction.BROADCAST_CANCELLED,
        entity_type: audit.EntityType.SYSTEM,
        entity_id: campaignId,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: "draft_deleted",
          title: campaign.title,
          broadcast_type: "inapp",
          deleted_by_cadmin_id: auditContext.actor_id,
        },
      })
      .catch((err) =>
        console.error("[AUDIT] Failed to log inapp draft delete:", err),
      );

    return {
      campaign_id: campaignId,
      message: "Campaign deleted successfully",
    };
  } catch (error) {
    console.error("[Broadcast Service] Cancel/delete failed:", error);
    throw error;
  }
}

// ============================================
// LIST ENDPOINTS
// ============================================

export async function getDrafts(cadminId, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    prisma.broadcastCampaign.findMany({
      where: { created_by_cadmin: cadminId, status: "draft" },
      include: { attachmentFiles: true },
      orderBy: { updated_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.broadcastCampaign.count({
      where: { created_by_cadmin: cadminId, status: "draft" },
    }),
  ]);

  return {
    drafts: drafts.map((d) => ({
      campaign_id: d.campaign_id,
      title: d.title,
      message: d.message,
      priority: d.priority,
      recipient_count: d.recipient_count,
      target_filters: d.target_filters,
      attachments: formatAttachmentsForAPI(d.attachmentFiles),
      action_url: d.action_url,
      action_label: d.action_label,
      target_users: d.target_users,
      target_cadmins: d.target_cadmins,
      created_at: d.created_at,
      updated_at: d.updated_at,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getScheduled(pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [scheduled, total] = await Promise.all([
    prisma.broadcastCampaign.findMany({
      where: { status: "scheduled" },
      orderBy: { scheduled_for: "asc" },
      skip,
      take: limit,
      select: {
        campaign_id: true,
        title: true,
        message: true,
        priority: true,
        recipient_count: true,
        scheduled_for: true,
        cadmin_name: true,
        created_at: true,
      },
    }),
    prisma.broadcastCampaign.count({ where: { status: "scheduled" } }),
  ]);

  return {
    scheduled,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getHistory(pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.broadcastCampaign.findMany({
      where: { status: "sent" },
      orderBy: { sent_at: "desc" },
      skip,
      take: limit,
      select: {
        campaign_id: true,
        title: true,
        message: true,
        priority: true,
        recipient_count: true,
        delivered_count: true,
        sent_at: true,
        cadmin_name: true,
      },
    }),
    prisma.broadcastCampaign.count({ where: { status: "sent" } }),
  ]);

  const enriched = await Promise.all(
    campaigns.map(async (campaign) => {
      //  Exactly two items in Promise.all — no leftover calls
      const [totalDelivered, readCount] = await Promise.all([
        countNotificationsByCampaign(campaign.campaign_id, false),
        countNotificationsByCampaign(campaign.campaign_id, true),
      ]);

      const delivered =
        totalDelivered > 0 ? totalDelivered : campaign.delivered_count || 0;

      return {
        ...campaign,
        delivered_count: delivered,
        read_count: readCount,
        read_rate:
          delivered > 0 ? ((readCount / delivered) * 100).toFixed(1) : "0.0",
      };
    }),
  );

  return {
    history: enriched,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getCampaignById(campaignId) {
  const campaign = await prisma.broadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
    include: { attachmentFiles: true },
  });

  if (!campaign) throw createError("Campaign not found", 404);

  const [totalDelivered, readCount] = await Promise.all([
    countNotificationsByCampaign(campaignId, false),
    countNotificationsByCampaign(campaignId, true),
  ]);

  const delivered =
    totalDelivered > 0 ? totalDelivered : campaign.delivered_count || 0;

  return {
    ...campaign,
    attachments: formatAttachmentsForAPI(campaign.attachmentFiles),
    delivered_count: delivered,
    read_count: readCount,
    read_rate:
      delivered > 0 ? ((readCount / delivered) * 100).toFixed(1) : "0.0",
  };
}

// ============================================
// FILTER HELPERS
// ============================================

export async function getShopsForFilter(search = "", page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const where = { verification_status: "verified", is_active: true };

  if (search) {
    where.OR = [
      { business_name: { contains: search, mode: "insensitive" } },
      { legal_name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      select: {
        shop_id: true,
        business_name: true,
        city: true,
        _count: { select: { users: true } },
      },
      orderBy: { business_name: "asc" },
      skip,
      take: limit,
    }),
    prisma.shop.count({ where }),
  ]);

  return {
    shops: shops.map((s) => ({
      shop_id: s.shop_id,
      business_name: s.business_name,
      city: s.city,
      user_count: s._count.users,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getUserRoles() {
  const roles = await prisma.user.groupBy({
    by: ["role"],
    where: { is_active: true },
    _count: { role: true },
  });

  return roles.map((r) => ({
    value: r.role,
    label: formatRoleName(r.role),
    count: r._count.role,
  }));
}

function formatRoleName(role) {
  const map = {
    super_admin: "Super Admin",
    branch_admin: "Branch Admin",
    staff: "Staff",
    owner: "Owner",
  };
  return (
    map[role] ||
    role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

export async function getCAdminRoles() {
  const roles = await prisma.cAdminCustomRole.findMany({
    where: { is_deleted: false },
    include: {
      assignments: {
        where: { cadmin: { is_active: true } },
        select: { cadmin_id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return roles.map((role) => ({
    value: role.name,
    label: role.name,
    description: role.description || null,
    count: role.assignments.length,
  }));
}

// ============================================
// SEGMENTS
// ============================================

export async function createSegment(data, cadminId) {
  return prisma.broadcastSegment.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim(),
      filters: data.filters,
      created_by_cadmin: cadminId,
    },
  });
}

export async function getSegments(cadminId) {
  return prisma.broadcastSegment.findMany({
    where: { created_by_cadmin: cadminId },
    orderBy: { created_at: "desc" },
  });
}

export async function deleteSegment(segmentId, cadminId) {
  const segment = await prisma.broadcastSegment.findFirst({
    where: { segment_id: segmentId, created_by_cadmin: cadminId },
  });
  if (!segment) throw createError("Segment not found", 404);
  return prisma.broadcastSegment.delete({ where: { segment_id: segmentId } });
}

// ============================================
// TEMPLATES
// ============================================

export async function createTemplate(data, cadminId) {
  return prisma.broadcastTemplate.create({
    data: {
      name: data.name.trim(),
      title: data.title.trim(),
      message: data.message.trim(),
      priority: validatePriority(data.priority),
      attachments: validateAttachments(data.attachments),
      created_by_cadmin: cadminId,
    },
  });
}

export async function getTemplates() {
  return prisma.broadcastTemplate.findMany({
    orderBy: { usage_count: "desc" },
    take: 20,
  });
}

export async function useTemplate(templateId) {
  const template = await prisma.broadcastTemplate.findUnique({
    where: { template_id: templateId },
  });
  if (!template) throw createError("Template not found", 404);

  await prisma.broadcastTemplate.update({
    where: { template_id: templateId },
    data: { usage_count: { increment: 1 } },
  });

  return template;
}
