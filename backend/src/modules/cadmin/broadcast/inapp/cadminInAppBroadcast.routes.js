// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js

import { Router } from 'express';
import * as controller from './cadminInAppBroadcast.controller.js';
import { validateBody, validateQuery } from '../../../../middleware/validate.js';
import { requireCAdmin } from '../../../../middleware/requireCAdmin.js';
import { requireCAdminPermission } from '../../../../middleware/requireCAdminPermission.js';
import { CADMIN_PERMISSIONS } from '../../../../config/cadminPermissions.js';
import * as schema from './cadminInAppBroadcast.schema.js';
import { createUploader, handleMulterError } from '../../../../config/multer.js';

const router = Router();

const broadcastUpload = createUploader('broadcast_attachments', {
  fieldName: 'file',
  maxFiles: 1,
});

// All routes require CAdmin auth
router.use(requireCAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/inapp/upload',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_UPLOAD),
  broadcastUpload,
  handleMulterError,
  controller.uploadBroadcastAttachmentController
);

router.delete(
  '/broadcast/inapp/upload/:filename',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_UPLOAD),
  controller.deleteBroadcastAttachmentController
);

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW & SEND
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/inapp/preview',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND),
  validateBody(schema.previewSchema),
  controller.previewRecipientCountController
);

router.post(
  '/broadcast/inapp/send-now',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND),
  validateBody(schema.sendNowSchema),
  controller.sendImmediateController
);

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/inapp/draft',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS),
  validateBody(schema.draftSchema),
  controller.createDraftController
);

router.get(
  '/broadcast/inapp/drafts',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS),
  validateQuery(schema.paginationSchema),
  controller.getDraftsController
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULING
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/inapp/scheduled',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE),
  validateQuery(schema.paginationSchema),
  controller.getScheduledController
);

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/inapp/history',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY),
  validateQuery(schema.paginationSchema),
  controller.getHistoryController
);

// ─────────────────────────────────────────────────────────────────────────────
// FILTER OPTIONS
// Bundled under BROADCAST_INAPP_SEND — these helpers support the send flow
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/inapp/filters/shops',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND),
  controller.getShopsForFilterController
);

router.get(
  '/broadcast/inapp/filters/roles',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND),
  controller.getUserRolesController
);

router.get(
  '/broadcast/inapp/filters/cadmin-roles',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND),
  controller.getCAdminRolesController
);

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTS
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/inapp/segments',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS),
  validateBody(schema.segmentSchema),
  controller.createSegmentController
);

router.get(
  '/broadcast/inapp/segments',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS),
  controller.getSegmentsController
);

router.delete(
  '/broadcast/inapp/segments/:segmentId',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS),
  controller.deleteSegmentController
);

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/inapp/templates',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES),
  validateBody(schema.templateSchema),
  controller.createTemplateController
);

router.get(
  '/broadcast/inapp/templates',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES),
  controller.getTemplatesController
);

router.post(
  '/broadcast/inapp/templates/:templateId/use',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES),
  controller.useTemplateController
);

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETERIZED ROUTES — must be last, these catch :id
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/inapp/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY),
  controller.getCampaignByIdController
);

router.put(
  '/broadcast/inapp/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS),
  validateBody(schema.updateDraftSchema),
  controller.updateDraftController
);

router.delete(
  '/broadcast/inapp/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS),
  controller.cancelOrDeleteController
);

router.post(
  '/broadcast/inapp/:id/schedule',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE),
  validateBody(schema.scheduleSchema),
  controller.scheduleBroadcastController
);

export default router;