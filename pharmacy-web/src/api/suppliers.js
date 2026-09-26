// pharmacy-web/src/api/suppliers.js (do not remove this comment)
// src/api/suppliers.js
import api from "./axios";

const suppliersAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get("/suppliers", { params: filters });
    return response.data;
  },

  search: async (searchTerm, branchId = null) => {
    const params = {
      search: searchTerm,
      isActive: true,
      limit: 100,
    };
    if (branchId) {
      params.branch_id = branchId;
    }
    const response = await api.get("/suppliers", { params });
    return response.data;
  },

  getById: async (supplierId) => {
    const response = await api.get(`/suppliers/${supplierId}`);
    return response.data;
  },

  create: async (data, branchId) => {
    const response = await api.post("/suppliers", {
      ...data,
      branch_id: branchId,
    });
    return response.data;
  },

  update: async (supplierId, data) => {
    const response = await api.put(`/suppliers/${supplierId}`, data);
    return response.data;
  },

  // Branch Management
  getSupplierBranches: async (supplierId) => {
    const response = await api.get(`/suppliers/${supplierId}/branches`);
    return response.data;
  },

  addToBranch: async (supplierId, branchId) => {
    const response = await api.post(`/suppliers/${supplierId}/branches`, {
      branch_id: branchId,
    });
    return response.data;
  },

  removeFromBranch: async (supplierId, branchId) => {
    const response = await api.delete(`/suppliers/${supplierId}/branches`, {
      data: { branch_id: branchId },
    });
    return response.data;
  },

  updateBranches: async (supplierId, branchIds) => {
    const response = await api.put(`/suppliers/${supplierId}/branches`, {
      branch_ids: branchIds,
    });
    return response.data;
  },

  getAvailableForBranch: async (branchId, search = "") => {
    const response = await api.get(`/suppliers/available/${branchId}`, {
      params: { search },
    });
    return response.data;
  },

  //  Status Management
  deactivate: async (supplierId) => {
    const response = await api.post(`/suppliers/${supplierId}/deactivate`);
    return response.data;
  },

  reactivate: async (supplierId, branchId) => {
    const response = await api.post(`/suppliers/${supplierId}/reactivate`, {
      branch_id: branchId,
    });
    return response.data;
  },

  removeFromAllBranches: async (supplierId) => {
    const response = await api.delete(`/suppliers/${supplierId}/all-branches`);
    return response.data;
  },
};

export default suppliersAPI;
