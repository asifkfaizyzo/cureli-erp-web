// backend/src/modules/marketplace-orders/marketplace.orders.routes.js (do not remove this comment)
// backend/src/modules/marketplace-orders/marketplace.orders.routes.js

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  listOrders,
  getOrderDetail,
  acceptOrder,
  rejectOrder,
  markReady,
  completeOrder,
  getPrescriptionUrl,
  getBillingData,
  regenerateInvoice,
} from './marketplace.orders.controller.js';

const router = Router();

// All routes require ERP authentication
router.use(requireAuth);

/**
 * GET /api/marketplace-orders
 * List orders — supports ?status=PLACED or ?status=ACCEPTED,READY_FOR_PICKUP
 */
router.get('/', listOrders);

/**
 * GET /api/marketplace-orders/:orderId/billing-data
 * Returns order items with available batches for the billing page.
 */
router.get('/:orderId/billing-data', getBillingData);

/**
 * GET /api/marketplace-orders/:orderId/prescriptions/:prescriptionId/url
 */
router.get('/:orderId/prescriptions/:prescriptionId/url', getPrescriptionUrl);

/**
 * POST /api/marketplace-orders/:orderId/regenerate-invoice
 * Manually retry PDF generation if background generation failed.
 */
router.post('/:orderId/regenerate-invoice', regenerateInvoice);

/**
 * GET /api/marketplace-orders/:orderId/invoice
 * ERP pharmacy can download the invoice PDF.
 */
router.get('/:orderId/invoice', async (req, res) => {
  try {
    const { getInvoiceDownloadUrl } = await import(
      '../mobile/invoice/invoice.service.js'
    );
    const data = await getInvoiceDownloadUrl(
      req.params.orderId,
      'pharmacy',
      req.user.shop_id,
    );
    res.json({ success: true, data });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/marketplace-orders/:orderId
 */
router.get('/:orderId', getOrderDetail);

/**
 * POST /api/marketplace-orders/:orderId/accept
 */
router.post('/:orderId/accept', acceptOrder);

/**
 * POST /api/marketplace-orders/:orderId/reject
 * Body: { rejection_reason, rejection_reason_other? }
 */
router.post('/:orderId/reject', rejectOrder);

/**
 * POST /api/marketplace-orders/:orderId/ready
 */
router.post('/:orderId/ready', markReady);

/**
 * POST /api/marketplace-orders/:orderId/complete
 */
router.post('/:orderId/complete', completeOrder);

export default router;