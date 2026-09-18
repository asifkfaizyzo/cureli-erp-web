// backend/src/modules/cadmin/broadcast/mobile-email/cadminMobileEmailBroadcast.service.js

import prisma from "../../../../config/prisma.js";
import { sendMail } from "../../../../utils/email.js"; // ◄ FIXED: Import sendMail instead of sendEmail
import * as audit from "../../../audit/index.js";

// Helper to wrap plain text with basic Cureli responsive email HTML
function buildCustomerEmailHtml({ subject, messageText, actionUrl, actionLabel, inlineImage }) {
  const formattedBody = messageText.replace(/\n/g, "<br/>");
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #05015A; padding: 24px; text-align: center; color: white; }
          .content { padding: 32px 24px; line-height: 1.6; font-size: 15px; }
          .button-wrap { text-align: center; margin: 28px 0; }
          .button { background: #05015A; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:20px; font-weight:700;">Cureli</h1>
          </div>
          <div class="content">
            <h2 style="margin-top:0; font-size:18px; color:#0f172a;">${subject}</h2>
            ${inlineImage?.url ? `<img src="${inlineImage.url}" alt="Attachment" style="max-width:100%; border-radius:8px; margin:16px 0;" />` : ""}
            <p>${formattedBody}</p>
            ${actionUrl && actionLabel ? `
              <div class="button-wrap">
                <a href="${actionUrl}" class="button" target="_blank">${actionLabel}</a>
              </div>
            ` : ""}
          </div>
          <div class="footer">
            <p style="margin:0;">You are receiving this email because you are a registered Cureli customer.</p>
            <p style="margin:4px 0 0;">© ${new Date().getFullYear()} Cureli. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Resolve target CureliMobileUsers who have valid, verified email addresses
 * and are not unsubscribed.
 */
export async function resolveCustomerAudience(filters = {}) {
  const {
    target_all = true,
    user_ids,
    registered_from,
    registered_to,
    has_orders,
  } = filters;

  const where = {
    status: "active",
    deleted_at: null,
    email: { not: null },
    phone_verified: true,
  };

  if (!target_all && Array.isArray(user_ids) && user_ids.length > 0) {
    where.id = { in: user_ids };
  }

  if (registered_from || registered_to) {
    where.created_at = {};
    if (registered_from) {
      const d = new Date(registered_from);
      if (!isNaN(d)) where.created_at.gte = d;
    }
    if (registered_to) {
      const d = new Date(registered_to);
      if (!isNaN(d)) {
        d.setHours(23, 59, 59, 999);
        where.created_at.lte = d;
      }
    }
  }

  if (has_orders === true) {
    where.marketplaceOrders = { some: {} };
  }

  const users = await prisma.cureliMobileUser.findMany({
    where,
    select: {
      id: true,
      email: true,
      full_name: true,
    },
  });

  // Filter out any unsubscribed emails
  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where: {
      email: { in: users.map((u) => u.email).filter(Boolean) },
    },
    select: { email: true },
  });

  const unsubsSet = new Set(unsubscribed.map((u) => u.email.toLowerCase()));
  const activeRecipients = users.filter(
    (u) => u.email && !unsubsSet.has(u.email.toLowerCase())
  );

  return {
    users: activeRecipients,
    total: users.length,
    unsubscribed_count: unsubscribed.length,
    active_count: activeRecipients.length,
  };
}

export async function previewCustomerAudience(filters = {}) {
  const audience = await resolveCustomerAudience(filters);
  return {
    total: audience.total,
    unsubscribed_count: audience.unsubscribed_count,
    total_after_unsubscribe: audience.active_count,
    by_type: {
      customers: audience.active_count,
    },
  };
}

export async function sendTestEmailToAdmin(data, adminEmail) {
  if (!adminEmail) throw new Error("Admin email not found");

  const html = buildCustomerEmailHtml({
    subject: data.subject,
    messageText: data.message_text,
    actionUrl: data.action_url,
    actionLabel: data.action_label,
    inlineImage: data.inline_image,
  });

  // ◄ FIXED: Pass as positional parameters: to, subject, html
  await sendMail(adminEmail, `[TEST] ${data.subject}`, html);

  return { sent_to: adminEmail };
}

export async function sendCustomerEmailBroadcastNow(data, auditContext = {}) {
  const audience = await resolveCustomerAudience(data.target_filters || {});

  if (audience.users.length === 0) {
    throw new Error("No eligible customer recipients found for selected audience");
  }

  const html = buildCustomerEmailHtml({
    subject: data.subject,
    messageText: data.message_text,
    actionUrl: data.action_url,
    actionLabel: data.action_label,
    inlineImage: data.inline_image,
  });

  // Create Campaign Record in existing EmailBroadcastCampaign table
  const campaign = await prisma.emailBroadcastCampaign.create({
    data: {
      subject: data.subject.trim(),
      body_html: html,
      body_text: data.message_text.trim(),
      from_name: "Cureli Support",
      from_email: process.env.EMAIL_FROM || "no-reply@cureli.in",
      target_filters: {
        ...data.target_filters,
        target_mobile_customers: true,
      },
      target_users: false,
      target_cadmins: false,
      recipient_count: audience.users.length,
      inline_image: data.inline_image || null,
      attachments: data.attachments?.length > 0 ? data.attachments : null,
      action_url: data.action_url || null,
      action_label: data.action_label || null,
      status: "SENT",
      sent_at: new Date(),
      created_by_cadmin: auditContext.actor_id,
      cadmin_name: auditContext.actor_name || "CAdmin",
    },
  });

  // Create Recipient Rows
  await prisma.emailBroadcastRecipient.createMany({
    data: audience.users.map((u) => ({
      campaign_id: campaign.id || campaign.campaign_id,
      email: u.email,
      name: u.full_name || "Customer",
      user_id: u.id,
      status: "DELIVERED",
      sent_at: new Date(),
      delivered_at: new Date(),
    })),
  });

  // Async dispatch email batch
  (async () => {
    let delivered = 0;
    let failed = 0;
    for (const recipient of audience.users) {
      try {
        // ◄ FIXED: Pass as positional parameters: to, subject, html
        await sendMail(recipient.email, data.subject, html);
        delivered++;
      } catch (e) {
        failed++;
        console.error(`[Customer Email] Failed sending to ${recipient.email}:`, e.message);
      }
    }

    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaign.id || campaign.campaign_id },
      data: {
        delivered_count: delivered,
        failed_count: failed,
        completed_at: new Date(),
      },
    });
  })().catch(console.error);

  audit.log({
    action: audit.AuditAction.BROADCAST_SENT,
    entity_type: audit.EntityType.SYSTEM,
    entity_id: campaign.id || campaign.campaign_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      broadcast_type: "customer_email",
      subject: data.subject,
      recipient_count: audience.users.length,
    },
  }).catch(console.error);

  return {
    campaign_id: campaign.id || campaign.campaign_id,
    recipient_count: audience.users.length,
  };
}

export async function createCustomerEmailDraft(data, auditContext = {}) {
  const preview = await previewCustomerAudience(data.target_filters || {});

  const html = buildCustomerEmailHtml({
    subject: data.subject,
    messageText: data.message_text,
    actionUrl: data.action_url,
    actionLabel: data.action_label,
    inlineImage: data.inline_image,
  });

  const campaign = await prisma.emailBroadcastCampaign.create({
    data: {
      subject: data.subject.trim(),
      body_html: html,
      body_text: data.message_text.trim(),
      from_name: "Cureli Support",
      from_email: process.env.EMAIL_FROM || "no-reply@cureli.in",
      target_filters: {
        ...data.target_filters,
        target_mobile_customers: true,
      },
      target_users: false,
      target_cadmins: false,
      recipient_count: preview.total_after_unsubscribe,
      inline_image: data.inline_image || null,
      attachments: data.attachments?.length > 0 ? data.attachments : null,
      action_url: data.action_url || null,
      action_label: data.action_label || null,
      status: "DRAFT",
      created_by_cadmin: auditContext.actor_id,
      cadmin_name: auditContext.actor_name || "CAdmin",
    },
  });

  return campaign;
}

export async function updateCustomerEmailDraft(campaignId, data) {
  const updateData = {};
  if (data.subject !== undefined) updateData.subject = data.subject.trim();
  if (data.message_text !== undefined) updateData.body_text = data.message_text.trim();
  if (data.action_url !== undefined) updateData.action_url = data.action_url || null;
  if (data.action_label !== undefined) updateData.action_label = data.action_label || null;
  if (data.inline_image !== undefined) updateData.inline_image = data.inline_image;
  if (data.attachments !== undefined) updateData.attachments = data.attachments;
  if (data.target_filters !== undefined) {
    updateData.target_filters = {
      ...data.target_filters,
      target_mobile_customers: true,
    };
    const preview = await previewCustomerAudience(data.target_filters);
    updateData.recipient_count = preview.total_after_unsubscribe;
  }

  return prisma.emailBroadcastCampaign.update({
    where: { campaign_id: campaignId },
    data: updateData,
  });
}

export async function deleteCustomerEmailDraft(campaignId) {
  return prisma.emailBroadcastCampaign.delete({
    where: { campaign_id: campaignId },
  });
}

export async function scheduleCustomerEmailCampaign(campaignId, scheduledFor) {
  return prisma.emailBroadcastCampaign.update({
    where: { campaign_id: campaignId },
    data: {
      status: "SCHEDULED",
      scheduled_for: new Date(scheduledFor),
    },
  });
}

export async function getCustomerEmailDrafts(cadminId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    created_by_cadmin: cadminId,
    status: "DRAFT",
    target_filters: { path: ["target_mobile_customers"], equals: true },
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
    drafts: drafts.map(formatCustomerCampaign),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getCustomerEmailScheduled({ page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    status: "SCHEDULED",
    target_filters: { path: ["target_mobile_customers"], equals: true },
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
    scheduled: scheduled.map(formatCustomerCampaign),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getCustomerEmailHistory({ page = 1, limit = 20, search } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    status: { in: ["SENT", "FAILED", "PARTIAL_FAILURE", "CANCELLED"] },
    target_filters: { path: ["target_mobile_customers"], equals: true },
  };

  if (search) {
    where.subject = { contains: search, mode: "insensitive" };
  }

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
    history: history.map(formatCustomerCampaign),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getCustomerEmailCampaignById(campaignId) {
  const campaign = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");
  return formatCustomerCampaign(campaign);
}

function formatCustomerCampaign(c) {
  return {
    campaign_id: c.campaign_id || c.id,
    subject: c.subject,
    message_text: c.body_text,
    message_html: c.body_html,
    from_name: c.from_name,
    from_email: c.from_email,
    target_filters: c.target_filters,
    recipient_count: c.recipient_count,
    delivered_count: c.delivered_count,
    failed_count: c.failed_count,
    delivery_rate:
      c.recipient_count > 0
        ? Math.round((c.delivered_count / c.recipient_count) * 100)
        : 100,
    status: c.status.toLowerCase(),
    scheduled_for: c.scheduled_for,
    sent_at: c.sent_at,
    completed_at: c.completed_at,
    inline_image: c.inline_image,
    attachments: c.attachments,
    action_url: c.action_url,
    action_label: c.action_label,
    cadmin_name: c.cadmin_name,
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}