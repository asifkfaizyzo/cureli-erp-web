// cadmin-web/src/api/cadminRiders.js (do not remove this comment)
import CAdminAPI from "./axios";

// ── Riders List ───────────────────────────────────────────────
export function getRiders(params = {}) {
  return CAdminAPI.get("/fleet/riders", { params });
}

// ── Rider Detail ──────────────────────────────────────────────
export function getRiderDetail(riderId) {
  return CAdminAPI.get(`/fleet/riders/${riderId}`);
}

// ── Create Team Rider ─────────────────────────────────────────
export function createTeamRider(data) {
  return CAdminAPI.post("/fleet/riders", data);
}

// ── Convert Rider Type ────────────────────────────────────────
export function convertRiderType(riderId, newType) {
  return CAdminAPI.patch(`/fleet/riders/${riderId}/convert-type`, {
    new_type: newType,
  });
}

// ── Approve Application ───────────────────────────────────────
export function approveRider(riderId) {
  return CAdminAPI.post(`/fleet/riders/${riderId}/approve`);
}

// ── Reject Application ────────────────────────────────────────
export function rejectRider(riderId, reason) {
  return CAdminAPI.post(`/fleet/riders/${riderId}/reject`, { reason });
}

// ── Suspend Rider ─────────────────────────────────────────────
export function suspendRider(riderId, reason) {
  return CAdminAPI.post(`/fleet/riders/${riderId}/suspend`, { reason });
}

// ── Reactivate Rider ──────────────────────────────────────────
export function reactivateRider(riderId) {
  return CAdminAPI.post(`/fleet/riders/${riderId}/reactivate`);
}

// ── Review Document ───────────────────────────────────────────
export function reviewDocument(riderId, documentId, action, rejectionReason) {
  return CAdminAPI.patch(
    `/fleet/riders/${riderId}/documents/${documentId}/review`,
    { action, rejection_reason: rejectionReason }
  );
}

// ── Pending Reviews ───────────────────────────────────────────
export function getPendingReviews(params = {}) {
  return CAdminAPI.get("/fleet/reviews", { params });
}

// ── Zone Management (if used in UI) ───────────────────────────
export function getZones(params = {}) {
  return CAdminAPI.get("/fleet/zones", { params });
}

export function createZone(data) {
  return CAdminAPI.post("/fleet/zones", data);
}

export function updateZone(zoneId, data) {
  return CAdminAPI.patch(`/fleet/zones/${zoneId}`, data);
}