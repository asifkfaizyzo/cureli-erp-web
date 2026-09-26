// pharmacy-web/src/api/customers.js (do not remove this comment)
// pharmacy-web/src/api/customers.js

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

const customersAPI = {
  // ═══════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════

  create: async (data) => {
    const response = await API.post("/customers", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getAll: async (filters = {}) => {
    const response = await API.get("/customers", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  search: async (searchTerm, limit = 10) => {
    const response = await API.get("/customers/search", {
      params: { q: searchTerm, limit },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getById: async (customerId) => {
    const response = await API.get(`/customers/${customerId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  update: async (customerId, data) => {
    const response = await API.put(`/customers/${customerId}`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LEDGER & CREDIT
  // ═══════════════════════════════════════════════════════════════════════

  getLedger: async (customerId, filters = {}) => {
    const response = await API.get(`/customers/${customerId}/ledger`, {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  checkCredit: async (customerId, amount) => {
    const response = await API.get(`/customers/${customerId}/credit-check`, {
      params: { amount },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getStats: async (customerId) => {
    const response = await API.get(`/customers/${customerId}/stats`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  recordPayment: async (customerId, data) => {
    const response = await API.post(`/customers/${customerId}/payments`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },
};

export default customersAPI;
