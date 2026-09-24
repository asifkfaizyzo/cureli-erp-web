// backend/src/modules/cadmin/pricing/cadminPricing.routes.js (do not remove this comment)
// backend/src/modules/cadmin/pricing/cadminPricing.routes.js

import { Router } from 'express';
import { requireCAdmin } from '../../../middleware/requireCAdmin.js';
import { getConfigHandler, updateConfigHandler } from './cadminPricing.controller.js';

const router = Router();

router.get('/marketplace/pricing-config',  requireCAdmin, getConfigHandler);
router.put('/marketplace/pricing-config',  requireCAdmin, updateConfigHandler);

export default router;