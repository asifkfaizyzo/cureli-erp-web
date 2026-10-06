// backend/src/modules/cadmin/commission/cadmin.commission.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import * as ctrl from "./cadmin.commission.controller.js";

const router = Router();

router.use(requireCAdmin);

// ── Rules ──────────────────────────────────
router.get("/marketplace/commission/rules", ctrl.listRulesHandler);
router.post("/marketplace/commission/rules", ctrl.createRuleHandler);
router.get("/marketplace/commission/rules/:id", ctrl.getRuleDetailHandler);
router.put("/marketplace/commission/rules/:id", ctrl.updateRuleHandler);
router.delete("/marketplace/commission/rules/:id", ctrl.deleteRuleHandler);
router.patch("/marketplace/commission/rules/:id/set-default", ctrl.setDefaultHandler);
router.patch("/marketplace/commission/rules/:id/toggle-active", ctrl.toggleActiveHandler);

// ── Global Suspension ──────────────────────
router.patch("/marketplace/commission/suspend", ctrl.suspendHandler);
router.patch("/marketplace/commission/resume", ctrl.resumeHandler);

// ── Overrides ──────────────────────────────
router.get("/marketplace/commission/overrides", ctrl.listOverridesHandler);
router.post("/marketplace/commission/overrides", ctrl.assignOverrideHandler);
router.delete("/marketplace/commission/overrides/:id", ctrl.removeOverrideHandler);

export default router;