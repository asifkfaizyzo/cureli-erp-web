// pharmacy-web/src/api/branches.js (do not remove this comment)
// src/api/branches.js

import api from "./axios";

/**
 * ============================================
 * EXISTING FUNCTIONS
 * ============================================
 */

/**
 * Get all branches for the current shop
 * @param {Object} options
 * @param {boolean} options.include_inactive - Include inactive branches
 */
export async function fetchBranches(options = {}) {
  const params = new URLSearchParams();

  if (options.include_inactive) {
    params.append("include_inactive", "true");
  }

  const response = await api.get(`/branches?${params.toString()}`);
  return response.data;
}

/**
 * Get branches for dropdown (minimal data, Super Admin only)
 */
export async function fetchBranchesDropdown() {
  const response = await api.get("/branches/dropdown");
  return response.data;
}

/**
 * Get a single branch by ID
 * @param {string} branchId
 */
export async function fetchBranch(branchId) {
  const response = await api.get(`/branches/${branchId}`);
  return response.data;
}

/**
 * Get current branch context
 */
export async function fetchCurrentBranch() {
  const response = await api.get("/branches/current");
  return response.data;
}

/**
 * Switch branch context (Super Admin only)
 * @param {string} branchId
 */
export async function switchBranch(branchId) {
  const response = await api.post("/branches/switch", {
    branch_id: branchId,
  });
  return response.data;
}

/**
 * ============================================
 * NEW FUNCTIONS
 * ============================================
 */

/**
 * Get branch limits (current usage vs plan)
 * SA only
 */
export async function fetchBranchLimits() {
  const response = await api.get("/branches/limits");
  return response.data;
}

/**
 * Create new branch
 * SA only
 * @param {Object} branchData
 * @param {string} branchData.branch_name - Branch name (required)
 * @param {string} branchData.address_line_1 - Address line 1 (optional)
 * @param {string} branchData.address_line_2 - Address line 2 (optional)
 * @param {string} branchData.city - City (optional)
 * @param {string} branchData.state - State (optional)
 * @param {string} branchData.pincode - 6 digit pincode (optional)
 * @param {string} branchData.contact_number - 10 digit phone (optional)
 * @param {string} branchData.alternate_number - 10 digit alternate phone (optional)
 */
export async function createBranch(branchData) {
  const response = await api.post("/branches", branchData);
  return response.data;
}

/**
 * Update existing branch
 * SA: any branch, BA: own branch only
 * @param {string} branchId
 * @param {Object} updates - Fields to update
 */
export async function updateBranch(branchId, updates) {
  const response = await api.put(`/branches/${branchId}`, updates);
  return response.data;
}

/**
 * Deactivate branch (soft delete)
 * SA only - Cannot delete main branch or branch with users
 * @param {string} branchId
 */
export async function deleteBranch(branchId) {
  const response = await api.delete(`/branches/${branchId}`);
  return response.data;
}

/**
 * Get active users in a branch
 * SA only - Used for reassignment UI before deletion
 * @param {string} branchId
 */
export async function fetchBranchUsers(branchId) {
  const response = await api.get(`/branches/${branchId}/users`);
  return response.data;
}

/**
 * Get branches available for user reassignment
 * SA only - Returns all active branches except the specified one
 * @param {string} excludeBranchId - Branch to exclude from list
 */
export async function fetchReassignmentOptions(excludeBranchId) {
  const response = await api.get(`/branches/${excludeBranchId}/reassignment-options`);
  return response.data;
}

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Format branch address for display
 * @param {Object} branch
 */
export function formatBranchAddress(branch) {
  const parts = [
    branch.address_line_1,
    branch.address_line_2,
    branch.city,
    branch.state,
    branch.pincode,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Get branch type badge classes
 * @param {boolean} isMain
 */
export function getBranchTypeBadgeClasses(isMain) {
  return isMain
    ? "bg-emerald-100 text-emerald-700"
    : "bg-blue-100 text-blue-700";
}

/**
 * Get branch status badge classes
 * @param {boolean} isActive
 */
export function getBranchStatusBadgeClasses(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-600";
}


/**
 * Reactivate a deactivated branch
 * SA only
 * @param {string} branchId
 */
export async function reactivateBranch(branchId) {
  const response = await api.post(`/branches/${branchId}/reactivate`);
  return response.data;
}