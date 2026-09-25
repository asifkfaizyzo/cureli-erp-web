//backend\src\modules\rider\delivery\rider.delivery.routes.js
import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import * as controller from "./rider.delivery.controller.js";

const router = Router();

router.use(riderAuth);

router.get("/active", controller.getActiveDelivery);
router.post("/:deliveryId/accept", controller.acceptDelivery);
router.post("/:deliveryId/decline", controller.declineDelivery);
router.post("/:deliveryId/status", controller.updateDeliveryStatus);
router.post("/:deliveryId/complete", controller.completeDelivery);

export default router;