// backend/src/modules/rider/push/rider.push.service.js
//
// Core push notification service for Cureli Rider App.
//
// Responsibilities:
//   1. Send push notifications via Expo Push API to rider devices
//   2. Persist notifications to RiderNotification inbox
//   3. Handle Expo push receipts (delivery confirmation)
//   4. Clean up stale push tokens from RiderSession
//
// Mirrors the pattern in mobile.push.service.js but targets
// RiderSession (tokens) and RiderNotification (inbox) instead
// of CureliMobileSession / CureliMobileNotification.
//
// Key difference from customer push:
//   - No per-category preference checks. Delivery assignments
//     are mandatory operational alerts — riders cannot opt out.
//   - Supports sticky, full-screen intent, and alarm-priority
//     channels for incoming delivery requests.

import prisma from "../../../config/prisma.js";

// ── Expo Push API ─────────────────────────────────────────────────────────────
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

// Expo enforces a max of 100 messages per batch request
const EXPO_BATCH_SIZE = 100;

// ── Category → Android channel mapping ───────────────────────────────────────
// These channel IDs must match the channels created on the rider app side
// via Notifications.setNotificationChannelAsync() in notificationChannelSetup.ts
const CATEGORY_CHANNEL_MAP = {
  incoming_delivery: "incoming_delivery",
  delivery_updates: "delivery_updates",
  system_messages: "cureli-rider-online-service",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get all active push tokens for a rider.
 * Queries RiderSession for active, non-expired sessions with push tokens.
 *
 * A rider may have multiple active sessions (multiple devices) since
 * single-device enforcement is not yet implemented.
 *
 * @param {string} riderId
 * @returns {Promise<string[]>} Array of unique push tokens
 */
async function getRiderPushTokens(riderId) {
  const sessions = await prisma.riderSession.findMany({
    where: {
      rider_id: riderId,
      is_active: true,
      push_token: { not: null },
      expires_at: { gt: new Date() },
    },
    select: {
      push_token: true,
    },
    orderBy: { push_token_updated_at: "desc" },
  });

  // Deduplicate tokens (same device could appear in multiple sessions)
  const unique = [
    ...new Set(sessions.map((s) => s.push_token).filter(Boolean)),
  ];

  return unique;
}

/**
 * Send a batch of messages to the Expo Push API.
 * Returns the array of tickets (one per message).
 *
 * Expo ticket shape (success):
 *   { status: 'ok', id: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' }
 *
 * Expo ticket shape (error):
 *   { status: 'error', message: '...', details: { error: 'DeviceNotRegistered' } }
 *
 * @param {Object[]} messages - Array of Expo message objects
 * @returns {Promise<Object[]>} tickets
 */
async function sendBatchToExpo(messages) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // Add Expo access token if configured (optional for development)
      // 'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo Push API error: ${response.status} ${text}`);
  }

  const result = await response.json();
  return result.data ?? [];
}

/**
 * Chunk an array into sub-arrays of at most `size` elements.
 *
 * @param {any[]} arr
 * @param {number} size
 * @returns {any[][]}
 */
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Build an Expo message object for a rider notification.
 *
 * Supports Android-specific fields for full-screen intent,
 * sticky notifications, and alarm-priority channels.
 *
 * @param {string} token - Expo push token
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body
 * @param {string} options.category
 * @param {Object} [options.data] - Tap routing data
 * @param {string} [options.sound] - Sound file name (e.g., "incoming_order.mp3")
 * @param {string} [options.channelId] - Android notification channel ID
 * @param {string} [options.priority] - "high" or "normal"
 * @param {boolean} [options.sticky] - If true, notification cannot be swiped away
 * @returns {Object} Expo message
 */
function buildExpoMessage(token, {
  title,
  body,
  category,
  data = {},
  sound = "default",
  channelId = null,
  priority = "max",    
  sticky = false,
}) {
  const resolvedChannelId = channelId || CATEGORY_CHANNEL_MAP[category] || "cureli-rider-online-service";

  return {
    to: token,
    title,
    body,
    data,
    sound,
    priority,
    // Android-specific
    channelId: resolvedChannelId,
    sticky,
    // autoCancel: false keeps the notification in the tray after tap
    // until explicitly dismissed by the app
    autoCancel: !sticky,
  };
}

// ── Core Send Function ────────────────────────────────────────────────────────

/**
 * Send a push notification to a single rider.
 *
 * This is the primary function called by the delivery assignment flow
 * and other rider-facing event handlers.
 *
 * Unlike customer push, there are no preference checks — delivery
 * assignments are mandatory operational alerts.
 *
 * @param {Object} options
 * @param {string}   options.riderId
 * @param {string}   options.title
 * @param {string}   options.body
 * @param {string}   options.category   - e.g., "incoming_delivery", "delivery_updates", "system_messages"
 * @param {Object}   [options.data]     - Tap routing { screen, delivery_id, order_id, ... }
 * @param {string}   [options.sound]    - Sound file name (default: "default")
 * @param {string}   [options.channelId]- Override Android channel ID
 * @param {string}   [options.priority] - "high" or "normal" (default: "high")
 * @param {boolean}  [options.sticky]   - Sticky notification (default: false)
 * @returns {Promise<{ notificationId: string | null, pushed: boolean }>}
 */
export async function sendPushToRider({
  riderId,
  title,
  body,
  category,
  data = {},
  sound = "default",
  channelId = null,
  priority = "high",
  sticky = false,
}) {
  // ── 1. Create inbox record ────────────────────────────────────────────────
  const notification = await prisma.riderNotification.create({
    data: {
      rider_id: riderId,
      title,
      body,
      category,
      data,
      push_sent: false, // updated below if push succeeds
    },
  });

  // ── 2. Get push tokens ────────────────────────────────────────────────────
  const tokens = await getRiderPushTokens(riderId);
  if (tokens.length === 0) {
    console.log(`[RiderPush] No push token for rider ${riderId}`);
    return { notificationId: notification.id, pushed: false };
  }

  // ── 3. Send to Expo ───────────────────────────────────────────────────────
  try {
    const messages = tokens.map((token) =>
      buildExpoMessage(token, {
        title,
        body,
        category,
        data,
        sound,
        channelId,
        priority,
        sticky,
      }),
    );

    const tickets = await sendBatchToExpo(messages);

    // Use the first successful ticket ID for the inbox record
    const successTicket = tickets.find((t) => t.status === "ok");
    const ticketId = successTicket?.id ?? null;

    // Handle DeviceNotRegistered — remove stale token from all sessions
    const staleTokens = [];
    tickets.forEach((ticket, index) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        staleTokens.push(tokens[index]);
      }
    });

    if (staleTokens.length > 0) {
      console.log(
        `[RiderPush] Removing ${staleTokens.length} stale token(s) for rider ${riderId}`,
      );
      await prisma.riderSession.updateMany({
        where: {
          rider_id: riderId,
          push_token: { in: staleTokens },
        },
        data: {
          push_token: null,
          push_token_type: null,
          push_token_updated_at: new Date(),
        },
      });
    }

    // Update inbox record with ticket ID
    await prisma.riderNotification.update({
      where: { id: notification.id },
      data: {
        push_sent: true,
        push_ticket_id: ticketId,
      },
    });

    console.log(
      `[RiderPush] Sent ${category} to rider ${riderId} (${tokens.length} device(s))`,
    );

    return { notificationId: notification.id, pushed: true };
  } catch (err) {
    console.error(
      `[RiderPush] Failed to send to rider ${riderId}:`,
      err.message,
    );
    return { notificationId: notification.id, pushed: false };
  }
}

// ── Dismiss Function ──────────────────────────────────────────────────────────

/**
 * Send a silent dismissal push to clear a sticky notification
 * from the rider's notification tray.
 *
 * Called when:
 *   - 90-second auto-decline timeout fires
 *   - CAdmin unassigns the rider
 *   - Another rider accepts the same order (race condition)
 *
 * Uses a special "dismiss" data flag that the rider app's notification
 * handler recognizes and calls Notifications.dismissNotificationAsync().
 *
 * @param {string} riderId
 * @param {string} deliveryId
 * @returns {Promise<void>}
 */
export async function dismissRiderNotification(riderId, deliveryId) {
  try {
    const tokens = await getRiderPushTokens(riderId);
    if (tokens.length === 0) return;

    const messages = tokens.map((token) => ({
      to: token,
      title: "",
      body: "",
      data: {
        action: "dismiss",
        delivery_id: deliveryId,
        category: "incoming_delivery",
      },
      sound: null,
      priority: "high",
      channelId: "incoming_delivery",
      sticky: false,
      autoCancel: true,
    }));

    await sendBatchToExpo(messages);

    console.log(
      `[RiderPush] Sent dismissal for delivery ${deliveryId} to rider ${riderId}`,
    );
  } catch (err) {
    console.error(
      `[RiderPush] Failed to send dismissal to rider ${riderId}:`,
      err.message,
    );
  }
}

// ── Receipt Checking ──────────────────────────────────────────────────────────

/**
 * Get Expo push receipts for previously sent tickets.
 * Call this ~15 minutes after sending to confirm delivery.
 * Intended to be called by a cron job.
 *
 * @param {string[]} ticketIds
 * @returns {Promise<Object>} receipt map { ticketId: receipt }
 */
export async function getRiderPushReceipts(ticketIds) {
  if (ticketIds.length === 0) return {};

  try {
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: ticketIds }),
    });

    if (!response.ok) {
      throw new Error(`Receipts API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data ?? {};
  } catch (err) {
    console.error("[RiderPush] Failed to fetch receipts:", err.message);
    return {};
  }
}

// ── Convenience Wrappers ──────────────────────────────────────────────────────

/**
 * Pre-built notification templates for rider-facing events.
 * These are the functions called by event handlers throughout the app.
 */
export const RiderPush = {
  // ── Incoming delivery request (the critical one) ──────────────────────────

  incomingDelivery: (riderId, deliveryId, orderId, orderNumber, shopName, earnings) => {
    const earningText = earnings?.total_earning
      ? ` · ₹${earnings.total_earning.toFixed(0)}`
      : "";

    return sendPushToRider({
      riderId,
      title: "🛵 New Delivery Request",
      body: `Order #${orderNumber} from ${shopName}${earningText}`,
      category: "incoming_delivery",
      data: {
        screen: "incoming_delivery",
        delivery_id: deliveryId,
        order_id: orderId,
        order_number: orderNumber,
      },
      sound: "incoming_order.mp3",
      channelId: "incoming_delivery",
      priority: "max",
      sticky: true,
    });
  },

  // ── Delivery cancelled / unassigned ───────────────────────────────────────

  deliveryCancelled: (riderId, deliveryId, orderNumber, reason) => {
    // First dismiss the sticky notification
    dismissRiderNotification(riderId, deliveryId);

    // Then send an informational notification
    return sendPushToRider({
      riderId,
      title: "Delivery Cancelled",
      body: reason || `Order #${orderNumber} has been reassigned.`,
      category: "delivery_updates",
      data: {
        screen: "home",
        delivery_id: deliveryId,
      },
      priority: "normal",
      sticky: false,
    });
  },

  // ── Order ready for pickup ────────────────────────────────────────────────

  orderReadyForPickup: (riderId, deliveryId, orderNumber, shopName) =>
    sendPushToRider({
      riderId,
      title: "Order Ready for Pickup",
      body: `Order #${orderNumber} is packed and ready at ${shopName}.`,
      category: "delivery_updates",
      data: {
        screen: "active_delivery",
        delivery_id: deliveryId,
      },
      priority: "max",
      sticky: false,
    }),

  // ── System messages ───────────────────────────────────────────────────────

  accountSuspended: (riderId, reason) =>
    sendPushToRider({
      riderId,
      title: "Account Suspended",
      body: reason || "Your account has been suspended. Contact support.",
      category: "system_messages",
      data: { screen: "home" },
      priority: "high",
      sticky: false,
    }),

  accountReactivated: (riderId) =>
    sendPushToRider({
      riderId,
      title: "Account Reactivated",
      body: "Your account has been reactivated. You can now go online.",
      category: "system_messages",
      data: { screen: "home" },
      priority: "normal",
      sticky: false,
    }),
};

export default { sendPushToRider, dismissRiderNotification, getRiderPushReceipts, RiderPush };