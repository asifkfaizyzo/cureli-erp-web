// backend/src/modules/mobile/prescriptions/mobile.prescriptions.routes.js (do not remove this comment)
// ============================================
// backend/src/modules/mobile/prescriptions/mobile.prescriptions.routes.js
// ============================================

import { Router } from 'express';
import { mobileAuth } from '../../../middleware/mobile.auth.js';
import { prescriptionUpload, handleMulterError } from '../../../config/multer.js';
import { uploadPrescriptions } from './mobile.prescriptions.controller.js';

const router = Router();

/**
 * POST /mobile/prescriptions/upload
 * Upload prescription files.
 * Returns prescription_key values to include in POST /mobile/orders.
 *
 * Auth: mobile customer JWT required.
 * Body: multipart/form-data, field name "files", max 5 files, 10MB each.
 */
router.post(
  '/upload',
  mobileAuth,
  prescriptionUpload,
  handleMulterError,
  uploadPrescriptions,
);

export default router;