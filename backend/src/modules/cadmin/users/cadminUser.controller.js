// backend/src/modules/cadmin/users/cadminUser.controller.js (do not remove this comment)
// ============================================
// backend\src\modules\cadmin\users\cadminUser.controller.js
// ============================================

import { success, fail } from "../../../utils/response.js";
import * as svc   from "./cadminUser.service.js";
import * as audit from "../../audit/index.js";

export async function getUsersController(req, res) {
  try {
    const params = req.query || {};
    const result = await svc.getUsersService(params);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.users.get", err);
    return fail(res, err.message || "Failed to fetch users", err.status || 500);
  }
}

export async function getUserByIdController(req, res) {
  try {
    const { id } = req.params;
    const user   = await svc.getUserByIdService(id);
    return success(res, user);
  } catch (err) {
    console.error("cadmin.users.getById", err);
    if (err.code === "DELETED") return fail(res, err.message, 410);
    return fail(res, err.message || "Failed to fetch user", err.status || 500);
  }
}

export async function updateUserController(req, res) {
  try {
    const { id }       = req.params;
    const payload      = req.body || {};
    const cadmin_id    = req.cadmin?.cadmin_id;
    const auditContext = audit.extractRequestContext(req);
    const updated      = await svc.updateUserService(id, payload, cadmin_id, auditContext);
    return success(res, updated, "User updated");
  } catch (err) {
    console.error("cadmin.users.update", err);
    if (err.code === "DELETED")  return fail(res, err.message, 410);
    if (err.code === "CONFLICT") return fail(res, err.message, 409);
    return fail(res, err.message || "Failed to update user", err.status || 400);
  }
}

export async function toggleUserAccessController(req, res) {
  try {
    const { id }      = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return fail(res, "is_active (boolean) required in body", 400);
    }

    const cadmin_id    = req.cadmin?.cadmin_id;
    const auditContext = audit.extractRequestContext(req);
    const updated      = await svc.toggleUserAccessService(id, is_active, cadmin_id, auditContext);
    return success(res, updated, "User access updated");
  } catch (err) {
    console.error("cadmin.users.toggleAccess", err);
    if (err.code === "DELETED") return fail(res, err.message, 410);
    return fail(res, err.message || "Failed to update access", err.status || 400);
  }
}

export async function resetUserPasswordController(req, res) {
  try {
    const { id }       = req.params;
    const cadmin_id    = req.cadmin?.cadmin_id;
    const auditContext = audit.extractRequestContext(req);
    const result       = await svc.resetUserPasswordService(id, cadmin_id, auditContext);
    return success(res, result, "Password reset initiated");
  } catch (err) {
    console.error("cadmin.users.resetPassword", err);
    if (err.code === "DELETED") return fail(res, err.message, 410);
    return fail(res, err.message || "Failed to reset password", err.status || 400);
  }
}

export async function deleteUserController(req, res) {
  try {
    const { id }       = req.params;
    const { reason }   = req.body;
    const cadmin_id    = req.cadmin?.cadmin_id;
    const auditContext = audit.extractRequestContext(req);

    if (!reason || !String(reason).trim()) {
      return fail(res, "A reason is required to delete a user.", 400, { code: "REASON_REQUIRED" });
    }

    const result = await svc.deleteUserService(id, cadmin_id, reason, auditContext);
    return success(res, result, "User account deleted successfully.");
  } catch (err) {
    console.error("cadmin.users.delete", err);
    if (err.code === "NOT_FOUND")       return fail(res, err.message, 404);
    if (err.code === "ALREADY_DELETED") return fail(res, err.message, 410);
    if (err.code === "FORBIDDEN")       return fail(res, err.message, 403);
    if (err.code === "VALIDATION_ERROR") return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to delete user", 500);
  }
}