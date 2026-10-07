// backend/src/modules/cadmin/pharmacy-payouts/cadmin.pharmacyPayouts.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import * as ctrl from "./cadmin.pharmacyPayouts.controller.js";

const router = express.Router();

// Step 1: Ensure all endpoints require valid CAdmin sessions
router.use(requireCAdmin);

const BASE = "/pharmacy-payouts";

// Step 2: Bind Read/View Endpoints to View Permissions
router.get(
  BASE,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_VIEW),
  ctrl.listPayouts
);
router.get(
  `${BASE}/export`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_VIEW),
  ctrl.exportCSV
);
router.get(
  `${BASE}/:shopId`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_VIEW),
  ctrl.getPayoutDetail
);
router.get(
  `${BASE}/:shopId/history`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_VIEW),
  ctrl.getHistory
);

// Step 3: Bind Calculation and Modification Endpoints to Management Write Permissions
router.post(
  `${BASE}/:shopId/refresh`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.refreshPayout
);
router.post(
  `${BASE}/refresh-all`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.refreshAllPayouts
);
router.post(
  `${BASE}/finalize`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.finalizeWeek
);

router.post(
  `${BASE}/:payoutId/process`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.processPayout
);
router.post(
  `${BASE}/:payoutId/complete`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.completePayout
);
router.post(
  `${BASE}/:payoutId/fail`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.failPayout
);
router.post(
  `${BASE}/:payoutId/retry`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.retryPayout
);

router.put(
  `${BASE}/:payoutId/adjustments`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.updateAdjustments
);
router.post(
  `${BASE}/:payoutId/notes`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.addNote
);

router.post(
  `${BASE}/bulk-process`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.bulkProcess
);
router.post(
  `${BASE}/bulk-complete`,
  requireCAdminPermission(CADMIN_PERMISSIONS.MARKETPLACE_PAYOUTS_MANAGE),
  ctrl.bulkComplete
);

export default router;