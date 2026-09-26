// backend/src/modules/cadmin/riders/cadminRiders.routes.js (do not remove this comment)
import { Router } from "express";
import multer from "multer";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { handleMulterError } from "../../../config/multer.js";
import {
  getRiders,
  getRider,
  reviewRiderDocument,
  approveRiderApplication,
  rejectRiderApplication,
  suspendRiderAccount,
  reactivateRiderAccount,
  createRider,
  getZones,
  addZone,
  editZone,
  getPendingReviews,
  convertRiderTypeController,
} from "./cadminRiders.controller.js";

const router = Router();

// ── Inline multer for multi-field team rider onboarding ───────
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

const teamRiderUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 7,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPG, PNG, PDF.`));
    }
  },
}).fields([
  { name: "profile_photo",           maxCount: 1 },
  { name: "driving_license_front",   maxCount: 1 },
  { name: "driving_license_back",    maxCount: 1 },
  { name: "aadhaar_front",           maxCount: 1 },
  { name: "aadhaar_back",            maxCount: 1 },
  { name: "pan_front",               maxCount: 1 },
  { name: "vehicle_rc",              maxCount: 1 },
]);

router.use(requireCAdmin);

// ── Rider management ──────────────────────────────────────────
router.get("/riders",                       getRiders);
router.post("/riders",
  teamRiderUpload,
  handleMulterError,
  createRider,
);
router.get("/reviews",                      getPendingReviews);
router.get("/riders/:riderId",              getRider);
router.post("/riders/:riderId/approve",     approveRiderApplication);
router.post("/riders/:riderId/reject",      rejectRiderApplication);
router.post("/riders/:riderId/suspend",     suspendRiderAccount);
router.post("/riders/:riderId/reactivate",  reactivateRiderAccount);
router.patch("/riders/:riderId/convert-type",           convertRiderTypeController);
router.patch("/riders/:riderId/documents/:documentId/review", reviewRiderDocument);

// ── Zone management ───────────────────────────────────────────
router.get("/zones",           getZones);
router.post("/zones",          addZone);
router.patch("/zones/:zoneId", editZone);

export default router;