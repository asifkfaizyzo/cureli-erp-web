// backend/src/modules/sales/sales.controller.js (do not remove this comment)
// backend/src/modules/sales/sales.controller.js

import { success, fail } from "../../utils/response.js";
import salesService from "./sales.service.js";
import salesReturnService from "./sales-return.service.js";
import * as audit from "../audit/index.js";

/**
 * Extract branch context from request headers
 */
function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;

  if (req.user.role === "super_admin") {
    return {
      branchId: branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }

  return {
    branchId: req.user.branch_id,
    branchMode: "BRANCH",
  };
}

// ═══════════════════════════════════════════════════════════════════════
// BATCH/STOCK ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

export async function getAvailableBatchesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { medicineId } = req.params;
    const { includeLowStock, includeExpiring } = req.query;

    if (!branchId) {
      return fail(res, "Please select a branch to view stock", 400, {
        code: "BRANCH_REQUIRED",
      });
    }

    const batches = await salesService.getAvailableBatches(
      shopId,
      branchId,
      medicineId,
      {
        includeLowStock: includeLowStock === "true",
        includeExpiring: includeExpiring !== "false",
      },
    );

    return success(res, { batches }, "Available batches retrieved");
  } catch (error) {
    console.error("getAvailableBatches ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// INVOICE CRUD
// ═══════════════════════════════════════════════════════════════════════

export async function createDraftSaleController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const auditContext = audit.extractRequestContext(req);

    if (!branchId) {
      return fail(res, "Please select a branch to create sales", 400, {
        code: "BRANCH_REQUIRED",
      });
    }

    const invoice = await salesService.createDraftSale(
      userId,
      shopId,
      branchId,
      req.validated,
      auditContext,
    );

    return success(res, invoice, "Draft sale created successfully", 201);
  } catch (error) {
    console.error("createDraftSale ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function addItemsController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const invoice = await salesService.addItemsToDraft(
      userId,
      shopId,
      branchId,
      invoiceId,
      req.validated,
      auditContext,
    );

    return success(res, invoice, "Items added successfully");
  } catch (error) {
    console.error("addItems ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function removeItemController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId, itemId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const invoice = await salesService.removeItemFromDraft(
      userId,
      shopId,
      branchId,
      invoiceId,
      itemId,
      auditContext,
    );

    return success(res, invoice, "Item removed successfully");
  } catch (error) {
    console.error("removeItem ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function parkInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const invoice = await salesService.parkInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      req.validated,
      auditContext,
    );

    return success(res, invoice, "Invoice parked successfully");
  } catch (error) {
    console.error("parkInvoice ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function resumeParkedInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;

    const invoice = await salesService.resumeParkedInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
    );

    return success(res, invoice, "Invoice resumed successfully");
  } catch (error) {
    console.error("resumeParkedInvoice ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getParkedInvoicesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const invoices = await salesService.getParkedInvoices(
      shopId,
      branchId,
      role,
      branchMode,
    );

    return success(res, { invoices }, "Parked invoices retrieved");
  } catch (error) {
    console.error("getParkedInvoices ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function confirmSaleController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const invoice = await salesService.confirmSale(
      userId,
      shopId,
      branchId,
      invoiceId,
      req.validated,
      auditContext,
    );

    return success(
      res,
      invoice,
      "Sale confirmed successfully. Stock deducted.",
    );
  } catch (error) {
    console.error("confirmSale ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function cancelInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const { reason } = req.validated;
    const auditContext = audit.extractRequestContext(req);

    const invoice = await salesService.cancelInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      reason,
      auditContext,
    );

    return success(
      res,
      invoice,
      "Invoice cancelled. Stock reservation released.",
    );
  } catch (error) {
    console.error("cancelInvoice ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function recordPaymentController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await salesService.recordPayment(
      userId,
      shopId,
      branchId,
      invoiceId,
      req.validated,
      auditContext,
    );

    return success(res, result, "Payment recorded successfully");
  } catch (error) {
    console.error("recordPayment ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GET ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

export async function getSalesInvoicesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      customerId: req.query.customerId,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      search: req.query.search,
      customerName: req.query.customerName,   // ← Added mapping for frontend filters
      invoiceNumber: req.query.invoiceNumber, // ← Added mapping for frontend filters
      phone: req.query.phone,                 // ← Added mapping for frontend filters
      branchId: req.query.branchId,           // ← Allows overriding active branch in global queries
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await salesService.getSalesInvoices(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, result, "Sales invoices retrieved");
  } catch (error) {
    console.error("getSalesInvoices ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getInvoiceDetailsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    const invoice = await salesService.getInvoiceDetails(
      invoiceId,
      shopId,
      branchId,
      role,
      branchMode,
    );

    return success(res, invoice, "Invoice details retrieved");
  } catch (error) {
    console.error("getInvoiceDetails ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getSalesStatsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const stats = await salesService.getSalesStats(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, stats, "Sales statistics retrieved");
  } catch (error) {
    console.error("getSalesStats ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SALES RETURN CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════

export async function createSalesReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const auditContext = audit.extractRequestContext(req);

    if (!branchId) {
      return fail(res, "Please select a branch to process returns", 400, {
        code: "BRANCH_REQUIRED",
      });
    }

    const result = await salesReturnService.createSalesReturn(
      userId,
      shopId,
      branchId,
      req.validated,
      auditContext,
    );

    const message =
      result.return_approval_status === "APPROVED"
        ? `Return processed successfully. Refund: ₹${result.refund_amount} (${result.refund_mode})`
        : "Return created. Pending approval from admin.";

    return success(res, result, message, 201);
  } catch (error) {
    console.error("createSalesReturn ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getSalesReturnsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      customerId: req.query.customerId,
      returnReason: req.query.returnReason,
      approvalStatus: req.query.approvalStatus,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await salesReturnService.getSalesReturns(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, result, "Sales returns retrieved");
  } catch (error) {
    console.error("getSalesReturns ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getReturnDetailsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { returnId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    const result = await salesReturnService.getReturnDetails(
      returnId,
      shopId,
      branchId,
      role,
      branchMode,
    );

    return success(res, result, "Return details retrieved");
  } catch (error) {
    console.error("getReturnDetails ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getReturnableItemsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;

    if (!branchId) {
      return fail(res, "Please select a branch", 400, {
        code: "BRANCH_REQUIRED",
      });
    }

    const result = await salesReturnService.getReturnableItems(
      invoiceId,
      shopId,
      branchId,
    );

    return success(res, result, "Returnable items retrieved");
  } catch (error) {
    console.error("getReturnableItems ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function approveOrRejectReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { returnId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await salesReturnService.approveOrRejectReturn(
      userId,
      shopId,
      branchId,
      returnId,
      req.validated,
      auditContext,
    );

    const message =
      req.validated.action === "APPROVE"
        ? "Return approved. Stock added back and refund processed."
        : "Return rejected.";

    return success(res, result, message);
  } catch (error) {
    console.error("approveOrRejectReturn ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function cancelSalesReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { returnId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await salesReturnService.cancelSalesReturn(
      userId,
      shopId,
      branchId,
      returnId,
      req.validated,
      auditContext,
    );

    return success(
      res,
      result,
      "Return cancelled. Stock has been deducted back.",
    );
  } catch (error) {
    console.error("cancelSalesReturn ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function revertSalesReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { returnId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await salesReturnService.revertReturnToPending(
      userId,
      shopId,
      branchId,
      returnId,
      req.validated,
      auditContext,
    );

    return success(
      res,
      result,
      "Return reverted to pending. Awaiting re-approval.",
    );
  } catch (error) {
    console.error("revertSalesReturn ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CUSTOMER CREDIT CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════

export async function getCustomerCreditsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      customerId: req.query.customerId,
      status: req.query.status,
      includeExpired: req.query.includeExpired === "true",
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await salesReturnService.getCustomerCredits(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, result, "Customer credits retrieved");
  } catch (error) {
    console.error("getCustomerCredits ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function applyCustomerCreditController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const auditContext = audit.extractRequestContext(req);

    const result = await salesReturnService.applyCustomerCredit(
      userId,
      shopId,
      branchId,
      req.validated,
      auditContext,
    );

    return success(res, result, "Customer credit applied successfully");
  } catch (error) {
    console.error("applyCustomerCredit ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UPDATE INVOICE (DRAFT/PARKED only)
// ═══════════════════════════════════════════════════════════════════════

export async function updateSalesInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    if (!branchId) {
      return fail(res, "Please select a branch", 400, {
        code: "BRANCH_REQUIRED",
      });
    }

    const invoice = await salesService.updateSalesInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      req.validated,
      auditContext,
    );

    return success(res, invoice, "Invoice updated successfully");
  } catch (error) {
    console.error("updateSalesInvoice ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UPDATE PAYMENT STATUS (Super Admin only)
// ═══════════════════════════════════════════════════════════════════════

export async function updatePaymentStatusController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    const result = await salesService.updatePaymentStatus(
      userId,
      shopId,
      branchId,
      invoiceId,
      req.validated,
      auditContext,
    );

    return success(res, result, "Payment status updated successfully");
  } catch (error) {
    console.error("updatePaymentStatus ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}