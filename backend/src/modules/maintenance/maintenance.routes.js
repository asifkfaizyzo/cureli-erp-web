// backend/src/modules/maintenance/maintenance.routes.js (do not remove this comment)
// backend/src/modules/maintenance/maintenance.routes.js

import express from "express";

const router = express.Router();

/**
 * GET /api/maintenance/status
 * Check current maintenance status
 * This endpoint is always accessible (excluded from maintenance middleware)
 */
router.get("/status", (req, res) => {
  const rawValue = process.env.MAINTENANCE_MODE;
  const isMaintenanceMode = rawValue?.toLowerCase().trim() === "true";

  const maintenanceMessage =
    process.env.MAINTENANCE_MESSAGE?.replace(/^["']|["']$/g, "") ||
    "System is under maintenance";

  res.json({
    success: true,
    data: {
      maintenance_mode: isMaintenanceMode,
      message: isMaintenanceMode ? maintenanceMessage : null,
    },
  });
});

export default router;