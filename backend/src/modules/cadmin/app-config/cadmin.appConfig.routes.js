// backend/src/modules/cadmin/app-config/cadmin.appConfig.routes.js (do not remove this comment)
// src/modules/cadmin/app-config/cadmin.appConfig.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";

// ── Category handlers ─────────────────────────────────────────────────────────
import { uploadCategoryImage } from "./cadmin.appConfig.upload.js";
import {
  handleListCategories,
  handleUploadCategoryImage,
  handleDeleteCategoryImage,
  handleSetVisibility,
  handleListFeedSections,
  handleReorderFeedSections,
  handleUpdateFeedSection,
  handleGetHomeScreenConfig,
  handleUpdateHomeScreenConfig,
} from "./cadmin.appConfig.controller.js";

import {
  handleGetLoyaltyConfig,
  handleUpdateLoyaltyConfig,
} from "../loyalty/cadminLoyalty.controller.js";

// ── Banner handlers ───────────────────────────────────────────────────────────
import { uploadBannerImage } from "./banners/cadmin.banners.upload.js";
import {
  handleListSlides,
  handleCreateSlide,
  handleUpdateSlide,
  handleUploadSlideImage,
  handleDeleteSlideImage,
  handleDeleteSlide,
  handleReorderSlides,
  // strips
  handleListStrips,
  handleCreateStrip,
  handleUpdateStrip,
  handleUploadStripImage,
  handleDeleteStripImage,
  handleDeleteStrip,
  handleReorderStrips,
} from "./banners/cadmin.banners.controller.js";

const router = Router();

router.use(requireCAdmin);

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY DISPLAY
// ════════════════════════════════════════════════════════════════════════════

router.get(
  "/app-config/categories",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleListCategories,
);

router.post(
  "/app-config/categories/:key/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  uploadCategoryImage.single("file"),
  handleUploadCategoryImage,
);

router.delete(
  "/app-config/categories/:key/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleDeleteCategoryImage,
);

router.patch(
  "/app-config/categories/:key/visibility",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleSetVisibility,
);

// ════════════════════════════════════════════════════════════════════════════
// HOME BANNERS — SLIDES
// ════════════════════════════════════════════════════════════════════════════

// GET    /cadmin/app-config/banners/slides
router.get(
  "/app-config/banners/slides",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleListSlides,
);

// POST   /cadmin/app-config/banners/slides
router.post(
  "/app-config/banners/slides",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleCreateSlide,
);

// PATCH  /cadmin/app-config/banners/slides/reorder
// ⚠️  Must be registered BEFORE /:slideId to avoid Express matching
//     "reorder" as a slideId param
router.patch(
  "/app-config/banners/slides/reorder",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleReorderSlides,
);

// PATCH  /cadmin/app-config/banners/slides/:slideId
router.patch(
  "/app-config/banners/slides/:slideId",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleUpdateSlide,
);

// POST   /cadmin/app-config/banners/slides/:slideId/image
router.post(
  "/app-config/banners/slides/:slideId/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  uploadBannerImage.single("file"),
  handleUploadSlideImage,
);

// DELETE /cadmin/app-config/banners/slides/:slideId/image
router.delete(
  "/app-config/banners/slides/:slideId/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleDeleteSlideImage,
);

// DELETE /cadmin/app-config/banners/slides/:slideId
router.delete(
  "/app-config/banners/slides/:slideId",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleDeleteSlide,
);

// ════════════════════════════════════════════════════════════════════════════
// HOME BANNERS — STRIPS
// ════════════════════════════════════════════════════════════════════════════

// GET    /cadmin/app-config/banners/strips
router.get(
  "/app-config/banners/strips",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleListStrips,
);

// POST   /cadmin/app-config/banners/strips
router.post(
  "/app-config/banners/strips",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleCreateStrip,
);

// PATCH  /cadmin/app-config/banners/strips/reorder
// ⚠️  Must be registered BEFORE /:stripId — same reason as slides
router.patch(
  "/app-config/banners/strips/reorder",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleReorderStrips,
);

// PATCH  /cadmin/app-config/banners/strips/:stripId
router.patch(
  "/app-config/banners/strips/:stripId",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleUpdateStrip,
);

// POST   /cadmin/app-config/banners/strips/:stripId/image
router.post(
  "/app-config/banners/strips/:stripId/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  uploadBannerImage.single("file"),
  handleUploadStripImage,
);

// DELETE /cadmin/app-config/banners/strips/:stripId/image
router.delete(
  "/app-config/banners/strips/:stripId/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleDeleteStripImage,
);

// DELETE /cadmin/app-config/banners/strips/:stripId
router.delete(
  "/app-config/banners/strips/:stripId",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleDeleteStrip,
);

// GET    /cadmin/app-config/feed-sections
router.get(
  "/app-config/feed-sections",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleListFeedSections,
);

// PATCH  /cadmin/app-config/feed-sections/reorder
// ⚠️  Must be registered BEFORE /:key to avoid Express matching
//     "reorder" as a key param
router.patch(
  "/app-config/feed-sections/reorder",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LAYOUT),
  handleReorderFeedSections,
);

// PATCH  /cadmin/app-config/feed-sections/:key
router.patch(
  "/app-config/feed-sections/:key",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LAYOUT),
  handleUpdateFeedSection,
);

// ════════════════════════════════════════════════════════════════════════════
// HOME SCREEN CONFIG
// ════════════════════════════════════════════════════════════════════════════

// GET    /cadmin/app-config/home-screen
router.get(
  "/app-config/home-screen",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleGetHomeScreenConfig,
);

// PATCH  /cadmin/app-config/home-screen
router.patch(
  "/app-config/home-screen",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LAYOUT),
  handleUpdateHomeScreenConfig,
);

// GET    /cadmin/app-config/loyalty
router.get(
  "/app-config/loyalty",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleGetLoyaltyConfig,
);

// PATCH  /cadmin/app-config/loyalty
router.patch(
  "/app-config/loyalty",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LOYALTY),
  handleUpdateLoyaltyConfig,
);

export default router;
