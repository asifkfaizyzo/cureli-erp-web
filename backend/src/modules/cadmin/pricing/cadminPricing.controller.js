// backend/src/modules/cadmin/pricing/cadminPricing.controller.js (do not remove this comment)

import { 
  getPricingConfig, 
  updatePricingConfig, 
  getSlashConfig, 
  updateSlashConfig 
} from './cadminPricing.service.js';
import { success, fail } from '../../../utils/response.js';

export async function getConfigHandler(req, res) {
  try {
    const config = await getPricingConfig();
    return success(res, config, 'Pricing config fetched');
  } catch (err) {
    console.error('[cadminPricing] getConfigHandler error:', err);
    return fail(res, 'Failed to fetch config', 500);
  }
}

export async function updateConfigHandler(req, res) {
  try {
    const cadminId = req.cadmin?.cadmin_id || null;
    const updated = await updatePricingConfig(req.body, cadminId);
    return success(res, updated, 'Pricing config updated');
  } catch (err) {
    console.error('[cadminPricing] updateConfigHandler error:', err);
    return fail(res, err.message || 'Failed to update config', 500);
  }
}

export async function getSlashConfigHandler(req, res) {
  try {
    const config = await getSlashConfig();
    return success(res, config, 'Slash display config fetched');
  } catch (err) {
    console.error('[cadminPricing] getSlashConfigHandler error:', err);
    return fail(res, 'Failed to fetch slash config', 500);
  }
}

export async function updateSlashConfigHandler(req, res) {
  try {
    const cadminId = req.cadmin?.cadmin_id || null;
    const updated = await updateSlashConfig(req.body, cadminId);
    return success(res, updated, 'Slash display config updated');
  } catch (err) {
    console.error('[cadminPricing] updateSlashConfigHandler error:', err);
    return fail(res, err.message || 'Failed to update slash config', 400);
  }
}