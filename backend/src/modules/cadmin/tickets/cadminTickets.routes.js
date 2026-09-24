// backend/src/modules/cadmin/tickets/cadminTickets.routes.js (do not remove this comment)
// backend/src/modules/cadmin/tickets/cadminTickets.routes.js

import { Router } from "express";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  getAllTicketsController,
  getTicketStatsController,
  getTicketByIdController,
  getTicketActivitiesController,  // ← replaces getTicketHistoryController
  updateTicketStatusController,
  addCommentController,           // ← new
} from "./cadminTickets.controller.js";
import {
  getTicketsQuerySchema,
  updateTicketStatusSchema,
  addCommentSchema,               // ← new
} from "./cadminTickets.schema.js";

const router = Router();

router.use(requireCAdmin);

// Stats MUST be before /:ticket_id
router.get(
  "/tickets/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_STATS),
  getTicketStatsController
);

router.get(
  "/tickets",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
  validateQuery(getTicketsQuerySchema),
  getAllTicketsController
);

router.get(
  "/tickets/:ticket_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_DETAIL),
  getTicketByIdController
);

// ← replaces /history
router.get(
  "/tickets/:ticket_id/activities",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_HISTORY),
  getTicketActivitiesController
);

router.patch(
  "/tickets/:ticket_id/status",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS),
  validateBody(updateTicketStatusSchema),
  updateTicketStatusController
);

router.post(
  "/tickets/:ticket_id/comment",
  requireCAdminPermission(CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS),
  validateBody(addCommentSchema),
  addCommentController
);

export default router;