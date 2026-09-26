// backend/src/modules/mobile/notifications/mobile.notifications.controller.js (do not remove this comment)
// backend/src/modules/mobile/notifications/mobile.notifications.controller.js

import { verifyMobileAccessToken } from '../../../config/mobile_jwt.js';
import prisma from '../../../config/prisma.js';
import { sseService } from '../../../services/sse.service.js';

/**
 * GET /mobile/notifications/stream?token=<access_token>
 *
 * Establishes an SSE connection for a mobile customer.
 * Auth is handled inline (token from query param, not Authorization header).
 *
 * Events emitted to this connection:
 *   connected              { customer_id }
 *   order_status_changed   { order_id, order_number, new_status }
 *   heartbeat              {} (every 30s — keeps connection alive through proxies)
 */
export async function streamMobileNotifications(req, res) {
  // ── 1. Extract token from query string ────────────────────────────────────
  const token = req.query.token;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // ── 2. Verify JWT ─────────────────────────────────────────────────────────
  let payload;
  try {
    payload = verifyMobileAccessToken(token);
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  const { sub: userId, sessionId } = payload;

  // ── 3. Validate session and user (mirrors mobileAuth logic) ───────────────
  let session;
  try {
    session = await prisma.cureliMobileSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
  } catch {
    res.status(401).json({ success: false, message: 'Authentication failed' });
    return;
  }

  if (!session || session.user_id !== userId || !session.is_active || session.revoked_at) {
    res.status(401).json({ success: false, message: 'Session invalid' });
    return;
  }

  if (new Date() > new Date(session.expires_at)) {
    res.status(401).json({ success: false, message: 'Session expired' });
    return;
  }

  const user = session.user;

  if (
    user.logout_all_issued_at &&
    new Date(session.created_at) < new Date(user.logout_all_issued_at)
  ) {
    res.status(401).json({ success: false, message: 'Session invalidated' });
    return;
  }

  if (user.deleted_at || user.status === 'deleted' || user.status === 'suspended') {
    res.status(403).json({ success: false, message: 'Account unavailable' });
    return;
  }

  const customerId = user.id;

  // ── 4. Establish SSE connection ───────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  // Register connection
  sseService.addMobileClient(customerId, res);

  // Send connected confirmation
  res.write(
    `event: connected\ndata: ${JSON.stringify({ customer_id: customerId })}\n\n`,
  );

  // ── 5. Heartbeat every 30 seconds ─────────────────────────────────────────
  // Prevents proxies and mobile OS from closing idle connections.
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({})}\n\n`);
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 30_000);

  // ── 6. Cleanup on client disconnect ──────────────────────────────────────
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    sseService.removeMobileClient(customerId, res);
    console.log(`[MobileSSE] Customer ${customerId} disconnected`);
  });

  console.log(`[MobileSSE] Customer ${customerId} connected`);
}