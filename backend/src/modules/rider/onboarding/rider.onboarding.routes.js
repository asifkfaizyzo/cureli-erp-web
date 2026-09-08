//backend\src\modules\rider\onboarding\rider.onboarding.routes.js
import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import { createUploader, handleMulterError } from "../../../config/multer.js";
import {
  getStatus,
  updatePersonalDetails,
  updateLocation,
  updateVehicleDetails,
  updateBankDetails,
  updateEmergencyContact,
  uploadDocument,
  getDocuments,
  submitOnboarding,
  acceptTermsAndConditions,
  resubmitOnboarding,
} from "./rider.onboarding.controller.js";

const router = Router();

const documentUpload = createUploader("rider_documents", {
  fieldName: "file",
  maxFiles: 1,
  maxFileSize: 5 * 1024 * 1024,
});

// All routes require rider auth
router.get("/status",            riderAuth, getStatus);
router.put("/personal-details",  riderAuth, updatePersonalDetails);
router.put("/location",          riderAuth, updateLocation);
router.put("/vehicle-details",   riderAuth, updateVehicleDetails);
router.put("/bank-details",      riderAuth, updateBankDetails);
router.put("/emergency-contact", riderAuth, updateEmergencyContact);
router.get("/documents",         riderAuth, getDocuments);
router.post(
  "/documents/upload",
  riderAuth,
  documentUpload,
  handleMulterError,
  uploadDocument
);
router.post("/submit",           riderAuth, submitOnboarding);
router.post("/resubmit",         riderAuth, resubmitOnboarding);
router.post("/accept-terms",     riderAuth, acceptTermsAndConditions);

export default router;