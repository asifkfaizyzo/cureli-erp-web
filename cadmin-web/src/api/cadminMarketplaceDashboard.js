// cadmin-web/src/api/cadminMarketplaceDashboard.js (do not remove this comment)

import CAdminAPI from "./axios";

/**
 * GET /cadmin/marketplace-dashboard
 * Full marketplace overview payload.
 */
export async function getMarketplaceDashboard() {
  const response = await CAdminAPI.get("/marketplace-dashboard");
  return response.data;
}