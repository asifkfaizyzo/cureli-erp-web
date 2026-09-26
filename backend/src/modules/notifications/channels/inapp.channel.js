// backend/src/modules/notifications/channels/inapp.channel.js (do not remove this comment)
// ============================================
// backend/src/modules/notifications/channels/inapp.channel.js
// ============================================

import prisma from "../../../config/prisma.js";
import { generateInAppContent } from "../templates/inapp/index.js";
import { EVENT_CONFIG } from "../notification.events.js";
import { sseService } from "../../../services/sse.service.js";

/**
 * Send notifications via in-app channel.
 *
 * Priority resolution order:
 *   1. context.priority  — set by caller (e.g. broadcast with user-chosen priority)
 *   2. eventConfig.priority — static default from EVENT_CONFIG
 *   3. 'normal'          — hard fallback
 */
export async function sendViaInApp(eventType, recipients, context) {
  const result = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (recipients.length === 0) {
    console.log(`[InApp Channel] No recipients for ${eventType}`);
    return result;
  }

  const userRecipients = recipients.filter(
    (r) => r.type === "user" && r.user_id,
  );
  const cadminRecipients = recipients.filter(
    (r) => r.type === "cadmin" && r.cadmin_id,
  );

  console.log(
    `[InApp Channel] Processing ${eventType}: ` +
      `${userRecipients.length} users, ${cadminRecipients.length} cadmins`,
  );

  const eventConfig = EVENT_CONFIG[eventType];
  if (!eventConfig) {
    console.error(`[InApp Channel] Unknown event type: ${eventType}`);
    result.failed = recipients.length;
    result.errors.push({ error: `Unknown event type: ${eventType}` });
    return result;
  }

  const content = generateInAppContent(eventType, context);
  if (!content) {
    console.error(
      `[InApp Channel] Failed to generate content for: ${eventType}`,
    );
    result.failed = recipients.length;
    result.errors.push({ error: `No template for: ${eventType}` });
    return result;
  }

  const { title, message } = content;

  //  KEY FIX: prefer context.priority (caller-supplied) over the static event default
  const priority = context.priority || eventConfig.priority || "normal";

  console.log(
    `[InApp Channel] Priority resolved: "${priority}" ` +
      `(context="${context.priority}", eventConfig="${eventConfig.priority}")`,
  );

  const dedupEntity = eventConfig.dedupEntity;

  if (userRecipients.length > 0) {
    const userResult = await processUserNotifications(
      userRecipients,
      eventType,
      title,
      message,
      priority,
      context,
      dedupEntity,
    );
    result.sent += userResult.sent;
    result.failed += userResult.failed;
    result.skipped += userResult.skipped;
    result.errors.push(...userResult.errors);
  }

  if (cadminRecipients.length > 0) {
    const cadminResult = await processCAdminNotifications(
      cadminRecipients,
      eventType,
      title,
      message,
      priority,
      context,
      dedupEntity,
    );
    result.sent += cadminResult.sent;
    result.failed += cadminResult.failed;
    result.skipped += cadminResult.skipped;
    result.errors.push(...cadminResult.errors);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function processUserNotifications(
  recipients,
  eventType,
  title,
  message,
  priority,
  context,
  dedupEntity,
) {
  const result = { sent: 0, failed: 0, skipped: 0, errors: [] };
  const notifications = [];

  const dedupKey = dedupEntity
    ? buildDedupKey(eventType, dedupEntity, context)
    : null;

  for (const recipient of recipients) {
    try {
      if (
        dedupKey &&
        (await checkUserDuplicateExists(recipient.user_id, dedupKey))
      ) {
        result.skipped++;
        continue;
      }

      notifications.push({
        user_id: recipient.user_id,
        cadmin_id: null,
        event_type: eventType,
        title,
        message,
        context: sanitizeContext(context),
        shop_id: recipient.shop_id || context.shop_id || null,
        branch_id: recipient.branch_id || context.branch_id || null,
        dedup_key: dedupKey,
        priority,
        is_read: false,
      });
    } catch (error) {
      console.error(
        `[InApp Channel] Error preparing notification for user ${recipient.user_id}:`,
        error,
      );
      result.failed++;
      result.errors.push({ user_id: recipient.user_id, error: error.message });
    }
  }

  if (notifications.length > 0) {
    try {
      const created = await prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true,
      });

      result.sent = created.count;
      console.log(
        `[InApp Channel] Created ${created.count} user notifications ` +
          `(priority="${priority}") for ${eventType}`,
      );

      // ── SSE: push real-time update to each connected user ────────────────
      if (created.count > 0) {
        const uniqueUserIds = [...new Set(notifications.map((n) => n.user_id))];

        uniqueUserIds.forEach(async (id) => {
          try {
            const [unreadCount, latest] = await Promise.all([
              prisma.notification.count({
                where: { user_id: id, is_read: false },
              }),
              prisma.notification.findFirst({
                where: { user_id: id },
                orderBy: { created_at: "desc" },
                select: { notification_id: true, title: true, priority: true },
              }),
            ]);

            sseService.notifyUser(id, "new_notification", {
              unread_count: unreadCount,
              notification: latest,
            });
          } catch (sseError) {
            console.error(
              `[InApp Channel] SSE notify failed for user ${id}:`,
              sseError,
            );
          }
        });
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (error) {
      console.error(
        `[InApp Channel] User batch insert failed for ${eventType}:`,
        error,
      );
      result.failed += notifications.length;
      result.errors.push({ error: error.message });
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CADMIN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function processCAdminNotifications(
  recipients,
  eventType,
  title,
  message,
  priority,
  context,
  dedupEntity,
) {
  const result = { sent: 0, failed: 0, skipped: 0, errors: [] };
  const notifications = [];

  const dedupKey = dedupEntity
    ? buildDedupKey(eventType, dedupEntity, context)
    : null;

  for (const recipient of recipients) {
    try {
      if (
        dedupKey &&
        (await checkCAdminDuplicateExists(recipient.cadmin_id, dedupKey))
      ) {
        result.skipped++;
        continue;
      }

      notifications.push({
        user_id: null,
        cadmin_id: recipient.cadmin_id,
        event_type: eventType,
        title,
        message,
        context: sanitizeContext(context),
        shop_id: null,
        branch_id: null,
        dedup_key: dedupKey,
        priority,
        is_read: false,
      });
    } catch (error) {
      console.error(
        `[InApp Channel] Error preparing notification for cadmin ${recipient.cadmin_id}:`,
        error,
      );
      result.failed++;
      result.errors.push({
        cadmin_id: recipient.cadmin_id,
        error: error.message,
      });
    }
  }

  if (notifications.length > 0) {
    try {
      const created = await prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true,
      });

      result.sent = created.count;
      console.log(
        `[InApp Channel] Created ${created.count} cadmin notifications ` +
          `(priority="${priority}") for ${eventType}`,
      );

      // ── SSE: push real-time update to each connected cadmin ───────────────
      if (created.count > 0) {
        const uniqueAdminIds = [
          ...new Set(notifications.map((n) => n.cadmin_id)),
        ];

        uniqueAdminIds.forEach(async (id) => {
          try {
            const [unreadCount, latest] = await Promise.all([
              prisma.notification.count({
                where: { cadmin_id: id, is_read: false },
              }),
              prisma.notification.findFirst({
                where: { cadmin_id: id },
                orderBy: { created_at: "desc" },
                select: { notification_id: true, title: true, priority: true },
              }),
            ]);

            sseService.notifyCAdmin(id, "new_notification", {
              unread_count: unreadCount,
              notification: latest,
            });
          } catch (sseError) {
            console.error(
              `[InApp Channel] SSE notify failed for cadmin ${id}:`,
              sseError,
            );
          }
        });
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (error) {
      console.error(
        `[InApp Channel] CAdmin batch insert failed for ${eventType}:`,
        error,
      );
      result.failed += notifications.length;
      result.errors.push({ error: error.message });
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEDUPLICATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildDedupKey(eventType, entityType, context) {
  let entityId = null;

  switch (entityType) {
    case "inventory":
      entityId = context.inventory_id;
      break;
    case "medicine":
      entityId = context.medicine_id;
      break;
    case "subscription":
      entityId = context.subscription_id;
      break;
    default:
      entityId = context[`${entityType}_id`];
  }

  if (!entityId) {
    console.warn(
      `[InApp Channel] Cannot build dedup key: missing ${entityType}_id in context`,
    );
    return null;
  }

  return `${eventType}:${entityType}:${entityId}`;
}

async function checkUserDuplicateExists(userId, dedupKey) {
  if (!dedupKey) return false;
  const existing = await prisma.notification.findFirst({
    where: { user_id: userId, dedup_key: dedupKey, is_read: false },
    select: { notification_id: true },
  });
  return !!existing;
}

async function checkCAdminDuplicateExists(cadminId, dedupKey) {
  if (!dedupKey) return false;
  const existing = await prisma.notification.findFirst({
    where: { cadmin_id: cadminId, dedup_key: dedupKey, is_read: false },
    select: { notification_id: true },
  });
  return !!existing;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeContext(context) {
  if (!context) return null;

  const sensitiveFields = [
    "password",
    "password_hash",
    "token",
    "otp",
    "reset_token",
    "secret",
  ];
  const sanitized = {};

  for (const [key, value] of Object.entries(context)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field)))
      continue;
    if (typeof value === "function") continue;
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
      continue;
    }
    if (typeof value === "bigint") {
      sanitized[key] = value.toString();
      continue;
    }
    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY EXPORTS (used by user-facing notification routes)
// ─────────────────────────────────────────────────────────────────────────────

export async function markAsRead(notificationId, userId) {
  return prisma.notification.updateMany({
    where: { notification_id: notificationId, user_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
}

export async function markAllAsRead(userId, filters = {}) {
  const where = { user_id: userId, is_read: false };
  if (filters.shop_id) where.shop_id = filters.shop_id;
  if (filters.event_types?.length > 0)
    where.event_type = { in: filters.event_types };

  return prisma.notification.updateMany({
    where,
    data: { is_read: true, read_at: new Date() },
  });
}

export async function getUnreadCount(userId, filters = {}) {
  const where = { user_id: userId, is_read: false };
  if (filters.shop_id) where.shop_id = filters.shop_id;
  return prisma.notification.count({ where });
}

export async function getNotifications(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    shop_id = null,
    event_types = null,
  } = options;

  const where = { user_id: userId };
  if (unreadOnly) where.is_read = false;
  if (shop_id) where.shop_id = shop_id;
  if (event_types?.length > 0) where.event_type = { in: event_types };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function deleteOldNotifications(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return prisma.notification.deleteMany({
    where: { is_read: true, created_at: { lt: cutoffDate } },
  });
}

export async function clearDedupNotification(userId, dedupKey) {
  return prisma.notification.updateMany({
    where: { user_id: userId, dedup_key: dedupKey, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
}

export async function clearInventoryAlerts(inventoryId) {
  const dedupPatterns = [
    `LOW_STOCK_ALERT:inventory:${inventoryId}`,
    `OUT_OF_STOCK_ALERT:inventory:${inventoryId}`,
    `NEAR_EXPIRY_ALERT:inventory:${inventoryId}`,
    `EXPIRED_STOCK_ALERT:inventory:${inventoryId}`,
  ];
  return prisma.notification.updateMany({
    where: { dedup_key: { in: dedupPatterns }, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
}

export default {
  sendViaInApp,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotifications,
  deleteOldNotifications,
  clearDedupNotification,
  clearInventoryAlerts,
};
