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
// We use multer directly here (not the createUploader helper) because
// we need .fields() for multiple named file inputs in one request.
// File validation is handled downstream by fileStorage.service.js
// when uploadFile() is called with folder="rider_documents".

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

const teamRiderStorage = multer.memoryStorage();

const teamRiderUpload = multer({
  storage: teamRiderStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 7,                   // max 7 files total
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

// All routes require CAdmin auth
router.use(requireCAdmin);

// ── Rider management ──────────────────────────────────────────
router.get("/delivery/riders",                       getRiders);
router.post(
  "/delivery/riders",
  teamRiderUpload,
  handleMulterError,
  createRider
);
router.get("/delivery/reviews",                      getPendingReviews);
router.get("/delivery/riders/:riderId",              getRider);
router.post("/delivery/riders/:riderId/approve",     approveRiderApplication);
router.post("/delivery/riders/:riderId/reject",      rejectRiderApplication);
router.post("/delivery/riders/:riderId/suspend",     suspendRiderAccount);
router.post("/delivery/riders/:riderId/reactivate",  reactivateRiderAccount);
router.patch(
  "/delivery/riders/:riderId/convert-type",
  convertRiderTypeController
);
router.patch(
  "/delivery/riders/:riderId/documents/:documentId/review",
  reviewRiderDocument
);

// ── Zone management (Placeholders/Retained) ───────────────────
router.get("/delivery/zones",           getZones);
router.post("/delivery/zones",          addZone);
router.patch("/delivery/zones/:zoneId", editZone);

export default router;