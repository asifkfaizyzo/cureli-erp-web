// backend/src/modules/cadmin/auth/cadminAuth.service.js (do not remove this comment)
// backend/src/modules/cadmin/auth/cadminAuth.service.js

import prisma from "../../../config/prisma.js";
import { comparePassword } from "../../../utils/hash.js";
import { getMCAuthToken } from "../../../providers/messageCentral/token.js";
import { mcSendOtp } from "../../../providers/messageCentral/sendOtp.js";
import { mcValidateOtp } from "../../../providers/messageCentral/validateOtp.js";
import {
  generateCAdminAccessToken,
  generateCAdminRefreshToken,
  verifyCAdminRefreshToken,
} from "../../../utils/cadminTokens.js";
import { ADMIN_REFRESH_SECRET } from "../../../config/cadmin_jwt.js";
import * as audit from "../../audit/index.js";

/**
 * loginCAdminService
 * Initiates OTP-based login
 */
export async function loginCAdminService({
  username,
  password,
  auditContext = {},
}) {
  const cadmin = await prisma.cAdmin.findUnique({ where: { username } });

  if (!cadmin) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }

  if (!cadmin.is_active) {
    const err = new Error("Account disabled");
    err.status = 403;
    throw err;
  }

  const ok = await comparePassword(password, cadmin.password_hash);
  if (!ok) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD,
  );

  const mcResp = await mcSendOtp({
    authToken,
    customerId: process.env.MC_CUSTOMER,
    mobileNumber: cadmin.phone_number,
    otpLength: process.env.SMS_OTP_LENGTH
      ? Number(process.env.SMS_OTP_LENGTH)
      : 4,
    countryCode: process.env.MC_COUNTRY || "91",
  });

  const verificationId = mcResp?.verificationId || mcResp?.verification_id;
  const expiryTime = mcResp?.expiryTime || mcResp?.expiresAt || mcResp?.expiry;

  await prisma.cAdmin.update({
    where: { cadmin_id: cadmin.cadmin_id },
    data: {
      verification_id: verificationId,
      otp_expires: expiryTime
        ? new Date(expiryTime)
        : new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  const phone_hint = cadmin.phone_number.replace(
    /^(\+?\d{0,3})?(\d{0,2})(\d+)(\d{2})$/,
    (_, p1, p2, mid, last) => {
      if (!mid) return "••••";
      const visible = last || mid.slice(-2);
      return `•••• ${visible}`;
    },
  );

  return { phone_hint };
}

/**
 * loginCAdminDirectService
 * Direct login without OTP (for development/special cases)
 */
export async function loginCAdminDirectService({
  username,
  password,
  req,
  res,
  auditContext = {},
}) {
  const cadmin = await prisma.cAdmin.findUnique({ where: { username } });

  if (!cadmin) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }

  if (!cadmin.is_active) {
    const err = new Error("Account disabled");
    err.status = 403;
    throw err;
  }

  const ok = await comparePassword(password, cadmin.password_hash);
  if (!ok) {
    const err = new Error("Invalid username or password");
    err.status = 401;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.cAdmin.update({
      where: { cadmin_id: cadmin.cadmin_id },
      data: { last_login_at: new Date() },
    });

    //  AUDIT LOG: Direct login success (SECURITY ACTION)
    await audit.log(
      {
        action: audit.AuditAction.CADMIN_LOGIN_SUCCESS,
        entity_type: audit.EntityType.CADMIN,
        entity_id: cadmin.cadmin_id,
        actor_type: audit.ActorType.CADMIN,
        actor_id: cadmin.cadmin_id,
        actor_role: cadmin.is_super_cadmin ? "SUPER_CADMIN" : "CUSTOM_ROLE",
        ...auditContext,
        reason_code: audit.AuditReasonCode.SECURITY_ACTION,
        metadata: {
          username: cadmin.username,
          login_method: "direct",
          session_type: "direct_password",
        },
      },
      { tx },
    );
  });

  const accessPayload = {
    cadmin_id: cadmin.cadmin_id,
    username: cadmin.username,
  };
  const refreshPayload = { cadmin_id: cadmin.cadmin_id };

  const accessToken = generateCAdminAccessToken(accessPayload);
  const refreshToken = generateCAdminRefreshToken(refreshPayload);

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.clearCookie("cadmin_refresh_token", { path: "/" });
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin" });
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin/refresh" });
  res.cookie("cadmin_refresh_token", refreshToken, cookieOptions);

  return { access_token: accessToken };
}

/**
 * verifyCAdminOtpService
 * Verifies OTP and completes login
 */
export async function verifyCAdminOtpService({
  username,
  otp,
  req,
  res,
  auditContext = {},
}) {
  const cadmin = await prisma.cAdmin.findUnique({ where: { username } });
  if (!cadmin) {
    const err = new Error("Invalid user");
    err.status = 401;
    throw err;
  }

  if (!cadmin.verification_id) {
    const err = new Error("No OTP requested");
    err.status = 400;
    throw err;
  }

  if (!cadmin.otp_expires || new Date() > new Date(cadmin.otp_expires)) {
    const err = new Error("OTP expired");
    err.status = 400;
    throw err;
  }

  const authToken = await getMCAuthToken(
    process.env.MC_CUSTOMER,
    process.env.MC_PASSWORD,
  );

  const mcValidation = await mcValidateOtp({
    authToken,
    verificationId: cadmin.verification_id,
    code: otp,
    mobileNumber: cadmin.phone_number,
  });

  const valid =
    mcValidation?.verificationStatus === "VERIFICATION_COMPLETED" &&
    mcValidation?.responseCode === "200";

  if (!valid) {
    const err = new Error("Invalid OTP");
    err.status = 401;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.cAdmin.update({
      where: { cadmin_id: cadmin.cadmin_id },
      data: {
        verification_id: null,
        otp_expires: null,
        last_login_at: new Date(),
      },
    });

    //  AUDIT LOG: OTP login success (SECURITY ACTION)
    await audit.log(
      {
        action: audit.AuditAction.CADMIN_LOGIN_SUCCESS,
        entity_type: audit.EntityType.CADMIN,
        entity_id: cadmin.cadmin_id,
        actor_type: audit.ActorType.CADMIN,
        actor_id: cadmin.cadmin_id,
        actor_role: cadmin.is_super_cadmin ? "SUPER_CADMIN" : "CUSTOM_ROLE",
        ...auditContext,
        reason_code: audit.AuditReasonCode.SECURITY_ACTION,
        metadata: {
          username: cadmin.username,
          login_method: "otp",
          session_type: "otp_verified",
        },
      },
      { tx },
    );
  });

  const accessPayload = {
    cadmin_id: cadmin.cadmin_id,
    username: cadmin.username,
  };
  const refreshPayload = { cadmin_id: cadmin.cadmin_id };

  const accessToken = generateCAdminAccessToken(accessPayload);
  const refreshToken = generateCAdminRefreshToken(refreshPayload);

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.clearCookie("cadmin_refresh_token", { path: "/" });
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin" });
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin/refresh" });
  res.cookie("cadmin_refresh_token", refreshToken, cookieOptions);

  return { access_token: accessToken };
}

/**
 * refreshCAdminService
 * Refreshes access token using refresh token
 */
export async function refreshCAdminService({ req, res }) {
  const token = req.cookies?.cadmin_refresh_token;

  if (!token) {
    const err = new Error("Missing refresh token");
    err.status = 401;
    throw err;
  }

  try {
    const payload = verifyCAdminRefreshToken(token);
    const cadmin_id = payload.cadmin_id;

    const cadmin = await prisma.cAdmin.findUnique({ where: { cadmin_id } });
    if (!cadmin) {
      const err = new Error("Invalid refresh token");
      err.status = 401;
      throw err;
    }

    if (!cadmin.is_active) {
      const err = new Error("Account disabled");
      err.status = 403;
      throw err;
    }

    const accessToken = generateCAdminAccessToken({
      cadmin_id: cadmin.cadmin_id,
      username: cadmin.username,
    });

    const newRefreshToken = generateCAdminRefreshToken({
      cadmin_id: cadmin.cadmin_id,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.clearCookie("cadmin_refresh_token", { path: "/" });
    res.clearCookie("cadmin_refresh_token", { path: "/cadmin" });
    res.clearCookie("cadmin_refresh_token", { path: "/cadmin/refresh" });
    res.cookie("cadmin_refresh_token", newRefreshToken, cookieOptions);

    return { access_token: accessToken };
  } catch (err) {
    res.clearCookie("cadmin_refresh_token", { path: "/" });
    res.clearCookie("cadmin_refresh_token", { path: "/cadmin" });
    res.clearCookie("cadmin_refresh_token", { path: "/cadmin/refresh" });

    const e = new Error("Invalid or expired refresh token");
    e.status = 401;
    throw e;
  }
}

/**
 * logoutCAdminService
 * Logs out CAdmin and clears session
 */
export async function logoutCAdminService({ req, res, auditContext = {} }) {
  const cadmin_id = req.cadmin?.cadmin_id;

  if (cadmin_id) {
    //  AUDIT LOG: Logout (SECURITY ACTION)
    await audit.log({
      action: audit.AuditAction.CADMIN_LOGOUT,
      entity_type: audit.EntityType.CADMIN,
      entity_id: cadmin_id,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadmin_id,
      actor_role: req.cadmin?.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.SECURITY_ACTION,
      metadata: {
        username: req.cadmin?.username,
        logout_type: "manual",
      },
    });
  }

  res.clearCookie("cadmin_refresh_token", { path: "/" });
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin" });
  res.clearCookie("cadmin_refresh_token", { path: "/cadmin/refresh" });

  return;
}
