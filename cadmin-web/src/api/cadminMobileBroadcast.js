// cadmin-web/src/api/cadminMobileBroadcast.js (do not remove this comment)
// cadmin-web/src/api/cadminMobileBroadcast.js

import CAdminAPI from './axios';

// ── Preview ───────────────────────────────────────────────────────────────────
export function previewMobileAudience(audienceFilters = {}) {
  return CAdminAPI.post('/broadcast/mobile/preview', {
    audience_filters: audienceFilters,
  });
}

// ── Send now ──────────────────────────────────────────────────────────────────
export function sendMobileBroadcastNow(data) {
  return CAdminAPI.post('/broadcast/mobile/send-now', data);
}

// ── Drafts ────────────────────────────────────────────────────────────────────
export function createMobileDraft(data) {
  return CAdminAPI.post('/broadcast/mobile/draft', data);
}

export function updateMobileDraft(campaignId, data) {
  return CAdminAPI.put(`/broadcast/mobile/${campaignId}`, data);
}

export function deleteMobileDraft(campaignId) {
  return CAdminAPI.delete(`/broadcast/mobile/${campaignId}`);
}

// ── Scheduling ────────────────────────────────────────────────────────────────
export function scheduleMobileBroadcast(campaignId, scheduledFor) {
  return CAdminAPI.post(`/broadcast/mobile/${campaignId}/schedule`, {
    scheduled_for: scheduledFor,
  });
}

export function cancelMobileScheduled(campaignId) {
  return CAdminAPI.delete(`/broadcast/mobile/${campaignId}`);
}

// ── Lists ─────────────────────────────────────────────────────────────────────
export function getMobileDrafts(page = 1, limit = 10) {
  return CAdminAPI.get('/broadcast/mobile/drafts', { params: { page, limit } });
}

export function getMobileScheduled(page = 1, limit = 10) {
  return CAdminAPI.get('/broadcast/mobile/scheduled', { params: { page, limit } });
}

export function getMobileHistory(page = 1, limit = 20) {
  return CAdminAPI.get('/broadcast/mobile/history', { params: { page, limit } });
}

export function getMobileCampaignById(campaignId) {
  return CAdminAPI.get(`/broadcast/mobile/${campaignId}`);
}