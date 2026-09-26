// pharmacy-web/src/api/inventory.js (do not remove this comment)
// src/api/inventory.js

import api from "./axios";
import { useAuthStore } from "../store/useAuthStore";

function getBranchHeaders() {
  const state = useAuthStore.getState();
  const { branchContext } = state;

  return {
    "X-Branch-Mode": branchContext.mode,
    "X-Branch-Id": branchContext.branch_id || "",
  };
}

const inventoryAPI = {
  getInventory: async (filters = {}, options = {}) => {
    const response = await api.get("/inventory", {
      params: filters,
      headers: getBranchHeaders(),
      ...options,
    });
    return response.data;
  },

  getFacets: async () => {
    const response = await api.get("/inventory/facets", {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getByMedicine: async (medicineId, filters = {}) => {
    const response = await api.get(`/inventory/medicine/${medicineId}`, {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getAll: async (filters = {}, options = {}) => {
    const response = await api.get("/inventory", {
      params: filters,
      headers: getBranchHeaders(),
      ...options,
    });
    return response.data;
  },

  getSummary: async (branchId = null) => {
    const response = await api.get("/inventory/summary", {
      params: branchId ? { branchId } : {},
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  createAdjustment: async (data) => {
    const response = await api.post("/inventory/adjustment", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  createWithMedicine: async (data) => {
    const response = await api.post("/inventory/create-with-medicine", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  update: async (inventoryId, data) => {
    const response = await api.put(`/inventory/${inventoryId}`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  delete: async (inventoryId) => {
    const response = await api.delete(`/inventory/${inventoryId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getLowStock: async (filters = {}) => {
    const response = await api.get("/inventory/low-stock", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getExpiringSoon: async (daysAhead = 90) => {
    const response = await api.get("/inventory/expiring-soon", {
      params: { daysAhead },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getLedger: async (filters = {}) => {
    const response = await api.get("/inventory/ledger", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  exportInventory: async () => {
    const response = await api.get("/inventory/export", {
      headers: getBranchHeaders(),
      responseType: "blob",
    });
    return response;
  },

  resetInventory: async () => {
    const response = await api.post("/inventory/reset", {}, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },
};

export default inventoryAPI;