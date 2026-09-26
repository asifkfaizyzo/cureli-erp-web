// pharmacy-web/src/api/users.js (do not remove this comment)
// src/api/users.js

import api from "./axios";

/**
 * ============================================
 * USER MANAGEMENT API
 * ============================================
 */

/**
 * Get users list with filtering and pagination
 * @param {Object} options - Query options
 * @param {string} options.branch_id - Filter by branch (SA only)
 * @param {string} options.role - Filter by role ("branch_admin" | "staff")
 * @param {string} options.status - Filter by status ("active" | "inactive")
 * @param {string} options.search - Search by name, username, or phone
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sort_by - Sort field
 * @param {string} options.sort_order - Sort order ("asc" | "desc")
 */
export async function fetchUsers(options = {}) {
  const params = new URLSearchParams();

  if (options.branch_id) params.append("branch_id", options.branch_id);
  if (options.role) params.append("role", options.role);
  if (options.status) params.append("status", options.status);
  if (options.search) params.append("search", options.search);
  if (options.page) params.append("page", options.page.toString());
  if (options.limit) params.append("limit", options.limit.toString());
  if (options.sort_by) params.append("sort_by", options.sort_by);
  if (options.sort_order) params.append("sort_order", options.sort_order);

  const response = await api.get(`/users?${params.toString()}`);
  return response.data;
}

/**
 * Get user limits (current usage vs plan)
 */
export async function fetchUserLimits() {
  const response = await api.get("/users/limits");
  return response.data;
}

/**
 * Get single user by ID
 * @param {string} userId
 */
export async function fetchUser(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

/**
 * Create new user
 * @param {Object} userData
 * @param {string} userData.full_name - Full name (required)
 * @param {string} userData.phone_number - 10 digit phone (required)
 * @param {string} userData.username - Username (required)
 * @param {string} userData.password - Password min 8 chars (required)
 * @param {string} userData.role - "branch_admin" | "staff" (required)
 * @param {string} userData.branch_id - Branch UUID (required)
 * @param {string} userData.email - Email (optional)
 */
export async function createUser(userData) {
  const response = await api.post("/users", userData);
  return response.data;
}

/**
 * Update existing user
 * @param {string} userId
 * @param {Object} updates - Fields to update
 * @param {string} updates.full_name
 * @param {string} updates.phone_number
 * @param {string} updates.username
 * @param {string} updates.email
 * @param {string} updates.role - SA only
 * @param {string} updates.branch_id - SA only
 * @param {boolean} updates.is_active - SA only
 */
export async function updateUser(userId, updates) {
  const response = await api.put(`/users/${userId}`, updates);
  return response.data;
}

/**
 * Deactivate user (soft delete)
 * SA only
 * @param {string} userId
 */
export async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
}

/**
 * Reset user's password
 * @param {string} userId
 * @param {string} newPassword - New password (min 8 chars)
 */
export async function resetUserPassword(userId, newPassword) {
  const response = await api.post(`/users/${userId}/reset-password`, {
    new_password: newPassword,
  });
  return response.data;
}

/**
 * Check if username is available
 * @param {string} username
 * @param {string} excludeUserId - Optional user ID to exclude (for edit mode)
 */
export async function checkUsernameAvailability(username, excludeUserId = null) {
  const payload = { username };
  if (excludeUserId) {
    payload.exclude_user_id = excludeUserId;
  }
  const response = await api.post("/users/check-username", payload);
  return response.data;
}

/**
 * Check if phone number is available
 * @param {string} phoneNumber
 * @param {string} excludeUserId - Optional user ID to exclude (for edit mode)
 */
export async function checkPhoneAvailability(phoneNumber, excludeUserId = null) {
  const payload = { phone_number: phoneNumber };
  if (excludeUserId) {
    payload.exclude_user_id = excludeUserId;
  }
  const response = await api.post("/users/check-phone", payload);
  return response.data;
}

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Format role for display
 * @param {string} role
 */
export function formatRole(role) {
  const roleLabels = {
    super_admin: "Super Admin",
    branch_admin: "Branch Admin",
    staff: "Staff",
  };
  return roleLabels[role] || role;
}

/**
 * Get role badge color classes
 * @param {string} role
 */
export function getRoleBadgeClasses(role) {
  const colors = {
    super_admin: "bg-amber-100 text-amber-700",
    branch_admin: "bg-purple-100 text-purple-700",
    staff: "bg-gray-100 text-gray-600",
  };
  return colors[role] || "bg-gray-100 text-gray-600";
}

/**
 * Get status badge color classes
 * @param {boolean} isActive
 */
export function getStatusBadgeClasses(isActive) {
  return isActive
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-600";
}


/**
 * Reactivate a deactivated user
 * SA only
 * @param {string} userId
 */
export async function reactivateUser(userId) {
  const response = await api.post(`/users/${userId}/reactivate`);
  return response.data;
}