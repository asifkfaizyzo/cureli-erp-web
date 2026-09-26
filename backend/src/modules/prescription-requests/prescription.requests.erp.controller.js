// backend/src/modules/prescription-requests/prescription.requests.erp.controller.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.erp.controller.js

import { success, fail } from '../../utils/response.js';
import {
  getErpRequests,
  getErpRequestDetail,
  getErpRequestFileUrl,
  submitQuote,
  declineRequest,
} from './prescription.requests.service.js';
import {
  erpListQuerySchema,
  submitQuoteSchema,
  declineRequestSchema,
} from './prescription.requests.schema.js';

// ── List prescription requests for pharmacy ───────────────────────────────────

export async function listErpRequests(req, res) {
  try {
    const parsed = erpListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 'Invalid query parameters', 400);
    }

    const shopId = req.user.shop_id;
    if (!shopId) return fail(res, 'No shop associated with this account', 403);

    const result = await getErpRequests(shopId, parsed.data);
    return success(res, result);
  } catch (err) {
    console.error('[PRxErpController] List error:', err.message);
    return fail(res, 'Failed to fetch prescription requests', 500);
  }
}

// ── Get prescription request detail ──────────────────────────────────────────

export async function getErpDetail(req, res) {
  try {
    const { recipientId } = req.params;
    const shopId          = req.user.shop_id;

    if (!shopId) return fail(res, 'No shop associated with this account', 403);

    const result = await getErpRequestDetail(recipientId, shopId);
    return success(res, result);
  } catch (err) {
    console.error('[PRxErpController] Detail error:', err.message);
    if (err.message === 'Prescription request not found') return fail(res, err.message, 404);
    return fail(res, 'Failed to fetch request detail', 500);
  }
}

// ── Get file signed URL ───────────────────────────────────────────────────────

export async function getErpFileUrl(req, res) {
  try {
    const { recipientId, fileId } = req.params;
    const shopId                  = req.user.shop_id;

    if (!shopId) return fail(res, 'No shop associated with this account', 403);

    const result = await getErpRequestFileUrl(recipientId, fileId, shopId);
    return success(res, result);
  } catch (err) {
    console.error('[PRxErpController] File URL error:', err.message);
    if (err.message === 'File not found')               return fail(res, err.message, 404);
    if (err.message === 'Prescription file has expired') return fail(res, err.message, 410);
    return fail(res, 'Failed to generate file URL', 500);
  }
}

// ── Submit or replace quote ───────────────────────────────────────────────────

export async function submitErpQuote(req, res) {
  try {
    const parsed = submitQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message ?? 'Invalid quote data', 400);
    }

    const { recipientId } = req.params;
    const shopId          = req.user.shop_id;

    if (!shopId) return fail(res, 'No shop associated with this account', 403);

    const result = await submitQuote(recipientId, shopId, parsed.data.items);
    return success(res, result, 'Quote submitted successfully');
  } catch (err) {
    console.error('[PRxErpController] Submit quote error:', err.message);
    if (err.message === 'Prescription request not found') return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}

// ── Decline request ───────────────────────────────────────────────────────────

export async function declineErpRequest(req, res) {
  try {
    const parsed = declineRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 'Invalid request body', 400);
    }

    const { recipientId } = req.params;
    const shopId          = req.user.shop_id;

    if (!shopId) return fail(res, 'No shop associated with this account', 403);

    const result = await declineRequest(recipientId, shopId, parsed.data.reason);
    return success(res, result, 'Request declined');
  } catch (err) {
    console.error('[PRxErpController] Decline error:', err.message);
    if (err.message === 'Prescription request not found') return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}