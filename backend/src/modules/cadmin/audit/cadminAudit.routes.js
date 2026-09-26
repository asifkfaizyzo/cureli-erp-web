// backend/src/modules/cadmin/audit/cadminAudit.routes.js (do not remove this comment)
// backend/src/modules/cadmin/audit/cadminAudit.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import * as auditController from "./cadminAudit.controller.js";

const router = Router();

// GET /cadmin/audits
// NOTE: stats route MUST be before /:audit_id to avoid route conflict
router.get(
  "/audits/stats",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.AUDIT_VIEW_STATS),
  auditController.getAuditStats
);

// GET /cadmin/audits/export/csv
router.get(
  "/audits/export/csv",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.AUDIT_EXPORT),
  auditController.exportAuditLogsCSV
);

// GET /cadmin/audits
router.get(
  "/audits",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.AUDIT_VIEW),
  auditController.getAuditLogs
);

// GET /cadmin/audits/:audit_id
router.get(
  "/audits/:audit_id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.AUDIT_VIEW_DETAIL),
  auditController.getAuditLogById
);

export default router;