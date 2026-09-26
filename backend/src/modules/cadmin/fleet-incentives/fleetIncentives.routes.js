// backend/src/modules/cadmin/fleet-incentives/fleetIncentives.routes.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-incentives/fleetIncentives.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { validate } from "../../../middleware/validate.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";

import * as controller from "./fleetIncentives.controller.js";
import * as schemas from "./fleetIncentives.schema.js";

const router = Router();

router.use(requireCAdmin);

// ── Template Library ─────────────────────────────────────────────────────────
router.get(
  "/templates",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_VIEW),
  controller.getTemplatesHandler
);

router.get(
  "/templates/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_VIEW),
  controller.getTemplateDetailHandler
);

router.post(
  "/templates",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  validate(schemas.createTemplateSchema),
  controller.createTemplateHandler
);

router.put(
  "/templates/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  validate(schemas.updateTemplateSchema),
  controller.updateTemplateHandler
);

router.patch(
  "/templates/:id/toggle",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  controller.toggleTemplateHandler
);

// ── Calendar & Schedules ─────────────────────────────────────────────────────
router.get(
  "/calendar",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_VIEW),
  controller.getCalendarScheduleHandler
);

router.post(
  "/calendar/assign",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  validate(schemas.assignScheduleSchema),
  controller.assignScheduleHandler
);

router.post(
  "/calendar/bulk-assign",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  validate(schemas.bulkAssignSchema),
  controller.bulkAssignHandler
);

router.delete(
  "/calendar/:scheduleId",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  controller.deleteScheduleHandler
);

// ── Manual Shift Evaluation ──────────────────────────────────────────────────
router.post(
  "/evaluate-shift",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE),
  validate(schemas.evaluateShiftSchema),
  controller.evaluateShiftHandler
);

export default router;