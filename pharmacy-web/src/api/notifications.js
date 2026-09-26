// pharmacy-web/src/api/notifications.js (do not remove this comment)
// ============================================
// NOTIFICATIONS API
// ============================================

import api from './axios';

/**
 * Get paginated notifications list
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {boolean} params.unread_only - Filter unread only
 * @param {string} params.priority - Filter by priority
 * @param {string|string[]} params.event_type - Filter by event type(s)
 */
export const fetchNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

/**
 * Get unread notification count (for badge)
 * Returns: { total, by_priority: { critical, high, normal, low }, has_critical, has_high }
 */
export const fetchUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

/**
 * Get recent notifications (for dropdown - 5 items)
 * @param {number} limit - Number of items (default: 5)
 */
export const fetchRecentNotifications = async (limit = 5) => {
  const response = await api.get('/notifications/recent', { params: { limit } });
  return response.data;
};

/**
 * Get single notification by ID
 * @param {string} notificationId - Notification UUID
 */
export const fetchNotificationById = async (notificationId) => {
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Mark single notification as read
 * @param {string} notificationId - Notification UUID
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 * @param {Object} options - Optional filters
 * @param {string[]} options.event_types - Only mark specific event types
 * @param {string} options.before_date - Only mark notifications before this date
 */
export const markAllNotificationsAsRead = async (options = {}) => {
  const response = await api.patch('/notifications/read-all', options);
  return response.data;
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification UUID
 */
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Clear inventory alerts for a specific inventory item
 * @param {string} inventoryId - Inventory UUID
 */
export const clearInventoryAlerts = async (inventoryId) => {
  const response = await api.post('/notifications/clear-inventory-alerts', {
    inventory_id: inventoryId,
  });
  return response.data;
};

export default {
  fetchNotifications,
  fetchUnreadCount,
  fetchRecentNotifications,
  fetchNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearInventoryAlerts,
};