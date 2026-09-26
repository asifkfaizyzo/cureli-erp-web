// backend/src/modules/cadmin/auth/cadminAuth.routes.js (do not remove this comment)
import express from "express";
import {
  loginCAdminController,
  verifyCAdminOtpController,
  loginCAdminDirectController,
  refreshCAdminController,
  logoutCAdminController,
} from "./cadminAuth.controller.js";
import {
  forgotCAdminPasswordController,
  resetCAdminPasswordController,
} from "./cadminPassword.controller.js";
import {
  cadminForgotPasswordSchema,
  cadminResetPasswordSchema,
} from "./cadminPassword.schema.js";
import { validateBody } from "../../../middleware/validate.js";
import {
  cadminLoginSchema,
  cadminVerifyOtpSchema,
} from "./cadminAuth.schema.js";

const router = express.Router();

// POST /cadmin/login
router.post("/login", validateBody(cadminLoginSchema), loginCAdminController);

// POST /cadmin/login-direct
router.post("/login-direct", validateBody(cadminLoginSchema), loginCAdminDirectController);

// POST /cadmin/verify-otp
router.post("/verify-otp", validateBody(cadminVerifyOtpSchema), verifyCAdminOtpController);

// GET /cadmin/refresh
router.get("/refresh", refreshCAdminController);

// POST /cadmin/logout
router.post("/logout", logoutCAdminController);

// POST /cadmin/forgot-password
router.post(
  "/forgot-password",
  validateBody(cadminForgotPasswordSchema),
  forgotCAdminPasswordController,
);

// POST /cadmin/reset-password
router.post(
  "/reset-password",
  validateBody(cadminResetPasswordSchema),
  resetCAdminPasswordController,
);

export default router;