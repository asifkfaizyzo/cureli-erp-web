// backend/src/modules/profile/profile.routes.js (do not remove this comment)
// src/modules/profile/profile.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  getProfile,
  updateBusiness,
  changePassword,
  initiateEmailChange,
  verifyEmailChange,
  initiatePhoneChangeOld,
  verifyPhoneChangeOldOtp,
  initiatePhoneChangeNew,
  verifyPhoneChangeNew,
  initiatePhoneChangeWithPassword,
  getSessions,
  logoutSession,
  logoutOtherSessions,
} from "./profile.controller.js";
import {
  updateBusinessSchema,
  changePasswordSchema,
  initiateEmailChangeSchema,
  verifyEmailChangeSchema,
  verifyOldPhoneOtpSchema,
  initiatePhoneChangeNewSchema,
  verifyPhoneChangeNewSchema,
  initiatePhoneChangeWithPasswordSchema,
} from "./profile.schema.js";

const router = Router();

// All routes require authentication and super_admin role
router.use(requireAuth);
router.use(requireRole("super_admin"));

// ============================================
// GET PROFILE
// ============================================
router.get("/", getProfile);

// ============================================
// BUSINESS INFO
// ============================================
router.put("/business", validate(updateBusinessSchema), updateBusiness);

// ============================================
// PASSWORD CHANGE
// ============================================
router.post("/password", validate(changePasswordSchema), changePassword);

// ============================================
// EMAIL CHANGE (2-step)
// ============================================
router.post("/email/initiate", validate(initiateEmailChangeSchema), initiateEmailChange);
router.post("/email/verify", validate(verifyEmailChangeSchema), verifyEmailChange);

// ============================================
// PHONE CHANGE - OTP METHOD (3-step)
// ============================================
// Step 1: Send OTP to old phone
router.post("/phone/verify-old", initiatePhoneChangeOld);

// Step 1b: Verify old phone OTP
router.post("/phone/verify-old-otp", validate(verifyOldPhoneOtpSchema), verifyPhoneChangeOldOtp);

// Step 2: Send OTP to new phone
router.post("/phone/initiate-new", validate(initiatePhoneChangeNewSchema), initiatePhoneChangeNew);

// Step 3: Verify new phone OTP
router.post("/phone/verify-new", validate(verifyPhoneChangeNewSchema), verifyPhoneChangeNew);

// ============================================
// PHONE CHANGE - PASSWORD METHOD (2-step)
// ============================================
router.post(
  "/phone/change-with-password",
  validate(initiatePhoneChangeWithPasswordSchema),
  initiatePhoneChangeWithPassword
);

// ============================================
// SESSIONS
// ============================================
router.get("/sessions", getSessions);
router.delete("/sessions/others", logoutOtherSessions);
router.delete("/sessions/:sessionId", logoutSession);

export default router;