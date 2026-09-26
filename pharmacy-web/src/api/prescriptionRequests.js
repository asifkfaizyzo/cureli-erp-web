// pharmacy-web/src/api/prescriptionRequests.js (do not remove this comment)
// pharmacy-web/src/api/prescriptionRequests.js

import API from './axios';

/**
 * GET /api/prescription-requests
 * List prescription requests for authenticated shop.
 * Supports ?status=SENT&page=1&limit=20
 */
export const getErpRequests = (params = {}) =>
  API.get('/prescription-requests', { params }).then((r) => r.data);

/**
 * GET /api/prescription-requests/:recipientId
 * Full detail for one prescription request recipient.
 */
export const getErpRequestDetail = (recipientId) =>
  API.get(`/prescription-requests/${recipientId}`).then((r) => r.data);

/**
 * GET /api/prescription-requests/:recipientId/files/:fileId/url
 * Get a signed URL to view a prescription image.
 */
export const getPrescriptionFileUrl = (recipientId, fileId) =>
  API.get(`/prescription-requests/${recipientId}/files/${fileId}/url`)
    .then((r) => r.data);

/**
 * POST /api/prescription-requests/:recipientId/quote
 * Submit or replace a quote for a prescription request.
 */
export const submitQuote = (recipientId, body) =>
  API.post(`/prescription-requests/${recipientId}/quote`, body).then((r) => r.data);

/**
 * POST /api/prescription-requests/:recipientId/decline
 * Decline to fulfil a prescription request.
 */
export const declineRequest = (recipientId, body) =>
  API.post(`/prescription-requests/${recipientId}/decline`, body).then((r) => r.data);