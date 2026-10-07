import CAdminAPI from "./axios";

const BASE = "/pharmacy-payouts";

// ── List & Detail ──────────────────────────────────────────────

export function getPharmacyPayouts(params = {}) {
  return CAdminAPI.get(BASE, { params });
}

export function getPharmacyPayoutDetail(shopId, weekStart) {
  return CAdminAPI.get(`${BASE}/${shopId}`, { params: { week_start: weekStart } });
}

// ── Refresh ────────────────────────────────────────────────────

export function refreshPharmacyPayout(shopId, weekStart) {
  return CAdminAPI.post(`${BASE}/${shopId}/refresh`, { week_start: weekStart });
}

export function refreshAllPharmacyPayouts(weekStart) {
  return CAdminAPI.post(`${BASE}/refresh-all`, { week_start: weekStart });
}

// ── Finalize ───────────────────────────────────────────────────

export function finalizePharmacyPayoutWeek(weekStart) {
  return CAdminAPI.post(`${BASE}/finalize`, { week_start: weekStart });
}

// ── Status Transitions ─────────────────────────────────────────

export function processPharmacyPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/process`, data);
}

export function completePharmacyPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/complete`, data);
}

export function failPharmacyPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/fail`, data);
}

export function retryPharmacyPayout(payoutId, data) {
  return CAdminAPI.post(`${BASE}/${payoutId}/retry`, data);
}

// ── Adjustments & Notes ────────────────────────────────────────

export function updatePharmacyPayoutAdjustments(payoutId, adjustments) {
  return CAdminAPI.put(`${BASE}/${payoutId}/adjustments`, { adjustments });
}

export function addPharmacyPayoutNote(payoutId, text) {
  return CAdminAPI.post(`${BASE}/${payoutId}/notes`, { text });
}

// ── Bulk Actions ───────────────────────────────────────────────

export function bulkProcessPharmacyPayouts(data) {
  return CAdminAPI.post(`${BASE}/bulk-process`, data);
}

export function bulkCompletePharmacyPayouts(data) {
  return CAdminAPI.post(`${BASE}/bulk-complete`, data);
}

// ── History & Export ───────────────────────────────────────────

export function getPharmacyPayoutHistory(shopId, params = {}) {
  return CAdminAPI.get(`${BASE}/${shopId}/history`, { params });
}

export function exportPharmacyPayoutsCSV(params = {}) {
  return CAdminAPI.get(`${BASE}/export`, {
    params,
    responseType: "blob",
  });
}