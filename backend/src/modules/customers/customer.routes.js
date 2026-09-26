// backend/src/modules/customers/customer.routes.js (do not remove this comment)
// backend/src/modules/customers/customer.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.schema.js";
import {
  createCustomerController,
  getCustomersController,
  searchCustomersController,
  getCustomerByIdController,
  updateCustomerController,
  getCustomerLedgerController,
  checkCreditController,
  getCustomerStatsController,
  recordDirectPaymentController,
} from "./customer.controller.js";
import { z } from "zod";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════
// SEARCH (must be before /:customerId)
// ═══════════════════════════════════════════════════════════════════════

router.get("/search", searchCustomersController);

// ═══════════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════════

router.post("/", validateBody(createCustomerSchema), createCustomerController);

router.get("/", getCustomersController);

router.get("/:customerId", getCustomerByIdController);

router.put(
  "/:customerId",
  validateBody(updateCustomerSchema),
  updateCustomerController
);

// ═══════════════════════════════════════════════════════════════════════
// LEDGER & CREDIT
// ═══════════════════════════════════════════════════════════════════════

router.get("/:customerId/ledger", getCustomerLedgerController);

router.get("/:customerId/credit-check", checkCreditController);

router.get("/:customerId/stats", getCustomerStatsController);

// Direct payment schema
const directPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_mode: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER"]),
  payment_date: z.string().datetime().optional(),
  reference_number: z.string().max(100).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

router.post(
  "/:customerId/payments",
  validateBody(directPaymentSchema),
  recordDirectPaymentController
);

export default router;