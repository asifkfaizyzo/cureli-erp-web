// cadmin-web/src/api/cadminFleetPricing.js

import CAdminAPI from "./axios";

const BASE = "/fleet/pricing";

// ============================================
// BASE PAY CONFIGS
// ============================================

export function getPricingConfig() {
  return CAdminAPI.get(`${BASE}/config`);
}

export function createPricingConfig(data) {
  return CAdminAPI.post(`${BASE}/config`, data);
}

export function getPricingHistory(params = {}) {
  return CAdminAPI.get(`${BASE}/history`, { params });
}

export function simulatePricing(data) {
  return CAdminAPI.post(`${BASE}/simulate`, data);
}

// ============================================
// SURGE RULES
// ============================================

export function getSurgeRules() {
  return CAdminAPI.get(`${BASE}/surge`);
}

export function createSurgeRule(data) {
  return CAdminAPI.post(`${BASE}/surge`, data);
}

export function toggleSurgeRule(id, data) {
  return CAdminAPI.patch(`${BASE}/surge/${id}/toggle`, data);
}

export function deleteSurgeRule(id) {
  return CAdminAPI.delete(`${BASE}/surge/${id}`);
}