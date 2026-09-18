// backend/src/modules/cadmin/broadcast/mobile-email/cadminMobileEmailBroadcast.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../../config/cadminPermissions.js";
import * as controller from "./cadminMobileEmailBroadcast.controller.js";

const router = Router();
router.use(requireCAdmin);

router.post(
  "/broadcast/mobile-email/preview",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.previewAudience
);

router.post(
  "/broadcast/mobile-email/send-now",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.sendNow
);

router.post(
  "/broadcast/mobile-email/test",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.sendTestEmail
);

router.post(
  "/broadcast/mobile-email/draft",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  controller.createDraft
);

router.get(
  "/broadcast/mobile-email/drafts",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  controller.getDrafts
);

router.get(
  "/broadcast/mobile-email/scheduled",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE),
  controller.getScheduled
);

router.get(
  "/broadcast/mobile-email/history",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY),
  controller.getHistory
);

router.get(
  "/broadcast/mobile-email/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY),
  controller.getCampaignById
);

router.put(
  "/broadcast/mobile-email/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  controller.updateDraft
);

router.delete(
  "/broadcast/mobile-email/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  controller.deleteDraft
);

router.post(
  "/broadcast/mobile-email/:id/schedule",
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE),
  controller.scheduleCampaign
);

export default router;