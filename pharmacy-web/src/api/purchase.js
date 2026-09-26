// pharmacy-web/src/api/purchase.js (do not remove this comment)
// pharmacy-web/src/api/purchase.js
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

const purchaseAPI = {
  create: async (data) => {
    try {
      const response = await API.post("/purchase", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Purchase create failed:", error.response?.data);
      throw error;
    }
  },

  update: async (invoiceId, data) => {
    try {
      const response = await API.put(`/purchase/${invoiceId}`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Purchase update failed:", error.response?.data);
      throw error;
    }
  },

  confirm: async (invoiceId) => {
    try {
      const response = await API.post(
        `/purchase/${invoiceId}/confirm`,
        {},
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Purchase confirm failed:", error.response?.data);
      throw error;
    }
  },

  getAll: async (filters = {}) => {
    try {
      const response = await API.get("/purchase", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get invoices failed:", error.response?.data);
      throw error;
    }
  },

  getById: async (invoiceId) => {
    try {
      const response = await API.get(`/purchase/${invoiceId}`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get invoice details failed:", error.response?.data);
      throw error;
    }
  },

  cancel: async (invoiceId, reason) => {
    try {
      const response = await API.post(
        `/purchase/${invoiceId}/cancel`,
        { reason },
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Cancel invoice failed:", error.response?.data);
      throw error;
    }
  },

  getStats: async (filters = {}) => {
    try {
      const response = await API.get("/purchase/stats", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get stats failed:", error.response?.data);
      throw error;
    }
  },

  //  NEW: Update payment status (Super Admin only)
  updatePaymentStatus: async (invoiceId, data) => {
    try {
      const response = await API.patch(
        `/purchase/${invoiceId}/payment-status`,
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

  //  NEW: Record payment
  recordPayment: async (invoiceId, data) => {
    try {
      const response = await API.post(`/purchase/${invoiceId}/payments`, data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Record payment failed:", error.response?.data);
      throw error;
    }
  },

  //  NEW: Revert to draft (for super admin)
  revertToDraft: async (invoiceId) => {
    try {
      const response = await API.patch(
        `/purchase/${invoiceId}`,
        { status: "DRAFT" },
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Revert to draft failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PURCHASE RETURNS
  // ═══════════════════════════════════════════════════════════════════════

  createReturn: async (data) => {
    try {
      const response = await API.post("/purchase/returns", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Create return failed:", error.response?.data);
      throw error;
    }
  },

  getAllReturns: async (filters = {}) => {
    try {
      const response = await API.get("/purchase/returns", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get returns failed:", error.response?.data);
      throw error;
    }
  },

  getReturnById: async (returnId) => {
    try {
      const response = await API.get(`/purchase/returns/${returnId}`, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get return details failed:", error.response?.data);
      throw error;
    }
  },

  approveReturn: async (returnId, data) => {
    try {
      const response = await API.post(
        `/purchase/returns/${returnId}/approve`,
        data,
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Approve return failed:", error.response?.data);
      throw error;
    }
  },

  rejectReturn: async (returnId, reason) => {
    try {
      const response = await API.post(
        `/purchase/returns/${returnId}/approve`,
        { action: "REJECT", rejection_reason: reason },
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(" Reject return failed:", error.response?.data);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SUPPLIER CREDITS
  // ═══════════════════════════════════════════════════════════════════════

  getSupplierCredits: async (filters = {}) => {
    try {
      const response = await API.get("/purchase/credits", {
        params: filters,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Get credits failed:", error.response?.data);
      throw error;
    }
  },

  applyCreditNote: async (data) => {
    try {
      const response = await API.post("/purchase/credits/apply", data, {
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(" Apply credit failed:", error.response?.data);
      throw error;
    }
  },

  // Make sure these match the schema exactly:
  cancelApprovedReturn: async (returnId, data) => {
    try {
      const response = await API.patch(
        `/purchase/returns/${returnId}/cancel`,
        data,
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Cancel approved return failed:", error.response?.data);
      throw error;
    }
  },

  revertReturnToPending: async (returnId, data) => {
    try {
      const response = await API.patch(
        `/purchase/returns/${returnId}/revert`,
        data,
        {
          headers: getBranchHeaders(),
        },
      );
      return response.data;
    } catch (error) {
      console.error(" Revert return failed:", error.response?.data);
      throw error;
    }
  },
};

export default purchaseAPI;
