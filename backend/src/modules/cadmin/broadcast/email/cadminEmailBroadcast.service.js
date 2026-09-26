// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js

import prisma from "../../../../config/prisma.js";
import { mailer } from "../../../../utils/email.js";
import { convertPlainTextToHtml } from "./emailBroadcast.converter.js";
import * as fileStorage from "../../../../services/fileStorage.service.js";
import {
  buildEmailHtml,
  formatAttachmentsForNodemailer,
} from "./emailBroadcast.template.js";
import {
  getRemainingCapacity,
  canSendEmails,
  incrementSentCount,
  shouldPauseSending,
  getNextAvailableTime,
} from "./emailBroadcast.quota.js";
import {
  resolveRecipients,
  previewRecipients,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
} from "./emailBroadcast.recipients.js";
import {
  buildUnsubscribeUrl,
  filterUnsubscribedRecipients,
} from "./emailBroadcast.unsubscribe.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const FOLDER = "email_attachments";

/**
 * SES safe sending parameters
 *
 * SES limit: 14 emails/second
 * We use 10/second to stay well under the limit.
 *
 * BATCH_SIZE  = 10   → send 10 emails per batch
 * BATCH_DELAY = 1000 → wait 1 second between batches
 * Result: 10 emails/second → safe under 14/sec SES limit
 *
 * Within each batch we use Promise.allSettled (parallel within the batch).
 * Nodemailer's connection pool (maxConnections=5, rateLimit=10/sec set in
 * email.js) provides an additional safety layer.
 */
const BATCH_SIZE = 10; // emails per batch
const BATCH_DELAY_MS = 1000; // ms between batches → 10/sec effective rate

const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || "Cureli Health";
const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM_ADDRESS || "info@curelihealth.com";
const DEFAULT_REPLY_TO =
  process.env.EMAIL_REPLY_TO || "support@curelihealth.com";

const CAMPAIGN_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  SENDING: "SENDING",
  PAUSED: "PAUSED",
  SENT: "SENT",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

// ── File helpers ──────────────────────────────────────────────────────────────

async function deleteEmailAttachment(filename) {
  if (!filename) return false;
  try {
    return await fileStorage.deleteFile({ folder: FOLDER, filename });
  } catch (err) {
    console.warn(
      `[Email Broadcast] Failed to delete ${filename}:`,
      err.message,
    );
    return false;
  }
}

async function deleteEmailAttachments(filenames) {
  if (!filenames?.length) return { deleted: 0, failed: 0 };
  const files = filenames
    .filter(Boolean)
    .map((filename) => ({ folder: FOLDER, filename }));
  return fileStorage.deleteFiles(files);
}

async function getEmailAttachmentUrl(filename) {
  if (!filename) return null;
  try {
    return await fileStorage.getSignedUrl({
      folder: FOLDER,
      filename,
      expiresIn: 3600,
    });
  } catch (err) {
    console.warn(
      `[Email Broadcast] Failed to get URL for ${filename}:`,
      err.message,
    );
    return null;
  }
}

async function deleteEmailCampaignFiles(campaignId) {
  const campaign = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
    select: { inline_image: true, attachments: true },
  });

  if (!campaign) return { deleted: 0, failed: 0 };

  const filesToDelete = [];

  if (campaign.inline_image?.filename) {
    filesToDelete.push({
      folder: FOLDER,
      filename: campaign.inline_image.filename,
    });
  }
  if (Array.isArray(campaign.attachments)) {
    campaign.attachments.forEach((att) => {
      if (att?.filename)
        filesToDelete.push({ folder: FOLDER, filename: att.filename });
    });
  }

  if (!filesToDelete.length) return { deleted: 0, failed: 0 };

  return fileStorage.deleteFiles(filesToDelete);
}

// ── Preview ───────────────────────────────────────────────────────────────────

export async function previewRecipientCount(data) {
  const { target_filters, target_users, target_cadmins } = data;

  const preview = await previewRecipients(
    target_filters,
    target_users,
    target_cadmins,
  );
  const quota = await getRemainingCapacity();

  return {
    ...preview,
    quota: {
      remaining: quota.remaining,
      used: quota.used,
      limit: quota.limit,
      can_send_all: quota.remaining >= preview.total_after_unsubscribe,
    },
  };
}

// ── Create Draft ──────────────────────────────────────────────────────────────

export async function createDraft(data, context) {
  const {
    subject,
    message_text,
    target_filters,
    target_users,
    target_cadmins,
    inline_image,
    attachments,
    action_url,
    action_label,
  } = data;

  const body_html = convertPlainTextToHtml(message_text);
  const preview = await previewRecipients(
    target_filters,
    target_users,
    target_cadmins,
  );

  const campaign = await prisma.emailBroadcastCampaign.create({
    data: {
      subject,
      body_html,
      body_text: message_text,
      from_name: DEFAULT_FROM_NAME,
      from_email: DEFAULT_FROM_EMAIL,
      reply_to: DEFAULT_REPLY_TO,
      target_filters: target_filters || {},
      target_users: target_users ?? true,
      target_cadmins: target_cadmins ?? false,
      inline_image: inline_image || null,
      attachments: attachments || [],
      action_url: action_url || null,
      action_label: action_label || null,
      recipient_count: preview.total_after_unsubscribe,
      status: CAMPAIGN_STATUS.DRAFT,
      created_by_cadmin: context.actor_id,
      cadmin_name: context.actor_name,
    },
  });

  return {
    campaign_id: campaign.campaign_id,
    subject: campaign.subject,
    status: campaign.status,
    recipient_count: campaign.recipient_count,
    created_at: campaign.created_at,
  };
}

// ── Update Draft ──────────────────────────────────────────────────────────────

export async function updateDraft(campaignId, data, context) {
  const existing = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!existing) {
    const e = new Error("Campaign not found");
    e.status = 404;
    throw e;
  }

  if (
    ![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(
      existing.status,
    )
  ) {
    const e = new Error(`Cannot edit campaign with status: ${existing.status}`);
    e.status = 400;
    throw e;
  }

  const updateData = {};

  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.message_text !== undefined) {
    updateData.body_text = data.message_text;
    updateData.body_html = convertPlainTextToHtml(data.message_text);
  }
  if (data.target_filters !== undefined)
    updateData.target_filters = data.target_filters;
  if (data.target_users !== undefined)
    updateData.target_users = data.target_users;
  if (data.target_cadmins !== undefined)
    updateData.target_cadmins = data.target_cadmins;
  if (data.action_url !== undefined) updateData.action_url = data.action_url;
  if (data.action_label !== undefined)
    updateData.action_label = data.action_label;

  // Replace inline image — delete old file if it changed
  if (data.inline_image !== undefined) {
    if (
      existing.inline_image?.filename &&
      existing.inline_image.filename !== data.inline_image?.filename
    ) {
      await deleteEmailAttachment(existing.inline_image.filename);
    }
    updateData.inline_image = data.inline_image;
  }

  // Replace attachments — delete removed files
  if (data.attachments !== undefined) {
    const oldFilenames = (existing.attachments || []).map((a) => a.filename);
    const newFilenames = (data.attachments || []).map((a) => a.filename);
    await deleteEmailAttachments(
      oldFilenames.filter((f) => f && !newFilenames.includes(f)),
    );
    updateData.attachments = data.attachments;
  }

  // Recalculate recipient count if audience changed
  const audienceChanged =
    data.target_filters !== undefined ||
    data.target_users !== undefined ||
    data.target_cadmins !== undefined;

  if (audienceChanged) {
    const preview = await previewRecipients(
      updateData.target_filters ?? existing.target_filters,
      updateData.target_users ?? existing.target_users,
      updateData.target_cadmins ?? existing.target_cadmins,
    );
    updateData.recipient_count = preview.total_after_unsubscribe;
  }

  const updated = await prisma.emailBroadcastCampaign.update({
    where: { campaign_id: campaignId },
    data: updateData,
  });

  return {
    campaign_id: updated.campaign_id,
    subject: updated.subject,
    status: updated.status,
    recipient_count: updated.recipient_count,
    updated_at: updated.updated_at,
  };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function scheduleCampaign(campaignId, scheduledFor, context) {
  const existing = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!existing) {
    const e = new Error("Campaign not found");
    e.status = 404;
    throw e;
  }

  if (
    ![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(
      existing.status,
    )
  ) {
    const e = new Error(
      `Cannot schedule campaign with status: ${existing.status}`,
    );
    e.status = 400;
    throw e;
  }

  const scheduledDate = new Date(scheduledFor);
  if (scheduledDate <= new Date()) {
    const e = new Error("Scheduled time must be in the future");
    e.status = 400;
    throw e;
  }

  const updated = await prisma.emailBroadcastCampaign.update({
    where: { campaign_id: campaignId },
    data: { status: CAMPAIGN_STATUS.SCHEDULED, scheduled_for: scheduledDate },
  });

  return {
    campaign_id: updated.campaign_id,
    subject: updated.subject,
    status: updated.status,
    scheduled_for: updated.scheduled_for,
    recipient_count: updated.recipient_count,
  };
}

// ── Send Immediately ──────────────────────────────────────────────────────────

export async function sendImmediate(data, context) {
  const {
    subject,
    message_text,
    target_filters,
    target_users,
    target_cadmins,
    inline_image,
    attachments,
    action_url,
    action_label,
  } = data;

  const body_html = convertPlainTextToHtml(message_text);
  const recipients = await resolveRecipients(
    target_filters,
    target_users,
    target_cadmins,
    true,
  );

  if (recipients.length === 0) {
    const e = new Error("No recipients found for the selected filters");
    e.status = 400;
    throw e;
  }

  // Non-blocking quota check (warn but don't block — campaign handles pausing)
  await canSendEmails(recipients.length);

  const campaign = await prisma.emailBroadcastCampaign.create({
    data: {
      subject,
      body_html,
      body_text: message_text,
      from_name: DEFAULT_FROM_NAME,
      from_email: DEFAULT_FROM_EMAIL,
      reply_to: DEFAULT_REPLY_TO,
      target_filters: target_filters || {},
      target_users: target_users ?? true,
      target_cadmins: target_cadmins ?? false,
      inline_image: inline_image || null,
      attachments: attachments || [],
      action_url: action_url || null,
      action_label: action_label || null,
      recipient_count: recipients.length,
      status: CAMPAIGN_STATUS.SENDING,
      processing: true,
      processing_started_at: new Date(),
      created_by_cadmin: context.actor_id,
      cadmin_name: context.actor_name,
    },
  });

  // Fire and forget — response returns immediately
  processCampaignSending(campaign.campaign_id).catch((err) => {
    console.error(
      `[Email Broadcast] Async sending failed for ${campaign.campaign_id}:`,
      err,
    );
  });

  return {
    campaign_id: campaign.campaign_id,
    status: CAMPAIGN_STATUS.SENDING,
    recipient_count: recipients.length,
    message: "Emails are being sent in the background",
  };
}

// ── Send Test Email ───────────────────────────────────────────────────────────

export async function sendTestEmail(data, context) {
  const {
    subject,
    message_text,
    inline_image,
    attachments,
    action_url,
    action_label,
  } = data;

  const cadmin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: context.actor_id },
    select: { email: true, name: true },
  });

  if (!cadmin?.email) {
    const e = new Error("CAdmin email not found");
    e.status = 400;
    throw e;
  }

  const body_html = convertPlainTextToHtml(message_text);

  // Resolve signed URLs for attachments
  let resolvedInlineImage = inline_image;
  let resolvedAttachments = attachments || [];

  if (inline_image?.filename) {
    const url = await getEmailAttachmentUrl(inline_image.filename);
    resolvedInlineImage = { ...inline_image, url: url || inline_image.url };
  }

  if (resolvedAttachments.length > 0) {
    resolvedAttachments = await Promise.all(
      resolvedAttachments.map(async (att) => {
        if (att?.filename) {
          const url = await getEmailAttachmentUrl(att.filename);
          return { ...att, url: url || att.url };
        }
        return att;
      }),
    );
  }

  const html = buildEmailHtml({
    subject,
    messageHtml: body_html,
    recipientName: cadmin.name,
    inlineImage: resolvedInlineImage,
    attachments: resolvedAttachments,
    actionUrl: action_url,
    actionLabel: action_label,
    unsubscribeUrl: null,
    isTest: true,
  });

  const nodemailerAttachments = formatAttachmentsForNodemailer(
    resolvedInlineImage,
    resolvedAttachments,
  );

  await mailer.sendMail({
    from: `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_EMAIL}>`,
    replyTo: DEFAULT_REPLY_TO,
    to: cadmin.email,
    subject: `[TEST] ${subject}`,
    html,
    attachments: nodemailerAttachments,
  });

  return { success: true, sent_to: cadmin.email };
}

// ── Cancel ────────────────────────────────────────────────────────────────────

export async function cancelCampaign(campaignId, context) {
  const existing = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!existing) {
    const e = new Error("Campaign not found");
    e.status = 404;
    throw e;
  }

  if (
    ![CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.PAUSED].includes(
      existing.status,
    )
  ) {
    const e = new Error(
      `Cannot cancel campaign with status: ${existing.status}`,
    );
    e.status = 400;
    throw e;
  }

  const deleteResult = await deleteEmailCampaignFiles(campaignId);

  const updated = await prisma.emailBroadcastCampaign.update({
    where: { campaign_id: campaignId },
    data: { status: CAMPAIGN_STATUS.CANCELLED, processing: false },
  });

  return {
    campaign_id: updated.campaign_id,
    status: updated.status,
    action: "cancelled",
    files_deleted: deleteResult.deleted,
  };
}

// ── Delete Draft ──────────────────────────────────────────────────────────────

export async function deleteDraft(campaignId, context) {
  const existing = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!existing) {
    const e = new Error("Campaign not found");
    e.status = 404;
    throw e;
  }

  if (existing.status !== CAMPAIGN_STATUS.DRAFT) {
    const e = new Error("Can only delete draft campaigns");
    e.status = 400;
    throw e;
  }

  const deleteResult = await deleteEmailCampaignFiles(campaignId);

  await prisma.emailBroadcastCampaign.delete({
    where: { campaign_id: campaignId },
  });

  return {
    campaign_id: campaignId,
    action: "deleted",
    files_deleted: deleteResult.deleted,
  };
}

// ── List Endpoints ────────────────────────────────────────────────────────────

export async function getDrafts(pagination = {}) {
  const { page = 1, limit = 10, search = "" } = pagination;
  const skip = (page - 1) * limit;
  const where = {
    status: CAMPAIGN_STATUS.DRAFT,
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { cadmin_name: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [drafts, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  return {
    drafts: drafts.map((d) => ({
      ...d,
      message_text: d.body_text,
      message_html: d.body_html,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getScheduled(pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;
  const where = {
    status: { in: [CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.PAUSED] },
  };

  const [scheduled, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { scheduled_for: "asc" },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  return {
    scheduled: scheduled.map((item) => ({
      ...item,
      message_text: item.body_text,
      message_html: item.body_html,
      time_until: item.scheduled_for ? getTimeUntil(item.scheduled_for) : null,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getHistory(pagination = {}) {
  const { page = 1, limit = 10, search = "" } = pagination;
  const skip = (page - 1) * limit;
  const where = {
    status: {
      in: [
        CAMPAIGN_STATUS.SENT,
        CAMPAIGN_STATUS.PARTIAL_FAILURE,
        CAMPAIGN_STATUS.FAILED,
        CAMPAIGN_STATUS.CANCELLED,
      ],
    },
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { cadmin_name: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [history, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { sent_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  return {
    history: history.map((item) => ({
      ...item,
      message_text: item.body_text,
      message_html: item.body_html,
      delivery_rate:
        item.recipient_count > 0
          ? Math.round((item.delivered_count / item.recipient_count) * 100)
          : 0,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getCampaignById(campaignId) {
  const campaign = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!campaign) {
    const e = new Error("Campaign not found");
    e.status = 404;
    throw e;
  }

  // ── Resolve signed URLs for inline image ─────────────────────────────────
  let resolvedInlineImage = campaign.inline_image || null;
  if (resolvedInlineImage?.filename) {
    const url = await getEmailAttachmentUrl(resolvedInlineImage.filename);
    resolvedInlineImage = {
      ...resolvedInlineImage,
      url: url || resolvedInlineImage.url,
    };
  }

  // ── Resolve signed URLs for attachments ──────────────────────────────────
  let resolvedAttachments = campaign.attachments || [];
  if (resolvedAttachments.length > 0) {
    resolvedAttachments = await Promise.all(
      resolvedAttachments.map(async (att) => {
        if (att?.filename) {
          const url = await getEmailAttachmentUrl(att.filename);
          return { ...att, url: url || att.url };
        }
        return att;
      }),
    );
  }

  return {
    ...campaign,
    message_text: campaign.body_text,
    message_html: campaign.body_html,
    inline_image: resolvedInlineImage,
    attachments: resolvedAttachments,
  };
}

// ── Quota Info ────────────────────────────────────────────────────────────────

export async function getQuotaStatus() {
  const capacity = await getRemainingCapacity();

  return {
    date: capacity.date,
    used: capacity.used,
    remaining: capacity.remaining,
    limit: capacity.limit,
    can_send: capacity.canSend,
    usage_percent: Math.round((capacity.used / capacity.limit) * 100),
  };
}

// ── Re-export filter helpers ──────────────────────────────────────────────────

export { getShopsForFilter, getActivePlans, getCAdminRoles };

// ── Core Sending Engine ───────────────────────────────────────────────────────

/**
 * processCampaignSending
 *
 * Sends emails in batches of BATCH_SIZE (10) with BATCH_DELAY_MS (1000ms)
 * between batches. This keeps throughput at ~10 emails/second — safely under
 * SES's 14/second limit.
 *
 * Within each batch, Promise.allSettled sends emails in parallel.
 * Nodemailer's connection pool (set in email.js) queues internally if needed.
 *
 * Pauses automatically when daily quota is exhausted. Cron worker resumes
 * paused campaigns the next day.
 */
export async function processCampaignSending(campaignId) {
 

  try {
    const campaign = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) throw new Error("Campaign not found");

    const allRecipients = await resolveRecipients(
      campaign.target_filters,
      campaign.target_users,
      campaign.target_cadmins,
      true,
    );

    if (allRecipients.length === 0) {
      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          status: CAMPAIGN_STATUS.FAILED,
          processing: false,
          last_error: "No recipients found",
        },
      });
      return;
    }

    const startIndex = campaign.last_processed_index || 0;
    const recipients = allRecipients.slice(startIndex);

    let delivered = campaign.delivered_count || 0;
    let failed = campaign.failed_count || 0;
    let processedIndex = startIndex;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      // ── Quota gate ───────────────────────────────────────────────────────
      const pauseNeeded = await shouldPauseSending();
      if (pauseNeeded) {

        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaignId },
          data: {
            status: CAMPAIGN_STATUS.PAUSED,
            processing: false,
            last_processed_index: processedIndex,
            delivered_count: delivered,
            failed_count: failed,
          },
        });

        return { paused: true, delivered, failed };
      }

      const capacity = await getRemainingCapacity();
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const canSend = Math.min(batch.length, capacity.remaining);

      if (canSend === 0) {
        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaignId },
          data: {
            status: CAMPAIGN_STATUS.PAUSED,
            processing: false,
            last_processed_index: processedIndex,
          },
        });
        return { paused: true, delivered, failed };
      }

      const batchToSend = batch.slice(0, canSend);
      const batchResults = await sendBatch(campaign, batchToSend);

      delivered += batchResults.delivered;
      failed += batchResults.failed;
      processedIndex += batchToSend.length;

      // Increment quota counter AFTER actually sending
      await incrementSentCount(batchToSend.length);

      // Persist progress after every batch
      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          delivered_count: delivered,
          failed_count: failed,
          last_processed_index: processedIndex,
        },
      });

      // ── Rate limit delay ─────────────────────────────────────────────────
      // Wait 1 second before next batch → effective rate: BATCH_SIZE/sec = 10/sec
      if (i + BATCH_SIZE < recipients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // ── Final status ─────────────────────────────────────────────────────────
    const finalStatus =
      delivered === 0
        ? CAMPAIGN_STATUS.FAILED
        : failed > 0
          ? CAMPAIGN_STATUS.PARTIAL_FAILURE
          : CAMPAIGN_STATUS.SENT;

    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: finalStatus,
        processing: false,
        sent_at: new Date(),
        completed_at: new Date(),
        delivered_count: delivered,
        failed_count: failed,
        last_processed_index: processedIndex,
      },
    });

    console.log(
      `[Email Broadcast] Campaign ${campaignId} done: ${delivered} delivered, ${failed} failed`,
    );

    return { delivered, failed, status: finalStatus };
  } catch (error) {
    console.error(`[Email Broadcast] Campaign ${campaignId} failed:`, error);

    await prisma.emailBroadcastCampaign
      .update({
        where: { campaign_id: campaignId },
        data: {
          status: CAMPAIGN_STATUS.FAILED,
          processing: false,
          last_error: error.message,
        },
      })
      .catch(() => {});

    throw error;
  }
}

/**
 * sendBatch — sends a batch of ≤10 emails in parallel using Promise.allSettled.
 * Nodemailer's internal queue and rateLimit setting in email.js act as a second
 * layer of rate enforcement.
 */
async function sendBatch(campaign, recipients) {
  let delivered = 0;
  let failed = 0;

  // Resolve attachment URLs once per batch (signed URLs, 1-hour expiry)
  let resolvedInlineImage = campaign.inline_image;
  let resolvedAttachments = campaign.attachments || [];

  if (campaign.inline_image?.filename) {
    const url = await getEmailAttachmentUrl(campaign.inline_image.filename);
    resolvedInlineImage = {
      ...campaign.inline_image,
      url: url || campaign.inline_image.url,
    };
  }

  if (resolvedAttachments.length > 0) {
    resolvedAttachments = await Promise.all(
      resolvedAttachments.map(async (att) => {
        if (att?.filename) {
          const url = await getEmailAttachmentUrl(att.filename);
          return { ...att, url: url || att.url };
        }
        return att;
      }),
    );
  }

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      try {
        const unsubscribeUrl = buildUnsubscribeUrl(recipient.email);

        // Build fresh CID for each email so images embed correctly per-recipient
        const inlineImageForRecipient = resolvedInlineImage
          ? { ...resolvedInlineImage }
          : null;

        const html = buildEmailHtml({
          subject: campaign.subject,
          messageHtml: campaign.body_html,
          recipientName: recipient.name,
          inlineImage: inlineImageForRecipient,
          attachments: resolvedAttachments,
          actionUrl: campaign.action_url,
          actionLabel: campaign.action_label,
          unsubscribeUrl,
          isTest: false,
        });

        const nodemailerAttachments = formatAttachmentsForNodemailer(
          inlineImageForRecipient,
          resolvedAttachments,
        );

        await mailer.sendMail({
          from: `"${campaign.from_name || DEFAULT_FROM_NAME}"  <${campaign.from_email || DEFAULT_FROM_EMAIL}>`,
          replyTo: campaign.reply_to || DEFAULT_REPLY_TO,
          to: recipient.email,
          subject: campaign.subject,
          html,
          attachments: nodemailerAttachments,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        return { success: true, email: recipient.email };
      } catch (err) {
        console.error(
          `[Email Broadcast] Failed → ${recipient.email}:`,
          err.message,
        );
        return { success: false, email: recipient.email, error: err.message };
      }
    }),
  );

  results.forEach((r) => {
    if (r.status === "fulfilled" && r.value.success) delivered++;
    else failed++;
  });

  return { delivered, failed };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTimeUntil(dateString) {
  const diff = new Date(dateString) - new Date();
  if (diff < 0) return "Sending soon...";

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (hours < 1) return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  if (hours < 24)
    return `in ${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} min`;

  const days = Math.floor(hours / 24);
  return `in ${days} day${days !== 1 ? "s" : ""}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  previewRecipientCount,
  createDraft,
  updateDraft,
  scheduleCampaign,
  sendImmediate,
  sendTestEmail,
  cancelCampaign,
  deleteDraft,
  getDrafts,
  getScheduled,
  getHistory,
  getCampaignById,
  getQuotaStatus,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
  processCampaignSending,
};
