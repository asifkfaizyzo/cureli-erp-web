// backend/src/modules/prescription-requests/prescription.requests.controller.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.controller.js

import { success, fail } from '../../utils/response.js';
import { validate }      from '../../middleware/validate.js';
import {
  uploadRequestFiles,
  submitRequest,
  getCustomerRequests,
  getRequestDetail,
  getRequestFileUrl,
  acceptQuote,
  cancelRequest,
} from './prescription.requests.service.js';
import {
  submitRequestSchema,
  mobileListQuerySchema,
} from './prescription.requests.schema.js';

// ── Upload prescription images ────────────────────────────────────────────────

export async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return fail(res, 'No files uploaded', 400);
    }

    const files = await uploadRequestFiles(req.files);
    return success(res, { files }, 'Files uploaded successfully');
  } catch (err) {
    console.error('[PRxController] Upload error:', err.message);

    if (['INVALID_MIME_TYPE', 'FILE_TOO_LARGE', 'BLOCKED_EXTENSION'].includes(err.code)) {
      return fail(res, err.message, 400);
    }
    if (err.message === 'Maximum 5 prescription files allowed') {
      return fail(res, err.message, 400);
    }

    return fail(res, 'Failed to upload files', 500);
  }
}

// ── Submit prescription request ───────────────────────────────────────────────

export async function submitPrescriptionRequest(req, res) {
  try {
    const parsed = submitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message ?? 'Invalid request', 400);
    }

    const { files, delivery_address_id, search_latitude, search_longitude, branch_ids } =
      parsed.data;

    const result = await submitRequest({
      customerId:       req.mobileUser.id,
      files,
      deliveryAddressId: delivery_address_id,
      searchLatitude:   search_latitude,
      searchLongitude:  search_longitude,
      branchIds:        branch_ids,
    });

    return success(res, result, 'Prescription request submitted successfully', 201);
  } catch (err) {
    console.error('[PRxController] Submit error:', err.message);
    return fail(res, err.message, 400);
  }
}

// ── Get customer requests list ────────────────────────────────────────────────

export async function listRequests(req, res) {
  try {
    const parsed = mobileListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 'Invalid query parameters', 400);
    }

    const result = await getCustomerRequests(req.mobileUser.id, parsed.data);
    return success(res, result);
  } catch (err) {
    console.error('[PRxController] List error:', err.message);
    return fail(res, 'Failed to fetch prescription requests', 500);
  }
}

// ── Get request detail ────────────────────────────────────────────────────────

export async function getDetail(req, res) {
  try {
    const { requestId } = req.params;
    const result = await getRequestDetail(requestId, req.mobileUser.id);
    return success(res, result);
  } catch (err) {
    console.error('[PRxController] Detail error:', err.message);
    if (err.message === 'Prescription request not found') return fail(res, err.message, 404);
    return fail(res, 'Failed to fetch request detail', 500);
  }
}

// ── Get file signed URL ───────────────────────────────────────────────────────

export async function getFileUrl(req, res) {
  try {
    const { requestId, fileId } = req.params;
    const result = await getRequestFileUrl(requestId, fileId, req.mobileUser.id);
    return success(res, result);
  } catch (err) {
    console.error('[PRxController] File URL error:', err.message);
    if (err.message === 'File not found')               return fail(res, err.message, 404);
    if (err.message === 'Prescription file has expired') return fail(res, err.message, 410);
    return fail(res, 'Failed to generate file URL', 500);
  }
}

// ── Accept quote ──────────────────────────────────────────────────────────────

export async function acceptPharmacyQuote(req, res) {
  try {
    const { requestId, recipientId } = req.params;
    const result = await acceptQuote(requestId, recipientId, req.mobileUser.id);
    return success(res, result, 'Quote accepted');
  } catch (err) {
    console.error('[PRxController] Accept quote error:', err.message);
    if (err.message.includes('not found')) return fail(res, err.message, 404);
    if (err.message.includes('expired'))   return fail(res, err.message, 410);
    return fail(res, err.message, 400);
  }
}

// ── Cancel request ────────────────────────────────────────────────────────────

export async function cancelPrescriptionRequest(req, res) {
  try {
    const { requestId } = req.params;
    const result = await cancelRequest(requestId, req.mobileUser.id);
    return success(res, result, 'Request cancelled');
  } catch (err) {
    console.error('[PRxController] Cancel error:', err.message);
    if (err.message === 'Prescription request not found') return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}