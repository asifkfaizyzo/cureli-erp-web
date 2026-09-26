// backend/src/modules/prescription-requests/prescription.requests.routes.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.routes.js

import { Router }                     from 'express';
import { mobileAuth }                 from '../../middleware/mobile.auth.js';
import { prescriptionRequestUpload, handleMulterError } from '../../config/multer.js';
import {
  uploadFiles,
  submitPrescriptionRequest,
  listRequests,
  getDetail,
  getFileUrl,
  acceptPharmacyQuote,
  cancelPrescriptionRequest,
} from './prescription.requests.controller.js';

const router = Router();

// All routes require mobile customer auth
router.use(mobileAuth);

// POST /mobile/prescription-requests/upload
// Upload prescription images — returns file keys
router.post(
  '/upload',
  prescriptionRequestUpload,
  handleMulterError,
  uploadFiles,
);

// POST /mobile/prescription-requests
// Submit request to selected pharmacies
router.post('/', submitPrescriptionRequest);

// GET /mobile/prescription-requests
// List customer's requests
router.get('/', listRequests);

// GET /mobile/prescription-requests/:requestId
// Request detail with all pharmacy responses
router.get('/:requestId', getDetail);

// GET /mobile/prescription-requests/:requestId/files/:fileId/url
// Signed URL for a prescription image
router.get('/:requestId/files/:fileId/url', getFileUrl);

// POST /mobile/prescription-requests/:requestId/recipients/:recipientId/accept
// Accept a pharmacy's quote
router.post('/:requestId/recipients/:recipientId/accept', acceptPharmacyQuote);

// POST /mobile/prescription-requests/:requestId/cancel
// Cancel the request
router.post('/:requestId/cancel', cancelPrescriptionRequest);

export default router;