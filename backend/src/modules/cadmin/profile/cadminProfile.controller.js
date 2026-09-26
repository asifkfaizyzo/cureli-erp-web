// backend/src/modules/cadmin/profile/cadminProfile.controller.js (do not remove this comment)
// backend/src/modules/cadmin/profile/cadminProfile.controller.js

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminProfile.service.js";

const getMeta = (req) => ({
  ip: req.ip || req.headers["x-forwarded-for"] || null,
  ua: req.headers["user-agent"] || null,
});

export async function getMyProfileController(req, res) {
  try {
    const data = await svc.getMyProfileService(req.cadmin.cadmin_id);
    return success(res, data, "Profile fetched");
  } catch (err) {
    console.error("cadmin.profile.me", err);
    return fail(
      res,
      err.message || "Failed to fetch profile",
      err.status || 500,
    );
  }
}

export async function getPendingCountsController(req, res) {
  try {
    const counts = await svc.getPendingCountsService();
    return success(res, counts, "Pending counts fetched");
  } catch (err) {
    console.error("cadmin.profile.pendingCounts", err);
    return fail(
      res,
      err.message || "Failed to fetch counts",
      err.status || 500,
    );
  }
}

export async function updateContactController(req, res) {
  try {
    const updated = await svc.updateContactService(
      req.cadmin.cadmin_id,
      req.validated, //  not req.body
      getMeta(req),
    );
    return success(res, updated, "Contact info updated");
  } catch (err) {
    console.error("cadmin.profile.contact", err);
    return fail(
      res,
      err.message || "Failed to update contact info",
      err.status || 500,
    );
  }
}

export async function updateIdentityController(req, res) {
  try {
    const updated = await svc.updateIdentityService(
      req.cadmin.cadmin_id,
      req.validated, //  not req.body
      getMeta(req),
    );
    return success(res, updated, "Identity updated");
  } catch (err) {
    console.error("cadmin.profile.identity", err);
    return fail(
      res,
      err.message || "Failed to update identity",
      err.status || 500,
    );
  }
}

export async function changeMyPasswordController(req, res) {
  try {
    const { currentPassword, newPassword } = req.validated; //  not req.body
    await svc.changeMyPasswordService(
      req.cadmin.cadmin_id,
      currentPassword,
      newPassword,
      getMeta(req),
    );
    return success(res, {}, "Password changed successfully");
  } catch (err) {
    console.error("cadmin.profile.changePassword", err);
    return fail(
      res,
      err.message || "Failed to change password",
      err.status || 500,
    );
  }
}

export async function getActivityLogsController(req, res) {
  try {
    const data = await svc.getActivityLogsService(
      req.cadmin.cadmin_id,
      req.validated, //  not req.query — page/limit are integers here
    );
    return success(res, data, "Activity logs fetched");
  } catch (err) {
    console.error("cadmin.profile.activity", err);
    return fail(
      res,
      err.message || "Failed to fetch activity logs",
      err.status || 500,
    );
  }
}
