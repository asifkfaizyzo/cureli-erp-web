// backend/src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.service.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.service.js
//
// Cadmin → Mobile Customer push broadcast service.
// Separate from cadminInAppBroadcast.service.js which targets ERP users.
//
// Audience resolution for mobile broadcasts queries CureliMobileUser
// directly — NOT the ERP User table.

import prisma from '../../../../config/prisma.js';
import { sendPushToMany } from '../../../mobile/push/mobile.push.service.js';
import * as audit from '../../../audit/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'promotions',
  'prescription_updates',
  'system_messages',
  'cart_abandonment',
];

// order_updates is excluded from broadcast —
// those are system-generated per-order, not cadmin-sent

const VALID_TAP_SCREENS = [
  'home',
  'cart',
  'product',
  'category',
  'prescription_upload',
];

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function validateCategory(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw createError(
      `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    );
  }
}

function validateTapScreen(screen) {
  if (screen && !VALID_TAP_SCREENS.includes(screen)) {
    throw createError(
      `Invalid tap_action. Must be one of: ${VALID_TAP_SCREENS.join(', ')}`,
    );
  }
}

function validateContent(title, body) {
  if (!title?.trim() || title.trim().length < 3) {
    throw createError('Title must be at least 3 characters');
  }
  if (title.trim().length > 200) {
    throw createError('Title must not exceed 200 characters');
  }
  if (!body?.trim() || body.trim().length < 10) {
    throw createError('Body must be at least 10 characters');
  }
  if (body.trim().length > 500) {
    throw createError('Body must not exceed 500 characters');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIENCE RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the target user IDs for a mobile broadcast.
 *
 * Filters accepted:
 *   target_all       boolean  — send to all active users (overrides everything)
 *   user_ids         string[] — specific user IDs
 *   registered_from  string   — ISO date, users registered after this date
 *   registered_to    string   — ISO date, users registered before this date
 *   has_orders       boolean  — only users who have placed at least one order
 *
 * @param {Object} filters
 * @returns {Promise<string[]>} array of CureliMobileUser IDs
 */
async function resolveMobileAudience(filters = {}) {
  const {
    target_all      = true,
    user_ids,
    registered_from,
    registered_to,
    has_orders,
  } = filters;

  // ── Specific user IDs ─────────────────────────────────────────────────────
  if (!target_all && Array.isArray(user_ids) && user_ids.length > 0) {
    // Validate that these users exist and are active
    const users = await prisma.cureliMobileUser.findMany({
      where: {
        id:         { in: user_ids },
        status:     'active',
        deleted_at: null,
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  // ── Filter-based resolution ───────────────────────────────────────────────
  const where = {
    status:     'active',
    deleted_at: null,
    // Must have phone verified to have a real account
    phone_verified: true,
  };

  // Registration date range
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

  // Has placed at least one order
  if (has_orders === true) {
    where.marketplaceOrders = { some: {} };
  }

  const users = await prisma.cureliMobileUser.findMany({
    where,
    select: { id: true },
  });

  return users.map((u) => u.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW AUDIENCE COUNT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Preview how many mobile users would receive a broadcast
 * with the given filters. Does NOT send anything.
 *
 * @param {Object} filters
 * @returns {Promise<{ total: number, with_push_token: number }>}
 */
export async function previewMobileAudience(filters = {}) {
  const userIds = await resolveMobileAudience(filters);

  if (userIds.length === 0) {
    return { total: 0, with_push_token: 0 };
  }

  // Count how many of these users have an active push token
  const withToken = await prisma.cureliMobileSession.count({
    where: {
      user_id:    { in: userIds },
      is_active:  true,
      push_token: { not: null },
      expires_at: { gt: new Date() },
    },
  });

  // Deduplicate — one user may have multiple sessions with tokens
  // We approximate: count distinct users with at least one token
  const usersWithToken = await prisma.cureliMobileSession.groupBy({
    by:    ['user_id'],
    where: {
      user_id:    { in: userIds },
      is_active:  true,
      push_token: { not: null },
      expires_at: { gt: new Date() },
    },
  });

  return {
    total:           userIds.length,
    with_push_token: usersWithToken.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND IMMEDIATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a mobile push broadcast immediately.
 *
 * @param {Object} data
 * @param {Object} auditContext
 */
export async function sendMobileBroadcastNow(data, auditContext = {}) {
  const {
    title,
    body,
    category       = 'promotions',
    tap_action     = 'home',
    tap_params     = {},
    audience_filters = {},
  } = data;

  // ── Validate ──────────────────────────────────────────────────────────────
  validateContent(title, body);
  validateCategory(category);
  validateTapScreen(tap_action);

  // ── Resolve audience ──────────────────────────────────────────────────────
  const userIds = await resolveMobileAudience(audience_filters);

  if (userIds.length === 0) {
    throw createError('No eligible recipients found for the selected filters');
  }

  // ── Create campaign record ────────────────────────────────────────────────
  const campaign = await prisma.cureliMobileBroadcastCampaign.create({
    data: {
      title:             title.trim(),
      body:              body.trim(),
      category,
      tap_action,
      tap_params:        Object.keys(tap_params).length > 0 ? tap_params : null,
      target_all:        audience_filters.target_all !== false,
      target_user_ids:   audience_filters.target_all === false
        ? userIds
        : [],
      audience_filters,
      status:            'sending',
      targeted_count:    userIds.length,
      created_by_cadmin: auditContext.actor_id,
      cadmin_name:       auditContext.actor_name || 'CAdmin',
    },
  });

  // ── Send push notifications ───────────────────────────────────────────────
  const tapData = {
    screen: tap_action,
    ...tap_params,
  };

  let result;
  try {
    result = await sendPushToMany({
      userIds,
      title:      title.trim(),
      body:       body.trim(),
      category,
      data:       tapData,
      campaignId: campaign.id,
    });
  } catch (err) {
    // Mark campaign as failed
    await prisma.cureliMobileBroadcastCampaign.update({
      where: { id: campaign.id },
      data:  { status: 'failed' },
    });
    throw err;
  }

  // ── Update campaign with results ──────────────────────────────────────────
  await prisma.cureliMobileBroadcastCampaign.update({
    where: { id: campaign.id },
    data: {
      status:      'sent',
      sent_at:     new Date(),
      sent_count:  result.pushed,
      failed_count: result.failed,
    },
  });

  // ── Audit ─────────────────────────────────────────────────────────────────
  audit.log({
    action:      audit.AuditAction.BROADCAST_SENT,
    entity_type: audit.EntityType.SYSTEM,
    entity_id:   campaign.id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      broadcast_type:  'mobile_push',
      title,
      category,
      targeted_count:  userIds.length,
      pushed:          result.pushed,
      failed:          result.failed,
    },
  }).catch((err) =>
    console.error('[MobileBroadcast] Audit log failed:', err.message),
  );

  return {
    campaign_id:    campaign.id,
    targeted:       userIds.length,
    pushed:         result.pushed,
    failed:         result.failed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE DRAFT
// ─────────────────────────────────────────────────────────────────────────────

export async function createMobileBroadcastDraft(data, auditContext = {}) {
  const {
    title,
    body,
    category         = 'promotions',
    tap_action       = 'home',
    tap_params       = {},
    audience_filters = {},
  } = data;

  validateContent(title, body);
  validateCategory(category);
  validateTapScreen(tap_action);

  // Preview audience count for the draft record
  const preview = await previewMobileAudience(audience_filters);

  const campaign = await prisma.cureliMobileBroadcastCampaign.create({
    data: {
      title:             title.trim(),
      body:              body.trim(),
      category,
      tap_action,
      tap_params:        Object.keys(tap_params).length > 0 ? tap_params : null,
      target_all:        audience_filters.target_all !== false,
      target_user_ids:   [],
      audience_filters,
      status:            'draft',
      targeted_count:    preview.total,
      created_by_cadmin: auditContext.actor_id,
      cadmin_name:       auditContext.actor_name || 'CAdmin',
    },
  });

  return formatCampaign(campaign);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE DRAFT
// ─────────────────────────────────────────────────────────────────────────────

export async function updateMobileBroadcastDraft(campaignId, data, auditContext = {}) {
  const existing = await prisma.cureliMobileBroadcastCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!existing) throw createError('Campaign not found', 404);
  if (existing.status !== 'draft') {
    throw createError('Only draft campaigns can be edited');
  }

  const updateData = {};

  if (data.title !== undefined) {
    if (data.title.trim().length < 3) throw createError('Title must be at least 3 characters');
    updateData.title = data.title.trim();
  }
  if (data.body !== undefined) {
    if (data.body.trim().length < 10) throw createError('Body must be at least 10 characters');
    updateData.body = data.body.trim();
  }
  if (data.category !== undefined) {
    validateCategory(data.category);
    updateData.category = data.category;
  }
  if (data.tap_action !== undefined) {
    validateTapScreen(data.tap_action);
    updateData.tap_action = data.tap_action;
  }
  if (data.tap_params !== undefined) {
    updateData.tap_params = data.tap_params;
  }
  if (data.audience_filters !== undefined) {
    const preview = await previewMobileAudience(data.audience_filters);
    updateData.audience_filters  = data.audience_filters;
    updateData.targeted_count    = preview.total;
    updateData.target_all        = data.audience_filters.target_all !== false;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError('No fields to update');
  }

  const updated = await prisma.cureliMobileBroadcastCampaign.update({
    where: { id: campaignId },
    data:  updateData,
  });

  return formatCampaign(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

export async function scheduleMobileBroadcast(campaignId, scheduledFor, auditContext = {}) {
  const existing = await prisma.cureliMobileBroadcastCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!existing) throw createError('Campaign not found', 404);
  if (existing.status !== 'draft') {
    throw createError('Only draft campaigns can be scheduled');
  }

  const scheduleTime = new Date(scheduledFor);
  if (isNaN(scheduleTime.getTime())) throw createError('Invalid scheduled_for date');
  if (scheduleTime <= new Date()) throw createError('Scheduled time must be in the future');

  const updated = await prisma.cureliMobileBroadcastCampaign.update({
    where: { id: campaignId },
    data: {
      status:        'scheduled',
      scheduled_for: scheduleTime,
    },
  });

  audit.log({
    action:      audit.AuditAction.BROADCAST_SCHEDULED,
    entity_type: audit.EntityType.SYSTEM,
    entity_id:   campaignId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      broadcast_type: 'mobile_push',
      title:          existing.title,
      scheduled_for:  scheduledFor,
    },
  }).catch(console.error);

  return formatCampaign(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND SCHEDULED (called by cron)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendScheduledMobileBroadcast(campaignId) {
  const campaign = await prisma.cureliMobileBroadcastCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw createError('Campaign not found', 404);
  if (campaign.status !== 'scheduled') throw createError('Campaign is not scheduled');

  // Mark as sending to prevent double-fire
  await prisma.cureliMobileBroadcastCampaign.update({
    where: { id: campaignId },
    data:  { status: 'sending' },
  });

  const userIds = await resolveMobileAudience(campaign.audience_filters ?? {});

  if (userIds.length === 0) {
    await prisma.cureliMobileBroadcastCampaign.update({
      where: { id: campaignId },
      data:  { status: 'sent', sent_at: new Date(), sent_count: 0 },
    });
    return { pushed: 0, failed: 0, targeted: 0 };
  }

  const tapData = {
    screen: campaign.tap_action,
    ...(campaign.tap_params ?? {}),
  };

  const result = await sendPushToMany({
    userIds,
    title:      campaign.title,
    body:       campaign.body,
    category:   campaign.category,
    data:       tapData,
    campaignId: campaign.id,
  });

  await prisma.cureliMobileBroadcastCampaign.update({
    where: { id: campaignId },
    data: {
      status:         'sent',
      sent_at:        new Date(),
      targeted_count: userIds.length,
      sent_count:     result.pushed,
      failed_count:   result.failed,
    },
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL / DELETE
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelOrDeleteMobileCampaign(campaignId, auditContext = {}) {
  const campaign = await prisma.cureliMobileBroadcastCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw createError('Campaign not found', 404);
  if (campaign.status === 'sent') throw createError('Cannot delete a sent campaign');
  if (campaign.status === 'sending') throw createError('Campaign is currently sending');

  if (campaign.status === 'scheduled') {
    const updated = await prisma.cureliMobileBroadcastCampaign.update({
      where: { id: campaignId },
      data:  { status: 'cancelled' },
    });
    return { campaign_id: campaignId, status: 'cancelled', message: 'Scheduled campaign cancelled' };
  }

  // Draft — hard delete
  await prisma.cureliMobileBroadcastCampaign.delete({
    where: { id: campaignId },
  });

  return { campaign_id: campaignId, message: 'Draft deleted' };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMobileBroadcastDrafts(cadminId, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    prisma.cureliMobileBroadcastCampaign.findMany({
      where:   { created_by_cadmin: cadminId, status: 'draft' },
      orderBy: { updated_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.cureliMobileBroadcastCampaign.count({
      where: { created_by_cadmin: cadminId, status: 'draft' },
    }),
  ]);

  return {
    drafts:     drafts.map(formatCampaign),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getMobileBroadcastScheduled(pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const [scheduled, total] = await Promise.all([
    prisma.cureliMobileBroadcastCampaign.findMany({
      where:   { status: 'scheduled' },
      orderBy: { scheduled_for: 'asc' },
      skip,
      take: limit,
    }),
    prisma.cureliMobileBroadcastCampaign.count({ where: { status: 'scheduled' } }),
  ]);

  return {
    scheduled:  scheduled.map(formatCampaign),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getMobileBroadcastHistory(pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.cureliMobileBroadcastCampaign.findMany({
      where:   { status: { in: ['sent', 'failed', 'cancelled'] } },
      orderBy: { sent_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.cureliMobileBroadcastCampaign.count({
      where: { status: { in: ['sent', 'failed', 'cancelled'] } },
    }),
  ]);

  return {
    history:    campaigns.map(formatCampaign),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function getMobileBroadcastById(campaignId) {
  const campaign = await prisma.cureliMobileBroadcastCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw createError('Campaign not found', 404);
  return formatCampaign(campaign);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTER
// ─────────────────────────────────────────────────────────────────────────────

function formatCampaign(c) {
  return {
    campaign_id:     c.id,
    title:           c.title,
    body:            c.body,
    category:        c.category,
    tap_action:      c.tap_action,
    tap_params:      c.tap_params,
    target_all:      c.target_all,
    audience_filters: c.audience_filters,
    status:          c.status,
    scheduled_for:   c.scheduled_for,
    sent_at:         c.sent_at,
    targeted_count:  c.targeted_count,
    sent_count:      c.sent_count,
    delivered_count: c.delivered_count,
    failed_count:    c.failed_count,
    cadmin_name:     c.cadmin_name,
    created_at:      c.created_at,
    updated_at:      c.updated_at,
  };
}