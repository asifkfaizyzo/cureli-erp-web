// cadmin-web/src/api/cadminCommission.js

import CAdminAPI from "./axios";

// ── Rules ──────────────────────────────────
export const getCommissionRules = () =>
  CAdminAPI.get("/marketplace/commission/rules");

export const getCommissionRuleDetail = (id) =>
  CAdminAPI.get(`/marketplace/commission/rules/${id}`);

export const createCommissionRule = (data) =>
  CAdminAPI.post("/marketplace/commission/rules", data);

export const updateCommissionRule = (id, data) =>
  CAdminAPI.put(`/marketplace/commission/rules/${id}`, data);

export const deleteCommissionRule = (id) =>
  CAdminAPI.delete(`/marketplace/commission/rules/${id}`);

export const setDefaultCommissionRule = (id) =>
  CAdminAPI.patch(`/marketplace/commission/rules/${id}/set-default`);

export const toggleCommissionRuleActive = (id) =>
  CAdminAPI.patch(`/marketplace/commission/rules/${id}/toggle-active`);

// ── Global Suspension ──────────────────────
export const suspendCommission = (until) =>
  CAdminAPI.patch("/marketplace/commission/suspend", { until });

export const resumeCommission = () =>
  CAdminAPI.patch("/marketplace/commission/resume");

// ── Overrides ──────────────────────────────
export const getCommissionOverrides = () =>
  CAdminAPI.get("/marketplace/commission/overrides");

export const assignCommissionOverride = (shop_id, rule_id) =>
  CAdminAPI.post("/marketplace/commission/overrides", { shop_id, rule_id });

export const removeCommissionOverride = (id) =>
  CAdminAPI.delete(`/marketplace/commission/overrides/${id}`);