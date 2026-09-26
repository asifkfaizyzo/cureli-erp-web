// cadmin-web/src/api/cadminNotifications.js (do not remove this comment)
// cadmin-web/src/api/cadminNotifications.js

import CAdminAPI from "./axios";

/**
 * Get paginated notifications list
 */
export const fetchNotifications = async (params = {}) => {
  const response = await CAdminAPI.get("/notifications", { params });
  return response.data;
};

/**
 * Get unread notification count (for badge)
 * Returns: { total, by_priority: { critical, high, normal, low }, has_critical, has_high }
 */
export const fetchUnreadCount = async () => {
  const response = await CAdminAPI.get("/notifications/unread-count");
  return response.data;
};

/**
 * Get recent notifications (for dropdown - 5 items)
 */
export const fetchRecentNotifications = async (limit = 5) => {
  const response = await CAdminAPI.get("/notifications/recent", {
    params: { limit },
  });
  return response.data;
};

/**
 * Get single notification by ID
 */
export const fetchNotificationById = async (notificationId) => {
  const response = await CAdminAPI.get(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Mark single notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await CAdminAPI.patch(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (options = {}) => {
  const response = await CAdminAPI.patch("/notifications/read-all", options);
  return response.data;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  const response = await CAdminAPI.delete(`/notifications/${notificationId}`);
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
};
