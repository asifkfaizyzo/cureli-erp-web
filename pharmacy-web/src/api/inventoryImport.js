// pharmacy-web/src/api/inventoryImport.js (do not remove this comment)
import api from "./axios";
import { useAuthStore } from "../store/useAuthStore";

function getBranchHeaders() {
  const state = useAuthStore.getState();
  const { branchContext } = state;
  return {
    "X-Branch-Mode": branchContext.mode,
    "X-Branch-Id":   branchContext.branch_id || "",
  };
}

const inventoryImportAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/inventory/import/upload", formData, {
      headers: {
        ...getBranchHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getStatus: async (importJobId) => {
    const response = await api.get(
      `/inventory/import/${importJobId}/status`,
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

  getJob: async (importJobId) => {
    const response = await api.get(
      `/inventory/import/${importJobId}`,
      { headers: getBranchHeaders() }
    );
    return response.data;
  },


  getJobDetail: async (importJobId) => {
    const response = await api.get(
      `/inventory/import/${importJobId}/detail`,
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

  resolve: async (importJobId, conflictDecisions) => {
    const response = await api.post(
      `/inventory/import/${importJobId}/resolve`,
      { conflictDecisions },
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

  confirm: async (importJobId) => {
    const response = await api.post(
      `/inventory/import/${importJobId}/confirm`,
      {},
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

  cancel: async (importJobId) => {
    const response = await api.delete(
      `/inventory/import/${importJobId}`,
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get("/inventory/import", {
      params:  { page, limit },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  downloadErrorReport: (importJobId) => {
    return `${api.defaults.baseURL}/inventory/import/${importJobId}/error-report`;
  },
};

export default inventoryImportAPI;