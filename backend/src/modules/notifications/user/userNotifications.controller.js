// backend/src/modules/notifications/user/userNotifications.controller.js (do not remove this comment)
// ============================================
// backend\src\modules\notifications\user\userNotifications.controller.js
// ============================================

import * as notificationService from './userNotifications.service.js';
import { success, fail } from '../../../utils/response.js';

/**
 * GET /notifications
 * Get paginated list of user notifications
 */
export async function listNotifications(req, res) {
  try {
    const userId = req.user.user_id;

    const {
      page = 1,
      limit = 20,
      unread_only = false,
      priority,
      event_type,
    } = req.query;

    // Normalize event_type to array
    let eventTypes = null;
    if (event_type) {
      eventTypes = Array.isArray(event_type) ? event_type : [event_type];
    }

    const result = await notificationService.getNotifications(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unread_only === 'true' || unread_only === true,
      priority,
      eventTypes,
      
    });

    return success(res, result, 'Notifications retrieved successfully');
  } catch (err) {
    console.error('[Notifications] listNotifications error:', err);
    return fail(res, 'Failed to retrieve notifications', 500);
  }
}

/**
 * GET /notifications/unread-count
 * Get unread notification count (for badge)
 */
export async function getUnreadCount(req, res) {
  try {
    const userId = req.user.user_id;
   

    const result = await notificationService.getUnreadCount(userId);

    return success(res, result, 'Unread count retrieved');
  } catch (err) {
    console.error('[Notifications] getUnreadCount error:', err);
    return fail(res, 'Failed to get unread count', 500);
  }
}

/**
 * GET /notifications/recent
 * Get recent notifications (for dropdown)
 */
export async function getRecentNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit, 10) || 5;

    const result = await notificationService.getRecentNotifications(userId, limit);

    return success(res, result, 'Recent notifications retrieved');
  } catch (err) {
    console.error('[Notifications] getRecentNotifications error:', err);
    return fail(res, 'Failed to get recent notifications', 500);
  }
}

/**
 * GET /notifications/:id
 * Get single notification details
 */
export async function getNotification(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const notification = await notificationService.getNotificationById(id, userId);

    if (!notification) {
      return fail(res, 'Notification not found', 404);
    }

    return success(res, { notification }, 'Notification retrieved');
  } catch (err) {
    console.error('[Notifications] getNotification error:', err);
    return fail(res, 'Failed to get notification', 500);
  }
}

/**
 * PATCH /notifications/:id/read
 * Mark single notification as read
 */
export async function markAsRead(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const result = await notificationService.markAsRead(id, userId);

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
    console.error('[Notifications] markAsRead error:', err);
    return fail(res, 'Failed to mark notification as read', 500);
  }
}

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.user_id;
    
    const { event_types, before_date } = req.body || {};

    const result = await notificationService.markAllAsRead(userId, {
      eventTypes: event_types,
      beforeDate: before_date,
      
    });

    return success(res, result, `${result.marked_count} notification(s) marked as read`);
  } catch (err) {
    console.error('[Notifications] markAllAsRead error:', err);
    return fail(res, 'Failed to mark notifications as read', 500);
  }
}

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const result = await notificationService.deleteNotification(id, userId);

    if (!result.success) {
      if (result.error === 'NOTIFICATION_NOT_FOUND') {
        return fail(res, 'Notification not found', 404);
      }
      return fail(res, 'Failed to delete notification', 400);
    }

    return success(res, {}, 'Notification deleted');
  } catch (err) {
    console.error('[Notifications] deleteNotification error:', err);
    return fail(res, 'Failed to delete notification', 500);
  }
}

/**
 * POST /notifications/clear-inventory-alerts
 * Clear inventory alerts when issue is resolved
 */
export async function clearInventoryAlerts(req, res) {
  try {
    const userId = req.user.user_id;
    
    const { inventory_id } = req.body;

    const result = await notificationService.clearInventoryAlerts(
      userId,
      inventory_id,
      
    );

    return success(res, result, `${result.cleared_count} inventory alert(s) cleared`);
  } catch (err) {
    console.error('[Notifications] clearInventoryAlerts error:', err);
    return fail(res, 'Failed to clear inventory alerts', 500);
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
  clearInventoryAlerts,
};