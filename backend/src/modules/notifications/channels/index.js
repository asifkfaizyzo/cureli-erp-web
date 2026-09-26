// backend/src/modules/notifications/channels/index.js (do not remove this comment)
// ============================================
// NOTIFICATION CHANNELS INDEX
// ============================================

// Channel dispatch functions
export { sendViaEmail } from './email.channel.js';
export { sendViaInApp } from './inapp.channel.js';
export { sendViaSMS } from './sms.channel.js';

// In-App channel utilities (for use in services/controllers)
export {
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotifications,
  deleteOldNotifications,
  clearDedupNotification,
  clearInventoryAlerts,
} from './inapp.channel.js';