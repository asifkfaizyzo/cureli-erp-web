// backend/src/modules/customers/customer.controller.js (do not remove this comment)
// backend/src/modules/customers/customer.controller.js

import { success, fail } from "../../utils/response.js";
import customerService from "./customer.service.js";
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
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

export async function createCustomerController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const customer = await customerService.createCustomer(
      req.validated,
      shopId,
      branchId,
      userId
    );

    return success(res, customer, "Customer created successfully", 201);
  } catch (error) {
    console.error("createCustomer ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getCustomersController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      search: req.query.search,
      isActive: req.query.isActive !== "false",
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await customerService.getCustomers(
      shopId,
      branchId,
      role,
      branchMode,
      filters
    );

    return success(res, result, "Customers retrieved");
  } catch (error) {
    console.error("getCustomers ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function searchCustomersController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const searchTerm = req.query.q || req.query.search || "";

    if (searchTerm.length < 2) {
      return success(res, { customers: [] }, "Search term too short");
    }

    const customers = await customerService.searchCustomers(
      shopId,
      branchId,
      searchTerm,
      parseInt(req.query.limit) || 10
    );

    return success(res, { customers }, "Search results");
  } catch (error) {
    console.error("searchCustomers ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getCustomerByIdController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { customerId } = req.params;

    const customer = await customerService.getCustomerById(customerId, shopId);

    return success(res, customer, "Customer details retrieved");
  } catch (error) {
    console.error("getCustomerById ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function updateCustomerController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { customerId } = req.params;

    const customer = await customerService.updateCustomer(
      customerId,
      shopId,
      req.validated
    );

    return success(res, customer, "Customer updated successfully");
  } catch (error) {
    console.error("updateCustomer ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LEDGER & CREDIT
// ═══════════════════════════════════════════════════════════════════════

export async function getCustomerLedgerController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { customerId } = req.params;

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await customerService.getCustomerLedger(
      customerId,
      shopId,
      filters
    );

    return success(res, result, "Customer ledger retrieved");
  } catch (error) {
    console.error("getCustomerLedger ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function checkCreditController(req, res) {
  try {
    const { customerId } = req.params;
    const { amount } = req.query;

    const result = await customerService.checkCreditAvailability(
      customerId,
      parseFloat(amount) || 0
    );

    return success(res, result, "Credit check completed");
  } catch (error) {
    console.error("checkCredit ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getCustomerStatsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { customerId } = req.params;

    const stats = await customerService.getCustomerStats(customerId, shopId);

    return success(res, stats, "Customer statistics retrieved");
  } catch (error) {
    console.error("getCustomerStats ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function recordDirectPaymentController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
    const { customerId } = req.params;

    if (!branchId) {
      return fail(res, "Please select a branch", 400, {
        code: "BRANCH_REQUIRED",
      });
    }

    const result = await customerService.recordDirectPayment(
      customerId,
      shopId,
      branchId,
      req.validated,
      userId
    );

    return success(res, result, "Payment recorded successfully");
  } catch (error) {
    console.error("recordDirectPayment ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}