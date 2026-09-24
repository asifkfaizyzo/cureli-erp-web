// backend/src/modules/cadmin/marketplace/cadmin.marketplace.routes.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace/cadmin.marketplace.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listShops,
  getShop,
  blockShop,
  updateStorefront,
  blockBranch,
  updateBranchConfig,
  uploadAsset,
  listUsers,
  getUser,
  blockUser,
  searchPlaces,
  getPlaceDetails,
} from "./cadmin.marketplace.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ─────────────────────────────────────────────
// PLACES PROXY — before /:shop_id to avoid conflicts
// ─────────────────────────────────────────────
router.get("/marketplace/places/search", searchPlaces);
router.get("/marketplace/places/details", getPlaceDetails);

// ─────────────────────────────────────────────
// UPLOAD
// POST /cadmin/marketplace/upload/:type
// type: logo | banner | branch_image
// ─────────────────────────────────────────────
router.post("/marketplace/upload/:type", uploadAsset);

// ─────────────────────────────────────────────
// SHOPS
// ─────────────────────────────────────────────
router.get("/marketplace/shops", listShops);
router.get("/marketplace/shops/:shop_id", getShop);
router.patch("/marketplace/shops/:shop_id/block", blockShop);
router.patch("/marketplace/shops/:shop_id/storefront", updateStorefront);
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/block",
  blockBranch
);
router.patch(
  "/marketplace/shops/:shop_id/branches/:branch_id/config",
  updateBranchConfig
);

// ─────────────────────────────────────────────
// MOBILE USERS
// ─────────────────────────────────────────────
router.get("/marketplace/users", listUsers);
router.get("/marketplace/users/:user_id", getUser);
router.patch("/marketplace/users/:user_id/block", blockUser);

export default router;