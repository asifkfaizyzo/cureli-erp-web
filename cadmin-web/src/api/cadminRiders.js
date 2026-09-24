// cadmin-web/src/api/cadminRiders.js (do not remove this comment)
import CAdminAPI from "./axios";

// ── Riders List ───────────────────────────────────────────────
export function getRiders(params = {}) {
  return CAdminAPI.get("/delivery/riders", { params });
}

// ── Rider Detail ──────────────────────────────────────────────
export function getRiderDetail(riderId) {
  return CAdminAPI.get(`/delivery/riders/${riderId}`);
}

// ── Create Team Rider ─────────────────────────────────────────
export function createTeamRider(data) {
  return CAdminAPI.post("/delivery/riders", data);
}

// ── Convert Rider Type ──────────────────────────────────────
export function convertRiderType(riderId, newType) {
  return CAdminAPI.patch(`/delivery/riders/${riderId}/convert-type`, {
    new_type: newType,
  });
}

// ── Approve Application ───────────────────────────────────────
export function approveRider(riderId) {
  return CAdminAPI.post(`/delivery/riders/${riderId}/approve`);
}

// ── Reject Application ────────────────────────────────────────
export function rejectRider(riderId, reason) {
  return CAdminAPI.post(`/delivery/riders/${riderId}/reject`, { reason });
}

// ── Suspend Rider ─────────────────────────────────────────────
export function suspendRider(riderId, reason) {
  return CAdminAPI.post(`/delivery/riders/${riderId}/suspend`, { reason });
}

// ── Reactivate Rider ──────────────────────────────────────────
export function reactivateRider(riderId) {
  return CAdminAPI.post(`/delivery/riders/${riderId}/reactivate`);
}

// ── Review Document ───────────────────────────────────────────
export function reviewDocument(riderId, documentId, action, rejectionReason) {
  return CAdminAPI.patch(
    `/delivery/riders/${riderId}/documents/${documentId}/review`,
    { action, rejection_reason: rejectionReason }
  );
}

// ── Pending Reviews ───────────────────────────────────────────
export function getPendingReviews(params = {}) {
  return CAdminAPI.get("/delivery/reviews", { params });
}