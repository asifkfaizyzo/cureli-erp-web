// pharmacy-web/src/api/sales.js (do not remove this comment)
// pharmacy-web/src/api/sales.js

import API from "./axios";
import { useAuthStore } from "../store/useAuthStore";

function getBranchHeaders() {
  const state = useAuthStore.getState();
  const { branchContext } = state;

  return {
    "X-Branch-Mode": branchContext.mode || "BRANCH",
    "X-Branch-Id": branchContext.branch_id || "",
  };
}

const salesAPI = {
  // ═══════════════════════════════════════════════════════════════════════
  // BATCH/STOCK
  // ═══════════════════════════════════════════════════════════════════════

  getAvailableBatches: async (medicineId, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.includeLowStock) params.append("includeLowStock", "true");
      if (options.includeExpiring !== false)
        params.append("includeExpiring", "true");

      //  Get current headers
      const headers = getBranchHeaders();

      const response = await API.get(`/sales/batches/${medicineId}?${params}`, {
        headers: headers,
      });

      return response.data;
    } catch (error) {
      console.error(" Get available batches failed:", {
        error: error.response?.data,
        status: error.response?.status,
        medicineId,
      });
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // INVOICE CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  create: async (data) => {
    try {
      const response = await API.post("/sales", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Sales create failed:", error.response?.data);
      throw error;
    }
  },

  // Alias for create (matching purchase API pattern)
  createDraft: async (data) => {
    try {
      const response = await API.post("/sales", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Sales create draft failed:", error.response?.data);
      throw error;
    }
  },

  update: async (invoiceId, data) => {
    try {
      const response = await API.put(`/sales/${invoiceId}`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Sales update failed:", error.response?.data);
      throw error;
    }
  },

  addItems: async (invoiceId, data) => {
    try {
      const response = await API.post(`/sales/${invoiceId}/items`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Add items failed:", error.response?.data);
      throw error;
    }
  },

  removeItem: async (invoiceId, itemId) => {
    try {
      const response = await API.delete(`/sales/${invoiceId}/items/${itemId}`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Remove item failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PARKED INVOICES
  // ═══════════════════════════════════════════════════════════════════════

  park: async (invoiceId, data = {}) => {
    try {
      const response = await API.post(`/sales/${invoiceId}/park`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Park invoice failed:", error.response?.data);
      throw error;
    }
  },

  resume: async (invoiceId) => {
    try {
      const response = await API.post(
        `/sales/${invoiceId}/resume`,
        {},
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Resume invoice failed:", error.response?.data);
      throw error;
    }
  },

  getParked: async () => {
    try {
      const response = await API.get("/sales/parked", {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get parked invoices failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // INVOICE STATUS OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  confirm: async (invoiceId, data = {}) => {
    try {
      const response = await API.post(`/sales/${invoiceId}/confirm`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Confirm sale failed:", error.response?.data);
      throw error;
    }
  },

  cancel: async (invoiceId, reason) => {
    try {
      const response = await API.post(
        `/sales/${invoiceId}/cancel`,
        { reason },
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Cancel invoice failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PAYMENT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  recordPayment: async (invoiceId, data) => {
    try {
      const response = await API.post(`/sales/${invoiceId}/payments`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Record payment failed:", error.response?.data);
      throw error;
    }
  },

  //  NEW: Update payment status (Super Admin only)
  updatePaymentStatus: async (invoiceId, data) => {
    try {
      const response = await API.patch(
        `/sales/${invoiceId}/payment-status`,
        data,
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Update payment status failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GET ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  getAll: async (filters = {}) => {
    try {
      const response = await API.get("/sales", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get sales invoices failed:", error.response?.data);
      throw error;
    }
  },

  getById: async (invoiceId) => {
    try {
      const response = await API.get(`/sales/${invoiceId}`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get invoice details failed:", error.response?.data);
      throw error;
    }
  },

  getStats: async (filters = {}) => {
    try {
      const response = await API.get("/sales/stats", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get sales stats failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SALES RETURNS
  // ═══════════════════════════════════════════════════════════════════════

  // Get returnable items for an invoice
  getReturnableItems: async (invoiceId) => {
    try {
      const response = await API.get(`/sales/${invoiceId}/returnable-items`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get returnable items failed:", error.response?.data);
      throw error;
    }
  },

  // Create a new sales return
  createReturn: async (data) => {
    try {
      const response = await API.post("/sales/returns", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Create return failed:", error.response?.data);
      throw error;
    }
  },

  // Get all sales returns
  getAllReturns: async (filters = {}) => {
    try {
      const response = await API.get("/sales/returns", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get returns failed:", error.response?.data);
      throw error;
    }
  },

  // Alias for getAllReturns (backward compatibility)
  getReturns: async (filters = {}) => {
    return salesAPI.getAllReturns(filters);
  },

  // Get return details by ID
  getReturnById: async (returnId) => {
    try {
      //  Validate UUID format before sending
      if (!returnId || typeof returnId !== "string") {
        throw new Error("Invalid return ID");
      }

      // Check if it's a valid UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(returnId)) {
        throw new Error(`Invalid UUID format: ${returnId}`);
      }

      const response = await API.get(`/sales/returns/${returnId}`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get return details failed:", error.response?.data);
      throw error;
    }
  },

  // Approve a pending return (Super Admin / Branch Admin)
  approveReturn: async (returnId, data = {}) => {
    try {
      const response = await API.post(
        `/sales/returns/${returnId}/approve`,
        { action: "APPROVE", ...data },
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Approve return failed:", error.response?.data);
      throw error;
    }
  },

  // Reject a pending return (Super Admin / Branch Admin)
  rejectReturn: async (returnId, reason) => {
    try {
      const response = await API.post(
        `/sales/returns/${returnId}/approve`,
        { action: "REJECT", rejection_reason: reason },
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Reject return failed:", error.response?.data);
      throw error;
    }
  },

  // Cancel an APPROVED return (Super Admin only)
  cancelApprovedReturn: async (returnId, data) => {
    try {
      const response = await API.patch(
        `/sales/returns/${returnId}/cancel`,
        data,
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Cancel approved return failed:", error.response?.data);
      throw error;
    }
  },

  // Revert an APPROVED return to PENDING (Super Admin only)
  revertReturnToPending: async (returnId, data) => {
    // console.log("📤 Sending revert data:", data);
    try {
      const response = await API.patch(
        `/sales/returns/${returnId}/revert`,
        data,
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Revert return failed:", error.response?.data);
      throw error;
    }
  },

  // Legacy cancel return (for non-approved returns)
  cancelReturn: async (returnId, reason) => {
    try {
      const response = await API.post(
        `/sales/returns/${returnId}/cancel`,
        { reason },
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Cancel return failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CUSTOMER CREDITS
  // ═══════════════════════════════════════════════════════════════════════

  // Get customer credits
  getCustomerCredits: async (filters = {}) => {
    try {
      const response = await API.get("/sales/credits", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get customer credits failed:", error.response?.data);
      throw error;
    }
  },

  // Apply customer credit to an invoice
  applyCustomerCredit: async (data) => {
    try {
      const response = await API.post("/sales/credits/apply", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Apply credit failed:", error.response?.data);
      throw error;
    }
  },
};

export default salesAPI;
