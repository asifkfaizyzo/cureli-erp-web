// backend/src/modules/cadmin/enquiries/cadminEnquiries.routes.js (do not remove this comment)
import { Router } from "express";
import { validate } from "../../../middleware/validate.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  listEnquiriesSchema,
  enquiryIdParamSchema,
  replyEnquirySchema,
  updateEnquiryStatusSchema,
} from "../../enquiries/enquiries.schema.js";
import {
  listEnquiries,
  getEnquiryDetails,
  replyToEnquiry,
  updateEnquiryStatus,
  getEnquiryStats,
  deleteEnquiry,
} from "../../enquiries/enquiries.controller.js";

const router = Router();

router.get(
  "/enquiries/admin/list",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),
  validate(listEnquiriesSchema, "query"),
  listEnquiries
);

router.get(
  "/enquiries/admin/stats",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW_STATS),
  getEnquiryStats
);

router.get(
  "/enquiries/admin/:enquiryId",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW_DETAIL),
  validate(enquiryIdParamSchema, "params"),
  getEnquiryDetails
);

router.post(
  "/enquiries/admin/:enquiryId/reply",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_REPLY),
  validate(enquiryIdParamSchema, "params"),
  validate(replyEnquirySchema, "body"),
  replyToEnquiry
);

router.patch(
  "/enquiries/admin/:enquiryId/status",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_UPDATE_STATUS),
  validate(enquiryIdParamSchema, "params"),
  validate(updateEnquiryStatusSchema, "body"),
  updateEnquiryStatus
);

router.delete(
  "/enquiries/admin/:enquiryId",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_DELETE),
  validate(enquiryIdParamSchema, "params"),
  deleteEnquiry
);

export default router;