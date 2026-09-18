// src/api/medicines.js

import api from "./axios";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Get branch context headers for API requests
 */
function getBranchHeaders() {
  const state = useAuthStore.getState();
  const { branchContext } = state;

  return {
    "X-Branch-Mode": branchContext.mode,
    "X-Branch-Id": branchContext.branch_id || "",
  };
}

const medicinesAPI = {
  // ══════════════════════════════════════════════════════════════
  // EXISTING METHODS (Updated with branch headers)
  // ══════════════════════════════════════════════════════════════

  getAll: async (filters = {}) => {
    const response = await api.get("/medicines", {
      params: filters,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  search: async (searchTerm, filters = {}) => {
    const response = await api.get("/medicines/search", {
      params: { q: searchTerm, limit: 50, ...filters },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  getById: async (medicineId) => {
    const response = await api.get(`/medicines/${medicineId}`, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/medicines", data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  bulkCreate: async (medicines, linkingResults = null) => {
    const response = await api.post(
      "/medicines/bulk",
      {
        medicines,
        linkingResults,
      },
      {
        headers: getBranchHeaders(),
      },
    );
    return response.data;
  },

  update: async (medicineId, data) => {
    const response = await api.put(`/medicines/${medicineId}`, data, {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  // ══════════════════════════════════════════════════════════════
  // Master Catalog Linking Methods
  // ══════════════════════════════════════════════════════════════

  /**
   * Check import rows against master catalog
   * Call this before bulk import to get linking suggestions
   * @param {Array} rows - Array of { name, manufacturer, generic_name }
   * @returns {Object} { results, stats }
   */
  checkMasterCatalog: async (rows) => {
    const response = await api.post(
      "/medicine-linking/check-import",
      { rows },
      { headers: getBranchHeaders() },
    );
    return response.data;
  },

  /**
   * Check products against master catalog (alternative endpoint)
   * @param {Array} products - Array of { name, manufacturer, generic_name }
   * @returns {Promise}
   */
  checkProductsAgainstCatalog: async (products) => {
    try {
      const response = await api.post(
        "/medicines/check-master-catalog",
        { products },
        { headers: getBranchHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error checking master catalog:", error);
      throw error;
    }
  },

  /**
   * Get catalog link status for medicines
   * @param {Array<string>} medicineIds - Optional array of medicine IDs to check
   * @returns {Promise} - Status for each medicine
   */
  getCatalogLinkStatus: async (medicineIds = null) => {
    try {
      const params = medicineIds ? { ids: medicineIds.join(",") } : {};
      const response = await api.get("/medicines/catalog-link-status", {
        params,
        headers: getBranchHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching catalog link status:", error);
      throw error;
    }
  },

  /**
   * Manually link a medicine to a master catalog entry
   * @param {string} medicineId - The shop's medicine ID
   * @param {string} masterMedicineId - The master catalog medicine ID
   */
  linkToMaster: async (medicineId, masterMedicineId) => {
    const response = await api.post(
      `/medicine-linking/${medicineId}/link`,
      { masterMedicineId },
      { headers: getBranchHeaders() },
    );
    return response.data;
  },

  /**
   * Unlink a medicine from master catalog
   * @param {string} medicineId
   * @param {boolean} reject - If true, mark as rejected (won't suggest again)
   */
  unlinkFromMaster: async (medicineId, reject = false) => {
    const response = await api.post(
      `/medicine-linking/${medicineId}/unlink`,
      { reject },
      { headers: getBranchHeaders() },
    );
    return response.data;
  },

  /**
   * Get link suggestions for a medicine
   * @param {string} medicineId
   * @returns {Object} { suggestions: Array, currentLink: Object|null }
   */
  getLinkSuggestions: async (medicineId) => {
    const response = await api.get(
      `/medicine-linking/${medicineId}/suggestions`,
      {
        headers: getBranchHeaders(),
      },
    );
    return response.data;
  },

  /**
   * Get all unlinked medicines for shop
   * @param {Object} options - { page, limit, search }
   * @returns {Object} { medicines: Array, pagination: Object }
   */
  getUnlinkedMedicines: async (options = {}) => {
    const response = await api.get("/medicine-linking/unlinked", {
      params: options,
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Get linking statistics for the shop
   * @returns {Object} { total, linked, pending, rejected, linkRate }
   */
  getLinkingStats: async () => {
    const response = await api.get("/medicine-linking/stats", {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Bulk accept suggested links
   * @param {Array} links - Array of { medicineId, masterMedicineId }
   */
  bulkAcceptLinks: async (links) => {
    const response = await api.post(
      "/medicine-linking/bulk-accept",
      { links },
      { headers: getBranchHeaders() },
    );
    return response.data;
  },

  /**
   * Bulk reject suggested links
   * @param {Array} medicineIds - Array of medicine IDs to reject suggestions for
   */
  bulkRejectLinks: async (medicineIds) => {
    const response = await api.post(
      "/medicine-linking/bulk-reject",
      { medicineIds },
      { headers: getBranchHeaders() },
    );
    return response.data;
  },

  /**
   * Search master catalog for manual linking
   * @param {string} query - Search term
   * @param {number} limit - Max results
   * @returns {Object} { results: Array }
   */
  searchMasterCatalog: async (query, limit = 10) => {
    const response = await api.get("/medicine-linking/search-catalog", {
      params: { q: query, limit },
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Auto-link all pending medicines for shop
   * @returns {Object} bulk auto-link result
   */
  bulkAutoLink: async () => {
    const response = await api.post(
      "/medicine-linking/bulk-auto-link",
      {},
      { headers: getBranchHeaders() },
    );
    return response.data;
  },

  /**
   * Get count of medicines eligible for resubmission
   * @returns {Promise} { success: true, data: { count: number } }
   */
  getResubmitCount: async () => {
    const response = await api.get("/medicine-linking/resubmit-count", {
      headers: getBranchHeaders(),
    });
    return response.data;
  },

  /**
   * Bulk resubmit medicines for catalog review
   * @param {Array<string>} medicineIds 
   * @returns {Promise}
   */
  resubmitForReview: async (medicineIds) => {
    const response = await api.post(
      "/medicine-linking/resubmit",
      { medicineIds },
      { headers: getBranchHeaders() }
    );
    return response.data;
  },

};

export default medicinesAPI;