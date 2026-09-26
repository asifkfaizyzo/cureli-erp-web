// backend/src/modules/prescription-requests/prescription.requests.service.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.service.js
//
// CHANGED: acceptQuote now fetches branch coordinates from
// BranchMarketplaceSettings and returns them in the response.
// The mobile app uses these to compute delivery distance in CartScreen.
//
// All other functions are unchanged.

import prisma             from '../../config/prisma.js';
import { uploadFile, getSignedUrl, deleteFile } from '../../services/fileStorage.service.js';
import { resolveAssetUrl } from '../../services/assetUrl.service.js';
import {
  firePrescriptionRequestNewEvents,
  firePrescriptionQuoteReceivedEvents,
} from './prescription.requests.events.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PRESCRIPTION_REQUEST_FOLDER = 'prescription_requests';
const QUOTE_EXPIRY_MINUTES        = 15;
const REQUEST_EXPIRY_HOURS        = 48;

const TERMINAL_REQUEST_STATUSES = new Set([
  'ACCEPTED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]);

const TERMINAL_RECIPIENT_STATUSES = new Set([
  'ACCEPTED',
  'CONVERTED',
  'DECLINED',
  'EXPIRED',
]);

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function generateRequestNumber() {
  const result = await prisma.$queryRaw`
    SELECT nextval('prescription_request_seq') AS seq
  `;
  const seq = result[0].seq;
  return `PRX-${String(seq).padStart(6, '0')}`;
}

function computeQuoteExpiry(from = new Date()) {
  return new Date(from.getTime() + QUOTE_EXPIRY_MINUTES * 60 * 1000);
}

function computeRequestExpiry(from = new Date()) {
  return new Date(from.getTime() + REQUEST_EXPIRY_HOURS * 60 * 60 * 1000);
}

function deriveRequestStatus(recipients) {
  const statuses = recipients.map((r) => r.status);

  if (statuses.includes('CONVERTED')) return 'COMPLETED';
  if (statuses.includes('ACCEPTED'))  return 'ACCEPTED';

  const activelySent = statuses.filter((s) => s === 'SENT').length;
  const quoteSent    = statuses.filter((s) => s === 'QUOTE_SENT').length;
  const allTerminal  = statuses.every((s) => TERMINAL_RECIPIENT_STATUSES.has(s));

  if (allTerminal)   return 'FULLY_RESPONDED';
  if (quoteSent > 0) return activelySent > 0 ? 'PARTIALLY_RESPONDED' : 'FULLY_RESPONDED';
  return 'PENDING';
}

function resolveVariantImageUrl(variant) {
  if (!variant) return null;
  let imgs = variant.images ?? null;
  if (!imgs) return null;
  if (typeof imgs === 'string') {
    try { imgs = JSON.parse(imgs); } catch { return null; }
  }
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const first = imgs[0];
  if (!first) return null;
  if (first.startsWith('medicine_images/')) return resolveAssetUrl(first);
  if (variant.sku_id) return resolveAssetUrl(`medicine_images/${variant.sku_id}/${first}`);
  return resolveAssetUrl(first);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

function formatRecipientSummary(recipient) {
  const availableItems = recipient.quoteItems?.filter((i) => i.is_available) ?? [];
  const totalItems     = recipient.quoteItems?.length ?? 0;
  const quoteTotal     = availableItems.reduce(
    (sum, i) => sum + Number(i.line_total), 0,
  );

  return {
    recipient_id:       recipient.recipient_id,
    shop_id:            recipient.shop_id,
    branch_id:          recipient.branch_id,
    shop_name:          recipient.shop_name_snapshot,
    branch_name:        recipient.branch_name_snapshot,
    distance_km:        recipient.branch_distance_km
                          ? Number(recipient.branch_distance_km)
                          : null,
    status:             recipient.status,
    sent_at:            recipient.sent_at,
    quote_sent_at:      recipient.quote_sent_at,
    quote_expires_at:   recipient.quote_expires_at,
    accepted_at:        recipient.accepted_at,
    declined_at:        recipient.declined_at,
    expired_at:         recipient.expired_at,
    decline_reason:     recipient.decline_reason,
    converted_order_id: recipient.converted_order_id,
    quote_summary: recipient.status === 'QUOTE_SENT' || recipient.status === 'ACCEPTED' || recipient.status === 'CONVERTED'
      ? {
          total_items:       totalItems,
          available_items:   availableItems.length,
          unavailable_items: totalItems - availableItems.length,
          quote_total:       quoteTotal,
        }
      : null,
    quote_items: recipient.quoteItems?.map(formatQuoteItem) ?? [],
  };
}

function formatQuoteItem(item) {
  return {
    quote_item_id:    item.quote_item_id,
    medicine_name:    item.medicine_name_snapshot,
    brand:            item.brand_snapshot,
    pack_size:        item.pack_size_snapshot,
    variant_sku:      item.variant_sku_snapshot,
    unit_price:       Number(item.unit_price_snapshot),
    mrp:              Number(item.mrp_snapshot),
    quantity:         item.quantity,
    line_total:       Number(item.line_total),
    is_available:     item.is_available,
    is_substitute:    item.is_substitute,
    substitute_note:  item.substitute_note,
    requires_prescription: item.requires_prescription_snapshot,
    image_url: resolveVariantImageUrl(item.variant),
  };
}

function formatRequestSummary(request) {
  const recipients    = request.recipients ?? [];
  const quotedCount   = recipients.filter((r) => r.status === 'QUOTE_SENT').length;
  const acceptedCount = recipients.filter((r) => r.status === 'ACCEPTED').length;

  return {
    request_id:      request.request_id,
    request_number:  request.request_number,
    status:          request.status,
    recipient_count: recipients.length,
    quoted_count:    quotedCount,
    accepted_count:  acceptedCount,
    file_count:      request.files?.length ?? 0,
    created_at:      request.created_at,
    expires_at:      request.expires_at,
    cancelled_at:    request.cancelled_at,
    completed_at:    request.completed_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD PRESCRIPTION IMAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadRequestFiles(files) {
  if (!files || files.length === 0) throw new Error('No files provided');
  if (files.length > 5)            throw new Error('Maximum 5 prescription files allowed');

  const results = [];

  for (const file of files) {
    const uploaded = await uploadFile({
      buffer:       file.buffer,
      folder:       PRESCRIPTION_REQUEST_FOLDER,
      originalName: file.originalname,
      mimetype:     file.mimetype,
      size:         file.size,
    });

    results.push({
      file_key:      uploaded.storage_key,
      original_name: file.originalname,
      mime_type:     file.mimetype,
      file_size:     file.size,
    });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT PRESCRIPTION REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export async function submitRequest({
  customerId,
  files,
  deliveryAddressId,
  searchLatitude,
  searchLongitude,
  branchIds,
}) {
  const customer = await prisma.cureliMobileUser.findUnique({
    where:  { id: customerId },
    select: { id: true, status: true },
  });

  if (!customer || customer.status !== 'active') {
    throw new Error('Customer account is not active');
  }

  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: deliveryAddressId, user_id: customerId, deleted_at: null },
  });

  if (!address) throw new Error('Delivery address not found');

  const deliveryAddressSnapshot = {
    label:           address.label,
    address_line_1:  address.address_line_1,
    address_line_2:  address.address_line_2  ?? null,
    landmark:        address.landmark        ?? null,
    city:            address.city,
    state:           address.state,
    pincode:         address.pincode,
    latitude:        address.latitude  ? Number(address.latitude)  : null,
    longitude:       address.longitude ? Number(address.longitude) : null,
    recipient_name:  address.recipient_name  ?? null,
    recipient_phone: address.recipient_phone ?? null,
  };

  const branchSettings = await prisma.branchMarketplaceSettings.findMany({
    where: {
      branch_id:           { in: branchIds },
      marketplace_enabled: true,
      marketplaceProfile:  { is_live: true },
    },
    select: {
      branch_id:    true,
      branch: {
        select: {
          shop_id:      true,
          branch_name:  true,
          is_active:    true,
        },
      },
      marketplaceProfile: {
        select: {
          shop_id:        true,
          storefront_name: true,
          shop: {
            select: { business_name: true },
          },
        },
      },
      latitude:   true,
      longitude:  true,
    },
  });

  if (branchSettings.length === 0) {
    throw new Error('No valid pharmacy branches found');
  }

  const validBranchMap = new Map(
    branchSettings.map((bs) => [bs.branch_id, bs]),
  );

  const validBranchIds = branchIds.filter((id) => validBranchMap.has(id));

  if (validBranchIds.length === 0) {
    throw new Error('None of the selected pharmacies are currently available');
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
    const R    = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a    =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  const requestNumber = await generateRequestNumber();
  const now           = new Date();
  const expiresAt     = computeRequestExpiry(now);

  const { request, recipients } = await prisma.$transaction(async (tx) => {
    const req = await tx.prescriptionRequest.create({
      data: {
        request_number:             requestNumber,
        customer_id:                customerId,
        delivery_address_id:        deliveryAddressId,
        delivery_address_snapshot:  deliveryAddressSnapshot,
        search_latitude:            searchLatitude,
        search_longitude:           searchLongitude,
        status:                     'PENDING',
        expires_at:                 expiresAt,
      },
    });

    await tx.prescriptionRequestFile.createMany({
      data: files.map((f, idx) => ({
        request_id:    req.request_id,
        storage_key:   f.file_key,
        original_name: f.original_name,
        mime_type:     f.mime_type,
        file_size:     f.file_size,
        sequence:      idx,
      })),
    });

    const recipientData = validBranchIds.map((branchId) => {
      const bs         = validBranchMap.get(branchId);
      const shopName   = bs.marketplaceProfile.storefront_name
                          ?? bs.marketplaceProfile.shop.business_name;
      const branchLat  = bs.latitude  ? Number(bs.latitude)  : null;
      const branchLng  = bs.longitude ? Number(bs.longitude) : null;
      const distanceKm = haversineKm(searchLatitude, searchLongitude, branchLat, branchLng);

      return {
        request_id:          req.request_id,
        shop_id:             bs.marketplaceProfile.shop_id,
        branch_id:           branchId,
        branch_name_snapshot: bs.branch.branch_name,
        shop_name_snapshot:  shopName,
        branch_distance_km:  distanceKm,
        status:              'SENT',
        sent_at:             now,
      };
    });

    await tx.prescriptionRequestRecipient.createMany({ data: recipientData });

    const createdRecipients = await tx.prescriptionRequestRecipient.findMany({
      where: { request_id: req.request_id },
    });

    return { request: req, recipients: createdRecipients };
  });

  for (const recipient of recipients) {
    firePrescriptionRequestNewEvents(recipient, request).catch((err) =>
      console.error(
        `[PRxService] Event fire failed for recipient ${recipient.recipient_id}:`,
        err.message,
      ),
    );
  }

  return {
    request_id:      request.request_id,
    request_number:  request.request_number,
    status:          request.status,
    recipient_count: recipients.length,
    created_at:      request.created_at,
    expires_at:      request.expires_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET CUSTOMER REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerRequests(customerId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    prisma.prescriptionRequest.findMany({
      where:   { customer_id: customerId },
      orderBy: { created_at: 'desc' },
      skip,
      take:    limit,
      include: {
        files:      { select: { file_id: true }, orderBy: { sequence: 'asc' } },
        recipients: {
          select: {
            recipient_id:    true,
            status:          true,
            quote_sent_at:   true,
            quoteItems:      { select: { is_available: true, line_total: true } },
          },
        },
      },
    }),
    prisma.prescriptionRequest.count({ where: { customer_id: customerId } }),
  ]);

  return {
    requests: requests.map(formatRequestSummary),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET REQUEST DETAIL
// ─────────────────────────────────────────────────────────────────────────────

export async function getRequestDetail(requestId, customerId) {
  const request = await prisma.prescriptionRequest.findUnique({
    where:   { request_id: requestId },
    include: {
      files: {
        where:   { deleted_at: null },
        orderBy: { sequence: 'asc' },
        select: {
          file_id:       true,
          original_name: true,
          mime_type:     true,
          file_size:     true,
          sequence:      true,
        },
      },
      recipients: {
        orderBy: { sent_at: 'asc' },
        include: {
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

  if (!request || request.customer_id !== customerId) {
    throw new Error('Prescription request not found');
  }

  return {
    request_id:               request.request_id,
    request_number:           request.request_number,
    status:                   request.status,
    delivery_address:         request.delivery_address_snapshot,
    created_at:               request.created_at,
    expires_at:               request.expires_at,
    cancelled_at:             request.cancelled_at,
    completed_at:             request.completed_at,
    files:                    request.files,
    recipients: [...request.recipients]
      .sort((a, b) => {
        if (a.status === 'QUOTE_SENT' && b.status !== 'QUOTE_SENT') return -1;
        if (b.status === 'QUOTE_SENT' && a.status !== 'QUOTE_SENT') return  1;
        if (a.quote_sent_at && b.quote_sent_at) {
          return new Date(b.quote_sent_at) - new Date(a.quote_sent_at);
        }
        return 0;
      })
      .map(formatRecipientSummary),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRESCRIPTION FILE SIGNED URL (mobile customer)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRequestFileUrl(requestId, fileId, customerId) {
  const file = await prisma.prescriptionRequestFile.findUnique({
    where:   { file_id: fileId },
    include: { request: { select: { customer_id: true, request_id: true } } },
  });

  if (!file || file.request.request_id !== requestId) {
    throw new Error('File not found');
  }

  if (file.request.customer_id !== customerId) {
    throw new Error('File not found');
  }

  if (file.deleted_at !== null) {
    throw new Error('Prescription file has expired');
  }

  const url = await getSignedUrl({
    folder:    PRESCRIPTION_REQUEST_FOLDER,
    filename:  file.storage_key,
    expiresIn: 900,
  });

  return { url, expires_in: 900 };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPT QUOTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CHANGED: Now also fetches branch coordinates from BranchMarketplaceSettings
 * and returns them in the response as branch_latitude and branch_longitude.
 *
 * The mobile app uses these to populate CartItem.branchLatitude / branchLongitude
 * so that CartScreen can compute the delivery distance via useDeliveryETA.
 *
 * Without coordinates, distanceKm is null and useCheckout passes 0 to the
 * pricing engine, resulting in an incorrect bill calculation.
 */
export async function acceptQuote(requestId, recipientId, customerId) {
  const request = await prisma.prescriptionRequest.findUnique({
    where:   { request_id: requestId },
    include: {
      recipients: true,
      files: {
        where:   { deleted_at: null },
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!request || request.customer_id !== customerId) {
    throw new Error('Prescription request not found');
  }

  if (
    TERMINAL_REQUEST_STATUSES.has(request.status) &&
    request.status !== 'FULLY_RESPONDED' &&
    request.status !== 'PARTIALLY_RESPONDED'
  ) {
    throw new Error(`Cannot accept a quote on a request with status ${request.status}`);
  }

  const recipient = request.recipients.find((r) => r.recipient_id === recipientId);

  if (!recipient) {
    throw new Error('Quote not found');
  }

  if (recipient.status !== 'QUOTE_SENT') {
    throw new Error('This pharmacy has not sent a quote');
  }

  if (recipient.quote_expires_at && new Date() > new Date(recipient.quote_expires_at)) {
    throw new Error('This quote has expired. Please wait for the pharmacy to send a new quote.');
  }

  const now = new Date();

  const quoteItems = await prisma.prescriptionQuoteItem.findMany({
    where:   { recipient_id: recipientId, is_available: true },
    include: {
      listing: {
        select: {
          listing_id:        true,
          linked_variant_id: true,
        },
      },
    },
  });

  if (quoteItems.length === 0) {
    throw new Error('This quote has no available items');
  }

  // ── ADDED: Fetch branch coordinates ──────────────────────────────────────
  // BranchMarketplaceSettings stores the branch's geolocation set during
  // marketplace onboarding. We need these so the mobile app can compute
  // the delivery distance in CartScreen → useDeliveryETA.
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where:  { branch_id: recipient.branch_id },
    select: { latitude: true, longitude: true },
  });

  const branchLatitude  = branchSettings?.latitude  ? Number(branchSettings.latitude)  : null;
  const branchLongitude = branchSettings?.longitude ? Number(branchSettings.longitude) : null;
  // ─────────────────────────────────────────────────────────────────────────

  await prisma.$transaction(async (tx) => {
    await tx.prescriptionRequestRecipient.update({
      where: { recipient_id: recipientId },
      data:  { status: 'ACCEPTED', accepted_at: now },
    });

    const otherIds = request.recipients
      .filter((r) => r.recipient_id !== recipientId && !TERMINAL_RECIPIENT_STATUSES.has(r.status))
      .map((r) => r.recipient_id);

    if (otherIds.length > 0) {
      await tx.prescriptionRequestRecipient.updateMany({
        where: { recipient_id: { in: otherIds } },
        data:  { status: 'EXPIRED', expired_at: now },
      });
    }

    await tx.prescriptionRequest.update({
      where: { request_id: requestId },
      data:  { status: 'ACCEPTED', updated_at: now },
    });
  });

  const checkoutPrefill = {
    branch_id:           recipient.branch_id,
    delivery_address_id: request.delivery_address_id,
    items: quoteItems.map((item) => ({
      variantId: item.variant_id,
      quantity:  item.quantity,
    })),
    prescription_files: request.files.map((f) => ({
      prescription_key: f.storage_key,
      original_name:    f.original_name,
      mime_type:        f.mime_type,
      file_size:        f.file_size,
    })),
    prescription_request_id:  requestId,
    prescription_recipient_id: recipientId,
  };

  return {
    branch_id:        recipient.branch_id,
    branch_name:      recipient.branch_name_snapshot,
    shop_id:          recipient.shop_id,
    shop_name:        recipient.shop_name_snapshot,
    // ── ADDED: branch coordinates for CartScreen distance calculation ────
    branch_latitude:  branchLatitude,
    branch_longitude: branchLongitude,
    // ─────────────────────────────────────────────────────────────────────
    checkout_prefill: checkoutPrefill,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelRequest(requestId, customerId) {
  const request = await prisma.prescriptionRequest.findUnique({
    where:   { request_id: requestId },
    include: { recipients: true },
  });

  if (!request || request.customer_id !== customerId) {
    throw new Error('Prescription request not found');
  }

  if (['ACCEPTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'].includes(request.status)) {
    throw new Error(`Cannot cancel a request with status ${request.status}`);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const activeIds = request.recipients
      .filter((r) => !TERMINAL_RECIPIENT_STATUSES.has(r.status))
      .map((r) => r.recipient_id);

    if (activeIds.length > 0) {
      await tx.prescriptionRequestRecipient.updateMany({
        where: { recipient_id: { in: activeIds } },
        data:  { status: 'EXPIRED', expired_at: now },
      });
    }

    await tx.prescriptionRequest.update({
      where: { request_id: requestId },
      data:  { status: 'CANCELLED', cancelled_at: now, updated_at: now },
    });
  });

  return { request_id: requestId, status: 'CANCELLED' };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ERP REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getErpRequests(shopId, { status, page = 1, limit = 20 }) {
  const skip  = (page - 1) * limit;
  const where = {
    shop_id: shopId,
    ...(status ? { status } : {}),
  };

  const [recipients, total] = await Promise.all([
    prisma.prescriptionRequestRecipient.findMany({
      where,
      orderBy: { sent_at: 'desc' },
      skip,
      take:    limit,
      include: {
        request: {
          select: {
            request_id:     true,
            request_number: true,
            created_at:     true,
            expires_at:     true,
            files: {
              where:   { deleted_at: null },
              select:  { file_id: true },
            },
          },
        },
        quoteItems: {
          select: { quote_item_id: true, is_available: true, line_total: true },
        },
      },
    }),
    prisma.prescriptionRequestRecipient.count({ where }),
  ]);

  return {
    recipients: recipients.map((r) => ({
      recipient_id:     r.recipient_id,
      request_id:       r.request.request_id,
      request_number:   r.request.request_number,
      branch_name:      r.branch_name_snapshot,
      shop_name:        r.shop_name_snapshot,
      distance_km:      r.branch_distance_km ? Number(r.branch_distance_km) : null,
      status:           r.status,
      sent_at:          r.sent_at,
      quote_sent_at:    r.quote_sent_at,
      quote_expires_at: r.quote_expires_at,
      accepted_at:      r.accepted_at,
      declined_at:      r.declined_at,
      expired_at:       r.expired_at,
      file_count:       r.request.files.length,
      quote_item_count: r.quoteItems.length,
      quote_total:      r.quoteItems
                          .filter((i) => i.is_available)
                          .reduce((sum, i) => sum + Number(i.line_total), 0),
    })),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ERP REQUEST DETAIL
// ─────────────────────────────────────────────────────────────────────────────

export async function getErpRequestDetail(recipientId, shopId) {
  const recipient = await prisma.prescriptionRequestRecipient.findUnique({
    where:   { recipient_id: recipientId },
    include: {
      request: {
        include: {
          files: {
            where:   { deleted_at: null },
            orderBy: { sequence: 'asc' },
            select: {
              file_id:       true,
              original_name: true,
              mime_type:     true,
              file_size:     true,
              sequence:      true,
            },
          },
        },
      },
      quoteItems: {
        include: {
          variant: { select: { sku_id: true, images: true } },
        },
      },
    },
  });

  if (!recipient || recipient.shop_id !== shopId) {
    throw new Error('Prescription request not found');
  }

  return {
    recipient_id:       recipient.recipient_id,
    request_id:         recipient.request.request_id,
    request_number:     recipient.request.request_number,
    branch_id:          recipient.branch_id,
    shop_id:            recipient.shop_id,
    branch_name:        recipient.branch_name_snapshot,
    shop_name:          recipient.shop_name_snapshot,
    distance_km:        recipient.branch_distance_km ? Number(recipient.branch_distance_km) : null,
    status:             recipient.status,
    sent_at:            recipient.sent_at,
    quote_sent_at:      recipient.quote_sent_at,
    quote_expires_at:   recipient.quote_expires_at,
    accepted_at:        recipient.accepted_at,
    converted_at:       recipient.converted_at,
    declined_at:        recipient.declined_at,
    expired_at:         recipient.expired_at,
    decline_reason:     recipient.decline_reason,
    converted_order_id: recipient.converted_order_id,
    delivery_address:   recipient.request.delivery_address_snapshot,
    request_expires_at: recipient.request.expires_at,
    files:              recipient.request.files,
    quote_items:        recipient.quoteItems.map(formatQuoteItem),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRESCRIPTION FILE SIGNED URL (ERP pharmacy)
// ─────────────────────────────────────────────────────────────────────────────

export async function getErpRequestFileUrl(recipientId, fileId, shopId) {
  const file = await prisma.prescriptionRequestFile.findUnique({
    where:   { file_id: fileId },
    include: {
      request: {
        include: {
          recipients: {
            where:  { shop_id: shopId },
            select: { recipient_id: true },
          },
        },
      },
    },
  });

  if (!file || file.request.recipients.length === 0) {
    throw new Error('File not found');
  }

  if (file.deleted_at !== null) {
    throw new Error('Prescription file has expired');
  }

  const url = await getSignedUrl({
    folder:    PRESCRIPTION_REQUEST_FOLDER,
    filename:  file.storage_key,
    expiresIn: 900,
  });

  return { url, expires_in: 900 };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT QUOTE (ERP pharmacy)
// ─────────────────────────────────────────────────────────────────────────────

export async function submitQuote(recipientId, shopId, items) {
  const recipient = await prisma.prescriptionRequestRecipient.findUnique({
    where:   { recipient_id: recipientId },
    include: { request: { select: { request_id: true, customer_id: true, request_number: true } } },
  });

  if (!recipient || recipient.shop_id !== shopId) {
    throw new Error('Prescription request not found');
  }

  if (!['SENT', 'QUOTE_SENT'].includes(recipient.status)) {
    throw new Error(`Cannot submit a quote for a request with status ${recipient.status}`);
  }

  const listingIds = items.map((i) => i.listing_id);

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      listing_id: { in: listingIds },
      branch_id:  recipient.branch_id,
      is_visible: true,
    },
    include: {
      medicine:      { select: { medicine_id: true } },
      linkedVariant: {
        select: {
          variant_id:    true,
          sku_id:        true,
          name:          true,
          brand:         true,
          pack_size:     true,
          mrp:           true,
          images:        true,
        },
      },
    },
  });

  const listingMap = new Map(listings.map((l) => [l.listing_id, l]));

  for (const item of items) {
    if (!listingMap.has(item.listing_id)) {
      throw new Error(`Listing ${item.listing_id} is not available at this branch`);
    }
  }

  const now            = new Date();
  const quoteExpiresAt = computeQuoteExpiry(now);

  await prisma.$transaction(async (tx) => {
    await tx.prescriptionQuoteItem.deleteMany({
      where: { recipient_id: recipientId },
    });

    const quoteItemData = items.map((item) => {
      const listing   = listingMap.get(item.listing_id);
      const variant   = listing.linkedVariant;
      const unitPrice = listing.marketplace_price ? Number(listing.marketplace_price) : 0;
      const mrp       = variant.mrp ? Number(variant.mrp) : unitPrice;
      const lineTotal = unitPrice * (item.is_available ? item.quantity : 0);

      return {
        recipient_id:                   recipientId,
        listing_id:                     item.listing_id,
        medicine_id:                    listing.medicine_id,
        variant_id:                     variant.variant_id,
        medicine_name_snapshot:         variant.name,
        variant_sku_snapshot:           variant.sku_id,
        brand_snapshot:                 variant.brand    ?? null,
        pack_size_snapshot:             variant.pack_size ?? null,
        unit_price_snapshot:            unitPrice,
        mrp_snapshot:                   mrp,
        requires_prescription_snapshot: listing.requires_prescription,
        quantity:                       item.quantity,
        line_total:                     lineTotal,
        is_available:                   item.is_available,
        is_substitute:                  item.is_substitute,
        substitute_note:                item.substitute_note ?? null,
      };
    });

    await tx.prescriptionQuoteItem.createMany({ data: quoteItemData });

    await tx.prescriptionRequestRecipient.update({
      where: { recipient_id: recipientId },
      data: {
        status:           'QUOTE_SENT',
        quote_sent_at:    now,
        quote_expires_at: quoteExpiresAt,
      },
    });

    const allRecipients = await tx.prescriptionRequestRecipient.findMany({
      where:  { request_id: recipient.request.request_id },
      select: { status: true },
    });

    const newRequestStatus = deriveRequestStatus(allRecipients);

    await tx.prescriptionRequest.update({
      where: { request_id: recipient.request.request_id },
      data:  { status: newRequestStatus, updated_at: now },
    });
  });

  firePrescriptionQuoteReceivedEvents(
    {
      customer_id:    recipient.request.customer_id,
      request_id:     recipient.request.request_id,
      request_number: recipient.request.request_number,
    },
    {
      shop_name_snapshot: recipient.shop_name_snapshot,
      recipient_id:       recipientId,
    },
  ).catch((err) =>
    console.error('[PRxService] Quote received event failed:', err.message),
  );

  return {
    recipient_id:     recipientId,
    status:           'QUOTE_SENT',
    quote_expires_at: quoteExpiresAt,
    item_count:       items.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DECLINE REQUEST (ERP pharmacy)
// ─────────────────────────────────────────────────────────────────────────────

export async function declineRequest(recipientId, shopId, reason) {
  const recipient = await prisma.prescriptionRequestRecipient.findUnique({
    where:   { recipient_id: recipientId },
    include: { request: { select: { request_id: true } } },
  });

  if (!recipient || recipient.shop_id !== shopId) {
    throw new Error('Prescription request not found');
  }

  if (!['SENT', 'QUOTE_SENT'].includes(recipient.status)) {
    throw new Error(`Cannot decline a request with status ${recipient.status}`);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.prescriptionRequestRecipient.update({
      where: { recipient_id: recipientId },
      data: {
        status:         'DECLINED',
        declined_at:    now,
        decline_reason: reason ?? null,
      },
    });

    const allRecipients = await tx.prescriptionRequestRecipient.findMany({
      where:  { request_id: recipient.request.request_id },
      select: { status: true },
    });

    const newRequestStatus = deriveRequestStatus(allRecipients);

    await tx.prescriptionRequest.update({
      where: { request_id: recipient.request.request_id },
      data:  { status: newRequestStatus, updated_at: now },
    });
  });

  return { recipient_id: recipientId, status: 'DECLINED' };
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK CONVERTED
// ─────────────────────────────────────────────────────────────────────────────

export async function markConverted(requestId, recipientId, orderId) {
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.prescriptionRequestRecipient.update({
        where: { recipient_id: recipientId },
        data: {
          status:             'CONVERTED',
          converted_at:       now,
          converted_order_id: orderId,
        },
      });

      await tx.prescriptionRequest.update({
        where: { request_id: requestId },
        data: {
          status:       'COMPLETED',
          completed_at: now,
          updated_at:   now,
        },
      });
    });

    console.log(
      `[PRxService] Request ${requestId} marked COMPLETED ` +
      `(recipient ${recipientId} → order ${orderId})`,
    );
  } catch (err) {
    console.error(
      `[PRxService] markConverted failed for request ${requestId}:`,
      err.message,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRE STALE QUOTES
// ─────────────────────────────────────────────────────────────────────────────

export async function expireStaleQuotes() {
  const now = new Date();

  const staleRecipients = await prisma.prescriptionRequestRecipient.findMany({
    where: {
      status:           'QUOTE_SENT',
      quote_expires_at: { lt: now },
    },
    select: {
      recipient_id: true,
      request_id:   true,
    },
  });

  if (staleRecipients.length === 0) return { expired: 0 };

  console.log(`[PRxCron] Expiring ${staleRecipients.length} stale quote(s)`);

  for (const recipient of staleRecipients) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.prescriptionRequestRecipient.update({
          where: { recipient_id: recipient.recipient_id },
          data:  { status: 'EXPIRED', expired_at: now },
        });

        const allRecipients = await tx.prescriptionRequestRecipient.findMany({
          where:  { request_id: recipient.request_id },
          select: { status: true },
        });

        const newStatus = deriveRequestStatus(allRecipients);

        await tx.prescriptionRequest.update({
          where: { request_id: recipient.request_id },
          data:  { status: newStatus, updated_at: now },
        });
      });
    } catch (err) {
      console.error(
        `[PRxCron] Failed to expire recipient ${recipient.recipient_id}:`,
        err.message,
      );
    }
  }

  return { expired: staleRecipients.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRE STALE REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function expireStaleRequests() {
  const now = new Date();

  const staleRequests = await prisma.prescriptionRequest.findMany({
    where: {
      status:     { in: ['PENDING', 'PARTIALLY_RESPONDED', 'FULLY_RESPONDED'] },
      expires_at: { lt: now },
    },
    select: {
      request_id: true,
      recipients: {
        where:  { status: { notIn: ['ACCEPTED', 'CONVERTED', 'DECLINED', 'EXPIRED'] } },
        select: { recipient_id: true },
      },
    },
  });

  if (staleRequests.length === 0) return { expired: 0 };

  console.log(`[PRxCron] Expiring ${staleRequests.length} stale request(s)`);

  for (const request of staleRequests) {
    try {
      await prisma.$transaction(async (tx) => {
        if (request.recipients.length > 0) {
          await tx.prescriptionRequestRecipient.updateMany({
            where: {
              recipient_id: { in: request.recipients.map((r) => r.recipient_id) },
            },
            data: { status: 'EXPIRED', expired_at: now },
          });
        }

        await tx.prescriptionRequest.update({
          where: { request_id: request.request_id },
          data:  { status: 'EXPIRED', updated_at: now },
        });
      });
    } catch (err) {
      console.error(
        `[PRxCron] Failed to expire request ${request.request_id}:`,
        err.message,
      );
    }
  }

  return { expired: staleRequests.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP PRESCRIPTION FILES
// ─────────────────────────────────────────────────────────────────────────────

export async function cleanupExpiredRequestFiles() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const files = await prisma.prescriptionRequestFile.findMany({
    where: {
      deleted_at:  null,
      uploaded_at: { lt: cutoff },
    },
    select: {
      file_id:     true,
      storage_key: true,
    },
    take: 200,
  });

  if (files.length === 0) return { deleted: 0, failed: 0 };

  console.log(`[PRxCron] Cleaning up ${files.length} expired prescription file(s)`);

  let deleted = 0;
  let failed  = 0;

  for (const file of files) {
    try {
      await deleteFile({
        folder:   PRESCRIPTION_REQUEST_FOLDER,
        filename: file.storage_key,
      });

      await prisma.prescriptionRequestFile.update({
        where: { file_id: file.file_id },
        data:  { deleted_at: new Date() },
      });

      deleted++;
    } catch (err) {
      console.error(
        `[PRxCron] Failed to delete file ${file.file_id}:`,
        err.message,
      );
      failed++;
    }
  }

  return { deleted, failed };
}