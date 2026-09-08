import prisma from "../../../config/prisma.js";
import { uploadFile } from "../../../services/fileStorage.service.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";

const RIDER_DOCS_FOLDER = "rider_documents";

// ── Step progression constants ────────────────────────────────

const STEP_ORDER = [
  "PERSONAL_DETAILS",
  "LOCATION",
  "VEHICLE_DETAILS",
  "RC_UPLOAD",
  "DL_UPLOAD",
  "AADHAAR_UPLOAD",
  "PAN_UPLOAD",
  "LIVE_PHOTO",
  "COMPLETED",
];

const STEP_AFTER = {
  PERSONAL_DETAILS: "LOCATION",
  LOCATION: "VEHICLE_DETAILS",
  VEHICLE_DETAILS: "RC_UPLOAD",
  RC_UPLOAD: "DL_UPLOAD",
  DL_UPLOAD: "AADHAAR_UPLOAD",
  AADHAAR_UPLOAD: "PAN_UPLOAD",
  PAN_UPLOAD: "LIVE_PHOTO",
  LIVE_PHOTO: "COMPLETED",
};

// Maps DB document type → onboarding step
const DOC_TYPE_TO_STEP = {
  VEHICLE_RC: "RC_UPLOAD",
  DRIVING_LICENSE_FRONT: "DL_UPLOAD",
  AADHAAR_FRONT: "AADHAAR_UPLOAD",
  PAN_FRONT: "PAN_UPLOAD",
  PROFILE_PHOTO: "LIVE_PHOTO",
};

// Document group definitions (unchanged from original)
const DOCUMENT_GROUPS = [
  { key: "DRIVING_LICENSE", dbType: "DRIVING_LICENSE_FRONT", label: "Driving License", hasBack: true },
  { key: "VEHICLE_RC", dbType: "VEHICLE_RC", label: "Vehicle RC", hasBack: false },
  { key: "AADHAAR", dbType: "AADHAAR_FRONT", label: "Aadhaar Card", hasBack: true },
  { key: "PAN", dbType: "PAN_FRONT", label: "PAN Card", hasBack: false },
  { key: "PROFILE_PHOTO", dbType: "PROFILE_PHOTO", label: "Live Photo", hasBack: false },
];

// ── Helpers ───────────────────────────────────────────────────

function getDocUrl(storageKey) {
  if (!storageKey) return null;
  return resolveAssetUrl(`rider_documents/${storageKey}`);
}

/**
 * Advance onboarding_step forward only (never regress).
 * During resubmission, jumps to next rejected step instead.
 */
async function advanceStep(tx, riderId, completedStep, isResubmission) {
  const rider = await tx.rider.findUnique({
    where: { rider_id: riderId },
    select: { onboarding_step: true, is_resubmission: true },
  });

  const currentIdx = STEP_ORDER.indexOf(rider.onboarding_step);
  const completedIdx = STEP_ORDER.indexOf(completedStep);

  // Don't regress
  if (completedIdx < currentIdx) return;

  if (isResubmission || rider.is_resubmission) {
    // Find next rejected doc step
    const rejectedDocs = await tx.riderDocument.findMany({
      where: { rider_id: riderId, was_rejected_this_cycle: true },
      select: { type: true },
    });

    if (rejectedDocs.length === 0) {
      // All rejected docs fixed → auto-submit
      await tx.rider.update({
        where: { rider_id: riderId },
        data: {
          onboarding_step: "COMPLETED",
          submitted_for_review: true,
          status: "PENDING_REVIEW",
          is_resubmission: false,
          last_resubmitted_at: new Date(),
        },
      });
      return;
    }

    // Jump to earliest remaining rejected step
    const rejectedSteps = rejectedDocs
      .map((d) => DOC_TYPE_TO_STEP[d.type])
      .filter(Boolean);
    const earliestRejected = rejectedSteps.sort(
      (a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b)
    )[0];

    if (earliestRejected) {
      await tx.rider.update({
        where: { rider_id: riderId },
        data: { onboarding_step: earliestRejected },
      });
    }
    return;
  }

  // Normal flow: advance to next sequential step
  const nextStep = STEP_AFTER[completedStep];
  if (!nextStep) return;

  const nextIdx = STEP_ORDER.indexOf(nextStep);
  if (nextIdx > currentIdx) {
    const updateData = { onboarding_step: nextStep };

    // Auto-submit when reaching COMPLETED
    if (nextStep === "COMPLETED") {
      updateData.submitted_for_review = true;
      updateData.status = "PENDING_REVIEW";
      updateData.first_submitted_at = new Date();
    }

    await tx.rider.update({
      where: { rider_id: riderId },
      data: updateData,
    });
  }
}

// ── Get onboarding status (full snapshot) ─────────────────────

export async function getOnboardingStatus(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      rider_type: true,
      status: true,
      onboarding_step: true,
      submitted_for_review: true,
      is_resubmission: true,
      full_name: true,
      email: true,
      date_of_birth: true,
      sex: true,
      current_city: true,
      residential_address: true,
      preferred_lat: true,
      preferred_lng: true,
      preferred_address: true,
      vehicle_type: true,
      vehicle_number: true,
      vehicle_make_model: true,
      bank_account_number: true,
      bank_ifsc: true,
      bank_holder_name: true,
      bank_verified: true,
      terms_accepted_at: true,
      documents: {
        select: {
          document_id: true,
          type: true,
          status: true,
          rejection_reason: true,
          storage_key: true,
          back_storage_key: true,
          uploaded_at: true,
          resubmission_count: true,
          was_rejected_this_cycle: true,
        },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Team riders skip onboarding
  if (rider.rider_type === "TEAM") {
    return {
      rider_type: "TEAM",
      status: rider.status,
      onboarding_step: "COMPLETED",
      submitted_for_review: true,
      is_resubmission: false,
      personal_details: null,
      location: null,
      vehicle_details: null,
      documents: [],
      rejected_steps: [],
      next_rejected_step: null,
    };
  }

  // Build grouped documents with URLs
  const docMap = new Map(rider.documents.map((d) => [d.type, d]));

  const documents = DOCUMENT_GROUPS.map((group) => {
    const doc = docMap.get(group.dbType);
    if (!doc) {
      return {
        group: group.key,
        label: group.label,
        hasBack: group.hasBack,
        status: "NOT_UPLOADED",
        rejection_reason: null,
        was_rejected_this_cycle: false,
        has_front: false,
        has_back: false,
        front_url: null,
        back_url: null,
        uploaded_at: null,
      };
    }
    return {
      group: group.key,
      label: group.label,
      hasBack: group.hasBack,
      status: doc.status,
      rejection_reason: doc.rejection_reason,
      was_rejected_this_cycle: doc.was_rejected_this_cycle,
      has_front: !!doc.storage_key,
      has_back: group.hasBack ? !!doc.back_storage_key : null,
      front_url: getDocUrl(doc.storage_key),
      back_url: group.hasBack ? getDocUrl(doc.back_storage_key) : null,
      uploaded_at: doc.uploaded_at,
      resubmission_count: doc.resubmission_count,
    };
  });

  // Compute rejected steps for resubmission flow
  const rejectedSteps = rider.documents
    .filter((d) => d.was_rejected_this_cycle)
    .map((d) => DOC_TYPE_TO_STEP[d.type])
    .filter(Boolean)
    .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b));

  return {
    rider_type: rider.rider_type,
    status: rider.status,
    onboarding_step: rider.onboarding_step,
    submitted_for_review: rider.submitted_for_review,
    is_resubmission: rider.is_resubmission,

    // Data snapshots for form pre-filling
    personal_details: {
      full_name: rider.full_name,
      email: rider.email,
      date_of_birth: rider.date_of_birth
        ? new Date(rider.date_of_birth).toISOString().split("T")[0]
        : null,
      sex: rider.sex,
    },
    location: {
      current_city: rider.current_city,
      residential_address: rider.residential_address,
      preferred_lat: rider.preferred_lat ? Number(rider.preferred_lat) : null,
      preferred_lng: rider.preferred_lng ? Number(rider.preferred_lng) : null,
      preferred_address: rider.preferred_address,
    },
    vehicle_details: {
      vehicle_type: rider.vehicle_type,
      vehicle_number: rider.vehicle_number,
      vehicle_make_model: rider.vehicle_make_model,
    },
    bank_details: {
      has_bank_details: !!(rider.bank_account_number && rider.bank_ifsc),
      bank_holder_name: rider.bank_holder_name,
      bank_account_last4: rider.bank_account_number
        ? rider.bank_account_number.slice(-4)
        : null,
      bank_verified: rider.bank_verified,
    },
    terms_accepted: !!rider.terms_accepted_at,

    documents,
    rejected_steps: rejectedSteps,
    next_rejected_step: rejectedSteps[0] || null,
  };
}

// ── Save personal details ─────────────────────────────────────

export async function savePersonalDetails(riderId, data) {
  if (data.email) {
    const existingEmail = await prisma.rider.findFirst({
      where: {
        email: data.email,
        rider_id: { not: riderId },
        deleted_at: null,
      },
    });
    if (existingEmail) {
      const err = new Error("This email is already in use.");
      err.code = "EMAIL_TAKEN";
      throw err;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.rider.update({
      where: { rider_id: riderId },
      data: {
        full_name: data.full_name,
        email: data.email,
        date_of_birth: new Date(data.date_of_birth),
        sex: data.sex ?? null,
      },
      select: {
        rider_id: true,
        full_name: true,
        email: true,
        date_of_birth: true,
        sex: true,
        onboarding_step: true,
      },
    });

    await advanceStep(tx, riderId, "PERSONAL_DETAILS", false);

    return updated;
  });

  return result;
}

// ── Save location ─────────────────────────────────────────────

export async function saveLocation(riderId, data) {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.rider.update({
      where: { rider_id: riderId },
      data: {
        current_city: data.current_city,
        residential_address: data.residential_address,
        preferred_lat: data.preferred_lat ?? null,
        preferred_lng: data.preferred_lng ?? null,
        preferred_address: data.preferred_address ?? null,
      },
      select: {
        rider_id: true,
        current_city: true,
        residential_address: true,
        preferred_lat: true,
        preferred_lng: true,
        preferred_address: true,
        onboarding_step: true,
      },
    });

    await advanceStep(tx, riderId, "LOCATION", false);

    return updated;
  });

  return result;
}

// ── Save vehicle details ──────────────────────────────────────

export async function saveVehicleDetails(riderId, data) {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.rider.update({
      where: { rider_id: riderId },
      data: {
        vehicle_type: data.vehicle_type,
        vehicle_number: data.vehicle_number,
        vehicle_make_model: data.vehicle_make_model ?? null,
      },
      select: {
        rider_id: true,
        vehicle_type: true,
        vehicle_number: true,
        vehicle_make_model: true,
        onboarding_step: true,
      },
    });

    await advanceStep(tx, riderId, "VEHICLE_DETAILS", false);

    return updated;
  });

  return result;
}

// ── Save bank details (post-approval, no step change) ─────────

export async function saveBankDetails(riderId, data) {
  const updated = await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      bank_account_number: data.bank_account_number,
      bank_ifsc: data.bank_ifsc,
      bank_holder_name: data.bank_holder_name,
      bank_name: data.bank_name,
      bank_verified: false,
    },
    select: {
      rider_id: true,
      bank_holder_name: true,
      bank_verified: true,
    },
  });

  return updated;
}

// ── Save emergency contact (no step change) ───────────────────

export async function saveEmergencyContact(riderId, data) {
  const updated = await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
    },
    select: {
      rider_id: true,
      emergency_contact_name: true,
      emergency_contact_phone: true,
    },
  });

  return updated;
}

// ── Upload document ───────────────────────────────────────────

export async function uploadRiderDocument(
  riderId,
  documentType,
  file,
  isFront = true,
) {
  if (!file) {
    const err = new Error("No file provided.");
    err.code = "NO_FILE";
    throw err;
  }

  const validDbTypes = DOCUMENT_GROUPS.map((g) => g.dbType);
  if (!validDbTypes.includes(documentType)) {
    const err = new Error(`Invalid document type: ${documentType}`);
    err.code = "INVALID_TYPE";
    throw err;
  }

  // Upload to S3
  const uploadResult = await uploadFile({
    buffer: file.buffer,
    folder: RIDER_DOCS_FOLDER,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  const group = DOCUMENT_GROUPS.find((g) => g.dbType === documentType);
  const isBackUpload = !isFront && group?.hasBack;
  const storageField = isBackUpload ? "back_storage_key" : "storage_key";

  const result = await prisma.$transaction(async (tx) => {
    const document = await tx.riderDocument.upsert({
      where: {
        rider_id_type: { rider_id: riderId, type: documentType },
      },
      update: {
        [storageField]: uploadResult.storage_key,
        status: "PENDING",
        rejection_reason: null,
        was_rejected_this_cycle: false,  // Clear rejection flag on re-upload
        uploaded_at: new Date(),
        resubmission_count: { increment: 1 },
      },
      create: {
        rider_id: riderId,
        type: documentType,
        [storageField]: uploadResult.storage_key,
        status: "PENDING",
        was_rejected_this_cycle: false,
        uploaded_at: new Date(),
      },
      select: {
        document_id: true,
        type: true,
        status: true,
        uploaded_at: true,
        resubmission_count: true,
        was_rejected_this_cycle: true,
      },
    });

    // Advance step based on which doc was uploaded
    const completedStep = DOC_TYPE_TO_STEP[documentType];
    if (completedStep) {
      const rider = await tx.rider.findUnique({
        where: { rider_id: riderId },
        select: { is_resubmission: true },
      });
      await advanceStep(tx, riderId, completedStep, rider.is_resubmission);
    }

    return document;
  });

  return result;
}

// ── Get document status (grouped) ─────────────────────────────

export async function getDocumentStatus(riderId) {
  const documents = await prisma.riderDocument.findMany({
    where: { rider_id: riderId },
    select: {
      document_id: true,
      type: true,
      status: true,
      rejection_reason: true,
      storage_key: true,
      back_storage_key: true,
      uploaded_at: true,
      resubmission_count: true,
      was_rejected_this_cycle: true,
    },
  });

  const docMap = new Map(documents.map((d) => [d.type, d]));

  return DOCUMENT_GROUPS.map((group) => {
    const doc = docMap.get(group.dbType);
    if (!doc) {
      return {
        group: group.key,
        label: group.label,
        hasBack: group.hasBack,
        status: "NOT_UPLOADED",
        rejection_reason: null,
        was_rejected_this_cycle: false,
        has_front: false,
        has_back: false,
        front_url: null,
        back_url: null,
        uploaded_at: null,
      };
    }
    return {
      group: group.key,
      label: group.label,
      hasBack: group.hasBack,
      status: doc.status,
      rejection_reason: doc.rejection_reason,
      was_rejected_this_cycle: doc.was_rejected_this_cycle,
      has_front: !!doc.storage_key,
      has_back: group.hasBack ? !!doc.back_storage_key : null,
      front_url: getDocUrl(doc.storage_key),
      back_url: group.hasBack ? getDocUrl(doc.back_storage_key) : null,
      uploaded_at: doc.uploaded_at,
      resubmission_count: doc.resubmission_count,
    };
  });
}

// ── Submit application (fallback — normally auto-triggered) ───

export async function submitApplication(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      status: true,
      onboarding_step: true,
      submitted_for_review: true,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (rider.submitted_for_review) {
    return { submitted: true, already_submitted: true };
  }

  if (rider.onboarding_step !== "COMPLETED") {
    const err = new Error("Please complete all onboarding steps first.");
    err.code = "INCOMPLETE";
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      submitted_for_review: true,
      status: "PENDING_REVIEW",
      first_submitted_at: new Date(),
    },
  });

  return { submitted: true };
}

// ── Accept terms (post-approval) ──────────────────────────────

export async function acceptTerms(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: { rider_id: true, status: true, terms_accepted_at: true },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (rider.status !== "ACTIVE") {
    const err = new Error(
      "You can only accept terms after your account is approved.",
    );
    err.code = "NOT_APPROVED";
    throw err;
  }

  const updated = await prisma.rider.update({
    where: { rider_id: riderId },
    data: { terms_accepted_at: new Date() },
    select: { rider_id: true, terms_accepted_at: true },
  });

  return updated;
}