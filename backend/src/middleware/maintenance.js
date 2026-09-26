// backend/src/middleware/maintenance.js (do not remove this comment)
// backend/src/middleware/maintenance.js

/**
 * Maintenance Mode Middleware
 * When MAINTENANCE_MODE=true, all requests return 503 except for:
 * - Allowed IPs (admins)
 * - Excluded paths (health checks, maintenance status)
 * - CAdmin routes (so admins can still work)
 */

const maintenanceMiddleware = (req, res, next) => {
  // Get raw value and trim it
  const rawValue = process.env.MAINTENANCE_MODE;
  const isMaintenanceMode = rawValue?.toLowerCase().trim() === "true";

  // Skip if maintenance mode is off
  if (!isMaintenanceMode) {
    return next();
  }

  // Get client IP
  const clientIp = getClientIp(req);

  // Allowed IPs (comma-separated in env)
  const allowedIpsStr = process.env.MAINTENANCE_ALLOWED_IPS || "";
  const allowedIps = allowedIpsStr
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  // Paths that should always work
  const excludedPaths = [
    "/api/health",
    "/api/maintenance",
    "/cadmin",
    "/favicon.ico",
    "/uploads",
  ];

  // Check if path is excluded
  const isExcludedPath = excludedPaths.some(
    (excludedPath) =>
      req.path === excludedPath || req.path.startsWith(excludedPath + "/"),
  );

  if (isExcludedPath) {
    return next();
  }

  // Check if IP is allowed (only if there are allowed IPs configured)
  if (allowedIps.length > 0) {
    const isAllowedIp = allowedIps.some(
      (allowedIp) => clientIp === allowedIp || clientIp.includes(allowedIp),
    );

    if (isAllowedIp) {
      return next();
    }
  }

  // Return maintenance response
  const maintenanceMessage =
    process.env.MAINTENANCE_MESSAGE?.replace(/^["']|["']$/g, "") ||
    "We are currently performing scheduled maintenance. Please check back soon.";

  // Set header for pharmacy-web to detect
  res.setHeader("X-Maintenance-Mode", "true");

  return res.status(503).json({
    success: false,
    error: "maintenance",
    message: maintenanceMessage,
    data: {
      maintenance_mode: true,
      retry_after: 3600,
    },
  });
};

/**
 * Extract client IP from request
 * Handles proxies and load balancers
 */
const getClientIp = (req) => {
  // X-Forwarded-For (proxy/load balancer)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // X-Real-IP (nginx)
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return realIp.trim();
  }

  // Direct connection
  const ip =
    req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "";
  return ip;
};

export default maintenanceMiddleware;
