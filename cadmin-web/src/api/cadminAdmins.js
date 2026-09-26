// cadmin-web/src/api/cadminAdmins.js (do not remove this comment)
// pharmacy-web/src/api/cadminAdmins.js

import CAdminAPI from "./axios";

// ============================================
// ADMIN CRUD
// ============================================

export function getAdmins(params = {}) {
  return CAdminAPI.get("/admins", { params });
}

export function getAdminById(id) {
  return CAdminAPI.get(`/admins/${id}`);
}

export function createAdmin(data) {
  return CAdminAPI.post("/admins", data);
}

export function updateAdmin(id, data) {
  return CAdminAPI.patch(`/admins/${id}`, data);
}

export function toggleAdminAccess(id, isActive) {
  return CAdminAPI.patch(`/admins/${id}/access`, { is_active: isActive });
}

export function getAdminActivity(id, params = {}) {
  return CAdminAPI.get(`/admins/${id}/activity`, { params });
}

// ============================================
// ROLE MANAGEMENT
// ============================================

export function getRoles(params = {}) {
  return CAdminAPI.get("/roles", { params });
}

export function getRoleById(roleId) {
  return CAdminAPI.get(`/roles/${roleId}`);
}

export function createRole(data) {
  return CAdminAPI.post("/roles", data);
}

export function updateRole(roleId, data) {
  return CAdminAPI.patch(`/roles/${roleId}`, data);
}

export function deleteRole(roleId) {
  return CAdminAPI.delete(`/roles/${roleId}`);
}

/**
 * Get deletion impact for a role.
 * Response shape after Issue 2 fix:
 *   res.data.data.impact  ← correct access path
 *
 * Any component consuming this must use:
 *   const { impact } = res.data.data;
 * NOT:
 *   const impact = res.data.data;   ← WRONG
 */
export function getRoleDeletionImpact(roleId) {
  return CAdminAPI.get(`/roles/${roleId}/deletion-impact`);
}

// ============================================
// ROLE ASSIGNMENTS
// ============================================

export function getAdminRoles(cadminId) {
  return CAdminAPI.get(`/admins/${cadminId}/roles`);
}

export function assignAdminRoles(cadminId, data) {
  return CAdminAPI.put(`/admins/${cadminId}/roles`, data);
}

/**
 * Create a new Super Admin account
 * Only callable by existing Super Admins
 * @param {Object} data - { name, username, phone, email, password, status }
 */
export function createSuperAdmin(data) {
  return CAdminAPI.post("/admins/super", data);
}

/**
 * Toggle Super Admin active status — requires secret
 * @param {string} id - Admin ID
 * @param {boolean} isActive - true = activate, false = deactivate
 * @param {string} secret - The SUPER_ADMIN_DEACTIVATE_SECRET value
 */
export function toggleSuperAdminAccess(id, isActive, secret) {
  return CAdminAPI.patch(`/admins/${id}/super-access`, {
    is_active: isActive,
    secret,
  });
}
