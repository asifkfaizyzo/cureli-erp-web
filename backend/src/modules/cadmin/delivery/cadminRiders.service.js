// backend/src/modules/cadmin/delivery/cadminRiders.service.js

import prisma from "../../../config/prisma.js";
import { sseService } from "../../../services/sse.service.js";
import { uploadFile } from "../../../services/fileStorage.service.js";

// ── List riders ───────────────────────────────────────────────

export async function listRiders(query = {}) {
  const { status, rider_type, search, page = 1, limit = 20 } = query;

  const where = { deleted_at: null };

  if (status) where.status = status;
  if (rider_type) where.rider_type = rider_type;
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [riders, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { created_at: "desc" },
      select: {
        rider_id: true,
        phone: true,
        full_name: true,
        email: true,
        status: true,
        is_online: true,
        rating: true,
        total_deliveries: true,
        created_at: true,
        profile_photo_key: true,
        rider_type: true,
        vehicle_type: true,
        vehicle_number: true,
        current_city: true,
        documents: {
          select: { type: true, status: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    }),
    prisma.rider.count({ where }),
  ]);

  return {
    riders,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ── Get rider detail ──────────────────────────────────────────

export async function getRiderDetail(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    include: {
      documents: true,
      appeals: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
      tickets: {
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          ticket_id: true,
          category: true,
          status: true,
          created_at: true,
        },
      },
      _count: {
        select: {
          deliveries: true,
          ratingsReceived: true,
        },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return rider;
}

// ── Review document ───────────────────────────────────────────

export async function reviewDocument(
  riderId,
  documentId,
  action,
  rejectionReason,
  reviewedBy,
) {
  if (!["APPROVED", "REJECTED"].includes(action)) {
    const err = new Error("Action must be APPROVED or REJECTED.");
    err.code = "INVALID_ACTION";
    throw err;
  }

  if (action === "REJECTED" && !rejectionReason) {
    const err = new Error("Rejection reason is required.");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  const document = await prisma.riderDocument.findFirst({
    where: { document_id: documentId, rider_id: riderId },
  });

  if (!document) {
    const err = new Error("Document not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updated = await prisma.riderDocument.update({
    where: { document_id: documentId },
    data: {
      status: action,
      rejection_reason: action === "REJECTED" ? rejectionReason : null,
      was_rejected_this_cycle: action === "REJECTED", // ← NEW
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
    },
  });

  return updated;
}

// ── Approve application ───────────────────────────────────────

export async function approveRider(riderId, reviewedBy) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    include: { documents: true },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const unapproved = rider.documents.filter((d) => d.status !== "APPROVED");
  if (unapproved.length > 0) {
    const err = new Error(
      "All documents must be approved before activating the rider.",
    );
    err.code = "DOCUMENTS_PENDING";
    err.unapproved = unapproved.map((d) => d.type);
    throw err;
  }

  await prisma.$transaction([
    prisma.rider.update({
      where: { rider_id: riderId },
      data: {
        status: "ACTIVE",
        onboarding_step: "COMPLETED", // ← NEW
        is_resubmission: false, // ← NEW
      },
    }),
    // Clear all rejection cycle flags
    prisma.riderDocument.updateMany({
      where: { rider_id: riderId },
      data: { was_rejected_this_cycle: false }, // ← NEW
    }),
  ]);

  sseService.notifyRider(riderId, "APPLICATION_APPROVED", {
    message: "Your application has been approved. You can now go online.",
  });

  return { approved: true };
}

// ── Reject application ────────────────────────────────────────

export async function rejectRider(riderId, reason, reviewedBy) {
  if (!reason) {
    const err = new Error("Rejection reason is required.");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  // Find which docs are rejected to compute the earliest step to send user back to
  const STEP_ORDER = [
    "RC_UPLOAD",
    "DL_UPLOAD",
    "AADHAAR_UPLOAD",
    "PAN_UPLOAD",
    "LIVE_PHOTO",
  ];
  const DOC_TYPE_TO_STEP = {
    VEHICLE_RC: "RC_UPLOAD",
    DRIVING_LICENSE_FRONT: "DL_UPLOAD",
    AADHAAR_FRONT: "AADHAAR_UPLOAD",
    PAN_FRONT: "PAN_UPLOAD",
    PROFILE_PHOTO: "LIVE_PHOTO",
  };

  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    include: {
      documents: {
        where: { status: "REJECTED" },
        select: { type: true },
      },
    },
  });

  // Compute earliest rejected step
  let earliestStep = "RC_UPLOAD"; // fallback
  if (rider && rider.documents.length > 0) {
    const rejectedSteps = rider.documents
      .map((d) => DOC_TYPE_TO_STEP[d.type])
      .filter(Boolean)
      .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b));
    if (rejectedSteps.length > 0) {
      earliestStep = rejectedSteps[0];
    }
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      status: "REJECTED",
      submitted_for_review: false, // ← NEW
      is_resubmission: true, // ← NEW
      onboarding_step: earliestStep, // ← NEW: user resumes here
      last_resubmitted_at: new Date(), // ← NEW
    },
  });

  sseService.notifyRider(riderId, "APPLICATION_REJECTED", {
    message: reason,
  });

  return { rejected: true };
}

// ── Suspend rider ─────────────────────────────────────────────

export async function suspendRider(riderId, reason, suspendedBy) {
  if (!reason) {
    const err = new Error("Suspension reason is required.");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      status: "SUSPENDED",
      suspension_reason: reason,
      suspended_at: new Date(),
      suspended_by: suspendedBy,
      is_online: false,
    },
  });

  // Revoke all active sessions
  await prisma.riderSession.updateMany({
    where: { rider_id: riderId, is_active: true },
    data: {
      is_active: false,
      revoked_at: new Date(),
      revoked_reason: "suspended",
    },
  });

  // Force SSE disconnect notification
  sseService.notifyRider(riderId, "ACCOUNT_SUSPENDED", { reason });

  return { suspended: true };
}

// ── Reactivate rider ──────────────────────────────────────────

export async function reactivateRider(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: { status: true },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!["SUSPENDED", "REJECTED"].includes(rider.status)) {
    const err = new Error(
      "Only suspended or rejected riders can be reactivated.",
    );
    err.code = "INVALID_STATUS";
    throw err;
  }

  await prisma.rider.update({
    where: { rider_id: riderId },
    data: {
      status: "ACTIVE",
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
    },
  });

  sseService.notifyRider(riderId, "ACCOUNT_REACTIVATED", {
    message: "Your account has been reactivated.",
  });

  return { reactivated: true };
}

// ── Create rider (CAdmin invite — Path B) ─────────────────────

export async function createRiderByAdmin(body, files, createdBy) {
  const {
    phone,
    initial_password,
    full_name,
    email,
    date_of_birth,
    sex,
    current_city,
    residential_address,
    preferred_lat,
    preferred_lng,
    preferred_address,
    vehicle_type,
    vehicle_number,
    vehicle_make_model,
    bank_account_number,
    bank_ifsc,
    bank_holder_name,
    bank_name,
  } = body;

  const raw10 = phone
    .replace(/^\+?91/, "")
    .replace(/\s+/g, "")
    .trim();
  const phoneVariants = [phone, `+91${raw10}`, `91${raw10}`, raw10];

  const existing = await prisma.rider.findFirst({
    where: {
      OR: [
        { phone: { in: phoneVariants } },
        ...(email ? [{ email: email.trim() }] : []),
      ],
      deleted_at: null,
    },
  });

  if (existing) {
    const field = existing.phone === phone ? "phone number" : "email address";
    const err = new Error(`A rider with this ${field} already exists.`);
    err.code = "ALREADY_EXISTS";
    throw err;
  }

  // 1. Password setup
  const { hashPassword } = await import("../../../utils/hash.js");
  const passwordHash = await hashPassword(initial_password);

  // 2. Upload files to S3 & prepare document records
  const uploadDoc = async (fileField) => {
    const fileArray = files[fileField];
    if (!fileArray || fileArray.length === 0) return null;

    const file = fileArray[0];
    const s3Result = await uploadFile({
      buffer: file.buffer,
      folder: "rider_documents",
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    return s3Result.storage_key;
  };

  // Upload Profile Photo
  const profilePhotoKey = await uploadDoc("profile_photo");

  // Compile individual documents (pre-approved for team riders)
  const preparedDocs = [];

  // Driving License Row (Combined front + back)
  const dlFront = await uploadDoc("driving_license_front");
  const dlBack = await uploadDoc("driving_license_back");
  if (dlFront) {
    preparedDocs.push({
      type: "DRIVING_LICENSE_FRONT",
      storage_key: dlFront,
      back_storage_key: dlBack || null,
      status: "APPROVED",
      uploaded_at: new Date(),
    });
  }

  // Aadhaar Row (Combined front + back)
  const adFront = await uploadDoc("aadhaar_front");
  const adBack = await uploadDoc("aadhaar_back");
  if (adFront) {
    preparedDocs.push({
      type: "AADHAAR_FRONT",
      storage_key: adFront,
      back_storage_key: adBack || null,
      status: "APPROVED",
      uploaded_at: new Date(),
    });
  }

  // PAN Front Row
  const panFront = await uploadDoc("pan_front");
  if (panFront) {
    preparedDocs.push({
      type: "PAN_FRONT",
      storage_key: panFront,
      status: "APPROVED",
      uploaded_at: new Date(),
    });
  }

  // Vehicle RC Row
  const rcDoc = await uploadDoc("vehicle_rc");
  if (rcDoc) {
    preparedDocs.push({
      type: "VEHICLE_RC",
      storage_key: rcDoc,
      status: "APPROVED",
      uploaded_at: new Date(),
    });
  }

  // Profile Photo Document Row (for document table parity)
  if (profilePhotoKey) {
    preparedDocs.push({
      type: "PROFILE_PHOTO",
      storage_key: profilePhotoKey,
      status: "APPROVED",
      uploaded_at: new Date(),
    });
  }

  // 3. Write Atomic Rider Record
  const rider = await prisma.rider.create({
    data: {
      phone,
      password_hash: passwordHash,
      rider_type: "TEAM",
      status: "ACTIVE", // Team riders bypass onboarding review
      full_name: full_name?.trim() || null,
      email: email?.trim() || null,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      sex: sex || null,
      profile_photo_key: profilePhotoKey || null,
      current_city: current_city?.trim() || null,
      residential_address: residential_address?.trim() || null,
      preferred_lat: preferred_lat ? parseFloat(preferred_lat) : null,
      preferred_lng: preferred_lng ? parseFloat(preferred_lng) : null,
      preferred_address: preferred_address?.trim() || null,
      vehicle_type: vehicle_type || null,
      vehicle_number: vehicle_number?.trim().toUpperCase() || null,
      vehicle_make_model: vehicle_make_model?.trim() || null,
      bank_account_number: bank_account_number?.trim() || null,
      bank_ifsc: bank_ifsc?.trim().toUpperCase() || null,
      bank_holder_name: bank_holder_name?.trim() || null,
      bank_name: bank_name?.trim() || null,
      bank_verified: !!bank_account_number,
      terms_accepted_at: new Date(), // Pre-agreed by terms of employment
      documents: {
        create: preparedDocs,
      },
    },
    select: {
      rider_id: true,
      phone: true,
      full_name: true,
      rider_type: true,
      status: true,
      created_at: true,
    },
  });

  return rider;
}

// ── Zone management (retained for future geofence use) ────────

export async function listZones(query = {}) {
  const { is_active } = query;
  const where = {};
  if (is_active !== undefined) where.is_active = is_active === "true";

  return prisma.deliveryZone.findMany({
    where,
    orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
  });
}

export async function createZone(data, createdBy) {
  return prisma.deliveryZone.create({
    data: {
      name: data.name,
      city: data.city,
      state: data.state,
    },
  });
}

export async function updateZone(zoneId, data) {
  const zone = await prisma.deliveryZone.findUnique({
    where: { zone_id: zoneId },
  });
  if (!zone) {
    const err = new Error("Zone not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return prisma.deliveryZone.update({
    where: { zone_id: zoneId },
    data: {
      name: data.name ?? zone.name,
      city: data.city ?? zone.city,
      state: data.state ?? zone.state,
      is_active: data.is_active ?? zone.is_active,
    },
  });
}

// ── Pending reviews (riders awaiting document verification) ───

export async function getPendingReviews(query = {}) {
  const { search, page = 1, limit = 20 } = query;

  const where = {
    deleted_at: null,
    rider_type: "INDEPENDENT",
    OR: [{ status: "PENDING_REVIEW" }, { status: "REJECTED" }],
  };

  if (search) {
    where.AND = [
      {
        OR: [
          { full_name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [riders, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { updated_at: "desc" },
      select: {
        rider_id: true,
        phone: true,
        full_name: true,
        email: true,
        status: true,
        rider_type: true,
        current_city: true,
        vehicle_type: true,
        vehicle_number: true,
        created_at: true,
        updated_at: true,
        profile_photo_key: true,
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
    }),
    prisma.rider.count({ where }),
  ]);

  return {
    riders,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}
