// backend/src/modules/pending/pending.routes.js (do not remove this comment)
import express from "express";
import { validateBody } from "../../middleware/validate.js";
import {
  pendingSignupSchema,
  usernameSchema,
  checkUsernameSchema,
} from "./pending.schema.js";

import {
  startPendingSignup,
  requestEmailOtp,
  verifyEmailOtpController,
  requestSmsOtp,
  verifySmsOtpController,
  chooseUsernameController,
  completePendingSignupController,
  googleSetPasswordController,
  googleSignupController,
  checkUsernameController,
} from "./pending.controller.js";

import { authLimiter, otpLimiter, signupLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// Signup initiation — rate limited to prevent spam account creation
router.post("/signup/start", signupLimiter, validateBody(pendingSignupSchema), startPendingSignup);
router.post("/signup/google", signupLimiter, googleSignupController);
router.post("/signup/google/set-password", signupLimiter, googleSetPasswordController);

// OTP endpoints — strict rate limits
router.post("/signup/email-otp", otpLimiter, requestEmailOtp);
router.post("/signup/verify-email", authLimiter, verifyEmailOtpController);
router.post("/signup/sms-otp", otpLimiter, requestSmsOtp);
router.post("/signup/verify-sms", authLimiter, verifySmsOtpController);

// Username and completion — signup limiter
router.post("/signup/username", signupLimiter, validateBody(usernameSchema), chooseUsernameController);
router.post("/signup/complete", signupLimiter, completePendingSignupController);
router.post("/signup/check-username", signupLimiter, validateBody(checkUsernameSchema), checkUsernameController);

export default router;