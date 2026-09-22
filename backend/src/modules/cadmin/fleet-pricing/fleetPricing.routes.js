// backend/src/modules/cadmin/fleet-pricing/fleetPricing.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { validate } from "../../../middleware/validate.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";

import * as controller from "./fleetPricing.controller.js";
import * as schemas from "./fleetPricing.schema.js";

const router = Router();

router.use(requireCAdmin);

// ── Base Pay & Slabs ─────────────────────────────────────────────────────────
router.get(
  "/config",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_VIEW),
  controller.getPricingConfigHandler
);

router.post(
  "/config",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_MANAGE_BASE),
  validate(schemas.createPricingConfigSchema),
  controller.createPricingConfigHandler
);

router.get(
  "/history",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_VIEW),
  controller.getPricingHistoryHandler
);

router.post(
  "/simulate",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_VIEW),
  validate(schemas.simulatePricingSchema),
  controller.simulatePricingHandler
);

// ── Surge Pricing ────────────────────────────────────────────────────────────
router.get(
  "/surge",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_VIEW),
  controller.getSurgeRulesHandler
);

router.post(
  "/surge",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_MANAGE_SURGE),
  validate(schemas.createSurgeRuleSchema),
  controller.createSurgeRuleHandler
);

router.patch(
  "/surge/:id/toggle",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_MANAGE_SURGE),
  validate(schemas.toggleSurgeRuleSchema),
  controller.toggleSurgeRuleHandler
);

router.delete(
  "/surge/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_PRICING_MANAGE_SURGE),
  controller.deleteSurgeRuleHandler
);

export default router;