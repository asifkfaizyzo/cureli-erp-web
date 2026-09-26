// backend/src/modules/purchase/purchase.controller.js (do not remove this comment)
// backend/src/modules/purchase/purchase.controller.js

import { success, fail } from "../../utils/response.js";
//  UPDATED: Import from index.js which combines both service files
import * as purchaseService from "./index.js";
import * as audit from "../audit/index.js";

/**
 * Extract branch context from request headers
 * pharmacy-web sends: X-Branch-Mode and X-Branch-Id headers
 */
function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;

  // For super_admin: use header branch context
  // For others: use their assigned branch_id from JWT
  if (req.user.role === "super_admin") {
    return {
      branchId: branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }

  // branch_admin/staff: always use their assigned branch
  return {
    branchId: req.user.branch_id,
    branchMode: "BRANCH",
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PURCHASE INVOICE CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════

export async function createPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    if (!branchId) {
      return fail(
        res,
        "Please select a specific branch to create purchase invoices",
        400,
        {
          code: "BRANCH_REQUIRED",
        },
      );
    }

    const invoice = await purchaseService.createPurchaseInvoice(
      userId,
      shopId,
      branchId,
      data,
      auditContext,
    );

    return success(res, invoice, "Purchase invoice created successfully", 201);
  } catch (error) {
    console.error("purchase.createInvoice ERROR:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "BRANCH_REQUIRED"
          ? 400
          : error.code === "BRANCH_MISMATCH"
            ? 400
            : 400;
    return fail(
      res,
      error.message || "Failed to create purchase invoice",
      statusCode,
    );
  }
}

export async function confirmPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.confirmPurchaseInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      auditContext,
    );

    return success(
      res,
      invoice,
      "Purchase invoice confirmed and stock updated successfully",
    );
  } catch (error) {
    console.error("purchase.confirmInvoice ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "BRANCH_ACCESS_DENIED"
          ? 403
          : error.code === "ALREADY_CONFIRMED"
            ? 400
            : error.code === "INVOICE_CANCELLED"
              ? 400
              : 400;
    return fail(
      res,
      error.message || "Failed to confirm purchase invoice",
      statusCode,
    );
  }
}

export async function getPurchaseInvoicesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await purchaseService.getPurchaseInvoices(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, result, "Purchase invoices retrieved successfully");
  } catch (error) {
    console.error("purchase.getInvoices ERROR:", error);
    return fail(
      res,
      error.message || "Failed to retrieve purchase invoices",
      500,
    );
  }
}

export async function getInvoiceDetailsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.getInvoiceDetails(
      invoiceId,
      shopId,
      branchId,
      role,
      branchMode,
    );

    return success(res, invoice, "Invoice details retrieved successfully");
  } catch (error) {
    console.error("purchase.getInvoiceDetails ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 500;
    return fail(
      res,
      error.message || "Failed to retrieve invoice details",
      statusCode,
    );
  }
}

export async function updatePurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.updatePurchaseInvoice(
      userId,
      shopId,
      branchId,
      role,
      branchMode,
      invoiceId,
      data,
      auditContext,
    );

    return success(res, invoice, "Purchase invoice updated successfully");
  } catch (error) {
    console.error("purchase.updateInvoice ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "PERMISSION_DENIED"
          ? 403
          : error.code === "INVOICE_CANCELLED"
            ? 400
            : error.code === "NOT_DRAFT"
              ? 400
              : 400;
    return fail(
      res,
      error.message || "Failed to update purchase invoice",
      statusCode,
    );
  }
}

export async function cancelPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);
    const { reason } = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.cancelPurchaseInvoice(
      userId,
      shopId,
      branchId,
      role,
      branchMode,
      invoiceId,
      reason,
      auditContext,
    );

    return success(res, invoice, "Purchase invoice cancelled successfully");
  } catch (error) {
    console.error("purchase.cancelInvoice ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "ALREADY_CANCELLED"
          ? 400
          : error.code === "INVOICE_CONFIRMED"
            ? 400
            : 400;
    return fail(
      res,
      error.message || "Failed to cancel purchase invoice",
      statusCode,
    );
  }
}

export async function getPurchaseStatsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const stats = await purchaseService.getPurchaseStats(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, stats, "Purchase statistics retrieved successfully");
  } catch (error) {
    console.error("purchase.getStats ERROR:", error);
    return fail(
      res,
      error.message || "Failed to retrieve purchase statistics",
      500,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PAYMENT CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════

export async function updatePaymentStatusController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    if (role !== "super_admin") {
      return fail(
        res,
        "Only super admin can change payment status directly",
        403,
      );
    }

    const invoice = await purchaseService.updatePaymentStatus(
      userId,
      shopId,
      branchId,
      role,
      branchMode,
      invoiceId,
      data,
      auditContext,
    );

    return success(res, invoice, "Payment status updated successfully");
  } catch (error) {
    console.error("purchase.updatePaymentStatus ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "PERMISSION_DENIED"
          ? 403
          : error.code === "INVOICE_CANCELLED"
            ? 400
            : error.code === "INVALID_AMOUNT"
              ? 400
              : 400;
    return fail(
      res,
      error.message || "Failed to update payment status",
      statusCode,
    );
  }
}

export async function recordPaymentController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const result = await purchaseService.recordPayment(
      userId,
      shopId,
      branchId,
      role,
      branchMode,
      invoiceId,
      data,
      auditContext,
    );

    return success(res, result, "Payment recorded successfully");
  } catch (error) {
    console.error("purchase.recordPayment ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "INVOICE_CANCELLED"
          ? 400
          : error.code === "ALREADY_PAID"
            ? 400
            : error.code === "OVERPAYMENT"
              ? 400
              : 400;
    return fail(res, error.message || "Failed to record payment", statusCode);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PURCHASE RETURN CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════

export async function createPurchaseReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    if (!branchId) {
      return fail(
        res,
        "Please select a specific branch to create purchase returns",
        400,
        {
          code: "BRANCH_REQUIRED",
        },
      );
    }

    const returnInvoice = await purchaseService.createPurchaseReturn(
      userId,
      shopId,
      branchId,
      data,
      auditContext,
    );

    const message =
      returnInvoice.return_approval_status === "APPROVED"
        ? "Purchase return created and approved. Stock deducted and adjustment processed."
        : "Purchase return created. Pending super admin approval.";

    return success(res, returnInvoice, message, 201);
  } catch (error) {
    console.error("purchase.createReturn ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "INVALID_PARENT"
          ? 400
          : error.code === "BATCH_NOT_FOUND"
            ? 400
            : error.code === "SUPPLIER_MISMATCH"
              ? 400
              : error.code === "BRANCH_REQUIRED"
                ? 400
                : 400;
    return fail(
      res,
      error.message || "Failed to create purchase return",
      statusCode,
    );
  }
}

export async function approveOrRejectReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { returnId } = req.params;
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const result = await purchaseService.approveOrRejectReturn(
      userId,
      shopId,
      branchId,
      returnId,
      data,
      auditContext,
    );

    const message =
      data.action === "APPROVE"
        ? "Return approved. Stock deducted and credit/refund processed."
        : "Return rejected.";

    return success(res, result, message);
  } catch (error) {
    console.error("purchase.approveRejectReturn ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "PERMISSION_DENIED"
          ? 403
          : 400;
    return fail(
      res,
      error.message || "Failed to process return approval",
      statusCode,
    );
  }
}

export async function getPurchaseReturnsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      approvalStatus: req.query.approvalStatus,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await purchaseService.getPurchaseReturns(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, result, "Purchase returns retrieved successfully");
  } catch (error) {
    console.error("purchase.getReturns ERROR:", error);
    return fail(
      res,
      error.message || "Failed to retrieve purchase returns",
      500,
    );
  }
}

export async function getReturnDetailsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { returnId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const returnInvoice = await purchaseService.getReturnDetails(
      returnId,
      shopId,
      branchId,
      role,
      branchMode,
    );

    return success(res, returnInvoice, "Return details retrieved successfully");
  } catch (error) {
    console.error("purchase.getReturnDetails ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 500;
    return fail(
      res,
      error.message || "Failed to retrieve return details",
      statusCode,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SUPPLIER CREDIT CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════

export async function getSupplierCreditsController(req, res) {
  try {
    const shopId = req.user.shop_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      supplierId: req.query.supplierId,
      status: req.query.status,
      includeExpired: req.query.includeExpired === "true",
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await purchaseService.getSupplierCredits(shopId, filters);

    return success(res, result, "Supplier credits retrieved successfully");
  } catch (error) {
    console.error("purchase.getSupplierCredits ERROR:", error);
    return fail(
      res,
      error.message || "Failed to retrieve supplier credits",
      500,
    );
  }
}

export async function applyCreditNoteController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const result = await purchaseService.applyCreditNote(
      userId,
      shopId,
      data,
      auditContext,
    );

    return success(res, result, "Credit note applied successfully");
  } catch (error) {
    console.error("purchase.applyCreditNote ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "PERMISSION_DENIED"
          ? 403
          : error.code === "CREDIT_NOT_FOUND"
            ? 404
            : error.code === "CREDIT_EXPIRED"
              ? 400
              : error.code === "INSUFFICIENT_CREDIT"
                ? 400
                : error.code === "INVALID_TARGET_INVOICE"
                  ? 400
                  : error.code === "EXCEEDS_INVOICE_BALANCE"
                    ? 400
                    : 400;
    return fail(
      res,
      error.message || "Failed to apply credit note",
      statusCode,
    );
  }
}

/**
 * Cancel an APPROVED return
 * - Reverses stock deduction
 * - Marks credit note as CANCELLED
 * - Handles refund reversal
 * - Super Admin only
 */
export async function cancelApprovedReturnController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { returnId } = req.params;
    const { branchId } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Only super admin can cancel approved returns", 403);
    }

    const result = await purchaseService.cancelApprovedReturn(
      userId,
      shopId,
      branchId,
      returnId,
      data,
      auditContext,
    );

    return success(
      res,
      result,
      "Return cancelled successfully. Stock has been restored.",
    );
  } catch (error) {
    console.error("purchase.cancelApprovedReturn ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "PERMISSION_DENIED"
          ? 403
          : error.code === "INVALID_STATUS"
            ? 400
            : 500;
    return fail(res, error.message || "Failed to cancel return", statusCode);
  }
}

/**
 * Revert an APPROVED return to PENDING_APPROVAL
 * - Adds stock back temporarily
 * - Marks credit note as CANCELLED
 * - Reverses payment adjustments
 * - Super Admin only
 */
export async function revertReturnToPendingController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { returnId } = req.params;
    const { branchId } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Only super admin can revert returns", 403);
    }

    const result = await purchaseService.revertReturnToPending(
      userId,
      shopId,
      branchId,
      returnId,
      data,
      auditContext,
    );

    return success(
      res,
      result,
      "Return reverted to pending. Stock has been restored temporarily.",
    );
  } catch (error) {
    console.error("purchase.revertReturnToPending ERROR:", error);
    const statusCode =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "PERMISSION_DENIED"
          ? 403
          : error.code === "INVALID_STATUS"
            ? 400
            : 500;
    return fail(res, error.message || "Failed to revert return", statusCode);
  }
}
