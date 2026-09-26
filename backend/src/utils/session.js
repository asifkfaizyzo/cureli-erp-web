// backend/src/utils/session.js (do not remove this comment)
// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\utils\session.js

import crypto from "crypto";
import prisma from "../config/prisma.js";

/**
 * Generate a secure random session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash session token for storage
 */
export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Parse User-Agent string to get device info
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) return "Unknown Device";

  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
    browser = "Opera";
  }

  // Detect OS
  if (userAgent.includes("Windows NT 10")) {
    os = "Windows 10/11";
  } else if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS X")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  }

  return `${browser} on ${os}`;
}

/**
 * Get client IP address from request
 */
export function getClientIp(req) {
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    "Unknown"
  );
}

/**
 * Create a new session for user, invalidating any existing sessions
 * @returns {string} Plain session token (to be included in JWT)
 */
export async function createUserSession(userId, req) {
  const sessionToken = generateSessionToken();
  const hashedToken = hashSessionToken(sessionToken);

  const deviceInfo = parseUserAgent(req.headers["user-agent"]);
  const ipAddress = getClientIp(req);

  // Session duration: 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Transaction: Invalidate old sessions + create new one
  await prisma.$transaction(async (tx) => {
    // 1. Get any active sessions for this user
    const existingSessions = await tx.userSession.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
      select: {
        id: true,
        device_info: true,
        ip_address: true,
      },
    });

    // 2. Invalidate all existing sessions
    if (existingSessions.length > 0) {
      await tx.userSession.updateMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        data: {
          is_active: false,
          ended_at: new Date(),
          ended_reason: "replaced",
        },
      });

      // 3. Log the session replacement in activity log
      for (const session of existingSessions) {
        await tx.activityLog.create({
          data: {
            user_id: userId,
            action: "session_replaced",
            description: `Logged out from ${session.device_info || "unknown device"} due to new login`,
            ip_address: ipAddress,
            user_agent: req.headers["user-agent"],
          },
        });
      }
    }

    // 4. Create new session
    await tx.userSession.create({
      data: {
        user_id: userId,
        session_token: hashedToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        expires_at: expiresAt,
      },
    });

    // 5. Log new login
    await tx.activityLog.create({
      data: {
        user_id: userId,
        action: "login",
        description: `Logged in from ${deviceInfo}`,
        ip_address: ipAddress,
        user_agent: req.headers["user-agent"],
      },
    });
  });

  return sessionToken;
}

/**
 * Validate session is still active
 * @returns {Object|null} Session object if valid, null otherwise
 */
export async function validateUserSession(userId, sessionToken) {
  const hashedToken = hashSessionToken(sessionToken);

  const session = await prisma.userSession.findFirst({
    where: {
      user_id: userId,
      session_token: hashedToken,
      is_active: true,
      expires_at: { gt: new Date() },
    },
  });

  if (!session) {
    return null;
  }

  // Update last active timestamp (throttled - only update if older than 1 minute)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  if (session.last_active_at < oneMinuteAgo) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { last_active_at: new Date() },
    }).catch(() => {}); // Non-blocking update
  }

  return session;
}

/**
 * Invalidate session (logout)
 */
export async function invalidateUserSession(userId, sessionToken, reason = "logout") {
  const hashedToken = hashSessionToken(sessionToken);

  await prisma.userSession.updateMany({
    where: {
      user_id: userId,
      session_token: hashedToken,
      is_active: true,
    },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: reason,
    },
  });
}

/**
 * Invalidate all sessions for a user (logout from all devices)
 */
export async function invalidateAllUserSessions(userId, reason = "logout_all") {
  await prisma.userSession.updateMany({
    where: {
      user_id: userId,
      is_active: true,
    },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: reason,
    },
  });
}

/**
 * Cleanup expired sessions (run via cron)
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.userSession.updateMany({
    where: {
      is_active: true,
      expires_at: { lt: new Date() },
    },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: "expired",
    },
  });

  return result.count;
}

/**
 * Get active session info for a user (for settings page)
 */
export async function getUserActiveSession(userId) {
  return prisma.userSession.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: { gt: new Date() },
    },
    select: {
      id: true,
      device_info: true,
      ip_address: true,
      created_at: true,
      last_active_at: true,
      expires_at: true,
    },
  });
}

/**
 * Get recent session history for a user
 */
export async function getUserSessionHistory(userId, limit = 10) {
  return prisma.userSession.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      device_info: true,
      ip_address: true,
      is_active: true,
      created_at: true,
      ended_at: true,
      ended_reason: true,
    },
  });
}