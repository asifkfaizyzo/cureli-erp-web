// backend/src/modules/cadmin/marketplace-dashboard/cadminMarketplaceDashboard.controller.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace-dashboard/cadminMarketplaceDashboard.controller.js

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminMarketplaceDashboard.service.js";

export async function getMarketplaceDashboardController(req, res) {
  try {
    const data = await svc.getMarketplaceDashboard();
    return success(res, data, "Marketplace dashboard fetched");
  } catch (err) {
    console.error("[CAdmin MP Dashboard] Error:", err.message);
    return fail(res, "Failed to fetch marketplace dashboard", 500);
  }
}