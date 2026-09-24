// backend/src/modules/cadmin/pricing/cadminPricing.controller.js (do not remove this comment)
// backend/src/modules/cadmin/pricing/cadminPricing.controller.js

import { getPricingConfig, updatePricingConfig } from './cadminPricing.service.js';
import { success, fail } from '../../../utils/response.js';

export async function getConfigHandler(req, res) {
  try {
    const config = await getPricingConfig();
    return success(res, config, 'Pricing config fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch config', 500);
  }
}

export async function updateConfigHandler(req, res) {
  try {
    const updated = await updatePricingConfig(req.body, req.cadmin.cadmin_id);
    return success(res, updated, 'Pricing config updated');
  } catch (err) {
    return fail(res, 'Failed to update config', 500);
  }
}