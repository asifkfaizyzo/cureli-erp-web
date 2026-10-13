// backend/src/modules/mobile/push/mobile.push.service.js (do not remove this comment)
// backend/src/modules/mobile/push/mobile.push.service.js
//
// Core push notification service for Cureli Mobile.

import prisma from "../../../config/prisma.js";

// ── Expo Push API ─────────────────────────────────────────────────────────────
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

// Expo enforces a max of 100 messages per batch request
const EXPO_BATCH_SIZE = 100;

// ── Category → Android channel mapping ───────────────────────────────────────
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

  if (!pref) return true;
  if (!pref.master_enabled) return false;

  const columnMap = {
    order_updates: "order_updates",
    promotions: "promotions",
    prescription_updates: "prescription_updates",
    system_messages: "system_messages",
    cart_abandonment: "cart_abandonment",
  };

  const column = columnMap[category];
  if (!column) return true;

  return pref[column] ?? true;
}

/**
 * Get the active push token for a user.
 */
async function getUserPushTokens(userId) {
  const sessions = await prisma.cureliMobileSession.findMany({
    where: {
      user_id: userId,
      is_active: true,
      push_token: { not: null },
      expires_at: { gt: new Date() },
    },
    select: {
      push_token: true,
    },
    orderBy: { push_token_updated_at: "desc" },
  });

  const unique = [
    ...new Set(sessions.map((s) => s.push_token).filter(Boolean)),
  ];

  return unique;
}

/**
 * Send a batch of messages to the Expo Push API.
 */
async function sendBatchToExpo(messages) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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
 */
function buildExpoMessage(token, title, body, category, data = {}) {
  return {
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: category === "order_updates" ? "high" : "normal",
    channelId: CATEGORY_CHANNEL_MAP[category] ?? "default",
  };
}

// ── Core send functions ───────────────────────────────────────────────────────

/**
 * Send a push notification to a single user.
 */
export async function sendPushToUser({
  userId,
  title,
  body,
  category,
  data = {},
  campaignId = null,
}) {
  const enabled = await isUserCategoryEnabled(userId, category);
  if (!enabled) {
    console.log(
      `[Push] Skipping ${category} for user ${userId} — disabled by preference`,
    );
  }

  // 1. Create inbox record
  const notification = await prisma.cureliMobileNotification.create({
    data: {
      user_id: userId,
      title,
      body,
      category,
      data,
      campaign_id: campaignId,
      push_sent: false,
    },
  });

  // 2. Emit SSE event for real-time bell badge (promotions & system only)
  //    Order/prescription/delivery updates already have their own SSE events.
  if (category === "promotions" || category === "system_messages") {
    try {
      const { sseService } = await import("../../../services/sse.service.js");
      const unreadCount = await prisma.cureliMobileNotification.count({
        where: { user_id: userId, is_read: false },
      });
      sseService.notifyMobile(userId, "new_notification", {
        category,
        unread_count: unreadCount,
        notification_id: notification.id,
      });
    } catch (sseErr) {
      console.error("[Push] SSE notify failed:", sseErr.message);
    }
  }

  if (!enabled) {
    return { notificationId: notification.id, pushed: false };
  }

  // 2. Get push tokens
  const tokens = await getUserPushTokens(userId);
  if (tokens.length === 0) {
    console.log(`[Push] No push token for user ${userId}`);
    return { notificationId: notification.id, pushed: false };
  }

  // 3. Send to Expo
  try {
    const messages = tokens.map((token) =>
      buildExpoMessage(token, title, body, category, data),
    );

    const tickets = await sendBatchToExpo(messages);

    const successTicket = tickets.find((t) => t.status === "ok");
    const ticketId = successTicket?.id ?? null;

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
 * Flush any pending notifications for a user whose push token was just registered.
 */
export async function flushPendingUserPushes(userId) {
  try {
    const pending = await prisma.cureliMobileNotification.findMany({
      where: {
        user_id: userId,
        push_sent: false,
        created_at: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // created in last 10 mins
      },
      orderBy: { created_at: "asc" },
    });

    if (pending.length === 0) return;

    const tokens = await getUserPushTokens(userId);
    if (tokens.length === 0) return;

    for (const notif of pending) {
      const enabled = await isUserCategoryEnabled(userId, notif.category);
      if (!enabled) continue;

      const messages = tokens.map((token) =>
        buildExpoMessage(
          token,
          notif.title,
          notif.body,
          notif.category,
          notif.data || {},
        ),
      );

      const tickets = await sendBatchToExpo(messages);
      const successTicket = tickets.find((t) => t.status === "ok");

      if (successTicket) {
        await prisma.cureliMobileNotification.update({
          where: { id: notif.id },
          data: {
            push_sent: true,
            push_ticket_id: successTicket.id,
          },
        });
      }
    }
  } catch (err) {
    console.error(
      `[Push] Failed to flush pending pushes for user ${userId}:`,
      err.message,
    );
  }
}

/**
 * Send a push notification to multiple users (broadcast).
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

  const userTokenMap = new Map();
  for (const session of sessions) {
    if (!session.push_token) continue;
    if (!userTokenMap.has(session.user_id)) {
      userTokenMap.set(session.user_id, new Set());
    }
    userTokenMap.get(session.user_id).add(session.push_token);
  }

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

  const messages = [];

  for (const userId of userIds) {
    const tokens = userTokenMap.get(userId);
    if (!tokens || tokens.size === 0) continue;

    const pref = prefMap.get(userId);
    if (pref) {
      if (!pref.master_enabled) continue;
      if (column && pref[column] === false) continue;
    }

    for (const token of tokens) {
      messages.push({ token, userId });
    }
  }

  if (messages.length === 0) {
    console.log("[Push] No eligible recipients after preference filtering");
    return { targeted: userIds.length, pushed: 0, failed: 0 };
  }

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
          if (ticket.details?.error === "DeviceNotRegistered") {
            staleTokens.push(batch[index].token);
          }
        }
      });
    } catch (err) {
      console.error(`[Push] Batch send failed:`, err);
      failed += batch.length;
    }
  }

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

  return { targeted: userIds.length, pushed, failed };
}

/**
 * Get Expo push receipts for previously sent tickets.
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
 * Convenience wrappers for push notification triggers.
 */
export const MobilePush = {
  // ── Welcome Notification ──────────────────────────────────────────────────
  welcomeUser: (userId, userName) =>
    sendPushToUser({
      userId,
      title: "Welcome to Cureli",
      body: "Your account is all set. Discover trusted pharmacies near you, order medicines, or upload prescriptions with ease.",
      category: "system_messages",
      data: { screen: "home" },
    }),

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
      READY_FOR_PICKUP: `Your order ${orderNumber} is ready! Rider will soon bring it to you.`,
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
