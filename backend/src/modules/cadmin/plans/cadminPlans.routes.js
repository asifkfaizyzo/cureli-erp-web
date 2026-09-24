// backend/src/modules/cadmin/plans/cadminPlans.routes.js (do not remove this comment)
// backend/src/modules/cadmin/plans/cadminPlans.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import { validate } from "../../../middleware/validate.js";
import {
  createPlanSchema,
  updatePlanSchema,
  clonePlanSchema,
  listPlansQuerySchema,
} from "./cadminPlans.schema.js";
import {
  listPlansController,
  getPlanStatsController,
  getPlanByIdController,
  createPlanController,
  updatePlanController,
  activatePlanController,
  suspendPlanController,
  reactivatePlanController,
  clonePlanController,
  deletePlanController,
} from "./cadminPlans.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ── READ ─────────────────────────────────────────────────────────────────────

// stats MUST be before /:plan_id
router.get(
  "/plans/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_VIEW_STATS),
  getPlanStatsController
);

router.get(
  "/plans",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_VIEW),
  validate(listPlansQuerySchema, "query"),
  listPlansController
);

router.get(
  "/plans/:plan_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_VIEW_DETAIL),
  getPlanByIdController
);

// ── CREATE ───────────────────────────────────────────────────────────────────

router.post(
  "/plans",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_CREATE),
  validate(createPlanSchema),
  createPlanController
);

// ── UPDATE ───────────────────────────────────────────────────────────────────

router.patch(
  "/plans/:plan_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_EDIT),
  validate(updatePlanSchema),
  updatePlanController
);

// ── LIFECYCLE ────────────────────────────────────────────────────────────────

router.post(
  "/plans/:plan_id/activate",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_ACTIVATE),
  activatePlanController
);

router.post(
  "/plans/:plan_id/suspend",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_SUSPEND),
  suspendPlanController
);

router.post(
  "/plans/:plan_id/reactivate",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_REACTIVATE),
  reactivatePlanController
);

router.post(
  "/plans/:plan_id/clone",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_CLONE),
  validate(clonePlanSchema),
  clonePlanController
);

// ── DELETE ───────────────────────────────────────────────────────────────────

router.delete(
  "/plans/:plan_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_DELETE),
  deletePlanController
);

export default router;