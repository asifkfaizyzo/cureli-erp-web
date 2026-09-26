// backend/src/modules/notifications/cadmin/cadminNotifications.routes.js (do not remove this comment)
//backend\src\modules\notifications\cadmin\cadminNotifications.routes.js

import { Router } from "express";
import * as controller from "./cadminNotifications.controller.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { validate } from "../../../middleware/validate.js";
import prisma from "../../../config/prisma.js";
import * as schema from "./cadminNotifications.schema.js";
import { sseService } from "../../../services/sse.service.js";
import { 
  verifyCAdminAccessToken, 
  verifyCAdminRefreshToken 
} from "../../../utils/cadminTokens.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SSE Stream Route
// Supports query token, cookie refresh token, and Authorization header
// ─────────────────────────────────────────────────────────────────────────────

router.get("/notifications/stream", async (req, res) => {
  const queryToken = req.query.token;
  const cookieToken = req.cookies?.cadmin_refresh_token;
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  const candidateToken = queryToken || cookieToken || headerToken;

  if (!candidateToken) {
    console.warn("[SSE Auth] No token provided in query, cookie, or header");
    return res.status(401).json({ error: "Missing token" });
  }

  let payload = null;

  // 1. Try verifying as Access Token (Query or Header)
  try {
    payload = verifyCAdminAccessToken(candidateToken);
  } catch (accessErr) {
    // 2. Fallback: Try candidate as Refresh Token
    try {
      payload = verifyCAdminRefreshToken(candidateToken);
    } catch (refreshErr) {
      // 3. Fallback: Try Cookie if candidate was query token
      if (cookieToken && cookieToken !== candidateToken) {
        try {
          payload = verifyCAdminRefreshToken(cookieToken);
        } catch (cookieErr) {
          console.error("[SSE Auth] All token verifications failed:", {
            accessError: accessErr.message,
            refreshError: refreshErr.message,
            cookieError: cookieErr.message,
          });
          return res.status(401).json({ error: "Invalid token" });
        }
      } else {
        console.error("[SSE Auth] Token verification failed:", {
          accessError: accessErr.message,
          refreshError: refreshErr.message,
        });
        return res.status(401).json({ error: "Invalid token" });
      }
    }
  }

  if (!payload?.cadmin_id) {
    console.error("[SSE Auth] Payload missing cadmin_id:", payload);
    return res.status(401).json({ error: "Invalid payload" });
  }

  try {
    // Verify admin exists and is active
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id: payload.cadmin_id },
      select: { cadmin_id: true, is_active: true },
    });

    if (!admin) {
      console.warn(`[SSE Auth] Admin ${payload.cadmin_id} not found in database`);
      return res.status(401).json({ error: "Admin not found" });
    }

    if (!admin.is_active) {
      console.warn(`[SSE Auth] Admin ${payload.cadmin_id} is deactivated`);
      return res.status(403).json({ error: "Account disabled" });
    }

    const cadminId = admin.cadmin_id;

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true",
    });

    // Register active connection
    sseService.addCAdminClient(cadminId, res);
    console.log(`[SSE] CAdmin ${cadminId} connected successfully`);

    // Send connected event with unread count
    const unreadCount = await prisma.notification.count({
      where: { cadmin_id: cadminId, is_read: false },
    });

    res.write(
      `event: connected\ndata: ${JSON.stringify({ unread_count: unreadCount })}\n\n`
    );

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      sseService.removeCAdminClient(cadminId, res);
      console.log(`[SSE] CAdmin ${cadminId} disconnected`);
    });
  } catch (dbErr) {
    console.error("[SSE] Database/Server error:", dbErr);
    return res.status(500).end();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Protected Routes
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireCAdmin);

router.get(
  "/notifications/",
  validate(schema.listNotificationsQuerySchema, "query"),
  controller.listNotifications,
);

router.get("/notifications/unread-count", controller.getUnreadCount);

router.get("/notifications/recent", controller.getRecentNotifications);

router.patch(
  "/notifications/read-all",
  validate(schema.markAllAsReadBodySchema, "body"),
  controller.markAllAsRead,
);

router.get(
  "/notifications/:id",
  validate(schema.notificationIdParamSchema, "params"),
  controller.getNotification,
);

router.patch(
  "/notifications/:id/read",
  validate(schema.notificationIdParamSchema, "params"),
  controller.markAsRead,
);

router.delete(
  "/notifications/:id",
  validate(schema.notificationIdParamSchema, "params"),
  controller.deleteNotification,
);

export default router;