// backend/src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js (do not remove this comment)
// backend/src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  getAtRiskController,
  getSubscriptionByIdController,
  sendReminderController,
  extendGraceController,
  forceSuspendController,
  reactivateController,
} from "./cadminSubscriptions.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ── READ ─────────────────────────────────────────────────────────────────────

router.get(
  "/subscriptions/at-risk",
  requireCAdminPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK),
  getAtRiskController
);

router.get(
  "/subscriptions/:subscription_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL),
  getSubscriptionByIdController
);

// ── ACTIONS ──────────────────────────────────────────────────────────────────

router.post(
  "/subscriptions/:subscription_id/remind",
  requireCAdminPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_SEND_REMINDER),
  sendReminderController
);

router.post(
  "/subscriptions/:subscription_id/extend-grace",
  requireCAdminPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_EXTEND_GRACE),
  extendGraceController
);

router.post(
  "/subscriptions/:subscription_id/suspend",
  requireCAdminPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_FORCE_SUSPEND),
  forceSuspendController
);

router.post(
  "/subscriptions/:subscription_id/reactivate",
  requireCAdminPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_REACTIVATE),
  reactivateController
);

export default router;