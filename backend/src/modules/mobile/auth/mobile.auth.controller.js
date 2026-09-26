// backend/src/modules/mobile/auth/mobile.auth.controller.js (do not remove this comment)
// src/modules/mobile/auth/mobile.auth.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  sendMobileOtp,
  verifyMobileOtp,
  refreshMobileToken,
  logoutMobile,
  logoutAllMobile,
  getMobileMe,
  registerMobile,
  loginMobileWithPassword,
  sendMobileResetOtp,
  resetMobilePassword,
  registerMobileVerify,
  sendMobileRegisterOtp,
  checkMobilePhone,
} from "./mobile.auth.service.js";

/**
 * POST /mobile/auth/send-otp
 * Body: { phone }
 */
export async function handleSendOtp(req, res) {
  try {
    const { phone } = req.body;
    const result = await sendMobileOtp(phone);

    return success(
      res,
      { expires_in: result.timeout },
      "OTP sent successfully"
    );
  } catch (err) {
    const statusMap = {
      OTP_COOLDOWN:      429,
      OTP_LOCKED:        429,
      OTP_DAILY_LIMIT:   429,
      ACCOUNT_SUSPENDED: 403,
      ACCOUNT_DELETED:   404,
      SMS_FAILED:        502,
    };

    const status = statusMap[err.code] || 400;
    const data = err.waitTime ? { wait_seconds: err.waitTime } : {};
    return fail(res, err.message, status, data);
  }
}

/**
 * POST /mobile/auth/verify-otp
 * Body: { phone, otp, device_info? }
 */
export async function handleVerifyOtp(req, res) {
  try {
    const { phone, otp, device_info } = req.body;

    const requestMeta = {
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    };

    const result = await verifyMobileOtp(phone, otp, device_info, requestMeta);

    return success(
      res,
      {
        access_token:  result.accessToken,
        refresh_token: result.refreshToken,
        expires_in:    result.expiresIn,
        token_type:    "Bearer",
        is_new_user:   result.isNewUser,
        user:          result.user,
      },
      result.isNewUser ? "Welcome to Cureli!" : "Login successful"
    );
  } catch (err) {
    const statusMap = {
      NO_OTP:            400,
      OTP_EXPIRED:       400,
      INVALID_OTP:       400,
      TOO_MANY_ATTEMPTS: 429,
      OTP_LOCKED:        429,
      ACCOUNT_SUSPENDED: 403,
      ACCOUNT_DELETED:   404,
    };

    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status);
  }
}

/**
 * POST /mobile/auth/register
 * Body: { phone, password, email?, full_name?, device_info? }
 */
export async function handleRegister(req, res) {
  try {
    const { phone, password, email, full_name, device_info } = req.body;

    const requestMeta = {
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    };

    const result = await registerMobile({
      phone,
      password,
      email,
      full_name,
      deviceInfo: device_info,
      requestMeta,
    });

    return success(
      res,
      {
        access_token:  result.accessToken,
        refresh_token: result.refreshToken,
        expires_in:    result.expiresIn,
        token_type:    "Bearer",
        is_new_user:   result.isNewUser,
        user:          result.user,
      },
      "Welcome to Cureli! Account registered successfully."
    );
  } catch (err) {
    const statusMap = {
      ALREADY_REGISTERED:       409,
      PASSWORD_NOT_SET:         400,
      EMAIL_ALREADY_REGISTERED: 409,
    };
    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status, { code: err.code });
  }
}

/**
 * POST /mobile/auth/login
 * Body: { identifier, password, device_info? }
 */
export async function handleLogin(req, res) {
  try {
    const { identifier, password, device_info } = req.body;

    const requestMeta = {
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    };

    const result = await loginMobileWithPassword({
      identifier,
      password,
      deviceInfo: device_info,
      requestMeta,
    });

    return success(
      res,
      {
        access_token:  result.accessToken,
        refresh_token: result.refreshToken,
        expires_in:    result.expiresIn,
        token_type:    "Bearer",
        is_new_user:   result.isNewUser,
        user:          result.user,
      },
      "Login successful."
    );
  } catch (err) {
    const statusMap = {
      INVALID_CREDENTIALS: 401,
      ACCOUNT_SUSPENDED:   403,
      PASSWORD_LOCKED:     429,
      PASSWORD_NOT_SET:    400,
    };
    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status, { code: err.code });
  }
}

/**
 * POST /mobile/auth/check-phone
 * Body: { phone }
 * Returns whether the phone exists and has a password set.
 * Used by the two-step login flow on mobile.
 */
export async function handleCheckPhone(req, res) {
  try {
    const { phone } = req.body;
    const result = await checkMobilePhone(phone);

    return success(res, result, "Phone checked");
  } catch (err) {
    const statusMap = {
      ACCOUNT_SUSPENDED: 403,
    };
    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status, { code: err.code });
  }
}

/**
 * POST /mobile/auth/send-reset-otp
 * Body: { phone }
 */
export async function handleSendResetOtp(req, res) {
  try {
    const { phone } = req.body;
    const result = await sendMobileResetOtp(phone);

    return success(
      res,
      { expires_in: result.timeout },
      "Password reset verification OTP sent successfully."
    );
  } catch (err) {
    const statusMap = {
      ACCOUNT_NOT_FOUND: 404,
      ACCOUNT_SUSPENDED: 403,
      OTP_COOLDOWN:      429,
      OTP_LOCKED:        429,
      OTP_DAILY_LIMIT:   429,
      SMS_FAILED:        502,
    };
    const status = statusMap[err.code] || 400;
    const data = err.waitTime ? { wait_seconds: err.waitTime } : {};
    return fail(res, err.message, status, data);
  }
}

/**
 * POST /mobile/auth/reset-password
 * Body: { phone, otp, new_password }
 */
export async function handleResetPassword(req, res) {
  try {
    const { phone, otp, new_password } = req.body;
    await resetMobilePassword(phone, otp, new_password);

    return success(res, {}, "Password updated successfully. Please log in with your new password.");
  } catch (err) {
    const statusMap = {
      ACCOUNT_NOT_FOUND: 404,
      NO_OTP:            400,
      OTP_EXPIRED:       400,
      INVALID_OTP:       400,
      TOO_MANY_ATTEMPTS: 429,
    };
    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status);
  }
}

/**
 * POST /mobile/auth/refresh
 * Body: { refresh_token }
 */
export async function handleRefresh(req, res) {
  try {
    const { refresh_token } = req.body;
    const result = await refreshMobileToken(refresh_token);

    return success(
      res,
      {
        access_token: result.accessToken,
        expires_in:   result.expiresIn,
        token_type:   "Bearer",
      },
      "Token refreshed"
    );
  } catch (err) {
    const statusMap = {
      INVALID_REFRESH_TOKEN: 401,
      SESSION_REVOKED:       401,
      SESSION_EXPIRED:       401,
      SESSION_INVALIDATED:   401,
      ACCOUNT_DELETED:       401,
      ACCOUNT_SUSPENDED:     403,
    };

    const status = statusMap[err.code] || 401;
    return fail(res, err.message, status);
  }
}

/**
 * POST /mobile/auth/logout
 * Requires: mobileAuth middleware
 */
export async function handleLogout(req, res) {
  try {
    await logoutMobile(req.mobileSession.id);
    return success(res, {}, "Logged out successfully");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

/**
 * POST /mobile/auth/logout-all
 * Requires: mobileAuth middleware
 */
export async function handleLogoutAll(req, res) {
  try {
    await logoutAllMobile(req.mobileUser.id);
    return success(res, {}, "All devices logged out successfully");
  } catch {
    return fail(res, "Logout failed", 500);
  }
}

/**
 * GET /mobile/auth/me
 * Requires: mobileAuth middleware
 */
export async function handleMe(req, res) {
  try {
    const user = await getMobileMe(req.mobileUser.id);
    return success(res, { user }, "Profile fetched");
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return fail(res, "User not found", 404);
    }
    return fail(res, "Failed to fetch profile", 500);
  }
}

/**
 * POST /mobile/auth/register/send-otp
 * Body: { phone }
 */
export async function handleSendRegisterOtp(req, res) {
  try {
    const { phone } = req.body;
    const result = await sendMobileRegisterOtp(phone);

    return success(
      res,
      { expires_in: result.timeout },
      "Registration verification OTP sent successfully."
    );
  } catch (err) {
    const statusMap = {
      ALREADY_REGISTERED: 409,
      ACCOUNT_SUSPENDED:  403,
      OTP_COOLDOWN:       429,
      OTP_LOCKED:         429,
      OTP_DAILY_LIMIT:    429,
      SMS_FAILED:         502,
    };
    const status = statusMap[err.code] || 400;
    const data = err.waitTime ? { wait_seconds: err.waitTime } : {};
    return fail(res, err.message, status, data);
  }
}

/**
 * POST /mobile/auth/register/verify
 * Body: { phone, password, email?, full_name?, otp, device_info? }
 */
export async function handleRegisterVerify(req, res) {
  try {
    const { phone, password, email, full_name, otp, device_info } = req.body;

    const requestMeta = {
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    };

    const result = await registerMobileVerify({
      phone,
      password,
      email,
      full_name,
      otp,
      deviceInfo: device_info,
      requestMeta,
    });

    return success(
      res,
      {
        access_token:  result.accessToken,
        refresh_token: result.refreshToken,
        expires_in:    result.expiresIn,
        token_type:    "Bearer",
        is_new_user:   result.isNewUser,
        user:          result.user,
      },
      "Welcome to Cureli! Account registered successfully."
    );
  } catch (err) {
    const statusMap = {
      ALREADY_REGISTERED:       409,
      EMAIL_ALREADY_REGISTERED: 409,
      NO_OTP:                   400,
      OTP_EXPIRED:              400,
      INVALID_OTP:              400,
      TOO_MANY_ATTEMPTS:        429,
    };
    const status = statusMap[err.code] || 400;
    return fail(res, err.message, status);
  }
}