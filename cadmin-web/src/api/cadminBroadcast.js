// cadmin-web/src/api/cadminBroadcast.js (do not remove this comment)
// src/api/cadminBroadcast.js

import CAdminAPI from "./axios";

// ============================================
// FILE UPLOAD
// ============================================

/**
 * Upload a broadcast attachment (image or video)
 * @param {File} file - The file to upload
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Upload response
 */
export function uploadBroadcastAttachment(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  return CAdminAPI.post("/broadcast/inapp/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
}

/**
 * Delete a broadcast attachment
 * @param {string} filename - The filename to delete
 * @returns {Promise} - Delete response
 */
export function deleteBroadcastAttachment(filename) {
  return CAdminAPI.delete(`/broadcast/inapp/upload/${filename}`);
}

// ============================================
// PREVIEW
// ============================================

export function previewBroadcast(filters, includeDetails = true) {
  return CAdminAPI.post("/broadcast/inapp/preview", {
    target_filters: filters,
    include_details: includeDetails,
  });
}

// ============================================
// SEND NOW (IMMEDIATE)
// ============================================

export function sendBroadcastNow(data) {
  return CAdminAPI.post("/broadcast/inapp/send-now", data);
}

// ============================================
// DRAFT MANAGEMENT
// ============================================

export function createDraft(data) {
  return CAdminAPI.post("/broadcast/inapp/draft", data);
}

export function updateDraft(campaignId, data) {
  return CAdminAPI.put(`/broadcast/inapp/${campaignId}`, data);
}

export function deleteDraft(campaignId) {
  return CAdminAPI.delete(`/broadcast/inapp/${campaignId}`);
}

// ============================================
// SCHEDULING
// ============================================

export function scheduleBroadcast(campaignId, scheduledFor) {
  return CAdminAPI.post(`/broadcast/inapp/${campaignId}/schedule`, {
    scheduled_for: scheduledFor,
  });
}

export function cancelScheduled(campaignId) {
  return CAdminAPI.delete(`/broadcast/inapp/${campaignId}`);
}

// ============================================
// LIST VIEWS
// ============================================

export function getDrafts(page = 1, limit = 10) {
  return CAdminAPI.get("/broadcast/inapp/drafts", { params: { page, limit } });
}

export function getScheduled(page = 1, limit = 10) {
  return CAdminAPI.get("/broadcast/inapp/scheduled", { params: { page, limit } });
}

export function getHistory(page = 1, limit = 20) {
  return CAdminAPI.get("/broadcast/inapp/history", { params: { page, limit } });
}

export function getCampaignById(campaignId) {
  return CAdminAPI.get(`/broadcast/inapp/${campaignId}`);
}

// ============================================
// FILTER OPTIONS
// ============================================

export function getShopsForFilter(search = '', page = 1, limit = 50) {
  return CAdminAPI.get("/broadcast/inapp/filters/shops", {
    params: { search, page, limit },
  });
}

export function getUserRoles() {
  return CAdminAPI.get("/broadcast/inapp/filters/roles");
}

export function getCAdminRoles() {
  return CAdminAPI.get("/broadcast/inapp/filters/cadmin-roles");
}

export function getActivePlans() {
  return CAdminAPI.get("/plans", {
    params: { status: "ACTIVE", type: "PRE_MADE", page: 1, limit: 100 },
  });
}

// ============================================
// SEGMENTS
// ============================================

export function createSegment(data) {
  return CAdminAPI.post("/broadcast/inapp/segments", data);
}

export function getSegments() {
  return CAdminAPI.get("/broadcast/inapp/segments");
}

export function deleteSegment(segmentId) {
  return CAdminAPI.delete(`/broadcast/inapp/segments/${segmentId}`);
}

// ============================================
// TEMPLATES
// ============================================

export function createTemplate(data) {
  return CAdminAPI.post("/broadcast/inapp/templates", data);
}

export function getTemplates() {
  return CAdminAPI.get("/broadcast/inapp/templates");
}

export function useTemplate(templateId) {
  return CAdminAPI.post(`/broadcast/inapp/templates/${templateId}/use`);
}

export default {
  // File upload
  uploadBroadcastAttachment,
  deleteBroadcastAttachment,
  // Preview & Send
  previewBroadcast,
  sendBroadcastNow,
  // Drafts
  createDraft,
  updateDraft,
  deleteDraft,
  // Scheduling
  scheduleBroadcast,
  cancelScheduled,
  // Lists
  getDrafts,
  getScheduled,
  getHistory,
  getCampaignById,
  // Filters
  getShopsForFilter,
  getUserRoles,
  getCAdminRoles,
  getActivePlans,
  // Segments
  createSegment,
  getSegments,
  deleteSegment,
  // Templates
  createTemplate,
  getTemplates,
  useTemplate,
};