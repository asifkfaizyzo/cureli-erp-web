// backend/src/modules/cadmin/auth/cadminAuth.controller.js (do not remove this comment)
// backend/src/modules/cadmin/auth/cadminAuth.controller.js

import {
  loginCAdminService,
  verifyCAdminOtpService,
  refreshCAdminService,
  loginCAdminDirectService,
  logoutCAdminService,
} from "./cadminAuth.service.js";
import { success, fail } from "../../../utils/response.js";
import * as audit from "../../audit/index.js";

export async function loginCAdminController(req, res) {
  try {
    const { username, password } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    const resp = await loginCAdminService({ username, password, auditContext });
    return success(res, resp, "OTP sent");
  } catch (err) {
    console.error("cadmin.login", err);
    const status = err.status || 400;
    return fail(res, err.message || "Login failed", status);
  }
}

export async function loginCAdminDirectController(req, res) {
  try {
    const { username, password } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    const resp = await loginCAdminDirectService({ username, password, req, res, auditContext });
    return success(res, resp, "Logged in");
  } catch (err) {
    console.error("cadmin.login-direct", err);
    const status = err.status || 400;
    return fail(res, err.message || "Login failed", status);
  }
}

export async function verifyCAdminOtpController(req, res) {
  try {
    const { username, otp } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    const resp = await verifyCAdminOtpService({ username, otp, req, res, auditContext });
    return success(res, resp, "Logged in");
  } catch (err) {
    console.error("cadmin.verify-otp", err);
    const status = err.status || 400;
    return fail(res, err.message || "OTP verification failed", status);
  }
}

export async function refreshCAdminController(req, res) {
  try {
    const resp = await refreshCAdminService({ req, res });
    return success(res, resp, "Access token refreshed");
  } catch (err) {
    console.error("cadmin.refresh", err);
    const status = err.status || 401;
    return fail(res, err.message || "Refresh failed", status);
  }
}

export async function logoutCAdminController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    await logoutCAdminService({ req, res, auditContext });
    return success(res, {}, "Logged out");
  } catch (err) {
    console.error("cadmin.logout", err);
    return fail(res, err.message || "Logout failed", 400);
  }
}