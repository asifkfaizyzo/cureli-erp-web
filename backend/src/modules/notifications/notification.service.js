// backend/src/modules/notifications/notification.service.js (do not remove this comment)
// ============================================
// backend\src\modules\notifications\notification.service.js
// ============================================

import { NOTIFICATION_EVENTS, EVENT_CONFIG } from './notification.events.js';
import { resolveAudience } from './notification.rules.js';
import { sendViaEmail } from './channels/email.channel.js';
import { sendViaInApp } from './channels/inapp.channel.js';
import { sendViaSMS } from './channels/sms.channel.js';

/**
 * Central notification dispatcher
 * 
 * @param {Object} options
 * @param {string} options.type - Event type from NOTIFICATION_EVENTS
 * @param {Object} options.context - Event-specific data for templates
 * @param {string[]} [options.channels] - Override default channels ['email', 'inapp', 'sms']
 * @param {Object} [options.audience] - Override audience resolution (for broadcasts)
 * @param {Object} [options.audienceFilters] - Filters for broadcast audience resolution
 * 
 * @returns {Promise<NotificationResult>}
 */
export async function notify({
  type,
  context = {},
  channels = null,
  audience = null,
  audienceFilters = {},
}) {
  const startTime = Date.now();
  const result = {
    success: false,
    event: type,
    recipientCount: 0,
    channels: {},
    errors: [],
  };

  try {
    // ─────────────────────────────────────────
    // 1. VALIDATE EVENT TYPE
    // ─────────────────────────────────────────
    const eventConfig = EVENT_CONFIG[type];
    if (!eventConfig) {
      throw new Error(`Unknown notification event: ${type}`);
    }

    // ─────────────────────────────────────────
    // 2. DETERMINE CHANNELS
    // ─────────────────────────────────────────
    const activeChannels = channels || eventConfig.defaultChannels || ['email'];

    // ─────────────────────────────────────────
    // 3. RESOLVE AUDIENCE
    // ─────────────────────────────────────────
    let recipients;
    if (audience && Array.isArray(audience)) {
      // Direct audience override (for broadcasts or manual targeting)
      recipients = audience;
    } else {
      recipients = await resolveAudience(type, context, audienceFilters);
    }

    if (recipients.length === 0) {
      console.warn(`[Notifications] No recipients for event: ${type}`);
      result.success = true; // Not an error, just no recipients
      result.recipientCount = 0;
      return result;
    }

    result.recipientCount = recipients.length;

    // ─────────────────────────────────────────
    // 4. DISPATCH TO CHANNELS
    // ─────────────────────────────────────────
    const channelPromises = [];

    if (activeChannels.includes('email')) {
      channelPromises.push(
        sendViaEmail(type, recipients, context)
          .then((res) => { result.channels.email = res; })
          .catch((err) => {
            result.errors.push({ channel: 'email', error: err.message });
            result.channels.email = { sent: 0, failed: recipients.length };
          })
      );
    }

    if (activeChannels.includes('inapp')) {
      channelPromises.push(
        sendViaInApp(type, recipients, context)
          .then((res) => { result.channels.inapp = res; })
          .catch((err) => {
            result.errors.push({ channel: 'inapp', error: err.message });
            result.channels.inapp = { sent: 0, failed: recipients.length };
          })
      );
    }

    if (activeChannels.includes('sms')) {
      channelPromises.push(
        sendViaSMS(type, recipients, context)
          .then((res) => { result.channels.sms = res; })
          .catch((err) => {
            result.errors.push({ channel: 'sms', error: err.message });
            result.channels.sms = { sent: 0, failed: recipients.length };
          })
      );
    }

    await Promise.all(channelPromises);

    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    // Log summary
    console.log(`[Notifications] ${type}: ${recipients.length} recipients, channels: ${activeChannels.join(', ')}, ${result.duration}ms`);

    return result;

  } catch (error) {
    console.error(`[Notifications] Error dispatching ${type}:`, error);
    result.errors.push({ channel: 'system', error: error.message });
    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Fire-and-forget version of notify
 * Use this when you don't need to wait for the result
 */
export function notifyAsync(options) {
  notify(options).catch((err) => {
    console.error('[Notifications] Async notification failed:', err);
  });
}

// ─────────────────────────────────────────
// CONVENIENCE METHODS
// ─────────────────────────────────────────

/**
 * Shorthand for common notification patterns
 */
export const Notify = {
  // Shop verification
  shopVerified: (shop_id, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.SHOP_VERIFIED, context: { shop_id, ...context } }),

  documentRejected: (shop_id, reason, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.DOCUMENT_REJECTED, context: { shop_id, reason, ...context } }),

  // Tickets
  ticketCreated: (ticketData) =>
    notify({ type: NOTIFICATION_EVENTS.TICKET_CREATED, context: ticketData }),

  ticketStatusChanged: (ticketData) =>
    notify({ type: NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED, context: ticketData }),

  // Password reset
  passwordResetRequested: (email, resetUrl, name) =>
    notify({
      type: NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED,
      context: { email, resetUrl, name },
    }),

  cadminPasswordResetRequested: (email, resetUrl, name) =>
    notify({
      type: NOTIFICATION_EVENTS.CADMIN_PASSWORD_RESET_REQUESTED,
      context: { email, resetUrl, name },
    }),

  // Subscriptions
  subscriptionActivated: (shop_id, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED, context: { shop_id, ...context } }),

  subscriptionExpiring: (shop_id, daysLeft, context = {}) => {
    const eventType = daysLeft <= 3
      ? NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS
      : NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS;
    return notify({ type: eventType, context: { shop_id, daysLeft, ...context } });
  },

  subscriptionGraceEnding: (shop_id, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING, context: { shop_id, ...context } }),

  subscriptionSuspended: (shop_id, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED, context: { shop_id, ...context } }),

  // Payments
  paymentSuccess: (shop_id, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.PAYMENT_SUCCESS, context: { shop_id, ...context } }),

  paymentFailed: (shop_id, context = {}) =>
    notify({ type: NOTIFICATION_EVENTS.PAYMENT_FAILED, context: { shop_id, ...context } }),

  // Broadcast
  broadcast: (message, subject, audienceFilters, channels = ['email']) =>
    notify({
      type: NOTIFICATION_EVENTS.SYSTEM_BROADCAST,
      context: { message, subject },
      audienceFilters,
      channels,
    }),
};

export { NOTIFICATION_EVENTS };
export default { notify, notifyAsync, Notify, NOTIFICATION_EVENTS };