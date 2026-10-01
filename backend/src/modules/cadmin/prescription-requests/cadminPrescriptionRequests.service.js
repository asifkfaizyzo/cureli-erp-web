//backend\src\modules\prescription-requests\cadminPrescriptionRequests.service.js
import prisma from "../../../config/prisma.js";
import { getSignedUrl } from "../../../services/fileStorage.service.js";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PRESCRIPTION_REQUEST_FOLDER = "prescription_requests";

const VALID_REQUEST_STATUSES = [
  "PENDING",
  "PARTIALLY_RESPONDED",
  "FULLY_RESPONDED",
  "ACCEPTED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

// ─────────────────────────────────────────────
// LIST ALL PRESCRIPTION REQUESTS (across all shops)
// ─────────────────────────────────────────────

export const listAllRequests = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
}) => {
  const skip = (page - 1) * limit;

  const where = {};

  // ── Status filter ──────────────────────────────────────
  if (status) {
    const statuses = status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { in: statuses };
    }
  }

  // ── Search filter ──────────────────────────────────────
  if (search) {
    where.OR = [
      { request_number: { contains: search, mode: "insensitive" } },
      {
        customer: {
          full_name: { contains: search, mode: "insensitive" },
        },
      },
      {
        customer: {
          phone: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.prescriptionRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      select: {
        request_id: true,
        request_number: true,
        status: true,
        created_at: true,
        expires_at: true,
        cancelled_at: true,
        completed_at: true,
        search_latitude: true,
        search_longitude: true,
        customer: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
        files: {
          where: { deleted_at: null },
          select: { file_id: true },
        },
        recipients: {
          select: {
            recipient_id: true,
            shop_id: true,
            branch_id: true,
            shop_name_snapshot: true,
            branch_name_snapshot: true,
            status: true,
            sent_at: true,
            quote_sent_at: true,
            accepted_at: true,
            declined_at: true,
            expired_at: true,
            converted_at: true,
            decline_reason: true,
            converted_order_id: true,
          },
        },
      },
    }),
    prisma.prescriptionRequest.count({ where }),
  ]);

  return {
    requests: requests.map(formatRequestRow),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

// ─────────────────────────────────────────────
// GET REQUEST DETAIL
// ─────────────────────────────────────────────

export const getRequestDetail = async (requestId) => {
  const request = await prisma.prescriptionRequest.findUnique({
    where: { request_id: requestId },
    include: {
      customer: {
        select: {
          id: true,
          full_name: true,
          phone: true,
          email: true,
          status: true,
        },
      },
      files: {
        where: { deleted_at: null },
        orderBy: { sequence: "asc" },
        select: {
          file_id: true,
          original_name: true,
          mime_type: true,
          file_size: true,
          sequence: true,
          uploaded_at: true,
        },
      },
      recipients: {
        orderBy: { sent_at: "asc" },
        include: {
          branch: {
            select: {
              contact_number: true,
              alternate_number: true,
              marketplaceSettings: {
                select: {
                  contact_override: true,
                },
              },
            },
          },
          shop: {
            select: {
              marketplaceProfile: {
                select: {
                  support_phone: true,
                },
              },
              owner: {
                select: {
                  phone_number: true,
                },
              },
            },
          },
          quoteItems: {
            include: {
              variant: {
                select: { sku_id: true, images: true },
              },
            },
          },
        },
      },
    },
  });

  if (!request) throw new Error("Prescription request not found");

  return formatRequestDetail(request);
};

// ─────────────────────────────────────────────
// GET FILE SIGNED URL
// ─────────────────────────────────────────────

export const getRequestFileUrl = async (requestId, fileId) => {
  const file = await prisma.prescriptionRequestFile.findUnique({
    where: { file_id: fileId },
    include: {
      request: {
        select: { request_id: true },
      },
    },
  });

  if (!file || file.request.request_id !== requestId) {
    throw new Error("File not found");
  }

  if (file.deleted_at !== null) {
    throw new Error("Prescription file has expired");
  }

  const url = await getSignedUrl({
    folder: PRESCRIPTION_REQUEST_FOLDER,
    filename: file.storage_key,
    expiresIn: 900,
  });

  return { url, expires_in: 900 };
};

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────

function formatRequestRow(request) {
  const recipients = request.recipients ?? [];
  const quotedCount = recipients.filter(
    (r) =>
      r.status === "QUOTE_SENT" ||
      r.status === "ACCEPTED" ||
      r.status === "CONVERTED",
  ).length;
  const declinedCount = recipients.filter(
    (r) => r.status === "DECLINED",
  ).length;
  const pendingCount = recipients.filter((r) => r.status === "SENT").length;

  return {
    request_id: request.request_id,
    request_number: request.request_number,
    status: request.status,
    customer_name: request.customer?.full_name || null,
    customer_phone: request.customer?.phone || null,
    customer_id: request.customer?.id || null,
    file_count: request.files?.length ?? 0,
    recipient_count: recipients.length,
    quoted_count: quotedCount,
    declined_count: declinedCount,
    pending_count: pendingCount,
    created_at: request.created_at,
    expires_at: request.expires_at,
    cancelled_at: request.cancelled_at,
    completed_at: request.completed_at,
  };
}

function resolveVariantImageUrl(variant) {
  if (!variant) return null;
  let imgs = variant.images ?? null;
  if (!imgs) return null;
  if (typeof imgs === "string") {
    try {
      imgs = JSON.parse(imgs);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const first = imgs[0];
  if (!first) return null;
  if (first.startsWith("medicine_images/")) return `/static/${first}`;
  if (variant.sku_id)
    return `/static/medicine_images/${variant.sku_id}/${first}`;
  return `/static/${first}`;
}

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────

function formatRequestDetail(request) {
  return {
    request_id: request.request_id,
    request_number: request.request_number,
    status: request.status,
    delivery_address: request.delivery_address_snapshot,
    search_latitude: request.search_latitude
      ? Number(request.search_latitude)
      : null,
    search_longitude: request.search_longitude
      ? Number(request.search_longitude)
      : null,
    created_at: request.created_at,
    expires_at: request.expires_at,
    cancelled_at: request.cancelled_at,
    completed_at: request.completed_at,
    customer: request.customer
      ? {
          id: request.customer.id,
          full_name: request.customer.full_name,
          phone: request.customer.phone,
          email: request.customer.email,
          status: request.customer.status,
        }
      : null,
    files: request.files.map((f) => ({
      file_id: f.file_id,
      original_name: f.original_name,
      mime_type: f.mime_type,
      file_size: f.file_size,
      sequence: f.sequence,
      uploaded_at: f.uploaded_at,
    })),
    recipients: request.recipients.map((r) => {
      const phone =
        r.branch?.marketplaceSettings?.contact_override ||
        r.branch?.contact_number ||
        r.branch?.alternate_number ||
        r.shop?.marketplaceProfile?.support_phone ||
        r.shop?.owner?.phone_number ||
        null;

      return {
        recipient_id: r.recipient_id,
        shop_id: r.shop_id,
        branch_id: r.branch_id,
        shop_name: r.shop_name_snapshot,
        branch_name: r.branch_name_snapshot,
        phone,
        distance_km: r.branch_distance_km ? Number(r.branch_distance_km) : null,
        status: r.status,
        sent_at: r.sent_at,
        quote_sent_at: r.quote_sent_at,
        quote_expires_at: r.quote_expires_at,
        accepted_at: r.accepted_at,
        converted_at: r.converted_at,
        declined_at: r.declined_at,
        expired_at: r.expired_at,
        decline_reason: r.decline_reason,
        converted_order_id: r.converted_order_id,
        quote_items:
          r.quoteItems?.map((item) => ({
            quote_item_id: item.quote_item_id,
            medicine_name: item.medicine_name_snapshot,
            brand: item.brand_snapshot,
            pack_size: item.pack_size_snapshot,
            variant_sku: item.variant_sku_snapshot,
            unit_price: Number(item.unit_price_snapshot),
            mrp: Number(item.mrp_snapshot),
            quantity: item.quantity,
            line_total: Number(item.line_total),
            is_available: item.is_available,
            is_substitute: item.is_substitute,
            substitute_note: item.substitute_note,
            requires_prescription: item.requires_prescription_snapshot,
            image_url: resolveVariantImageUrl(item.variant),
          })) ?? [],
      };
    }),
  };
}
