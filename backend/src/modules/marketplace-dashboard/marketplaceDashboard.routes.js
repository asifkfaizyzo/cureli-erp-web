// backend/src/modules/marketplace-dashboard/marketplaceDashboard.routes.js (do not remove this comment)
// backend/src/modules/marketplace-dashboard/marketplaceDashboard.routes.js

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getDashboard } from './marketplaceDashboard.controller.js';

const router = Router();

// All marketplace dashboard routes require authentication
router.use(requireAuth);

/**
 * GET /api/marketplace/dashboard
 * Returns aggregated dashboard data for the authenticated shop.
 * Scoped to branch for non-super-admin users.
 */
router.get('/', getDashboard);

export default router;