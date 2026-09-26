// backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.routes.js (do not remove this comment)
import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listOrders,
  getOrder,
  updateStatus,
  updatePaymentStatusHandler,
} from "./cadminMarketplaceOrders.controller.js";

const router = express.Router();

router.use(requireCAdmin);

/**
 * GET /cadmin/marketplace-orders
 */
router.get("/marketplace-orders", listOrders);

/**
 * GET /cadmin/marketplace-orders/:orderId
 */
router.get("/marketplace-orders/:orderId", getOrder);

/**
 * PATCH /cadmin/marketplace-orders/:orderId/status
 */
router.patch("/marketplace-orders/:orderId/status", updateStatus);

/**
 * PATCH /cadmin/marketplace-orders/:orderId/payment-status
 */
router.patch(
  "/marketplace-orders/:orderId/payment-status",
  updatePaymentStatusHandler
);

export default router;