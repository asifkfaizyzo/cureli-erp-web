// backend/src/modules/mobile/orders/mobile.orders.routes.js (do not remove this comment)
// backend/src/modules/mobile/orders/mobile.orders.routes.js

import { Router } from 'express';
import { mobileAuth } from '../../../middleware/mobile.auth.js';
import { requireProfileComplete } from '../../../middleware/requireProfileComplete.js';

import {
  placeOrderHandler,
  listOrdersHandler,
  getOrderDetailHandler,
  cancelOrderHandler,
  getPrescriptionUrlHandler,
  getReorderItemsHandler,
  getInvoiceDownloadHandler,
} from './mobile.orders.controller.js';

const router = Router();

router.use(mobileAuth);
router.use(requireProfileComplete);

router.post('/',                                                 placeOrderHandler);
router.get('/',                                                  listOrdersHandler);
router.get('/:orderId',                                          getOrderDetailHandler);
router.post('/:orderId/cancel',                                  cancelOrderHandler);
router.get('/:orderId/reorder-items',                            getReorderItemsHandler);
router.get('/:orderId/prescriptions/:prescriptionId/url',        getPrescriptionUrlHandler);
router.get('/:orderId/invoice',                                  getInvoiceDownloadHandler);

export default router;