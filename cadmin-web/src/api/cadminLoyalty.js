// cadmin-web/src/api/cadminLoyalty.js (do not remove this comment)
// cadmin-web/src/api/cadminLoyalty.js
import CAdminAPI from "./axios";

export const getLoyaltyConfig = () => 
  CAdminAPI.get("/app-config/loyalty");

export const updateLoyaltyConfig = (updates) => 
  CAdminAPI.patch("/app-config/loyalty", updates);