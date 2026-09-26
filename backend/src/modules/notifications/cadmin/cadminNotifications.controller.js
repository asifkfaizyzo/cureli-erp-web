// backend/src/modules/notifications/cadmin/cadminNotifications.controller.js (do not remove this comment)
// ============================================
// backend/src/modules/notifications/cadmin/cadminNotifications.controller.js
// ============================================

import * as notificationService from './cadminNotifications.service.js';
import { success, fail } from '../../../utils/response.js';

/**
 * GET /cadmin/notifications
 * Get paginated list of cadmin notifications
 */
export async function listNotifications(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const validated = req.validated || req.query;
    
    const {
      page = 1,
      limit = 20,
      unread_only = false,
      priority,
      event_type,
    } = validated;

    // Normalize event_type to array
    let eventTypes = null;
    if (event_type) {
      eventTypes = Array.isArray(event_type) ? event_type : [event_type];
    }

    const result = await notificationService.getNotifications(cadminId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unread_only === 'true' || unread_only === true,
      priority,
      eventTypes,
    });

    return success(res, result, 'Notifications retrieved successfully');
  } catch (err) {
    console.error('[CAdmin Notifications] listNotifications error:', err);
    return fail(res, 'Failed to retrieve notifications', 500);
  }
}

/**
 * GET /cadmin/notifications/unread-count
 * Get unread notification count (for badge)
 */
export async function getUnreadCount(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const result = await notificationService.getUnreadCount(cadminId);

    return success(res, result, 'Unread count retrieved');
  } catch (err) {
    console.error('[CAdmin Notifications] getUnreadCount error:', err);
    return fail(res, 'Failed to get unread count', 500);
  }
}

/**
 * GET /cadmin/notifications/recent
 * Get recent notifications (for dropdown)
 */
export async function getRecentNotifications(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const limit = parseInt(req.query.limit, 10) || 5;

    const result = await notificationService.getRecentNotifications(cadminId, limit);

    return success(res, result, 'Recent notifications retrieved');
  } catch (err) {
    console.error('[CAdmin Notifications] getRecentNotifications error:', err);
    return fail(res, 'Failed to get recent notifications', 500);
  }
}

/**
 * GET /cadmin/notifications/:id
 * Get single notification details
 */
export async function getNotification(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const { id } = req.validated || req.params;

    const notification = await notificationService.getNotificationById(id, cadminId);

    if (!notification) {
      return fail(res, 'Notification not found', 404);
    }

    return success(res, { notification }, 'Notification retrieved');
  } catch (err) {
    console.error('[CAdmin Notifications] getNotification error:', err);
    return fail(res, 'Failed to get notification', 500);
  }
}

/**
 * PATCH /cadmin/notifications/:id/read
 * Mark single notification as read
 */
export async function markAsRead(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const { id } = req.validated || req.params;

    const result = await notificationService.markAsRead(id, cadminId);

    if (!result.success) {
      if (result.error === 'NOTIFICATION_NOT_FOUND') {
        return fail(res, 'Notification not found', 404);
      }
      return fail(res, 'Failed to mark as read', 400);
    }

    return success(
      res,
      { already_read: result.already_read },
      result.already_read 
        ? 'Notification was already read' 
        : 'Notification marked as read'
    );
  } catch (err) {
    console.error('[CAdmin Notifications] markAsRead error:', err);
    return fail(res, 'Failed to mark notification as read', 500);
  }
}

/**
 * PATCH /cadmin/notifications/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const validated = req.validated || req.body || {};
    const { event_types, before_date } = validated;

    const result = await notificationService.markAllAsRead(cadminId, {
      eventTypes: event_types,
      beforeDate: before_date,
    });

    return success(res, result, `${result.marked_count} notification(s) marked as read`);
  } catch (err) {
    console.error('[CAdmin Notifications] markAllAsRead error:', err);
    return fail(res, 'Failed to mark notifications as read', 500);
  }
}

/**
 * DELETE /cadmin/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const { id } = req.validated || req.params;

    const result = await notificationService.deleteNotification(id, cadminId);

    if (!result.success) {
      if (result.error === 'NOTIFICATION_NOT_FOUND') {
        return fail(res, 'Notification not found', 404);
      }
      return fail(res, 'Failed to delete notification', 400);
    }

    return success(res, {}, 'Notification deleted');
  } catch (err) {
    console.error('[CAdmin Notifications] deleteNotification error:', err);
    return fail(res, 'Failed to delete notification', 500);
  }
}

export default {
  listNotifications,
  getUnreadCount,
  getRecentNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};