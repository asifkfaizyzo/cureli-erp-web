// backend/src/modules/mobile/users/mobile.users.routes.js (do not remove this comment)
import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { mobileAuthLimiter } from "../../../middleware/rateLimiter.js";
import { validate } from "../../../middleware/validate.js";
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  confirmDeleteAccountSchema,
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
} from "./mobile.users.schema.js";
import {
  handleUpdateProfile,
  handleListAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleSetDefaultAddress,
  handleDeleteAddress,
  handleSendDeleteOtp,
  handleConfirmDeleteAccount,
} from "./mobile.users.controller.js";
import {
  handleListMembers,
  handleCreateMember,
  handleUpdateMember,
  handleDeleteMember,
} from "./mobile.members.controller.js";

const router = Router();

// All users routes require authentication
// Note: mobileLimiter is already applied globally in index.js for /mobile/*
// so we don't apply it again here
router.use(mobileAuth);

// ── Profile ───────────────────────────────────────────────────
router.patch("/profile", validate(updateProfileSchema), handleUpdateProfile);

// ── Addresses ─────────────────────────────────────────────────
router.get("/addresses", handleListAddresses);
router.post("/addresses", validate(createAddressSchema), handleCreateAddress);
router.patch("/addresses/:id", validate(updateAddressSchema), handleUpdateAddress);
router.patch("/addresses/:id/default", handleSetDefaultAddress);
router.delete("/addresses/:id", handleDeleteAddress);

// ── Family Members ────────────────────────────────────────────
router.get("/members", handleListMembers);
router.post("/members", validate(createFamilyMemberSchema), handleCreateMember);
router.patch("/members/:id", validate(updateFamilyMemberSchema), handleUpdateMember);
router.delete("/members/:id", handleDeleteMember);

// ── Account Deletion — genuinely sensitive, keep strict limiter ───
router.post("/account/delete/send-otp", mobileAuthLimiter, handleSendDeleteOtp);
router.post(
  "/account/delete/confirm",
  mobileAuthLimiter,
  validate(confirmDeleteAccountSchema),
  handleConfirmDeleteAccount,
);

export default router;