// backend/src/modules/pending/pending.controller.js (do not remove this comment)
// backend/src/modules/pending/pending.controller.js

import {
  createPendingUser,
  sendEmailOtp,
  verifyEmailOtp,
  setUsername,
  sendSmsOtp,
  verifySmsOtp,
  finalizePendingSignup,
  createPendingUserFromGoogle,
  setPasswordForPending,
  cleanupExpiredPendingUsers,
  checkUsernameAvailabilityWithSuggestions,
} from "./pending.service.js";
import { success, fail } from "../../utils/response.js";
import { jwtDecode } from "jwt-decode";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import {
  verifyRecaptcha,
  isRecaptchaScoreValid,
} from "../../utils/recaptcha.js";
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
} from "../../config/jwt.js";
import * as audit from "../audit/index.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function startPendingSignup(req, res) {
  try {
    const { first_name, last_name, email, password, recaptchaToken } =
      req.validated;

    //  Log the token for debugging
    

    //  Verify reCAPTCHA (returns {success, score, error})
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);

   

    if (!recaptchaResult.success) {
    
      return fail(res, "reCAPTCHA verification failed", 400);
    }

    //  Check if score meets threshold
    const threshold = Number(process.env.RECAPTCHA_THRESHOLD) || 0.3;

    if (!isRecaptchaScoreValid(recaptchaResult.score, threshold)) {
      
      return fail(res, "Suspicious activity detected. Please try again.", 400);
    }

    

    // Continue with signup
    const pending = await createPendingUser({
      first_name,
      last_name,
      email,
      password,
    });

    // Send OTP automatically
    await sendEmailOtp(pending.pending_id);

    return success(
      res,
      { pending_id: pending.pending_id, email },
      "Signup started",
    );
  } catch (err) {
    if (err.code === "EMAIL_EXISTS") {
      return fail(res, err.message, 400);
    }

    console.error(" Signup error:", err);
    return fail(res, "Cannot start signup", 500);
  }
}

export async function googleSignupController(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return fail(res, "Missing Google credential", 400);
    }

    // Verify the Google ID token signature and claims
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google token verification failed:", verifyErr.message);
      return fail(res, "Invalid Google credential", 401);
    }

    const google_id = payload.sub;
    const email = payload.email;
    const first_name = payload.given_name || payload.name?.split(" ")[0] || "";
    const last_name =
      payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "";

    if (!email) return fail(res, "Google did not return an email", 400);

    if (!payload.email_verified) {
      return fail(res, "Google email not verified", 400);
    }

    const pending = await createPendingUserFromGoogle({
      google_id,
      email,
      first_name,
      last_name,
    });

    return success(
      res,
      {
        pending_id: pending.pending_id,
        email: pending.email,
        first_name: pending.first_name,
        last_name: pending.last_name,
      },
      "Google signup started",
    );
  } catch (err) {
    if (err.code === "GOOGLE_ID_EXISTS") {
      return fail(res, err.message, 409);
    }

    if (err.code === "EMAIL_EXISTS") {
      return fail(res, err.message, 409);
    }

    console.error(err);
    return fail(res, "Google signup failed", 500);
  }
}

export async function requestEmailOtp(req, res) {
  try {
    const { pending_id, isResend } = req.body;

    await sendEmailOtp(pending_id, isResend === true);

    return success(res, {}, "OTP sent to email");
  } catch (err) {
    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429, { waitTime: err.waitTime });
    }
    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    console.error(err);
    return fail(res, "Failed to send OTP", 500);
  }
}

export async function verifyEmailOtpController(req, res) {
  try {
    const { pending_id, otp } = req.body;

    await verifyEmailOtp(pending_id, otp);

    return success(res, {}, "Email verified successfully");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "NO_OTP") return fail(res, err.message, 400);
    if (err.code === "OTP_EXPIRED") return fail(res, err.message, 400);
    if (err.code === "INVALID_OTP") return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to verify OTP", 500);
  }
}

export async function requestSmsOtp(req, res) {
  try {
    const { pending_id, phone, isResend } = req.body;

  

    if (!phone || typeof phone !== "string") {
      return fail(res, "Invalid phone number", 400);
    }

    const result = await sendSmsOtp(pending_id, phone, isResend === true);
   

    return success(res, {}, "OTP sent to phone");
  } catch (err) {
    console.error(" requestSmsOtp error:", err);

    if (err.code === "OTP_COOLDOWN") return fail(res, err.message, 429);
    if (err.code === "OTP_DAILY_LIMIT") return fail(res, err.message, 429);
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "PHONE_EXISTS") return fail(res, err.message, 409);
    if (err.code === "PHONE_PENDING_EXISTS") return fail(res, err.message, 409);

    return fail(res, "Failed to send SMS OTP", 500);
  }
}

export async function verifySmsOtpController(req, res) {
  try {
    const { pending_id, code } = req.body;

    await verifySmsOtp(pending_id, code);

    return success(res, {}, "Phone verified successfully");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "NO_OTP") return fail(res, err.message, 400);
    if (err.code === "OTP_EXPIRED") return fail(res, err.message, 400);
    if (err.code === "INVALID_OTP") return fail(res, err.message, 400);
    if (err.code === "TOO_MANY_ATTEMPTS") return fail(res, err.message, 429);

    console.error(err);
    return fail(res, "Failed to verify SMS OTP", 500);
  }
}

export async function chooseUsernameController(req, res) {
  try {
    const { pending_id, username } = req.validated;

    await setUsername(pending_id, username);

    return success(res, {}, "Username saved");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "EMAIL_NOT_VERIFIED" || err.code === "PHONE_NOT_VERIFIED")
      return fail(res, err.message, 400);
    if (err.code === "USERNAME_EXISTS") return fail(res, err.message, 400);
    if (err.code === "USERNAME_PENDING_EXISTS")
      return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to save username", 500);
  }
}

export async function checkUsernameController(req, res) {
  try {
    const { username } = req.validated;

    const result = await checkUsernameAvailabilityWithSuggestions(username);

    return success(res, result);
  } catch (err) {
    console.error("checkUsernameController error:", err);
    return fail(res, "Failed to check username availability", 500);
  }
}

export async function completePendingSignupController(req, res) {
 

  try {
    const { pending_id } = req.body;
    

    const auditContext = audit.extractRequestContext(req);

    const { user, shop } = await finalizePendingSignup(
      pending_id,
      auditContext,
    );

    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: shop.shop_id,
        role: user.role,
        status: user.status,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES },
    );

    const refreshToken = jwt.sign({ user_id: user.user_id }, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRES,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(
      res,
      {
        user,
        shop,
        access_token: accessToken,
      },
      "Signup completed",
      201,
    );
  } catch (err) {
    console.error("=== Complete Signup ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Full error:", err);
    return fail(res, err.message, 400);
  }
}

export async function googleSetPasswordController(req, res) {
  try {
    const { pending_id, password } = req.body;

    await setPasswordForPending(pending_id, password);

    return success(res, {}, "Password saved");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "NOT_GOOGLE") return fail(res, err.message, 400);
    console.error(err);
    return fail(res, "Failed to set password", 500);
  }
}
