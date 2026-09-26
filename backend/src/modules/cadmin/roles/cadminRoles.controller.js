// backend/src/modules/cadmin/roles/cadminRoles.controller.js (do not remove this comment)
// backend/src/modules/cadmin/roles/cadminRoles.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  listRolesService,
  getRoleByIdService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
  getAdminRolesService,
  assignRolesService,
  removeAllRolesService,
  getRoleDeletionImpactService,
} from "./cadminRoles.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getAuditContext(req) {
  return {
    actor_id:   req.cadmin.cadmin_id,
    actor_type: "cadmin",
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function listRolesController(req, res) {
  try {
    const { include_deleted, search } = req.query;
    const roles = await listRolesService({
      include_deleted: include_deleted === "true",
      search,
    });
    return success(res, { roles }, "Roles fetched");           // ← data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function getRoleByIdController(req, res) {
  try {
    const role = await getRoleByIdService(req.params.role_id);
    return success(res, { role }, "Role fetched");             // ← data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function createRoleController(req, res) {
  try {
    const role = await createRoleService(req.body, getAuditContext(req));
    return success(res, { role }, "Role created", 201);        // ← data, then message, then status
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function updateRoleController(req, res) {
  try {
    const role = await updateRoleService(
      req.params.role_id,
      req.body,
      getAuditContext(req)
    );
    return success(res, { role }, "Role updated");             // ← data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function getRoleDeletionImpactController(req, res) {
  try {
    const impact = await getRoleDeletionImpactService(req.params.role_id);
    return success(res, { impact }, "Role deletion impact fetched");  // ← data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function deleteRoleController(req, res) {
  try {
    await deleteRoleService(req.params.role_id, getAuditContext(req));
    return success(res, {}, "Role deleted");                   // ← empty data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminRolesController(req, res) {
  try {
    const data = await getAdminRolesService(req.params.cadmin_id);
    return success(res, data, "Admin roles fetched");          // ← data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function assignRolesController(req, res) {
  try {
    const data = await assignRolesService(
      req.params.cadmin_id,
      req.validated,   // ← was req.body, must be req.validated
      getAuditContext(req)
    );
    return success(res, data, "Roles assigned");
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

export async function removeAllRolesController(req, res) {
  try {
    await removeAllRolesService(req.params.cadmin_id, getAuditContext(req));
    return success(res, {}, "All roles removed");              // ← empty data, then message
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}