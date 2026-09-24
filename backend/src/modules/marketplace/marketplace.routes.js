// backend/src/modules/marketplace/marketplace.routes.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as Controller from "./marketplace.controller.js";
import * as HolidayController from './marketplace.holidays.controller.js';

import {
  storefrontSchema,
  branchSelectionSchema,
  branchConfigSchema,
  draftSchema,
  bankingSchema, // <-- Imported
} from "./marketplace.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/status", Controller.getStatus);
router.get("/places/search", Controller.getPlacesSearch);
router.get("/places/details", Controller.getPlaceDetails);

router.post(
  "/upload/:type",
  requireRole("super_admin"),
  Controller.postUpload
);

router.post(
  "/onboarding/draft",
  requireRole("super_admin"),
  validate(draftSchema),
  Controller.postDraft
);

router.post(
  "/onboarding/storefront",
  requireRole("super_admin"),
  validate(storefrontSchema),
  Controller.postStorefront
);

router.post(
  "/onboarding/branches",
  requireRole("super_admin"),
  validate(branchSelectionSchema),
  Controller.postBranchSelections
);

router.post(
  "/onboarding/branch-config/:branch_id",
  requireRole("super_admin", "branch_admin"),
  validate(branchConfigSchema),
  Controller.postBranchConfig
);

// ── ADDED ONBOARDING BANKING ROUTE ────────────────────────
router.post(
  "/onboarding/banking",
  requireRole("super_admin"),
  validate(bankingSchema),
  Controller.postBanking
);

router.post(
  "/onboarding/go-live",
  requireRole("super_admin"),
  Controller.postGoLive
);

// Post-onboarding settings
router.get("/storefront", Controller.getStorefront);

router.patch(
  "/storefront",
  requireRole("super_admin"),
  validate(storefrontSchema),
  Controller.patchStorefront
);

// ── ADDED EDIT BANKING ROUTE (Settings screen) ──────────────
router.patch(
  "/banking",
  requireRole("super_admin"),
  validate(bankingSchema),
  Controller.patchBanking
);

router.get(
  "/branches",
  requireRole("super_admin", "branch_admin"),
  Controller.getBranches
);

router.patch(
  "/branches/:branch_id",
  requireRole("super_admin", "branch_admin"),
  validate(branchConfigSchema),
  Controller.patchBranch
);

router.post("/suspend", requireRole("super_admin"), Controller.postSuspend);
router.post("/resume", requireRole("super_admin"), Controller.postResume);

router.get('/holidays', requireRole('super_admin', 'branch_admin'), HolidayController.getHolidays);
router.post('/holidays', requireRole('super_admin', 'branch_admin'), HolidayController.postHoliday);
router.delete('/holidays/:holiday_id', requireRole('super_admin', 'branch_admin'), HolidayController.deleteHolidayHandler);

export default router;