// backend/src/modules/mobile/push/mobile.push.service.js
//
// Core push notification service for Cureli Mobile.
//
// Responsibilities:
//   1. Send push notifications via Expo Push API
//   2. Respect per-user preferences before sending
//   3. Persist notifications to CureliMobileNotification inbox
//   4. Handle Expo push receipts (delivery confirmation)
//
// Expo Push API docs: https://docs.expo.dev/push-notifications/sending-notifications/
//
// Flow for a single notification:
//   caller → sendPushToUser()
//     → check user preferences
//     → create inbox record
//     → get push token from active session
//     → send to Expo API
//     → update inbox record with ticket ID
//
// Flow for a broadcast:
//   caller → sendPushToMany()
//     → chunk recipients into batches of 100 (Expo limit)
//     → for each batch: send to Expo API
//     → persist all inbox records

import prisma from "../../../config/prisma.js";

// ── Expo Push API ─────────────────────────────────────────────────────────────
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

// Expo enforces a max of 100 messages per batch request
const EXPO_BATCH_SIZE = 100;

// ── Category → Android channel mapping ───────────────────────────────────────
// Matches the channels created in pushNotificationService.ts on the mobile side
const CATEGORY_CHANNEL_MAP = {
  order_updates: "order_updates",
  promotions: "default",
  prescription_updates: "default",
  system_messages: "default",
  cart_abandonment: "default",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check if a user has enabled a specific notification category.
 * If no preference row exists, defaults to enabled (new users).
 *
 * @param {string} userId
 * @param {string} category - matches PUSH_CATEGORIES values
 * @returns {Promise<boolean>}
 */
async function isUserCategoryEnabled(userId, category) {
  const pref = await prisma.cureliMobilePushPreference.findUnique({
    where: { user_id: userId },
    select: {
      master_enabled: true,
      order_updates: true,
      promotions: true,
      prescription_updates: true,
      system_messages: true,
      cart_abandonment: true,
    },
  });

  // No preference row → all enabled by default
  if (!pref) return true;
  if (!pref.master_enabled) return false;

  // Map category string to column name
  const columnMap = {
    order_updates: "order_updates",
    promotions: "promotions",
    prescription_updates: "prescription_updates",
    system_messages: "system_messages",
    cart_abandonment: "cart_abandonment",
  };

  const column = columnMap[category];
  if (!column) return true; // Unknown category → allow

  return pref[column] ?? true;
}

/**
 * Get the active push token for a user.
 * Returns the most recently updated active session token.
 * A user may have multiple active sessions (multiple devices).
 *
 * @param {string} userId
 * @returns {Promise<string[]>} Array of push tokens (one per device)
 */
async function getUserPushTokens(userId) {
  const sessions = await prisma.cureliMobileSession.findMany({
    where: {
      user_id: userId,
      is_active: true,
      push_token: { not: null },
      // Only sessions that haven't expired
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
 * @param {Object[]} messages
 * @returns {Promise<Object[]>} tickets
 */
async function sendBatchToExpo(messages) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // Add Expo access token if you have one (optional for development)
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
 * Build an Expo message object from our notification data.
 *
 * @param {string} token - Expo push token
 * @param {string} title
 * @param {string} body
 * @param {string} category
 * @param {Object} data  - tap routing data
 * @returns {Object} Expo message
 */
function buildExpoMessage(token, title, body, category, data = {}) {
  return {
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: category === "order_updates" ? "high" : "normal",
    // Android-specific
    channelId: CATEGORY_CHANNEL_MAP[category] ?? "default",
    // iOS badge — we don't manage badge count server-side for now
    // badge:        undefined,
  };
}

// ── Core send functions ───────────────────────────────────────────────────────

/**
 * Send a push notification to a single user.
 *
 * This is the primary function called by event handlers
 * (order status changed, prescription updated, etc.)
 *
 * @param {Object} options
 * @param {string}   options.userId
 * @param {string}   options.title
 * @param {string}   options.body
 * @param {string}   options.category   - PUSH_CATEGORIES value
 * @param {Object}   [options.data]     - tap routing { screen, orderId, ... }
 * @param {string}   [options.campaignId] - set when sent from broadcast
 * @returns {Promise<{ notificationId: string, pushed: boolean }>}
 */
export async function sendPushToUser({
  userId,
  title,
  body,
  category,
  data = {},
  campaignId = null,
}) {
  // ── 1. Check preference ───────────────────────────────────────────────────
  // order_updates cannot be disabled (canDisable: false in constants)
  // but we still check master_enabled
  const enabled = await isUserCategoryEnabled(userId, category);
  if (!enabled) {
    console.log(
      `[Push] Skipping ${category} for user ${userId} — disabled by preference`,
    );
    // Still create the inbox record even if push is suppressed
    // so the user can see it in the notification center
  }

  // ── 2. Create inbox record ────────────────────────────────────────────────
  const notification = await prisma.cureliMobileNotification.create({
    data: {
      user_id: userId,
      title,
      body,
      category,
      data,
      campaign_id: campaignId,
      push_sent: false, // updated below if push succeeds
    },
  });

  if (!enabled) {
    return { notificationId: notification.id, pushed: false };
  }

  // ── 3. Get push tokens ────────────────────────────────────────────────────
  const tokens = await getUserPushTokens(userId);
  if (tokens.length === 0) {
    console.log(`[Push] No push token for user ${userId}`);
    return { notificationId: notification.id, pushed: false };
  }

  // ── 4. Send to Expo ───────────────────────────────────────────────────────
  try {
    const messages = tokens.map((token) =>
      buildExpoMessage(token, title, body, category, data),
    );

    const tickets = await sendBatchToExpo(messages);

    // Use the first successful ticket ID for the inbox record
    const successTicket = tickets.find((t) => t.status === "ok");
    const ticketId = successTicket?.id ?? null;

    // Handle DeviceNotRegistered — remove stale token
    tickets.forEach(async (ticket, index) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        const staleToken = tokens[index];
        console.log(`[Push] Removing stale token for user ${userId}`);
        await prisma.cureliMobileSession.updateMany({
          where: { push_token: staleToken },
          data: {
            push_token: null,
            push_token_type: null,
            push_token_updated_at: new Date(),
          },
        });
      }
    });

    // Update inbox record with ticket ID
    await prisma.cureliMobileNotification.update({
      where: { id: notification.id },
      data: {
        push_sent: true,
        push_ticket_id: ticketId,
      },
    });

    console.log(
      `[Push] Sent ${category} to user ${userId} (${tokens.length} device(s))`,
    );

    return { notificationId: notification.id, pushed: true };
  } catch (err) {
    console.error(`[Push] Failed to send to user ${userId}:`, err.message);
    return { notificationId: notification.id, pushed: false };
  }
}

/**
 * Send a push notification to multiple users.
 * Used by the cadmin mobile broadcast system.
 *
 * Batches messages into groups of 100 (Expo limit).
 * Creates inbox records for all users regardless of push success.
 *
 * @param {Object} options
 * @param {string[]}  options.userIds
 * @param {string}    options.title
 * @param {string}    options.body
 * @param {string}    options.category
 * @param {Object}    [options.data]
 * @param {string}    [options.campaignId]
 * @returns {Promise<{ targeted: number, pushed: number, failed: number }>}
 */
export async function sendPushToMany({
  userIds,
  title,
  body,
  category,
  data = {},
  campaignId = null,
}) {
  if (userIds.length === 0) {
    return { targeted: 0, pushed: 0, failed: 0 };
  }

  console.log(
    `[Push] Starting broadcast to ${userIds.length} users (category: ${category})`,
  );

  // ── 1. Get all tokens for all users in one query ──────────────────────────
  const sessions = await prisma.cureliMobileSession.findMany({
    where: {
      user_id: { in: userIds },
      is_active: true,
      push_token: { not: null },
      expires_at: { gt: new Date() },
    },
    select: {
      user_id: true,
      push_token: true,
    },
  });

  // ── ADD THESE THREE LINES RIGHT HERE ──────────────────────────────────────
  console.log("[Push Debug] userIds:", userIds);
  console.log("[Push Debug] sessions:", sessions);
  // ─────────────────────────────────────────────────────────────────────────

  // Build user_id → tokens[] map
  const userTokenMap = new Map();
  for (const session of sessions) {
    if (!session.push_token) continue;
    if (!userTokenMap.has(session.user_id)) {
      userTokenMap.set(session.user_id, new Set());
    }
    userTokenMap.get(session.user_id).add(session.push_token);
  }

  // ── ADD THIS LINE RIGHT HERE ──────────────────────────────────────────────
  console.log(
    "[Push Debug] userTokenMap keys:",
    Array.from(userTokenMap.keys()),
  );
  // ─────────────────────────────────────────────────────────────────────────

  // ── 2. Check preferences in bulk ─────────────────────────────────────────
  const preferences = await prisma.cureliMobilePushPreference.findMany({
    where: { user_id: { in: userIds } },
    select: {
      user_id: true,
      master_enabled: true,
      order_updates: true,
      promotions: true,
      prescription_updates: true,
      system_messages: true,
      cart_abandonment: true,
    },
  });

  const prefMap = new Map(preferences.map((p) => [p.user_id, p]));

  const columnMap = {
    order_updates: "order_updates",
    promotions: "promotions",
    prescription_updates: "prescription_updates",
    system_messages: "system_messages",
    cart_abandonment: "cart_abandonment",
  };
  const column = columnMap[category];

  // ── 3. Create inbox records for all users ─────────────────────────────────
  // createMany is much faster than individual creates for large audiences
  await prisma.cureliMobileNotification.createMany({
    data: userIds.map((userId) => ({
      user_id: userId,
      title,
      body,
      category,
      data,
      campaign_id: campaignId,
      push_sent: false,
    })),
    skipDuplicates: true,
  });

  // ── 4. Build message list (filtered by preference + token availability) ───
  const messages = []; // { token, userId }

  for (const userId of userIds) {
    const tokens = userTokenMap.get(userId);
    if (!tokens || tokens.size === 0) continue;

    // Check preference
    const pref = prefMap.get(userId);
    if (pref) {
      if (!pref.master_enabled) continue;
      if (column && pref[column] === false) continue;
    }
    // No pref row → send (default all enabled)

    for (const token of tokens) {
      messages.push({ token, userId });
    }
  }

  if (messages.length === 0) {
    console.log("[Push] No eligible recipients after preference filtering");
    return { targeted: userIds.length, pushed: 0, failed: 0 };
  }

  // ── 5. Send in batches of 100 ─────────────────────────────────────────────
  const batches = chunk(messages, EXPO_BATCH_SIZE);
  let pushed = 0;
  let failed = 0;
  const staleTokens = [];

  for (const batch of batches) {
    try {
      const expoMessages = batch.map(({ token }) =>
        buildExpoMessage(token, title, body, category, data),
      );

      const tickets = await sendBatchToExpo(expoMessages);

      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          pushed++;
        } else {
          failed++;
          // ── ADD THIS ──────────────────────────────────────────────────────────
          console.log(
            "[Push Debug] Expo ticket error:",
            JSON.stringify(ticket),
          );
          // ─────────────────────────────────────────────────────────────────────
          if (ticket.details?.error === "DeviceNotRegistered") {
            staleTokens.push(batch[index].token);
          }
        }
      });
    } catch (err) {
      // ── ADD THIS ──────────────────────────────────────────────────────────
      console.error(`[Push] Batch send failed FULL ERROR:`, err);
      // ─────────────────────────────────────────────────────────────────────
      failed += batch.length;
    }
  }

  // ── 6. Clean up stale tokens ──────────────────────────────────────────────
  if (staleTokens.length > 0) {
    console.log(`[Push] Removing ${staleTokens.length} stale token(s)`);
    await prisma.cureliMobileSession.updateMany({
      where: { push_token: { in: staleTokens } },
      data: {
        push_token: null,
        push_token_type: null,
        push_token_updated_at: new Date(),
      },
    });
  }

  // ── 7. Mark inbox records as push_sent for successful ones ────────────────
  // We bulk-mark all as sent for simplicity — per-user tracking is available
  // via the campaign_id + push_ticket_id if needed later
  if (pushed > 0) {
    await prisma.cureliMobileNotification.updateMany({
      where: {
        campaign_id: campaignId,
        user_id: { in: userIds },
        push_sent: false,
      },
      data: { push_sent: true },
    });
  }

  console.log(
    `[Push] Broadcast complete: ${pushed} pushed, ${failed} failed ` +
      `out of ${messages.length} messages to ${userIds.length} users`,
  );

  return { targeted: userIds.length, pushed, failed };
}

/**
 * Get Expo push receipts for previously sent tickets.
 * Call this ~15 minutes after sending to confirm delivery.
 * Intended to be called by a cron job.
 *
 * @param {string[]} ticketIds
 * @returns {Promise<Object>} receipt map { ticketId: receipt }
 */
export async function getPushReceipts(ticketIds) {
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
    console.error("[Push] Failed to fetch receipts:", err.message);
    return {};
  }
}

/**
 * Convenience wrappers for each notification type.
 * These are the functions called by event handlers throughout the app.
 */
export const MobilePush = {
  // ── Order notifications ───────────────────────────────────────────────────

  orderStatusChanged: (userId, orderId, orderNumber, newStatus) => {
    const statusLabels = {
      ACCEPTED: "Order Accepted",
      REJECTED: "Order Rejected",
      READY_FOR_PICKUP: "Order Ready",
      COMPLETED: "Order Completed",
      CANCELLED: "Order Cancelled",
    };

    const statusBodies = {
      ACCEPTED: `Your order ${orderNumber} has been accepted by the pharmacy.`,
      REJECTED: `Your order ${orderNumber} was rejected. Tap to see details.`,
      READY_FOR_PICKUP: `Your order ${orderNumber} is ready! Head to the pharmacy.`,
      COMPLETED: `Your order ${orderNumber} is complete. Thank you!`,
      CANCELLED: `Your order ${orderNumber} has been cancelled.`,
    };

    const title = statusLabels[newStatus] ?? "Order Update";
    const body =
      statusBodies[newStatus] ??
      `Your order ${orderNumber} status changed to ${newStatus}.`;

    return sendPushToUser({
      userId,
      title,
      body,
      category: "order_updates",
      data: {
        screen: "order_detail",
        orderId,
      },
    });
  },

  orderPlacedConfirmation: (userId, orderId, orderNumber) =>
    sendPushToUser({
      userId,
      title: "Order Placed!",
      body: `Your order ${orderNumber} has been placed. We'll notify you when the pharmacy accepts it.`,
      category: "order_updates",
      data: {
        screen: "order_detail",
        orderId,
      },
    }),

  // ── Prescription notifications ────────────────────────────────────────────

  prescriptionVerified: (userId) =>
    sendPushToUser({
      userId,
      title: "Prescription Verified",
      body: "Your prescription has been verified. You can now complete your order.",
      category: "prescription_updates",
      data: { screen: "home" },
    }),

  prescriptionRejected: (userId, reason) =>
    sendPushToUser({
      userId,
      title: "Prescription Rejected",
      body: reason
        ? `Your prescription was rejected: ${reason}`
        : "Your prescription was rejected. Please upload a valid prescription.",
      category: "prescription_updates",
      data: { screen: "prescription_upload" },
    }),

  prescriptionQuoteReceived: (userId, requestId, requestNumber, pharmacyName) =>
    sendPushToUser({
      userId,
      title: "Quote received!",
      body: `${pharmacyName} has sent you a quote for your prescription ${requestNumber}.`,
      category: "prescription_updates",
      data: {
        screen: "prescription_request_detail",
        requestId,
      },
    }),

  // ── System notifications ──────────────────────────────────────────────────

  accountSuspended: (userId) =>
    sendPushToUser({
      userId,
      title: "Account Suspended",
      body: "Your account has been suspended. Please contact support for assistance.",
      category: "system_messages",
      data: { screen: "home" },
    }),

  // ── Cart abandonment ──────────────────────────────────────────────────────

  cartAbandonment: (userId, itemCount) =>
    sendPushToUser({
      userId,
      title: "Items waiting in your cart",
      body: `You have ${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart. Complete your order before they run out!`,
      category: "cart_abandonment",
      data: { screen: "cart" },
    }),

  // ── Promotions (broadcast) ────────────────────────────────────────────────

  promotion: (
    userId,
    title,
    body,
    tapScreen = "home",
    tapParams = {},
    campaignId = null,
  ) =>
    sendPushToUser({
      userId,
      title,
      body,
      category: "promotions",
      data: { screen: tapScreen, ...tapParams },
      campaignId,
    }),

  ticketStatusUpdated: (userId, ticketId, ticketNumber, newStatus) => {
    const statusLabels = {
      IN_PROGRESS: "Support Ticket In Progress",
      RESOLVED: "Support Ticket Resolved",
      CLOSED: "Support Ticket Closed",
    };

    const statusBodies = {
      IN_PROGRESS: `Our support team is now reviewing your ticket #${ticketNumber}.`,
      RESOLVED: `Your ticket #${ticketNumber} has been marked as resolved. Tap to view details.`,
      CLOSED: `Your ticket #${ticketNumber} has been closed.`,
    };

    const title = statusLabels[newStatus] || "Ticket Update";
    const body =
      statusBodies[newStatus] ||
      `Your ticket #${ticketNumber} status changed to ${newStatus}.`;

    return sendPushToUser({
      userId,
      title,
      body,
      category: "order_updates",
      data: {
        screen: "ticket_detail",
        ticketId,
      },
    });
  },

  ticketReplyReceived: (userId, ticketId, ticketNumber, snippet) =>
    sendPushToUser({
      userId,
      title: `Reply on Ticket #${ticketNumber}`,
      body: snippet || "Support team sent you a response. Tap to view.",
      category: "order_updates",
      data: {
        screen: "ticket_detail",
        ticketId,
      },
    }),

  paymentRefunded: (userId, orderNumber, paymentStatus) => {
    const isPartial = paymentStatus === "PARTIALLY_REFUNDED";
    const label = isPartial ? "partially refunded" : "refunded";

    return sendPushToUser({
      userId,
      title: "Payment Refunded",
      body: `Your payment for order ${orderNumber} has been ${label}. Our team will review and process it shortly.`,
      category: "order_updates",
      data: {
        screen: "order_detail",
      },
    });
  },
};
