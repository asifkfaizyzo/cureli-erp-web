// backend/src/modules/cadmin/commission/cadmin.commission.controller.js

import { success, fail } from "../../../utils/response.js";
import * as service from "./cadmin.commission.service.js";

export async function listRulesHandler(req, res) {
  try {
    const rules = await service.listRules();
    return success(res, rules, "Commission rules fetched");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch rules", err.status || 500);
  }
}

export async function getRuleDetailHandler(req, res) {
  try {
    const rule = await service.getRuleDetail(req.params.id);
    return success(res, rule, "Commission rule fetched");
  } catch (err) {
    return fail(res, err.message || "Failed to fetch rule", err.status || 500);
  }
}

export async function createRuleHandler(req, res) {
  try {
    const rule = await service.createRule(req.body, req.cadmin.cadmin_id);
    return success(res, rule, "Commission rule created", 201);
  } catch (err) {
    return fail(res, err.message || "Failed to create rule", err.status || 500);
  }
}

export async function updateRuleHandler(req, res) {
  try {
    const rule = await service.updateRule(
      req.params.id,
      req.body,
      req.cadmin.cadmin_id,
    );
    return success(res, rule, "Commission rule updated");
  } catch (err) {
    return fail(res, err.message || "Failed to update rule", err.status || 500);
  }
}

export async function deleteRuleHandler(req, res) {
  try {
    const result = await service.deleteRule(
      req.params.id,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Commission rule deleted");
  } catch (err) {
    return fail(res, err.message || "Failed to delete rule", err.status || 500);
  }
}

export async function setDefaultHandler(req, res) {
  try {
    const result = await service.setDefaultRule(
      req.params.id,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Default commission rule updated");
  } catch (err) {
    return fail(res, err.message || "Failed to set default", err.status || 500);
  }
}

export async function toggleActiveHandler(req, res) {
  try {
    const result = await service.toggleRuleActive(
      req.params.id,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Commission rule toggled");
  } catch (err) {
    return fail(res, err.message || "Failed to toggle rule", err.status || 500);
  }
}

export async function suspendHandler(req, res) {
  try {
    const result = await service.suspendCommission(
      req.body.until,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Commission suspended");
  } catch (err) {
    return fail(res, err.message || "Failed to suspend", err.status || 500);
  }
}

export async function resumeHandler(req, res) {
  try {
    const result = await service.resumeCommission(req.cadmin.cadmin_id);
    return success(res, result, "Commission resumed");
  } catch (err) {
    return fail(res, err.message || "Failed to resume", err.status || 500);
  }
}

export async function listOverridesHandler(req, res) {
  try {
    const overrides = await service.listOverrides();
    return success(res, overrides, "Commission overrides fetched");
  } catch (err) {
    console.error("[Commission] listOverrides error:", err); // <-- ADD THIS
    return fail(
      res,
      err.message || "Failed to fetch overrides",
      err.status || 500,
    );
  }
}

export async function assignOverrideHandler(req, res) {
  try {
    const { shop_id, rule_id } = req.body;
    if (!shop_id || !rule_id) {
      return fail(res, "shop_id and rule_id are required", 400);
    }
    const result = await service.assignOverride(
      shop_id,
      rule_id,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Commission override assigned");
  } catch (err) {
    return fail(
      res,
      err.message || "Failed to assign override",
      err.status || 500,
    );
  }
}

export async function removeOverrideHandler(req, res) {
  try {
    const result = await service.removeOverride(
      req.params.id,
      req.cadmin.cadmin_id,
    );
    return success(res, result, "Commission override removed");
  } catch (err) {
    return fail(
      res,
      err.message || "Failed to remove override",
      err.status || 500,
    );
  }
}
