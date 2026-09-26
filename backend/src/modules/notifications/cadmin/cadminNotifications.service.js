// backend/src/modules/notifications/cadmin/cadminNotifications.service.js (do not remove this comment)
// ============================================
// backend/src/modules/notifications/cadmin/cadminNotifications.service.js
// ============================================

import prisma from '../../../config/prisma.js';

/**
 * Get paginated notifications for a cadmin
 */
export async function getNotifications(cadminId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    priority = null,
    eventTypes = null,
  } = options;

  // Build where clause
  const where = { cadmin_id: cadminId };

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
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ 
      where: { cadmin_id: cadminId, is_read: false } 
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
export async function getUnreadCount(cadminId) {
  const where = {
    cadmin_id: cadminId,
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
export async function markAsRead(notificationId, cadminId) {
  // Verify ownership and get current state
  const notification = await prisma.notification.findFirst({
    where: {
      notification_id: notificationId,
      cadmin_id: cadminId,
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
 * Mark all notifications as read for a cadmin
 */
export async function markAllAsRead(cadminId, options = {}) {
  const { eventTypes = null, beforeDate = null } = options;

  const where = {
    cadmin_id: cadminId,
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
export async function deleteNotification(notificationId, cadminId) {
  // Verify ownership
  const notification = await prisma.notification.findFirst({
    where: {
      notification_id: notificationId,
      cadmin_id: cadminId,
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
 * Get notification by ID (with ownership check)
 */
export async function getNotificationById(notificationId, cadminId) {
  const notification = await prisma.notification.findFirst({
    where: {
      notification_id: notificationId,
      cadmin_id: cadminId,
    },
  });

  return notification;
}

/**
 * Get recent notifications (for dropdown/quick view)
 */
export async function getRecentNotifications(cadminId, limit = 5) {
  const notifications = await prisma.notification.findMany({
    where: { cadmin_id: cadminId },
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
      context: true,
      priority: true,
      is_read: true,
      created_at: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { cadmin_id: cadminId, is_read: false },
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
  getNotificationById,
  getRecentNotifications,
};