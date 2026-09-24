// backend/src/modules/marketplace-dashboard/marketplaceDashboard.controller.js (do not remove this comment)
// backend/src/modules/marketplace-dashboard/marketplaceDashboard.controller.js

import { getMarketplaceDashboard } from './marketplaceDashboard.service.js';
import { success, fail } from '../../utils/response.js';

/**
 * GET /api/marketplace/dashboard
 *
 * Role scoping:
 *   super_admin  → branch_id = null (all branches)
 *   branch_admin → branch_id = req.user.branch_id
 *   staff        → branch_id = req.user.branch_id
 */
export async function getDashboard(req, res) {
  try {
    const shop_id = req.user.shop_id;

    // super_admin sees all branches — no branch filter
    const branch_id =
      req.user.role === 'super_admin' ? null : (req.user.branch_id ?? null);

    const data = await getMarketplaceDashboard(shop_id, branch_id);

    return success(res, data, 'Dashboard fetched');
  } catch (err) {
    console.error('[Marketplace Dashboard] getDashboard error:', err.message);
    return fail(res, 'Failed to fetch dashboard', 500);
  }
}