// backend/src/modules/mobile/prescriptions/mobile.prescriptions.controller.js (do not remove this comment)
// ============================================
// backend/src/modules/mobile/prescriptions/mobile.prescriptions.controller.js
// ============================================

import { uploadPrescriptionFiles } from './mobile.prescriptions.service.js';
import { success, fail } from '../../../utils/response.js';

/**
 * POST /mobile/prescriptions/upload
 * Upload prescription files before placing an order.
 * Returns file keys to be submitted with the order.
 */
export async function uploadPrescriptions(req, res) {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return fail(res, 'No files uploaded', 400);
    }

    const uploaded = await uploadPrescriptionFiles(files);

    return success(res, { files: uploaded }, 'Prescriptions uploaded successfully');
  } catch (err) {
    console.error('[Prescriptions] Upload error:', err.message);

    if (
      err.code === 'INVALID_MIME_TYPE' ||
      err.code === 'FILE_TOO_LARGE' ||
      err.code === 'BLOCKED_EXTENSION'
    ) {
      return fail(res, err.message, 400);
    }

    if (err.message === 'Maximum 5 prescription files allowed') {
      return fail(res, err.message, 400);
    }

    return fail(res, 'Failed to upload prescriptions', 500);
  }
}