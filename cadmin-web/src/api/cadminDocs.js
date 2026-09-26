// cadmin-web/src/api/cadminDocs.js (do not remove this comment)
// src/api/cadminDocs.js

import CAdminAPI from "./axios";

/**
 * List shops for verification with filters, sorting, pagination
 */
export function listShopsForVerification(params = {}) {
  return CAdminAPI.get("/files", { params });
}

/**
 * Get shop details with all files for verification modal
 */
export function getShopVerificationDetail(shop_id) {
  return CAdminAPI.get(`/files/shop/${shop_id}`);
}

/**
 * Approve a document (single)
 */
export function verifyFile(file_id) {
  return CAdminAPI.patch(`/files/${file_id}/verify`);
}

/**
 * Reject a document with reason (single)
 */
export function rejectFile(file_id, reason) {
  return CAdminAPI.patch(`/files/${file_id}/reject`, { reason });
}

/**
 *  NEW: Batch update files (verify/reject multiple at once)
 * @param {Object} data
 * @param {string[]} data.verifyIds - Array of file_ids to verify
 * @param {Array<{file_id: string, reason: string}>} data.rejectItems - Array of rejections
 */
export function batchUpdateFiles(data) {
  return CAdminAPI.post("/files/batch", data);
}
