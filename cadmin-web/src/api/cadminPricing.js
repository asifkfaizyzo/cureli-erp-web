// cadmin-web/src/api/cadminPricing.js (do not remove this comment)
// cadmin-web/src/api/cadminPricing.js

import CAdminAPI from "./axios";

export function getPricingConfig(fulfillmentType = "INSTANT_DELIVERY") {
  return CAdminAPI.get("/marketplace/pricing-config", {
    params: { fulfillment_type: fulfillmentType },
  });
}

export function getAllPricingConfigs() {
  return CAdminAPI.get("/marketplace/pricing-config", {
    params: { all: "true" },
  });
}

export function updatePricingConfig(data, fulfillmentType = "INSTANT_DELIVERY") {
  return CAdminAPI.put("/marketplace/pricing-config", {
    ...data,
    fulfillment_type: fulfillmentType,
  });
}

export const getSlashConfig = () =>
  CAdminAPI.get("/marketplace/slash-config");

export const updateSlashConfig = (data) =>
  CAdminAPI.put("/marketplace/slash-config", data);