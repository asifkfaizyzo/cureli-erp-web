// backend/src/modules/notifications/user/userNotifications.routes.js (do not remove this comment)
// ============================================
// backend/src/modules/notifications/user/userNotifications.routes.js
// ============================================

import { Router } from "express";
import jwt from "jsonwebtoken";
import * as controller from "./userNotifications.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import { ACCESS_SECRET } from "../../../config/jwt.js";
import { sseService } from "../../../services/sse.service.js";
import { validateUserSession } from "../../../utils/session.js";
import prisma from "../../../config/prisma.js";
import {
  listNotificationsSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  deleteNotificationSchema,
  clearInventoryAlertsSchema,
} from "./userNotifications.schema.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SSE Stream Route
// NOTE: Registered BEFORE router.use(requireAuth) — does inline JWT auth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/notifications/stream
 * @desc    SSE stream for real-time notifications
 * @access  Public (inline JWT verification)
 */
router.get("/stream", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    // Validate session if session_id is present in payload
    if (payload.session_id) {
      const session = await validateUserSession(
        payload.user_id,
        payload.session_id,
      );
      if (!session) return res.status(401).end();
    }

    const userId = payload.user_id;

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // ← tells Nginx not to buffer even without location block
    });

    // Register client with SSE service
    sseService.addUserClient(userId, res);

    // Send initial connected event with unread count
    const unreadCount = await prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
    res.write(
      sseService.formatSSEMessage("connected", { unread_count: unreadCount }),
    );

    // Heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 30000);

    // Cleanup on client disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      sseService.removeUserClient(userId, res);
    });
  } catch (err) {
    return res.status(401).end();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Protected Routes
// NOTE: requireAuth middleware applied to ALL routes below this point
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get paginated list of notifications
 * @access  Private
 */
router.get(
  "/",
  validate(listNotificationsSchema.query, "query"),
  controller.listNotifications,
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count (for badge)
 * @access  Private
 */
router.get("/unread-count", controller.getUnreadCount);

/**
 * @route   GET /api/notifications/recent
 * @desc    Get recent notifications (for dropdown)
 * @access  Private
 */
router.get("/recent", controller.getRecentNotifications);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 * @note    Must come BEFORE /:id routes to avoid param conflict
 */
router.patch(
  "/read-all",
  validate(markAllAsReadSchema.body, "body"),
  controller.markAllAsRead,
);

/**
 * @route   POST /api/notifications/clear-inventory-alerts
 * @desc    Clear inventory alerts for a specific item
 * @access  Private
 */
router.post(
  "/clear-inventory-alerts",
  validate(clearInventoryAlertsSchema.body, "body"),
  controller.clearInventoryAlerts,
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification
 * @access  Private
 */
router.get(
  "/:id",
  validate(markAsReadSchema.params, "params"),
  controller.getNotification,
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch(
  "/:id/read",
  validate(markAsReadSchema.params, "params"),
  controller.markAsRead,
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete(
  "/:id",
  validate(deleteNotificationSchema.params, "params"),
  controller.deleteNotification,
);

export default router;
