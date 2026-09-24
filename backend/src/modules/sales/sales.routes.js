// backend/src/modules/sales/sales.routes.js (do not remove this comment)
// backend/src/modules/sales/sales.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createSalesInvoiceSchema,
  addItemsSchema,
  confirmInvoiceSchema,
  recordPaymentSchema,
  cancelInvoiceSchema,
  parkInvoiceSchema,
  createSalesReturnSchema,
  approveReturnSchema,
  cancelSalesReturnSchema,
  revertSalesReturnSchema,
  applyCustomerCreditSchema,
  updateSalesInvoiceSchema,
  updatePaymentStatusSchema,
} from "./sales.schema.js";
import {
  // Invoice controllers
  getAvailableBatchesController,
  createDraftSaleController,
  addItemsController,
  removeItemController,
  parkInvoiceController,
  resumeParkedInvoiceController,
  getParkedInvoicesController,
  confirmSaleController,
  cancelInvoiceController,
  recordPaymentController,
  getSalesInvoicesController,
  getInvoiceDetailsController,
  getSalesStatsController,
  // Return controllers
  createSalesReturnController,
  getSalesReturnsController,
  getReturnDetailsController,
  getReturnableItemsController,
  approveOrRejectReturnController,
  cancelSalesReturnController,
  revertSalesReturnController,
  updateSalesInvoiceController,
  // Customer credit controllers
  getCustomerCreditsController,
  applyCustomerCreditController,
  updatePaymentStatusController,
} from "./sales.controller.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════
// SALES RETURN ROUTES (Must come BEFORE :invoiceId routes)
// ═══════════════════════════════════════════════════════════════════════

// Create sales return
router.post(
  "/returns",
  validateBody(createSalesReturnSchema),
  createSalesReturnController,
);

// Get all sales returns
router.get("/returns", getSalesReturnsController);

// Get return details
router.get("/returns/:returnId", getReturnDetailsController);

// Approve or reject return
router.post(
  "/returns/:returnId/approve",
  validateBody(approveReturnSchema),
  approveOrRejectReturnController,
);

// Cancel approved return (Super Admin only)
router.patch(
  "/returns/:returnId/cancel",
  validateBody(cancelSalesReturnSchema),
  cancelSalesReturnController,
);

// Revert approved return to pending (Super Admin only)
router.patch(
  "/returns/:returnId/revert",
  validateBody(revertSalesReturnSchema),
  revertSalesReturnController,
);

// ═══════════════════════════════════════════════════════════════════════
// CUSTOMER CREDIT ROUTES
// ═══════════════════════════════════════════════════════════════════════

// Get customer credits
router.get("/credits", getCustomerCreditsController);

// Apply customer credit to invoice
router.post(
  "/credits/apply",
  validateBody(applyCustomerCreditSchema),
  applyCustomerCreditController,
);

// ═══════════════════════════════════════════════════════════════════════
// BATCH/STOCK ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

router.get("/batches/:medicineId", getAvailableBatchesController);

// ═══════════════════════════════════════════════════════════════════════
// PARKED INVOICES
// ═══════════════════════════════════════════════════════════════════════

router.get("/parked", getParkedInvoicesController);

// ═══════════════════════════════════════════════════════════════════════
// SALES INVOICE ROUTES
// ═══════════════════════════════════════════════════════════════════════

// Create draft sale
router.post(
  "/",
  validateBody(createSalesInvoiceSchema),
  createDraftSaleController,
);

// Get all sales invoices
router.get("/", getSalesInvoicesController);

// Get sales statistics
router.get("/stats", getSalesStatsController);

// Get invoice details
router.get("/:invoiceId", getInvoiceDetailsController);

// Get returnable items for an invoice
router.get("/:invoiceId/returnable-items", getReturnableItemsController);

// Add items to draft
router.post(
  "/:invoiceId/items",
  validateBody(addItemsSchema),
  addItemsController,
);

// Remove item from draft
router.delete("/:invoiceId/items/:itemId", removeItemController);

// Park invoice
router.post(
  "/:invoiceId/park",
  validateBody(parkInvoiceSchema),
  parkInvoiceController,
);

// Resume parked invoice
router.post("/:invoiceId/resume", resumeParkedInvoiceController);

// Confirm sale
router.post(
  "/:invoiceId/confirm",
  validateBody(confirmInvoiceSchema),
  confirmSaleController,
);

// Cancel invoice
router.post(
  "/:invoiceId/cancel",
  validateBody(cancelInvoiceSchema),
  cancelInvoiceController,
);

// Record payment
router.post(
  "/:invoiceId/payments",
  validateBody(recordPaymentSchema),
  recordPaymentController,
);

//  ADD THIS: Update invoice (DRAFT/PARKED only)
router.put(
  "/:invoiceId",
  validateBody(updateSalesInvoiceSchema),
  updateSalesInvoiceController,
);

//  ADD THIS: Update payment status (Super Admin only)
router.patch(
  "/:invoiceId/payment-status",
  validateBody(updatePaymentStatusSchema),
  updatePaymentStatusController,
);

// Update invoice (DRAFT/PARKED/CONFIRMED for Super Admin)
router.put(
  "/:invoiceId",
  validateBody(updateSalesInvoiceSchema),
  updateSalesInvoiceController,
);

export default router;
