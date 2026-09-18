// cadmin-web/src/api/cadminMobileEmailBroadcast.js

import CAdminAPI from "./axios";

export function previewCustomerRecipients(targetFilters = {}) {
  return CAdminAPI.post("/broadcast/mobile-email/preview", {
    target_filters: targetFilters,
  });
}

export function sendCustomerEmailNow(data) {
  return CAdminAPI.post("/broadcast/mobile-email/send-now", data);
}

export function sendCustomerTestEmail(data) {
  return CAdminAPI.post("/broadcast/mobile-email/test", data);
}

export function createCustomerDraft(data) {
  return CAdminAPI.post("/broadcast/mobile-email/draft", data);
}

export function updateCustomerDraft(campaignId, data) {
  return CAdminAPI.put(`/broadcast/mobile-email/${campaignId}`, data);
}

export function deleteCustomerDraft(campaignId) {
  return CAdminAPI.delete(`/broadcast/mobile-email/${campaignId}`);
}

export function scheduleCustomerCampaign(campaignId, scheduledFor) {
  return CAdminAPI.post(`/broadcast/mobile-email/${campaignId}/schedule`, {
    scheduled_for: scheduledFor,
  });
}

export function getCustomerDrafts(page = 1, limit = 10) {
  return CAdminAPI.get("/broadcast/mobile-email/drafts", {
    params: { page, limit },
  });
}

export function getCustomerScheduled(page = 1, limit = 10) {
  return CAdminAPI.get("/broadcast/mobile-email/scheduled", {
    params: { page, limit },
  });
}

export function getCustomerHistory(page = 1, limit = 20, search = "") {
  return CAdminAPI.get("/broadcast/mobile-email/history", {
    params: { page, limit, search },
  });
}

export function getCustomerCampaignById(campaignId) {
  return CAdminAPI.get(`/broadcast/mobile-email/${campaignId}`);
}