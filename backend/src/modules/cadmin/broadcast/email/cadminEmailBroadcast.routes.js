// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.routes.js (do not remove this comment)
import { Router } from 'express';
import * as controller from './cadminEmailBroadcast.controller.js';
import { validateBody, validateQuery } from '../../../../middleware/validate.js';
import { requireCAdmin } from '../../../../middleware/requireCAdmin.js';
import { requireCAdminPermission } from '../../../../middleware/requireCAdminPermission.js';
import { CADMIN_PERMISSIONS } from '../../../../config/cadminPermissions.js';
import * as schema from './cadminEmailBroadcast.schema.js';
import * as unsubscribeController from './unsubscribeManagement.controller.js';
import { createUploader, handleMulterError } from '../../../../config/multer.js';

const router = Router();

const emailAttachmentUpload = createUploader('email_attachments', {
  fieldName: 'file',
  maxFiles: 1,
});

router.use(requireCAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/email/upload/inline-image',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD),
  emailAttachmentUpload,
  handleMulterError,
  controller.uploadInlineImageController
);

router.post(
  '/broadcast/email/upload/attachment',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD),
  emailAttachmentUpload,
  handleMulterError,
  controller.uploadAttachmentController
);

router.delete(
  '/broadcast/email/upload/:filename',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD),
  controller.deleteAttachmentController
);

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW & QUOTA
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/email/preview',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  validateBody(schema.previewSchema),
  controller.previewRecipientCountController
);

router.get(
  '/broadcast/email/quota',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.getQuotaStatusController
);

// ─────────────────────────────────────────────────────────────────────────────
// SEND OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/email/send-now',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  validateBody(schema.sendNowSchema),
  controller.sendImmediateController
);

router.post(
  '/broadcast/email/test',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  validateBody(schema.testEmailSchema),
  controller.sendTestEmailController
);

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/email/draft',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  validateBody(schema.createDraftSchema),
  controller.createDraftController
);

router.get(
  '/broadcast/email/drafts',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  validateQuery(schema.paginationSchema),
  controller.getDraftsController
);

router.put(
  '/broadcast/email/draft/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  validateBody(schema.updateDraftSchema),
  controller.updateDraftController
);

router.delete(
  '/broadcast/email/draft/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS),
  controller.deleteDraftController
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULING
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/broadcast/email/schedule/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE),
  validateBody(schema.scheduleSchema),
  controller.scheduleCampaignController
);

router.get(
  '/broadcast/email/scheduled',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE),
  validateQuery(schema.paginationSchema),
  controller.getScheduledController
);

router.post(
  '/broadcast/email/cancel/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE),
  controller.cancelCampaignController
);

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/email/history',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY),
  validateQuery(schema.paginationSchema),
  controller.getHistoryController
);

// ─────────────────────────────────────────────────────────────────────────────
// FILTER OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/email/filters/shops',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.getShopsForFilterController
);

router.get(
  '/broadcast/email/filters/plans',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.getActivePlansController
);

router.get(
  '/broadcast/email/filters/cadmin-roles',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
  controller.getCAdminRolesController
);

// ─────────────────────────────────────────────────────────────────────────────
// UNSUBSCRIBE MANAGEMENT  ← NOW BEFORE /:id
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/email/unsubscribes',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES),
  unsubscribeController.getUnsubscribeListController
);

router.get(
  '/broadcast/email/unsubscribes/count',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES),
  unsubscribeController.getUnsubscribeCountController
);

router.get(
  '/broadcast/email/unsubscribes/export',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES),
  unsubscribeController.exportUnsubscribeListController
);

router.post(
  '/broadcast/email/unsubscribes',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES),
  unsubscribeController.addToSuppressionListController
);

router.post(
  '/broadcast/email/unsubscribes/bulk',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES),
  unsubscribeController.bulkAddToSuppressionListController
);

router.delete(
  '/broadcast/email/unsubscribes/:email',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES),
  unsubscribeController.removeFromSuppressionListController
);

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE CAMPAIGN — MUST BE LAST, catches :id
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/broadcast/email/:id',
  requireCAdminPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY),
  controller.getCampaignByIdController
);

export default router;