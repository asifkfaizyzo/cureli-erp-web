// cadmin-web/src/api/cadminFleetRiderPayouts.js (do not remove this comment)
import CAdminAPI from "./axios";

const BASE = "/fleet/rider-payouts";

// ── List & Detail ──────────────────────────────────────────────

export function getRiderPayouts(params = {}) {
  return CAdminAPI.get(BASE, { params });
}

export function getRiderPayoutDetail(riderId, weekStart) {
  return CAdminAPI.get(`${BASE}/${riderId}`, { params: { week_start: weekStart } });
}

// ── Refresh ────────────────────────────────────────────────────

export function refreshRiderPayout(riderId, weekStart) {
  return CAdminAPI.post(`${BASE}/${riderId}/refresh`, { week_start: weekStart });
}

export function refreshAllRiderPayouts(weekStart, riderType) {
  return CAdminAPI.post(`${BASE}/refresh-all`, { week_start: weekStart, rider_type: riderType });
}

// ── Finalize ───────────────────────────────────────────────────

export function finalizeRiderPayoutWeek(weekStart) {
  return CAdminAPI.post(`${BASE}/finalize`, { week_start: weekStart });
}

// ── Status Transitions ─────────────────────────────────────────

export function processRiderPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/process`, data);
}

export function completeRiderPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/complete`, data);
}

export function failRiderPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/fail`, data);
}

export function retryRiderPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/retry`, data);
}

// ── Deductions & Notes ─────────────────────────────────────────

export function updateRiderPayoutDeductions(payoutId, deductions) {
  return CAdminAPI.put(`${BASE}/${payoutId}/deductions`, { deductions });
}

export function addRiderPayoutNote(payoutId, text) {
  return CAdminAPI.post(`${BASE}/${payoutId}/notes`, { text });
}

// ── TEAM Payout Management ─────────────────────────────────────

export function createTeamPayout(data) {
  return CAdminAPI.post(`${BASE}/team`, data);
}

export function updateTeamPayoutAmount(payoutId, amount) {
  return CAdminAPI.put(`${BASE}/${payoutId}/team-amount`, { amount });
}

// ── Attendance ─────────────────────────────────────────────────

export function getRiderAttendance(riderId, weekStart) {
  return CAdminAPI.get(`${BASE}/${riderId}/attendance`, {
    params: { week_start: weekStart },
  });
}


// ── Bulk Actions ───────────────────────────────────────────────

export function bulkProcessRiderPayouts(data) {
  return CAdminAPI.post(`${BASE}/bulk-process`, data);
}

export function bulkCompleteRiderPayouts(data) {
  return CAdminAPI.post(`${BASE}/bulk-complete`, data);
}

// ── History & Export ───────────────────────────────────────────

export function getRiderPayoutHistory(riderId, params = {}) {
  return CAdminAPI.get(`${BASE}/${riderId}/history`, { params });
}

export function exportRiderPayoutsCSV(params = {}) {
  return CAdminAPI.get(`${BASE}/export`, {
    params,
    responseType: "blob",
  });
}