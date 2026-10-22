//backend\src\modules\cadmin\delivery\cadmin.delivery.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import * as controller from "./cadmin.delivery.controller.js";

const router = Router();

router.use(requireCAdmin);

router.get("/available-riders", controller.getAvailableRiders);
router.post("/assign", controller.assignRider);
router.post("/unassign", controller.unassignRider);

// Same Day batch
router.get("/available-team-riders", controller.getAvailableTeamRiders);
router.get("/active-batches", controller.getActiveBatches);
router.post("/batch-assign", controller.batchAssign);
router.post("/add-to-batch", controller.addOrderToBatch);
router.post("/reassign-batch-order", controller.reassignBatchOrder);
router.post("/remove-from-batch", controller.removeOrderFromBatch);
router.get("/batch-orders", controller.getBatchOrders);
router.get("/batch-history", controller.getBatchHistory);

export default router;