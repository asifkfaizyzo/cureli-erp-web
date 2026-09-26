//backend\src\modules\cadmin\delivery\cadmin.delivery.routes.js
import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import * as controller from "./cadmin.delivery.controller.js";

const router = Router();

router.use(requireCAdmin);

router.get("/available-riders", controller.getAvailableRiders);
router.post("/assign", controller.assignRider);

export default router;