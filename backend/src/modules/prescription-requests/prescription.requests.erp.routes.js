// backend/src/modules/prescription-requests/prescription.requests.erp.routes.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.erp.routes.js

import { Router }      from 'express';
import { requireAuth } from '../../middleware/auth.js';  // ← was: { auth }
import {
  listErpRequests,
  getErpDetail,
  getErpFileUrl,
  submitErpQuote,
  declineErpRequest,
} from './prescription.requests.erp.controller.js';

const router = Router();

// All routes require ERP auth
router.use(requireAuth);  // ← was: auth

// GET /api/prescription-requests
router.get('/', listErpRequests);

// GET /api/prescription-requests/:recipientId
router.get('/:recipientId', getErpDetail);

// GET /api/prescription-requests/:recipientId/files/:fileId/url
router.get('/:recipientId/files/:fileId/url', getErpFileUrl);

// POST /api/prescription-requests/:recipientId/quote
router.post('/:recipientId/quote', submitErpQuote);

// POST /api/prescription-requests/:recipientId/decline
router.post('/:recipientId/decline', declineErpRequest);

export default router;