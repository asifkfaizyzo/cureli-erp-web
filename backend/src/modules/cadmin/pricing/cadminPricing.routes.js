// backend/src/modules/cadmin/pricing/cadminPricing.routes.js (do not remove this comment)

import { Router } from 'express';
import { requireCAdmin } from '../../../middleware/requireCAdmin.js';
import { 
  getConfigHandler, 
  updateConfigHandler,
  getSlashConfigHandler,
  updateSlashConfigHandler
} from './cadminPricing.controller.js';

const router = Router();

router.get('/marketplace/pricing-config',  requireCAdmin, getConfigHandler);
router.put('/marketplace/pricing-config',  requireCAdmin, updateConfigHandler);

router.get('/marketplace/slash-config', requireCAdmin, getSlashConfigHandler);
router.put('/marketplace/slash-config', requireCAdmin, updateSlashConfigHandler);

export default router;