// backend/src/modules/notifications/index.js (do not remove this comment)
// ============================================
// NOTIFICATIONS MODULE - Public API
// ============================================

export { notify, notifyAsync, Notify, NOTIFICATION_EVENTS } from './notification.service.js';
export { NOTIFICATION_EVENTS as Events, EVENT_CONFIG } from './notification.events.js';
export { resolveAudience } from './notification.rules.js';

// Default export for convenience
import { notify, notifyAsync, Notify, NOTIFICATION_EVENTS } from './notification.service.js';

export default {
  notify,
  notifyAsync,
  Notify,
  NOTIFICATION_EVENTS,
};