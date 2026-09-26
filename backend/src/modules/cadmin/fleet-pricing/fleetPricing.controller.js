// backend/src/modules/cadmin/fleet-pricing/fleetPricing.controller.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-pricing/fleetPricing.controller.js

import * as pricingService from "./fleetPricing.service.js";
import * as surgeService from "./fleetSurge.service.js";
import { success, fail } from "../../../utils/response.js";

// ── Base Pay Handlers ────────────────────────────────────────────────────────
export async function getPricingConfigHandler(req, res) {
  try {
    const data = await pricingService.getPricingConfigData();
    return success(res, data, "Fleet pricing config fetched successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch pricing config", 500);
  }
}

export async function createPricingConfigHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const created = await pricingService.createPricingConfig(req.body, adminId);
    return success(res, created, "Pricing configuration created successfully", 201);
  } catch (err) {
    return fail(res, err.message || "Failed to create pricing config", 500);
  }
}

export async function getPricingHistoryHandler(req, res) {
  try {
    const history = await pricingService.getPricingHistory(req.query);
    return success(res, history, "Pricing history fetched successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch pricing history", 500);
  }
}

export async function simulatePricingHandler(req, res) {
  try {
    const simulation = await pricingService.simulatePricingPreview(req.body);
    return success(res, simulation, "Pricing preview calculated successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to simulate pricing", 500);
  }
}

// ── Surge Handlers ───────────────────────────────────────────────────────────
export async function getSurgeRulesHandler(req, res) {
  try {
    const rules = await surgeService.getSurgeRules();
    return success(res, rules, "Surge rules fetched successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch surge rules", 500);
  }
}

export async function createSurgeRuleHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const rule = await surgeService.createSurgeRule(req.body, adminId);
    return success(res, rule, "Surge rule created successfully", 201);
  } catch (err) {
    return fail(res, err.message || "Failed to create surge rule", 500);
  }
}

export async function toggleSurgeRuleHandler(req, res) {
  try {
    const adminId = req.cadmin?.cadmin_id;
    const updated = await surgeService.toggleSurgeRule(req.params.id, req.body, adminId);
    return success(res, updated, "Surge status updated successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to update surge status", 500);
  }
}

export async function deleteSurgeRuleHandler(req, res) {
  try {
    await surgeService.deleteSurgeRule(req.params.id);
    return success(res, null, "Surge rule deleted successfully");
  } catch (err) {
    return fail(res, err.message || "Failed to delete surge rule", 500);
  }
}