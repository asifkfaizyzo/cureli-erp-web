//backend\src\modules\rider\onboarding\rider.onboarding.service.js
import prisma from "../../../config/prisma.js";
import { uploadFile } from "../../../services/fileStorage.service.js";

const RIDER_DOCS_FOLDER = "rider_documents";

// ── Document group definitions ────────────────────────────────
// Each group maps to a single RiderDocument row.
// Groups with hasBack: true use storage_key (front) + back_storage_key (back).

const DOCUMENT_GROUPS = [
  {
    key: "DRIVING_LICENSE",
    dbType: "DRIVING_LICENSE_FRONT",
    label: "Driving License",
    hasBack: true,
  },
  {
    key: "VEHICLE_RC",
    dbType: "VEHICLE_RC",
    label: "Vehicle RC",
    hasBack: false,
  },
  {
    key: "AADHAAR",
    dbType: "AADHAAR_FRONT",
    label: "Aadhaar Card",
    hasBack: true,
  },
  { key: "PAN", dbType: "PAN_FRONT", label: "PAN Card", hasBack: false },
  {
    key: "PROFILE_PHOTO",
    dbType: "PROFILE_PHOTO",
    label: "Live Photo",
    hasBack: false,
  },
];

// ── Get onboarding status (unified) ───────────────────────────

export async function getOnboardingStatus(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      rider_type: true,
      status: true,
      full_name: true,
      email: true,
      date_of_birth: true,
      sex: true,
      current_city: true,
      residential_address: true,
      preferred_lat: true,
      preferred_lng: true,
      vehicle_type: true,
      vehicle_number: true,
      bank_account_number: true,
      bank_ifsc: true,
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
        },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Team riders skip onboarding entirely
  if (rider.rider_type === "TEAM") {
    return {
      rider_type: "TEAM",
      status: rider.status,
      is_complete: true,
      next_step: null,
      steps: {},
      documents: [],
    };
  }

  // Build step completion flags
  const steps = {
    personal_details: !!(rider.full_name && rider.date_of_birth && rider.email),
    location: !!(rider.current_city && rider.residential_address),
    vehicle_details: !!(rider.vehicle_type && rider.vehicle_number),
    bank_details: !!(rider.bank_account_number && rider.bank_ifsc),
    terms_accepted: !!rider.terms_accepted_at,
  };

  // Build grouped document status
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
        has_front: false,
        has_back: false,
        uploaded_at: null,
      };
    }

    return {
      group: group.key,
      label: group.label,
      hasBack: group.hasBack,
      status: doc.status,
      rejection_reason: doc.rejection_reason,
      has_front: !!doc.storage_key,
      has_back: group.hasBack ? !!doc.back_storage_key : null,
      uploaded_at: doc.uploaded_at,
      resubmission_count: doc.resubmission_count,
    };
  });

  const allDocsApproved = documents.every((d) => d.status === "APPROVED");
  const anyDocRejected = documents.some((d) => d.status === "REJECTED");
  const allDocsUploaded = documents.every((d) => {
    if (d.hasBack) return d.has_front && d.has_back;
    return d.has_front;
  });

  // Determine next step based on status and completion
  let next_step = null;
  let is_complete = false;

    if (rider.status === "ACTIVE") {
    if (!steps.bank_details) {
      next_step = "bank_details";
    } else if (!steps.terms_accepted) {
      next_step = "terms";
    } else {
      next_step = "home";
      is_complete = true;
    }
  } else if (rider.status === "PENDING_REVIEW") {
    next_step = "status";
  } else if (rider.status === "REJECTED") {
    next_step = "status";
  } else if (rider.status === "DRAFT") {
    // Rider is still filling out onboarding
    if (!steps.personal_details) next_step = "personal_details";
    else if (!steps.location) next_step = "location";
    else if (!steps.vehicle_details) next_step = "vehicle_details";
    else if (!allDocsUploaded || anyDocRejected) next_step = "documents";
    else next_step = "submit";
  } else {
    // Fallback for any unknown status
    next_step = "personal_details";
  }

  return {
    rider_type: rider.rider_type,
    status: rider.status,
    is_complete,
    next_step,
    steps,
    documents,
    all_docs_uploaded: allDocsUploaded,
    all_docs_approved: allDocsApproved,
    any_doc_rejected: anyDocRejected,
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

  const updated = await prisma.rider.update({
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
    },
  });

  return updated;
}

// ── Save location ─────────────────────────────────────────────

export async function saveLocation(riderId, data) {
  const updated = await prisma.rider.update({
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
    },
  });

  return updated;
}

// ── Save vehicle details ──────────────────────────────────────

export async function saveVehicleDetails(riderId, data) {
  const updated = await prisma.rider.update({
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
    },
  });

  return updated;
}

// ── Save bank details ─────────────────────────────────────────

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

// ── Save emergency contact ────────────────────────────────────

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
//
// Front/back handling:
// - For DL and Aadhaar, both sides go into ONE RiderDocument row.
//   type = "DRIVING_LICENSE_FRONT" or "AADHAAR_FRONT"
//   storage_key = front image, back_storage_key = back image
// - is_front=true (default) → writes to storage_key
// - is_front=false → writes to back_storage_key on the SAME row
// - For single-side docs (PAN, RC, PROFILE_PHOTO), is_front is ignored.

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

  // Validate document type against known DB types
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

  // Determine which column to write
  const group = DOCUMENT_GROUPS.find((g) => g.dbType === documentType);
  const isBackUpload = !isFront && group?.hasBack;
  const storageField = isBackUpload ? "back_storage_key" : "storage_key";

  const document = await prisma.riderDocument.upsert({
    where: {
      rider_id_type: { rider_id: riderId, type: documentType },
    },
    update: {
      [storageField]: uploadResult.storage_key,
      status: "PENDING",
      rejection_reason: null,
      uploaded_at: new Date(),
      resubmission_count: { increment: 1 },
    },
    create: {
      rider_id: riderId,
      type: documentType,
      [storageField]: uploadResult.storage_key,
      status: "PENDING",
      uploaded_at: new Date(),
    },
    select: {
      document_id: true,
      type: true,
      status: true,
      uploaded_at: true,
      resubmission_count: true,
    },
  });

  return document;
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
        has_front: false,
        has_back: false,
        uploaded_at: null,
      };
    }

    return {
      group: group.key,
      label: group.label,
      hasBack: group.hasBack,
      status: doc.status,
      rejection_reason: doc.rejection_reason,
      has_front: !!doc.storage_key,
      has_back: group.hasBack ? !!doc.back_storage_key : null,
      uploaded_at: doc.uploaded_at,
      resubmission_count: doc.resubmission_count,
    };
  });
}

// ── Submit application ────────────────────────────────────────

export async function submitApplication(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      status: true,
      full_name: true,
      date_of_birth: true,
      email: true,
      current_city: true,
      residential_address: true,
      vehicle_type: true,
      vehicle_number: true,
      documents: {
        select: {
          type: true,
          status: true,
          storage_key: true,
          back_storage_key: true,
        },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

    // Allow submission from DRAFT (first time), PENDING_REVIEW (edge), or REJECTED (resubmit)
  if (!["DRAFT", "PENDING_REVIEW", "REJECTED"].includes(rider.status)) {
    const err = new Error("Application cannot be submitted in current status.");
    err.code = "INVALID_STATUS";
    throw err;
  }

  // Validate personal details
  if (!rider.full_name || !rider.date_of_birth || !rider.email) {
    const err = new Error(
      "Please complete your personal details before submitting.",
    );
    err.code = "INCOMPLETE_PROFILE";
    throw err;
  }

  // Validate location
  if (!rider.current_city || !rider.residential_address) {
    const err = new Error(
      "Please complete your location details before submitting.",
    );
    err.code = "INCOMPLETE_LOCATION";
    throw err;
  }

  // Validate vehicle
  if (!rider.vehicle_type || !rider.vehicle_number) {
    const err = new Error("Please add your vehicle details before submitting.");
    err.code = "INCOMPLETE_VEHICLE";
    throw err;
  }

  // Validate all 5 document groups are uploaded
  const docMap = new Map(rider.documents.map((d) => [d.type, d]));
  const missingDocs = [];
  const rejectedDocs = [];

  for (const group of DOCUMENT_GROUPS) {
    const doc = docMap.get(group.dbType);

    if (!doc || !doc.storage_key) {
      missingDocs.push(group.key);
      continue;
    }

    if (group.hasBack && !doc.back_storage_key) {
      missingDocs.push(`${group.key} (back)`);
      continue;
    }

    if (doc.status === "REJECTED") {
      rejectedDocs.push(group.key);
    }
  }

  if (missingDocs.length > 0) {
    const err = new Error(`Missing documents: ${missingDocs.join(", ")}`);
    err.code = "MISSING_DOCUMENTS";
    err.missing = missingDocs;
    throw err;
  }

  if (rejectedDocs.length > 0) {
    const err = new Error(
      `Rejected documents must be re-uploaded: ${rejectedDocs.join(", ")}`,
    );
    err.code = "REJECTED_DOCUMENTS";
    err.rejected = rejectedDocs;
    throw err;
  }

  // All good — set status to PENDING_REVIEW
  await prisma.rider.update({
    where: { rider_id: riderId },
    data: { status: "PENDING_REVIEW", updated_at: new Date() },
  });

  return { submitted: true };
}

// ── Accept terms ──────────────────────────────────────────────

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

// ── Resubmit application (after rejection) ────────────────────
//
// Resets status from REJECTED → PENDING_REVIEW.
// Only works if all previously rejected documents have been re-uploaded
// (their status reset to PENDING via the upload endpoint).

export async function resubmitApplication(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      status: true,
      documents: { select: { type: true, status: true } },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (rider.status !== "REJECTED") {
    const err = new Error(
      "Resubmission is only allowed for rejected applications.",
    );
    err.code = "INVALID_STATUS";
    throw err;
  }

  // Check no documents are still in REJECTED state
  const stillRejected = rider.documents.filter((d) => d.status === "REJECTED");
  if (stillRejected.length > 0) {
    const err = new Error(
      `Please re-upload all rejected documents first: ${stillRejected.map((d) => d.type).join(", ")}`,
    );
    err.code = "REJECTED_DOCUMENTS_REMAIN";
    err.rejected = stillRejected.map((d) => d.type);
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: { status: "PENDING_REVIEW", updated_at: new Date() },
  });

  return { resubmitted: true };
}
