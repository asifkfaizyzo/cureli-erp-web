// cadmin-web/src/api/cadminEmailBroadcast.js (do not remove this comment)
// src/api/cadminEmailBroadcast.js

import CAdminAPI from "./axios";

const BASE_URL = '/broadcast/email';

// ============================================
// PREVIEW & QUOTA
// ============================================

/**
 * Preview recipient count
 * @param {Object} filters - Target filters
 * @param {boolean} targetUsers - Include shop owners
 * @param {boolean} targetCAdmins - Include CAdmins
 */
export const previewRecipients = async (filters, targetUsers = true, targetCAdmins = false) => {
  const response = await CAdminAPI.post(`${BASE_URL}/preview`, {
    target_filters: filters,
    target_users: targetUsers,
    target_cadmins: targetCAdmins,
  });
  return response.data;
};

/**
 * Get daily quota status
 */
export const getQuotaStatus = async () => {
  const response = await CAdminAPI.get(`${BASE_URL}/quota`);
  return response.data;
};

// ============================================
// SEND OPERATIONS
// ============================================

/**
 * Send email broadcast immediately
 * @param {Object} data - Campaign data
 */
export const sendEmailNow = async (data) => {
  const response = await CAdminAPI.post(`${BASE_URL}/send-now`, data);
  return response.data;
};

/**
 * Send test email to self
 * @param {Object} data - Test email data
 */
export const sendTestEmail = async (data) => {
  const response = await CAdminAPI.post(`${BASE_URL}/test`, data);
  return response.data;
};

// ============================================
// DRAFT MANAGEMENT
// ============================================

/**
 * Create new draft
 * @param {Object} data - Draft data
 */
export const createDraft = async (data) => {
  const response = await CAdminAPI.post(`${BASE_URL}/draft`, data);
  return response.data;
};

/**
 * Get all drafts
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 */
export const getDrafts = async (page = 1, limit = 10, search = '') => {
  const response = await CAdminAPI.get(`${BASE_URL}/drafts`, {
    params: { page, limit, search },
  });
  return response.data;
};

/**
 * Update draft
 * @param {string} campaignId - Campaign UUID
 * @param {Object} data - Updated data
 */
export const updateDraft = async (campaignId, data) => {
  const response = await CAdminAPI.put(`${BASE_URL}/draft/${campaignId}`, data);
  return response.data;
};

/**
 * Delete draft
 * @param {string} campaignId - Campaign UUID
 */
export const deleteDraft = async (campaignId) => {
  const response = await CAdminAPI.delete(`${BASE_URL}/draft/${campaignId}`);
  return response.data;
};

// ============================================
// SCHEDULING
// ============================================

/**
 * Schedule a campaign
 * @param {string} campaignId - Campaign UUID
 * @param {string} scheduledFor - ISO datetime string
 */
export const scheduleCampaign = async (campaignId, scheduledFor) => {
  const response = await CAdminAPI.post(`${BASE_URL}/schedule/${campaignId}`, {
    scheduled_for: scheduledFor,
  });
  return response.data;
};

/**
 * Get scheduled campaigns
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getScheduled = async (page = 1, limit = 10) => {
  const response = await CAdminAPI.get(`${BASE_URL}/scheduled`, {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Cancel scheduled/paused campaign
 * @param {string} campaignId - Campaign UUID
 */
export const cancelCampaign = async (campaignId) => {
  const response = await CAdminAPI.post(`${BASE_URL}/cancel/${campaignId}`);
  return response.data;
};

// ============================================
// HISTORY
// ============================================

/**
 * Get campaign history
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 */
export const getHistory = async (page = 1, limit = 10, search = '') => {
  const response = await CAdminAPI.get(`${BASE_URL}/history`, {
    params: { page, limit, search },
  });
  return response.data;
};

/**
 * Get single campaign by ID
 * @param {string} campaignId - Campaign UUID
 */
export const getCampaignById = async (campaignId) => {
  const response = await CAdminAPI.get(`${BASE_URL}/${campaignId}`);
  return response.data;
};

// ============================================
// FILTER OPTIONS
// ============================================

/**
 * Get shops for filter dropdown
 * @param {string} search - Search query
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getShopsForFilter = async (search = '', page = 1, limit = 50) => {
  const response = await CAdminAPI.get(`${BASE_URL}/filters/shops`, {
    params: { search, page, limit },
  });
  return response.data;
};

/**
 * Get active plans for filter
 */
export const getActivePlans = async () => {
  const response = await CAdminAPI.get(`${BASE_URL}/filters/plans`);
  return response.data;
};

/**
 * Get CAdmin roles for filter
 */
export const getCAdminRoles = async () => {
  const response = await CAdminAPI.get(`${BASE_URL}/filters/cadmin-roles`);
  return response.data;
};

// ============================================
// FILE UPLOAD
// ============================================

/**
 * Upload inline image
 * @param {File} file - Image file
 * @param {Function} onProgress - Progress callback (0-100)
 */
export const uploadInlineImage = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await CAdminAPI.post(`${BASE_URL}/upload/inline-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return response.data;
};

/**
 * Upload file attachment
 * @param {File} file - Attachment file
 * @param {Function} onProgress - Progress callback (0-100)
 */
export const uploadAttachment = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await CAdminAPI.post(`${BASE_URL}/upload/attachment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return response.data;
};

/**
 * Delete uploaded file
 * @param {string} filename - Filename to delete
 */
export const deleteUploadedFile = async (filename) => {
  const response = await CAdminAPI.delete(`${BASE_URL}/upload/${filename}`);
  return response.data;
};

// ============================================
// ADMIN CONTROLS
// ============================================

/**
 * Get worker status
 */
export const getWorkerStatus = async () => {
  const response = await CAdminAPI.get(`${BASE_URL}/admin/status`);
  return response.data;
};

/**
 * Retry failed campaign
 * @param {string} campaignId - Campaign UUID
 */
export const retryCampaign = async (campaignId) => {
  const response = await CAdminAPI.post(`${BASE_URL}/admin/retry/${campaignId}`);
  return response.data;
};

// ============================================
// UNSUBSCRIBE MANAGEMENT
// ============================================

/**
 * Get unsubscribe list
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 */
export const getUnsubscribeList = async (page = 1, limit = 20, search = '') => {
  const response = await CAdminAPI.get(`${BASE_URL}/unsubscribes`, {
    params: { page, limit, search },
  });
  return response.data;
};

/**
 * Get unsubscribe count
 */
export const getUnsubscribeCount = async () => {
  const response = await CAdminAPI.get(`${BASE_URL}/unsubscribes/count`);
  return response.data;
};

/**
 * Add to suppression list
 * @param {string} email - Email address
 * @param {string} reason - Optional reason
 */
export const addToSuppressionList = async (email, reason = '') => {
  const response = await CAdminAPI.post(`${BASE_URL}/unsubscribes`, { email, reason });
  return response.data;
};

/**
 * Remove from suppression list (resubscribe)
 * @param {string} email - Email address
 */
export const removeFromSuppressionList = async (email) => {
  const response = await CAdminAPI.delete(`${BASE_URL}/unsubscribes/${encodeURIComponent(email)}`);
  return response.data;
};

/**
 * Export unsubscribe list as CSV
 */
export const exportUnsubscribeList = async () => {
  const response = await CAdminAPI.get(`${BASE_URL}/unsubscribes/export`, {
    responseType: 'blob',
  });
  return response;
};

/**
 * Bulk add to suppression list
 * @param {string[]} emails - Array of email addresses
 * @param {string} reason - Optional reason
 */
export const bulkAddToSuppressionList = async (emails, reason = '') => {
  const response = await CAdminAPI.post(`${BASE_URL}/unsubscribes/bulk`, { emails, reason });
  return response.data;
};

export default {
  previewRecipients,
  getQuotaStatus,
  sendEmailNow,
  sendTestEmail,
  createDraft,
  getDrafts,
  updateDraft,
  deleteDraft,
  scheduleCampaign,
  getScheduled,
  cancelCampaign,
  getHistory,
  getCampaignById,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
  uploadInlineImage,
  uploadAttachment,
  deleteUploadedFile,
  getWorkerStatus,
  retryCampaign,
  getUnsubscribeList,
  getUnsubscribeCount,
  addToSuppressionList,
  removeFromSuppressionList,
  exportUnsubscribeList,
  bulkAddToSuppressionList,
};