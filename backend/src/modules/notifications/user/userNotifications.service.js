// backend/src/modules/notifications/user/userNotifications.service.js (do not remove this comment)
// ============================================
// backend\src\modules\notifications\user\userNotifications.service.js
// ============================================

import prisma from '../../../config/prisma.js';

/**
 * Get paginated notifications for a user
 */
export async function getNotifications(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    priority = null,
    eventTypes = null,
  } = options;

  // Build where clause
  const where = { user_id: userId };

  if (unreadOnly) {
    where.is_read = false;
  }

  if (priority) {
    where.priority = priority;
  }

  if (eventTypes && eventTypes.length > 0) {
    where.event_type = { in: eventTypes };
  }



  // Execute queries
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [
        { is_read: 'asc' },      // Unread first
        { created_at: 'desc' },  // Then by newest
      ],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        notification_id: true,
        event_type: true,
        title: true,
        message: true,
        context: true,
        priority: true,
        is_read: true,
        read_at: true,
        created_at: true,
        shop_id: true,
        branch_id: true,
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ 
      where: { user_id: userId, is_read: false } 
    }),
  ]);

  return {
    notifications,
    unread_count: unreadCount,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_more: page * limit < total,
    },
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId) {
  const where = {
    user_id: userId,
    is_read: false,
  };


  const count = await prisma.notification.count({ where });

  // Also get count by priority for badge styling
  const bySeverity = await prisma.notification.groupBy({
    by: ['priority'],
    where,
    _count: { priority: true },
  });

  const priorityCounts = {
    critical: 0,
    high: 0,
    normal: 0,
    low: 0,
  };

  for (const item of bySeverity) {
    priorityCounts[item.priority] = item._count.priority;
  }

  return {
    total: count,
    by_priority: priorityCounts,
    has_critical: priorityCounts.critical > 0,
    has_high: priorityCounts.high > 0,
  };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId, userId) {
  // Verify ownership and update
  const notification = await prisma.notification.findFirst({
    where: {
      notification_id: notificationId,
      user_id: userId,
    },
    select: {
      notification_id: true,
      is_read: true,
    },
  });

  if (!notification) {
    return { success: false, error: 'NOTIFICATION_NOT_FOUND' };
  }

  if (notification.is_read) {
    return { success: true, already_read: true };
  }

  await prisma.notification.update({
    where: { notification_id: notificationId },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return { success: true, already_read: false };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId, options = {}) {
  const { eventTypes = null, beforeDate = null } = options;

  const where = {
    user_id: userId,
    is_read: false,
  };

  if (eventTypes && eventTypes.length > 0) {
    where.event_type = { in: eventTypes };
  }

  if (beforeDate) {
    where.created_at = { lte: new Date(beforeDate) };
  }



  const result = await prisma.notification.updateMany({
    where,
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return {
    success: true,
    marked_count: result.count,
  };
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notificationId, userId) {
  // Verify ownership
  const notification = await prisma.notification.findFirst({
    where: {
      notification_id: notificationId,
      user_id: userId,
    },
    select: { notification_id: true },
  });

  if (!notification) {
    return { success: false, error: 'NOTIFICATION_NOT_FOUND' };
  }

  await prisma.notification.delete({
    where: { notification_id: notificationId },
  });

  return { success: true };
}

/**
 * Clear inventory alerts for a specific inventory item
 * Called when stock is replenished or issue is resolved
 */
export async function clearInventoryAlerts(userId, inventoryId) {
  // Build dedup patterns for this inventory item
  const dedupPatterns = [
    `LOW_STOCK_ALERT:inventory:${inventoryId}`,
    `OUT_OF_STOCK_ALERT:inventory:${inventoryId}`,
    `NEAR_EXPIRY_ALERT:inventory:${inventoryId}`,
    `EXPIRED_STOCK_ALERT:inventory:${inventoryId}`,
  ];

  const where = {
    user_id: userId,
    dedup_key: { in: dedupPatterns },
    is_read: false,
  };

 

  const result = await prisma.notification.updateMany({
    where,
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return {
    success: true,
    cleared_count: result.count,
  };
}

/**
 * Get notification by ID (with ownership check)
 */
export async function getNotificationById(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: {
      notification_id: notificationId,
      user_id: userId,
    },
  });

  return notification;
}

/**
 * Get recent notifications (for dropdown/quick view)
 */
export async function getRecentNotifications(userId, limit = 5) {
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_read: 'asc' },
      { created_at: 'desc' },
    ],
    take: limit,
    select: {
      notification_id: true,
      event_type: true,
      title: true,
      message: true,
      priority: true,
      is_read: true,
      created_at: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });

  return {
    notifications,
    unread_count: unreadCount,
    has_more: unreadCount > limit,
  };
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearInventoryAlerts,
  getNotificationById,
  getRecentNotifications,
};