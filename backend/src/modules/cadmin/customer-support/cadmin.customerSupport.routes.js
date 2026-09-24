// backend/src/modules/cadmin/customer-support/cadmin.customerSupport.routes.js (do not remove this comment)
import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import * as controller from "./cadmin.customerSupport.controller.js";

const router = Router();

router.use(requireCAdmin);

router.get(
  "/customer-tickets",
  requireCAdminPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW),
  controller.getAllTicketsHandler
);

router.get(
  "/customer-tickets/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW),
  controller.getStatsHandler
);

router.get(
  "/customer-tickets/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW_DETAIL),
  controller.getTicketDetailHandler
);

router.patch(
  "/customer-tickets/:id/status",
  requireCAdminPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_UPDATE_STATUS),
  controller.updateStatusHandler
);

router.post(
  "/customer-tickets/:id/reply",
  requireCAdminPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_REPLY),
  controller.replyHandler
);

export default router;