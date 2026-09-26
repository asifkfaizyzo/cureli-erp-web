// cadmin-web/src/api/cadminMobileUsers.js (do not remove this comment)
// cadmin-web/src/api/cadminMobileUsers.js

import CAdminAPI from "./axios";

// ── List ──────────────────────────────────────────────────────
export function getMobileUsers(params = {}) {
  return CAdminAPI.get("/mobile-users", { params });
}

// ── Detail ────────────────────────────────────────────────────
export function getMobileUserById(userId) {
  return CAdminAPI.get(`/mobile-users/${userId}`);
}

// ── Edit profile (full_name, email) ──────────────────────────
export function editMobileUser(userId, data) {
  return CAdminAPI.patch(`/mobile-users/${userId}`, data);
}

// ── Edit phone ────────────────────────────────────────────────
export function editMobileUserPhone(userId, phone) {
  return CAdminAPI.patch(`/mobile-users/${userId}/phone`, { phone });
}

// ── Block / unblock ───────────────────────────────────────────
export function blockMobileUser(userId, block, reason = "") {
  return CAdminAPI.patch(`/mobile-users/${userId}/block`, { block, reason });
}

// ── Force revoke all sessions ─────────────────────────────────
export function revokeMobileUserSessions(userId) {
  return CAdminAPI.post(`/mobile-users/${userId}/revoke-sessions`);
}

// ── Delete account ────────────────────────────────────────────
export function deleteMobileUser(userId, reason = "") {
  return CAdminAPI.delete(`/mobile-users/${userId}`, { data: { reason } });
}