// pharmacy-web/src/api/reports.js (do not remove this comment)
// pharmacy-web/src/api/reports.js

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

const reportsAPI = {
  // ── SALES REPORTS ──────────────────────────────────────────────────────────

  getSalesSummary: async (filters = {}) => {
    const response = await API.get("/reports/sales/summary", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getSalesRegister: async (filters = {}) => {
    const response = await API.get("/reports/sales/register", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getSalesProfit: async (filters = {}) => {
    const response = await API.get("/reports/sales/profit", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getSalesReturnsReport: async (filters = {}) => {
    const response = await API.get("/reports/sales/returns", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getPaymentCollection: async (filters = {}) => {
    const response = await API.get("/reports/sales/payments", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getOutstandingReceivables: async (filters = {}) => {
    const response = await API.get("/reports/sales/outstanding", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getDayBook: async (filters = {}) => {
    const response = await API.get("/reports/sales/daybook", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ── PURCHASE REPORTS ───────────────────────────────────────────────────────

  // B1 — Purchase Register
  getPurchaseRegister: async (filters = {}) => {
    const response = await API.get("/reports/purchase/register", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // B2 — Purchase Outstanding & Payables
  getPurchaseOutstanding: async (filters = {}) => {
    const response = await API.get("/reports/purchase/outstanding", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // B3 — Purchase Returns
  getPurchaseReturnsReport: async (filters = {}) => {
    const response = await API.get("/reports/purchase/returns", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },
  getCurrentStockReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/current-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getExpiryReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/expiry", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getMinStockReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/min-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getDeadStockReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/dead-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getStockAdjustmentsReport: async (filters = {}) => {
    const response = await API.get("/reports/inventory/adjustments", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

   // ── GST REPORTS ────────────────────────────────────────────────────────────

  getGstr1Report: async (filters = {}) => {
    const response = await API.get("/reports/gst/gstr1", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getGstr2Report: async (filters = {}) => {
    const response = await API.get("/reports/gst/gstr2", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getGstr3bReport: async (filters = {}) => {
    const response = await API.get("/reports/gst/gstr3b", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ── FINANCIAL REPORTS ──────────────────────────────────────────────────────

  getMedicinePLReport: async (filters = {}) => {
    const response = await API.get("/reports/financial/medicine-pl", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getPeriodPLReport: async (filters = {}) => {
    const response = await API.get("/reports/financial/period-pl", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ── MARKETPLACE REPORTS ────────────────────────────────────────────────────

  getMarketplaceSalesSummary: async (filters = {}) => {
    const response = await API.get("/reports/marketplace/sales-summary", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getOrderStatusFunnel: async (filters = {}) => {
    const response = await API.get("/reports/marketplace/order-funnel", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getAcceptanceRate: async (filters = {}) => {
    const response = await API.get("/reports/marketplace/acceptance-rate", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getPrescriptionSummary: async (filters = {}) => {
    const response = await API.get("/reports/marketplace/prescription-summary", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getListingHealth: async (filters = {}) => {
    const response = await API.get("/reports/marketplace/listing-health", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },


};

export default reportsAPI;