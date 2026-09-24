// backend/src/modules/mobile/auth/mobile.auth.routes.js (do not remove this comment)
// src/modules/mobile/auth/mobile.auth.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  registerSchema,
  registerVerifySchema,
  loginSchema,
  sendResetOtpSchema,
  resetPasswordSchema,
  checkPhoneSchema,
} from "./mobile.auth.schema.js";
import {
  handleSendOtp,
  handleVerifyOtp,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleMe,
  handleRegister,
  handleLogin,
  handleSendResetOtp,
  handleResetPassword,
  handleSendRegisterOtp,
  handleRegisterVerify,
  handleCheckPhone,
} from "./mobile.auth.controller.js";

const router = Router();

// ── Public routes ─────────────────────────────────────────────

// Two-step login: Step 1 — check if phone exists and has password
router.post(
  "/check-phone",
  validate(checkPhoneSchema),
  handleCheckPhone
);

// Direct registration (legacy — kept for backward compat / admin flows)
router.post(
  "/register",
  validate(registerSchema),
  handleRegister
);

// Two-step OTP-verified registration (used by mobile app)
router.post(
  "/register/send-otp",
  validate(sendOtpSchema),
  handleSendRegisterOtp
);

router.post(
  "/register/verify",
  validate(registerVerifySchema),
  handleRegisterVerify
);

router.post(
  "/login",
  validate(loginSchema),
  handleLogin
);

router.post(
  "/send-reset-otp",
  validate(sendResetOtpSchema),
  handleSendResetOtp
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  handleResetPassword
);

// Keep OTP-only fallback routes active for internal reuse or legacy clients
router.post(
  "/send-otp",
  validate(sendOtpSchema),
  handleSendOtp
);

router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  handleVerifyOtp
);

router.post(
  "/refresh",
  validate(refreshSchema),
  handleRefresh
);

// ── Protected routes ──────────────────────────────────────────
router.post("/logout", mobileAuth, handleLogout);
router.post("/logout-all", mobileAuth, handleLogoutAll);
router.get("/me", mobileAuth, handleMe);

export default router;