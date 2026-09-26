// backend/src/modules/auth/auth.routes.js (do not remove this comment)
import express from "express";
import { validateBody } from "../../middleware/validate.js";
import {
  loginController,
  verifyLoginOtpController,
  refreshTokenController,
  logoutController,
  completeOnboardingController,
  getOnboardingStatusController,
  resendLoginOtpController,
  updateOnboardingStepController,
} from "./login.controller.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyLoginOtpSchema,
  resendLoginOtpSchema,
} from "./auth.schema.js";
import {
  forgotPasswordController,
  resetPasswordController,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { getUserPermissionsHandler } from "../../middleware/rbac.js";
import { authLimiter, otpLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// ============================================
// PUBLIC SENSITIVE ROUTES
//
// /login      — authLimiter only. The login flow sends an OTP
//               internally but this is gated by the application-
//               level per-user cooldown in sendLoginOtp().
//               Adding otpLimiter here was the root cause of the
//               "OTP limit reached" bug for new users.
//
// /resend     — authLimiter + otpLimiter. This is an explicit
//               OTP send action so both limiters are appropriate.
// ============================================

router.post(
  "/login",
  authLimiter,                      // IP-level auth protection only
  validateBody(loginSchema),
  loginController
);

router.post(
  "/verify-login-otp",
  authLimiter,
  validateBody(verifyLoginOtpSchema),
  verifyLoginOtpController
);

router.post(
  "/resend-login-otp",
  authLimiter,
  otpLimiter,                       // Explicit OTP send — both limiters correct here
  validateBody(resendLoginOtpSchema),
  resendLoginOtpController
);

router.post(
  "/forgot-password",
  authLimiter,
  validateBody(forgotPasswordSchema),
  forgotPasswordController
);

router.post(
  "/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  resetPasswordController
);

// Semi-public — global limiter is sufficient
router.post("/refresh", refreshTokenController);

// Authenticated routes
router.post("/logout", requireAuth, logoutController);
router.get("/onboarding-status", requireAuth, getOnboardingStatusController);
router.post("/onboarding-step", requireAuth, updateOnboardingStepController);
router.post("/complete-onboarding", requireAuth, completeOnboardingController);
router.get("/permissions", requireAuth, getUserPermissionsHandler);

export default router;