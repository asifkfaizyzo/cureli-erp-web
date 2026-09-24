// cadmin-web/src/api/cadminPlans.js (do not remove this comment)
import CAdminAPI from "./axios";

// ============================================
// UTILITY FUNCTIONS
// ============================================



// ============================================
// PLAN API FUNCTIONS
// ============================================

/**
 * Get all plans with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.type - 'PRE_MADE' or 'CUSTOM'
 * @param {string} params.status - Plan status filter
 * @param {string} params.search - Search query
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export async function getPlans(params = {}) {
  try {
    const response = await CAdminAPI.get("/plans", { params });
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("getPlans error:", error);
    throw error;
  }
}

/**
 * Get PRE_MADE plans only (for subscription page default view)
 */
export async function getPreMadePlans(params = {}) {
  return getPlans({ ...params, type: "PRE_MADE" });
}

/**
 * Get CUSTOM plans only
 */
export async function getCustomPlans(params = {}) {
  return getPlans({ ...params, type: "CUSTOM" });
}

/**
 * Get plan statistics (only counts PRE_MADE plans)
 */
export async function getPlanStats() {
  try {
    const response = await CAdminAPI.get("/plans/stats");
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("getPlanStats error:", error);
    throw error;
  }
}

/**
 * Get a single plan by ID
 */
export async function getPlanById(planId) {
  try {
    const response = await CAdminAPI.get(`/plans/${planId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("getPlanById error:", error);
    throw error;
  }
}

/**
 * Create a new plan
 * For PRE_MADE: { name, description, price, max_users, max_branches, is_highlighted }
 * For CUSTOM: add { type: 'CUSTOM', created_for_shop_id: shopId }
 */
export async function createPlan(data) {
  try {
    const response = await CAdminAPI.post("/plans", data);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("createPlan error:", error);
    console.error("createPlan error:", error.response?.data); 
    throw error;
  }
}

/**
 * Update a draft plan
 */
export async function updatePlan(planId, data) {
  try {
    const response = await CAdminAPI.patch(`/plans/${planId}`, data);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("updatePlan error:", error);
    throw error;
  }
}

/**
 * Activate a draft plan
 */
export async function activatePlan(planId) {
  try {
    const response = await CAdminAPI.post(`/plans/${planId}/activate`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("activatePlan error:", error);
    throw error;
  }
}

/**
 * Suspend an active plan
 */
export async function suspendPlan(planId) {
  try {
    const response = await CAdminAPI.post(`/plans/${planId}/suspend`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("suspendPlan error:", error);
    throw error;
  }
}

/**
 * Reactivate a suspended plan
 */
export async function reactivatePlan(planId) {
  try {
    const response = await CAdminAPI.post(`/plans/${planId}/reactivate`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("reactivatePlan error:", error);
    throw error;
  }
}

/**
 * Clone a plan
 */
export async function clonePlan(planId, customName = null) {
  try {
    const response = await CAdminAPI.post(`/plans/${planId}/clone`, {
      name: customName,
    });
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("clonePlan error:", error);
    throw error;
  }
}

/**
 * Delete a draft plan
 */
export async function deletePlan(planId) {
  try {
    const response = await CAdminAPI.delete(`/plans/${planId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("deletePlan error:", error);
    throw error;
  }
}