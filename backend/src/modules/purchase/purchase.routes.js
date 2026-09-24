// backend/src/modules/purchase/purchase.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
  cancelInvoiceSchema,
  updatePaymentStatusSchema,
  recordPaymentSchema,
  createReturnInvoiceSchema,
  approveReturnSchema,
  applyCreditNoteSchema,
  cancelApprovedReturnSchema,
  revertReturnToPendingSchema,
} from "./purchase.schema.js";
import {
  createPurchaseInvoiceController,
  confirmPurchaseInvoiceController,
  getPurchaseInvoicesController,
  getInvoiceDetailsController,
  updatePurchaseInvoiceController,
  cancelPurchaseInvoiceController,
  getPurchaseStatsController,
  updatePaymentStatusController,
  recordPaymentController,
  createPurchaseReturnController,
  approveOrRejectReturnController,
  getPurchaseReturnsController,
  getReturnDetailsController,
  getSupplierCreditsController,
  applyCreditNoteController,
  cancelApprovedReturnController,
  revertReturnToPendingController,
  revertPurchaseInvoiceToDraftController, // Added Revert Invoice Controller
} from "./purchase.controller.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════
// PURCHASE RETURN ROUTES (Must come BEFORE generic :invoiceId routes)
// ═══════════════════════════════════════════════════════════════════════

// Create purchase return
router.post(
  "/returns",
  validateBody(createReturnInvoiceSchema),
  createPurchaseReturnController,
);

// Get all purchase returns
router.get("/returns", getPurchaseReturnsController);

// Get return details
router.get("/returns/:returnId", getReturnDetailsController);

// Approve or reject return (Super Admin only)
router.post(
  "/returns/:returnId/approve",
  validateBody(approveReturnSchema),
  approveOrRejectReturnController,
);

// Cancel approved return (Super Admin only)
router.patch(
  "/returns/:returnId/cancel",
  validateBody(cancelApprovedReturnSchema),
  cancelApprovedReturnController,
);

// Revert approved return to pending (Super Admin only)
router.patch(
  "/returns/:returnId/revert",
  validateBody(revertReturnToPendingSchema),
  revertReturnToPendingController,
);

// ═══════════════════════════════════════════════════════════════════════
// SUPPLIER CREDIT ROUTES
// ═══════════════════════════════════════════════════════════════════════

// Get supplier credits
router.get("/credits", getSupplierCreditsController);

// Apply credit note to invoice (Super Admin only)
router.post(
  "/credits/apply",
  validateBody(applyCreditNoteSchema),
  applyCreditNoteController,
);

// ═══════════════════════════════════════════════════════════════════════
// PURCHASE INVOICE ROUTES
// ═══════════════════════════════════════════════════════════════════════

// Create purchase invoice
router.post(
  "/",
  validateBody(createPurchaseInvoiceSchema),
  createPurchaseInvoiceController,
);

// Get all purchase invoices
router.get("/", getPurchaseInvoicesController);

// Get purchase statistics
router.get("/stats", getPurchaseStatsController);

// Get invoice details by ID
router.get("/:invoiceId", getInvoiceDetailsController);

// Update purchase invoice
router.put(
  "/:invoiceId",
  validateBody(updatePurchaseInvoiceSchema),
  updatePurchaseInvoiceController,
);

// Confirm invoice (adds stock to inventory)
router.post("/:invoiceId/confirm", confirmPurchaseInvoiceController);

// Revert confirmed invoice to DRAFT (Super Admin only - reverses stock additions)
router.post("/:invoiceId/revert", revertPurchaseInvoiceToDraftController);

// Cancel invoice
router.post(
  "/:invoiceId/cancel",
  validateBody(cancelInvoiceSchema),
  cancelPurchaseInvoiceController,
);

// Update payment status (Super Admin only)
router.patch(
  "/:invoiceId/payment-status",
  validateBody(updatePaymentStatusSchema),
  updatePaymentStatusController,
);

// Record payment
router.post(
  "/:invoiceId/payments",
  validateBody(recordPaymentSchema),
  recordPaymentController,
);

export default router;