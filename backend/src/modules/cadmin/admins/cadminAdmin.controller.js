// backend/src/modules/cadmin/admins/cadminAdmin.controller.js (do not remove this comment)
// backend/src/modules/cadmin/admins/cadminAdmin.controller.js

import { success, fail } from "../../../utils/response.js";
import * as audit from "../../audit/index.js";
import {
  getAdminsService,
  getAdminByIdService,
  createAdminService,
  updateAdminService,
  toggleAdminAccessService,
  getAdminActivityService,
  createSuperAdminService,
  toggleSuperAdminAccessService,
  assignAdminRolesService,
  getAdminRolesService,
} from "./cadminAdmin.service.js";

export async function getAdminsController(req, res) {
  try {
    const result = await getAdminsService(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.admins.list", err);
    return fail(res, err.message || "Failed to fetch admins", err.status || 500);
  }
}

export async function getAdminByIdController(req, res) {
  try {
    const { id } = req.params;
    const admin = await getAdminByIdService(id);
    return success(res, admin);
  } catch (err) {
    console.error("cadmin.admins.getById", err);
    return fail(res, err.message || "Failed to fetch admin", err.status || 500);
  }
}

export async function createAdminController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const admin = await createAdminService(req.validated, auditContext);
    return success(res, admin, "Admin created successfully", 201);
  } catch (err) {
    console.error("cadmin.admins.create", err);
    return fail(res, err.message || "Failed to create admin", err.status || 500);
  }
}

export async function updateAdminController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);
    const admin = await updateAdminService(id, req.validated, auditContext);
    return success(res, admin, "Admin updated successfully");
  } catch (err) {
    console.error("cadmin.admins.update", err);
    return fail(res, err.message || "Failed to update admin", err.status || 500);
  }
}

export async function toggleAdminAccessController(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    const result = await toggleAdminAccessService(id, is_active, auditContext);
    const message = is_active
      ? "Admin activated successfully"
      : "Admin suspended successfully";
    return success(res, result, message);
  } catch (err) {
    console.error("cadmin.admins.toggleAccess", err);
    return fail(res, err.message || "Failed to update access", err.status || 500);
  }
}

export async function getAdminActivityController(req, res) {
  try {
    const { id } = req.params;
    const result = await getAdminActivityService(id, req.validated);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.admins.activity", err);
    return fail(res, err.message || "Failed to fetch activity", err.status || 500);
  }
}

export async function createSuperAdminController(req, res) {
  try {
    // Extra guard — only super admins can call this
    // requireCAdmin runs first so req.cadmin is populated
    if (!req.cadmin.is_super_cadmin) {
      return fail(res, "Only Super Admins can create other Super Admins.", 403);
    }
    const auditContext = audit.extractRequestContext(req);
    const admin = await createSuperAdminService(req.validated, auditContext);
    return success(res, admin, "Super Admin created successfully", 201);
  } catch (err) {
    console.error("cadmin.admins.createSuperAdmin", err);
    return fail(res, err.message || "Failed to create Super Admin", err.status || 500);
  }
}

export async function toggleSuperAdminAccessController(req, res) {
  try {
    // Extra guard — only super admins can call this
    if (!req.cadmin.is_super_cadmin) {
      return fail(res, "Only Super Admins can modify Super Admin access.", 403);
    }
    const { id } = req.params;
    const { is_active, secret } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    const result = await toggleSuperAdminAccessService(id, is_active, secret, auditContext);
    const message = is_active
      ? "Super Admin activated successfully"
      : "Super Admin deactivated successfully";
    return success(res, result, message);
  } catch (err) {
    console.error("cadmin.admins.toggleSuperAdminAccess", err);
    return fail(res, err.message || "Failed to update Super Admin access", err.status || 500);
  }
}

export async function getAdminRolesController(req, res) {
  try {
    const { id } = req.params;
    const result = await getAdminRolesService(id);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.admins.getRoles", err);
    return fail(res, err.message || "Failed to fetch roles", err.status || 500);
  }
}

export async function assignAdminRolesController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);
    const result = await assignAdminRolesService(id, req.validated, auditContext);
    return success(res, result, "Roles updated successfully");
  } catch (err) {
    console.error("cadmin.admins.assignRoles", err);
    return fail(res, err.message || "Failed to update roles", err.status || 500);
  }
}