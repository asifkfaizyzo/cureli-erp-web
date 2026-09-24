// backend/src/modules/mobile/prescriptions/mobile.prescriptions.service.js (do not remove this comment)
// ============================================
// backend/src/modules/mobile/prescriptions/mobile.prescriptions.service.js
// ============================================

import { uploadFile } from '../../../services/fileStorage.service.js';

const PRESCRIPTION_FOLDER = 'order_prescriptions';

/**
 * Upload one or more prescription files to S3.
 * Returns an array of file metadata to be included in the order placement request.
 *
 * @param {Express.Multer.File[]} files - Array of multer file objects (memory storage)
 * @returns {Promise<Array>}
 */
export async function uploadPrescriptionFiles(files) {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  if (files.length > 5) {
    throw new Error('Maximum 5 prescription files allowed');
  }

  const results = [];

  for (const file of files) {
    const uploaded = await uploadFile({
      buffer: file.buffer,
      folder: PRESCRIPTION_FOLDER,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    results.push({
      prescription_key: uploaded.storage_key,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
    });
  }

  return results;
}