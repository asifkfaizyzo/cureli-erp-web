// backend/src/modules/cadmin/marketplace/cadmin.marketplace.routes.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace/cadmin.marketplace.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listShops,
  getShop,
  toggleShopVisibility,
  updateStorefront,
  blockBranch,
  updateBranchConfig,
  toggleBranchVisibility,
  uploadAsset,
  listUsers,
  getUser,
  blockUser,
  searchPlaces,
  getPlaceDetails,
  getShopHolidays,
  createShopHoliday,
  deleteShopHoliday,
} from "./cadmin.marketplace.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ─────────────────────────────────────────────
// PLACES PROXY
// ─────────────────────────────────────────────
router.get("/marketplace/places/search", searchPlaces);
router.get("/marketplace/places/details", getPlaceDetails);

// ─────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────
router.post("/marketplace/upload/:type", uploadAsset);

// ─────────────────────────────────────────────
// SHOPS
// ─────────────────────────────────────────────
router.get("/marketplace/shops", listShops);
router.get("/marketplace/shops/:shop_id", getShop);

// Marketplace visibility toggle (is_live)
router.patch("/marketplace/shops/:shop_id/visibility", toggleShopVisibility);

router.patch("/marketplace/shops/:shop_id/storefront", updateStorefront);

// ── Holidays ──
router.get("/marketplace/shops/:shop_id/holidays", getShopHolidays);
router.post("/marketplace/shops/:shop_id/holidays", createShopHoliday);
router.delete("/marketplace/shops/:shop_id/holidays/:holiday_id", deleteShopHoliday);

// ── Branches ──
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/block",
  blockBranch
);
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/config",
  updateBranchConfig
);
// Branch marketplace visibility toggle (marketplace_enabled)
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/visibility",
  toggleBranchVisibility
);

// ─────────────────────────────────────────────
// MOBILE USERS
// ─────────────────────────────────────────────
router.get("/marketplace/users", listUsers);
router.get("/marketplace/users/:user_id", getUser);
router.patch("/marketplace/users/:user_id/block", blockUser);

export default router;