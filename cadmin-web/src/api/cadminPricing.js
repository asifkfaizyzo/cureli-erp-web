// cadmin-web/src/api/cadminPricing.js (do not remove this comment)
// cadmin-web/src/api/cadminPricing.js

import CAdminAPI from "./axios";

export const getPricingConfig = () =>
  CAdminAPI.get("/marketplace/pricing-config");

export const updatePricingConfig = (data) =>
  CAdminAPI.put("/marketplace/pricing-config", data);

export const getSlashConfig = () =>
  CAdminAPI.get("/marketplace/slash-config");

export const updateSlashConfig = (data) =>
  CAdminAPI.put("/marketplace/slash-config", data);