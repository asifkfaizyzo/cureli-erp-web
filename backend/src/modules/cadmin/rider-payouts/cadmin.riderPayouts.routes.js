// backend\src\modules\cadmin\rider-payouts\cadmin.riderPayouts.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { validate } from "../../../middleware/validate.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";

import * as controller from "./cadmin.riderPayouts.controller.js";
import * as schemas from "./cadmin.riderPayouts.schema.js";

const router = Router();
router.use(requireCAdmin);

const VIEW = requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_RIDER_PAYOUTS_VIEW);
const MANAGE = requireCAdminPermission(CADMIN_PERMISSIONS.FLEET_RIDER_PAYOUTS_MANAGE);

// ── List & Detail ──────────────────────────────────────────────
router.get("/", VIEW, validate(schemas.listRiderPayoutsSchema, "query"), controller.listRiderPayoutsHandler);
router.get("/:riderId", VIEW, controller.getRiderPayoutDetailHandler);

// ── Refresh ────────────────────────────────────────────────────
router.post("/:riderId/refresh", MANAGE, validate(schemas.weekStartBodySchema), controller.refreshRiderPayoutHandler);
router.post("/refresh-all", MANAGE, validate(schemas.refreshAllSchema), controller.refreshAllRiderPayoutsHandler);

// ── Finalize ───────────────────────────────────────────────────
router.post("/finalize", MANAGE, validate(schemas.weekStartBodySchema), controller.finalizeWeekHandler);

// ── Status Transitions ─────────────────────────────────────────
router.post("/:payoutId/process", MANAGE, validate(schemas.processPayoutSchema), controller.processPayoutHandler);
router.post("/:payoutId/complete", MANAGE, validate(schemas.completePayoutSchema), controller.completePayoutHandler);
router.post("/:payoutId/fail", MANAGE, validate(schemas.failPayoutSchema), controller.failPayoutHandler);
router.post("/:payoutId/retry", MANAGE, validate(schemas.retryPayoutSchema), controller.retryPayoutHandler);

// ── Deductions & Notes ─────────────────────────────────────────
router.put("/:payoutId/deductions", MANAGE, validate(schemas.updateDeductionsSchema), controller.updateDeductionsHandler);
router.post("/:payoutId/notes", MANAGE, validate(schemas.addNoteSchema), controller.addNoteHandler);

// ── TEAM Payout Management ─────────────────────────────────────
router.post("/team", MANAGE, validate(schemas.createTeamPayoutSchema), controller.createTeamPayoutHandler);
router.put("/:payoutId/team-amount", MANAGE, validate(schemas.updateTeamAmountSchema), controller.updateTeamAmountHandler);

// ── Attendance ─────────────────────────────────────────────────
router.get("/:riderId/attendance", VIEW, validate(schemas.attendanceQuerySchema, "query"), controller.getRiderAttendanceHandler);

// ── Bulk Status Actions ────────────────────────────────────────
router.post("/bulk-process", MANAGE, validate(schemas.bulkProcessSchema), controller.bulkProcessHandler);
router.post("/bulk-complete", MANAGE, validate(schemas.bulkCompleteSchema), controller.bulkCompleteHandler);

// ── Export CSV ─────────────────────────────────────────────────
router.get("/export", VIEW, validate(schemas.exportPayoutsQuerySchema, "query"), controller.exportPayoutsCSVHandler);

// ── Rider History ──────────────────────────────────────────────
router.get("/:riderId/history", VIEW, validate(schemas.riderHistoryQuerySchema, "query"), controller.getRiderHistoryHandler);

export default router;