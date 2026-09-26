// backend/src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.routes.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.routes.js

import { Router } from 'express';
import { requireCAdmin } from '../../../../middleware/requireCAdmin.js';
import { requireCAdminPermission } from '../../../../middleware/requireCAdminPermission.js';
import { CADMIN_PERMISSIONS } from '../../../../config/cadminPermissions.js';
import * as controller from './cadminMobileBroadcast.controller.js';

const router = Router();

router.use(requireCAdmin);

// ── Preview ───────────────────────────────────────────────────────────────────
router.post(
  '/broadcast/mobile/preview',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.previewAudienceController,
);

// ── Send now ──────────────────────────────────────────────────────────────────
router.post(
  '/broadcast/mobile/send-now',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.sendNowController,
);

// ── Drafts ────────────────────────────────────────────────────────────────────
router.post(
  '/broadcast/mobile/draft',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.createDraftController,
);

router.get(
  '/broadcast/mobile/drafts',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.getDraftsController,
);

// ── Scheduled ─────────────────────────────────────────────────────────────────
router.get(
  '/broadcast/mobile/scheduled',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.getScheduledController,
);

// ── History ───────────────────────────────────────────────────────────────────
router.get(
  '/broadcast/mobile/history',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.getHistoryController,
);

// ── Parameterized — must be last ──────────────────────────────────────────────
router.get(
  '/broadcast/mobile/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.getCampaignByIdController,
);

router.put(
  '/broadcast/mobile/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.updateDraftController,
);

router.delete(
  '/broadcast/mobile/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.cancelOrDeleteController,
);

router.post(
  '/broadcast/mobile/:id/schedule',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
  controller.scheduleController,
);

export default router;