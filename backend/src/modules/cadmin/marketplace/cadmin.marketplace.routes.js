// backend/src/modules/cadmin/marketplace/cadmin.marketplace.routes.js (do not remove this comment)

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
  updateShopTags,    
} from "./cadmin.marketplace.controller.js";
import {
  listTags,
  createTag,
  updateTag,
  deleteTag,
  reorderTags,
} from "./cadmin.shopTags.controller.js";

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
// SHOP TAGS (Admin Config)
// ─────────────────────────────────────────────
router.get("/marketplace/shop-tags", listTags);
router.post("/marketplace/shop-tags", createTag);
router.put("/marketplace/shop-tags/:tag_id", updateTag);
router.delete("/marketplace/shop-tags/:tag_id", deleteTag);
router.patch("/marketplace/shop-tags/reorder", reorderTags);

// ─────────────────────────────────────────────
// SHOPS
// ─────────────────────────────────────────────
router.get("/marketplace/shops", listShops);
router.get("/marketplace/shops/:shop_id", getShop);

// Marketplace visibility toggle (is_live)
router.patch("/marketplace/shops/:shop_id/visibility", toggleShopVisibility);

router.patch("/marketplace/shops/:shop_id/storefront", updateStorefront);
router.patch("/marketplace/shops/:shop_id/tags", updateShopTags);

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