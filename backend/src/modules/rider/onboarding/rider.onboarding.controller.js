//backend\src\modules\rider\onboarding\rider.onboarding.controller.js
import { fail, success } from "../../../utils/response.js";
import {
  personalDetailsSchema,
  locationSchema,
  vehicleDetailsSchema,
  bankDetailsSchema,
  emergencyContactSchema,
} from "./rider.onboarding.schema.js";
import {
  getOnboardingStatus,
  savePersonalDetails,
  saveLocation,
  saveVehicleDetails,
  saveBankDetails,
  saveEmergencyContact,
  uploadRiderDocument,
  getDocumentStatus,
  submitApplication,
  acceptTerms,
  resubmitApplication,
} from "./rider.onboarding.service.js";

// ── Status ────────────────────────────────────────────────────

export async function getStatus(req, res) {
  try {
    const result = await getOnboardingStatus(req.rider.rider_id);
    return success(res, "Onboarding status retrieved", result);
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to fetch onboarding status", 500);
  }
}

// ── Personal Details ──────────────────────────────────────────

export async function updatePersonalDetails(req, res) {
  const parsed = personalDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await savePersonalDetails(req.rider.rider_id, parsed.data);
    return success(res, "Personal details saved", result);
  } catch (err) {
    if (err.code === "EMAIL_TAKEN") return fail(res, err.message, 409);
    return fail(res, "Failed to save details", 500);
  }
}

// ── Location ──────────────────────────────────────────────────

export async function updateLocation(req, res) {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await saveLocation(req.rider.rider_id, parsed.data);
    return success(res, "Location saved", result);
  } catch {
    return fail(res, "Failed to save location", 500);
  }
}

// ── Vehicle Details ───────────────────────────────────────────

export async function updateVehicleDetails(req, res) {
  const parsed = vehicleDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await saveVehicleDetails(req.rider.rider_id, parsed.data);
    return success(res, "Vehicle details saved", result);
  } catch {
    return fail(res, "Failed to save vehicle details", 500);
  }
}

// ── Bank Details ──────────────────────────────────────────────

export async function updateBankDetails(req, res) {
  const parsed = bankDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await saveBankDetails(req.rider.rider_id, parsed.data);
    return success(res, "Bank details saved", result);
  } catch {
    return fail(res, "Failed to save bank details", 500);
  }
}

// ── Emergency Contact ─────────────────────────────────────────

export async function updateEmergencyContact(req, res) {
  const parsed = emergencyContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await saveEmergencyContact(req.rider.rider_id, parsed.data);
    return success(res, "Emergency contact saved", result);
  } catch {
    return fail(res, "Failed to save emergency contact", 500);
  }
}

// ── Document Upload ───────────────────────────────────────────

export async function uploadDocument(req, res) {
  const { document_type, is_front } = req.body;

  const validTypes = [
    "DRIVING_LICENSE_FRONT",
    "VEHICLE_RC",
    "AADHAAR_FRONT",
    "PAN_FRONT",
    "PROFILE_PHOTO",
  ];

  if (!document_type || !validTypes.includes(document_type)) {
    return fail(
      res,
      `Invalid document type. Must be one of: ${validTypes.join(", ")}`,
      400
    );
  }

  if (!req.file) {
    return fail(res, "No file uploaded", 400);
  }

  try {
    const isFront = is_front !== "false";
    const result = await uploadRiderDocument(
      req.rider.rider_id,
      document_type,
      req.file,
      isFront
    );
    return success(res, "Document uploaded successfully", result);
  } catch (err) {
    if (err.code === "NO_FILE") return fail(res, err.message, 400);
    if (err.code === "INVALID_TYPE") return fail(res, err.message, 400);
    return fail(res, "Failed to upload document", 500);
  }
}

// ── Get Documents ─────────────────────────────────────────────

export async function getDocuments(req, res) {
  try {
    const docs = await getDocumentStatus(req.rider.rider_id);
    return success(res, "Documents retrieved", docs);
  } catch {
    return fail(res, "Failed to fetch documents", 500);
  }
}

// ── Submit ────────────────────────────────────────────────────

export async function submitOnboarding(req, res) {
  try {
    const result = await submitApplication(req.rider.rider_id);
    return success(res, "Application submitted for review", result);
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      INVALID_STATUS: 400,
      INCOMPLETE_PROFILE: 400,
      INCOMPLETE_LOCATION: 400,
      INCOMPLETE_VEHICLE: 400,
      MISSING_DOCUMENTS: 400,
      REJECTED_DOCUMENTS: 400,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

// ── Accept Terms ──────────────────────────────────────────────

export async function acceptTermsAndConditions(req, res) {
  try {
    const result = await acceptTerms(req.rider.rider_id);
    return success(res, "Terms accepted", result);
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      NOT_APPROVED: 400,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

// ── Resubmit ──────────────────────────────────────────────────

export async function resubmitOnboarding(req, res) {
  try {
    const result = await resubmitApplication(req.rider.rider_id);
    return success(res, "Application resubmitted for review", result);
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      INVALID_STATUS: 400,
      REJECTED_DOCUMENTS_REMAIN: 400,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}