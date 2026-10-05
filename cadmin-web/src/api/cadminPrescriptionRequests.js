//cadmin-web\src\api\cadminPrescriptionRequests.js
import CAdminAPI from "./axios";

/**
 * List all prescription requests (paginated, filterable).
 * @param {Object} params - { page, limit, search, status }
 */
export function getPrescriptionRequests(params = {}) {
  return CAdminAPI.get("/prescription-requests", { params });
}

/**
 * Get full detail of a single prescription request.
 * @param {string} requestId
 */
export function getPrescriptionRequestById(requestId) {
  return CAdminAPI.get(`/prescription-requests/${requestId}`);
}

/**
 * Get signed URL for a prescription file.
 * @param {string} requestId
 * @param {string} fileId
 */
export function getPrescriptionRequestFileUrl(requestId, fileId) {
  return CAdminAPI.get(`/prescription-requests/${requestId}/files/${fileId}/url`);
}