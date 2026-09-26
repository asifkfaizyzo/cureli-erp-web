// cadmin-web/src/api/cadminUsers.js (do not remove this comment)
// cadmin-web/src/api/cadminUsers.js

import CAdminAPI from "./axios";

export function getCAdminUsers(params = {}) {
  return CAdminAPI.get("/users", { params });
}

export function getCAdminUserById(id) {
  return CAdminAPI.get(`/users/${id}`);
}

export function toggleCAdminUserAccess(id, is_active) {
  return CAdminAPI.patch(`/users/${id}/access`, { is_active });
}

export function updateCAdminUser(id, payload) {
  return CAdminAPI.patch(`/users/${id}`, payload);
}

export function resetCAdminUserPassword(id) {
  return CAdminAPI.post(`/users/${id}/reset-password`);
}

/**
 * Soft-delete a user account.
 * Anonymises PII and frees email/username for reuse.
 * @param {string} id     - User ID
 * @param {string} reason - Mandatory reason for deletion (stored in audit log)
 */
export function deleteCAdminUser(id, reason) {
  return CAdminAPI.delete(`/users/${id}`, { data: { reason } });
}