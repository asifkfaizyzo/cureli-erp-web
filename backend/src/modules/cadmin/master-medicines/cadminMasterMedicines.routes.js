import { Router } from "express";
import multer from "multer";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  listMasterMedicines,
  getMasterMedicine,
  getVariant,
  getMasterMedicinesStats,
  getFilters,
  autocomplete,
  listShops,
  listUnmappedMedicines,
  listNeedsReview,
  listLinkedMedicines,
  listLinkedByVariant,
  acceptMatch,
  rejectMatch,
  matchToVariant,
  matchToMaster,
  ignoreUnmapped,
  unlinkMedicine,
  handleImageUpload,
  handleImageDelete,
  createMasterMed,
  listMappingHistory,
  unignoreMedicine,
} from "./cadminMasterMedicines.controller.js";

const router = Router();

// ── MULTER CONFIG — memory storage, buffer goes straight to S3 ───────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
});

// ── ALL ROUTES REQUIRE AUTH ──────────────────────────────────────────────────
router.use(requireCAdmin);

// ── SPECIFIC READ ROUTES (MUST BE BEFORE :id ROUTES) ─────────────────────────
router.get(
  "/master-medicines/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getMasterMedicinesStats
);
router.get(
  "/master-medicines/filters",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getFilters
);
router.get(
  "/master-medicines/autocomplete",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  autocomplete
);
router.get(
  "/master-medicines/shops",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listShops
);
router.get(
  "/master-medicines/unmapped",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listUnmappedMedicines
);
router.get(
  "/master-medicines/review",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listNeedsReview
);

// ── NEW: HISTORY ROUTE (MUST BE BEFORE :id) ──────────────────────────────────
router.get(
  "/master-medicines/history",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listMappingHistory
);

router.get(
  "/master-medicines/variants/:skuId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getVariant
);
router.get(
  "/master-medicines/variants/:variantId/linked",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listLinkedByVariant
);

// ── MAPPING ACTION ROUTES ────────────────────────────────────────────────────
router.post(
  "/master-medicines/review/:medicineId/accept",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  acceptMatch
);
router.post(
  "/master-medicines/review/:medicineId/reject",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  rejectMatch
);
router.post(
  "/master-medicines/match",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  matchToVariant
);
router.post(
  "/master-medicines/ignore",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  ignoreUnmapped
);
router.post(
  "/master-medicines/unignore/:medicineId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  unignoreMedicine
);
router.post(
  "/master-medicines/unlink/:medicineId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  unlinkMedicine
);

// ── LINKED READ ROUTES ───────────────────────────────────────────────────────
router.get(
  "/master-medicines/:id/linked",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listLinkedMedicines
);

// ── IMAGE ROUTES ─────────────────────────────────────────────────────────────
router.post(
  "/master-medicines/:id/images",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_IMAGES),
  upload.single("image"),
  handleImageUpload
);
router.delete(
  "/master-medicines/images/:imageId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_IMAGES),
  handleImageDelete
);

// ── CREATE ROUTE ─────────────────────────────────────────────────────────────
router.post(
  "/master-medicines",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_CREATE),
  createMasterMed
);

// ── MAIN READ ROUTES (MUST BE LAST) ──────────────────────────────────────────
router.get(
  "/master-medicines",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listMasterMedicines
);
router.get(
  "/master-medicines/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getMasterMedicine
);

export default router;