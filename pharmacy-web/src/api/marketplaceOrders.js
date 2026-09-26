// pharmacy-web/src/api/marketplaceOrders.js (do not remove this comment)
// pharmacy-web/src/api/marketplaceOrders.js
// Updated: Added getBillingData and getInvoiceUrl

import API from './axios';

export const getOrders = (params = {}) =>
  API.get('/marketplace-orders', { params }).then((r) => r.data);

export const getOrderDetail = (orderId) =>
  API.get(`/marketplace-orders/${orderId}`).then((r) => r.data);

export const acceptOrder = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/accept`).then((r) => r.data);

export const rejectOrder = (orderId, body) =>
  API.post(`/marketplace-orders/${orderId}/reject`, body).then((r) => r.data);

export const markReady = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/ready`).then((r) => r.data);

export const completeOrder = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/complete`).then((r) => r.data);

export const getPrescriptionUrl = (orderId, prescriptionId) =>
  API.get(
    `/marketplace-orders/${orderId}/prescriptions/${prescriptionId}/url`
  ).then((r) => r.data);

/**
 * GET /api/marketplace-orders/:orderId/billing-data
 * Returns order items with available inventory batches.
 * Used by SalesBillingPage when ?marketplace_order= is in URL.
 */
export const getBillingData = (orderId) =>
  API.get(`/marketplace-orders/${orderId}/billing-data`).then((r) => r.data);

/**
 * GET /api/marketplace-orders/:orderId/invoice
 * Returns a signed S3 URL for the 2-page PDF invoice.
 * Available once status is READY_FOR_PICKUP or COMPLETED.
 */
export const getInvoiceUrl = (orderId) =>
  API.get(`/marketplace-orders/${orderId}/invoice`).then((r) => r.data);

/**
 * POST /api/marketplace-orders/:orderId/regenerate-invoice
 * Manually retry PDF generation if background generation failed.
 */
export const regenerateInvoice = (orderId) =>
  API.post(`/marketplace-orders/${orderId}/regenerate-invoice`).then((r) => r.data);