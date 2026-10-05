// backend/src/modules/prescription-requests/prescription.requests.events.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.events.js

import prisma          from '../../config/prisma.js';
import { sseService }  from '../../services/sse.service.js';
import { MobilePush }  from '../mobile/push/mobile.push.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user_ids of all active ERP users belonging to a shop.
 * Used to fan out SSE events to every logged-in staff member.
 */
async function getActiveShopUserIds(shop_id) {
  const users = await prisma.user.findMany({
    where:  { shop_id, is_active: true },
    select: { user_id: true },
  });
  return users.map((u) => u.user_id);
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT: NEW PRESCRIPTION REQUEST RECEIVED (pharmacy side)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire SSE to all active ERP users of the pharmacy when a new
 * prescription request arrives at their branch.
 *
 * Called once per recipient (per pharmacy branch) when the customer
 * submits their prescription request.
 *
 * @param {Object} recipient  - PrescriptionRequestRecipient row
 * @param {Object} request    - Parent PrescriptionRequest row
 */
export async function firePrescriptionRequestNewEvents(recipient, request) {
  const { shop_id, recipient_id, branch_name_snapshot, shop_name_snapshot } = recipient;
  const { request_id, request_number, customer_id }                          = request;

  // ── SSE to ERP users of this pharmacy ────────────────────────────────────
  try {
    const userIds = await getActiveShopUserIds(shop_id);

    const ssePayload = {
      recipient_id,
      request_id,
      request_number,
      branch_name: branch_name_snapshot,
      shop_name:   shop_name_snapshot,
    };

    for (const userId of userIds) {
      sseService.notifyUser(userId, 'prescription_request_new', ssePayload);
    }

    console.log(
      `[PRxEvents] Fired prescription_request_new SSE to ${userIds.length} ` +
      `users for shop ${shop_id} (request ${request_number})`,
    );
  } catch (err) {
    // SSE failure must never break the request submission flow
    console.error('[PRxEvents] SSE dispatch failed (new request):', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT: QUOTE RECEIVED (customer side)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire push notification + SSE to the mobile customer when a pharmacy
 * sends them a quote.
 *
 * Both are fire-and-forget — neither must block the quote submission response.
 *
 * @param {Object} request    - PrescriptionRequest row
 * @param {Object} recipient  - PrescriptionRequestRecipient row (the one that sent the quote)
 */
export async function firePrescriptionQuoteReceivedEvents(request, recipient) {
  const { customer_id, request_id, request_number } = request;
  const { shop_name_snapshot, recipient_id }        = recipient;

  // ── Push to mobile customer ───────────────────────────────────────────────
  MobilePush.prescriptionQuoteReceived(
    customer_id,
    request_id,
    request_number,
    shop_name_snapshot,
  ).catch((err) =>
    console.error('[PRxEvents] Push (quote received) failed:', err.message),
  );

  // ── SSE to mobile customer ────────────────────────────────────────────────
  // Allows the open request detail screen to update in real time
  // without polling.
  try {
    sseService.notifyMobile(customer_id, 'prescription_quote_received', {
      request_id,
      request_number,
      recipient_id,
      pharmacy_name: shop_name_snapshot,
    });

    console.log(
      `[PRxEvents] Fired prescription_quote_received SSE to customer ${customer_id} ` +
      `(request ${request_number}, pharmacy ${shop_name_snapshot})`,
    );
  } catch (err) {
    console.error('[PRxEvents] Mobile SSE dispatch failed (quote received):', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT: CADMIN ALERT — NEW PRESCRIPTION REQUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broadcast to all connected CAdmins when a customer submits a new
 * prescription request to one or more pharmacies.
 *
 * Fire-and-forget — must never block the request submission response.
 *
 * @param {Object} request    - PrescriptionRequest row (from prisma create)
 * @param {Array}  recipients - PrescriptionRequestRecipient rows
 */
export async function fireCAdminPrescriptionRequestNew(request, recipients) {
  const { request_id, request_number, customer_id, created_at } = request;

  try {
    const customer = await prisma.cureliMobileUser.findUnique({
      where:  { id: customer_id },
      select: { full_name: true, phone: true },
    });

    const fileCount = await prisma.prescriptionRequestFile.count({
      where: { request_id, deleted_at: null },
    });

    const ssePayload = {
      request_id,
      request_number,
      customer_name:  customer?.full_name || null,
      customer_phone: customer?.phone || null,
      recipient_count: recipients.length,
      file_count:      fileCount,
      created_at,
    };

    sseService.notifyAllCAdmins('prescription_request_new', ssePayload);

    console.log(
      `[PRxEvents] Broadcasted prescription_request_new to all CAdmins ` +
      `(request ${request_number}, ${recipients.length} pharmacies)`,
    );
  } catch (err) {
    console.error(
      '[PRxEvents] CAdmin SSE broadcast failed (new prescription request):',
      err.message,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT: CADMIN ALERT — PRESCRIPTION REQUEST RESPONDED (QUOTED / DECLINED)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broadcast to all connected CAdmins when a pharmacy responds to a
 * prescription request — either by sending a quote or declining.
 *
 * Fire-and-forget — must never block the quote/decline response.
 *
 * @param {Object} recipient     - PrescriptionRequestRecipient row (with shop/branch snapshots)
 * @param {Object} request       - PrescriptionRequest row (or partial: request_id, request_number)
 * @param {string} action        - 'QUOTED' | 'DECLINED'
 * @param {string} declineReason - Reason text (only when action === 'DECLINED')
 */
export async function fireCAdminPrescriptionRequestResponded(
  recipient,
  request,
  action,
  declineReason = null,
) {
  const { request_id, request_number } = request;
  const { recipient_id, shop_name_snapshot, branch_name_snapshot } = recipient;

  try {
    const ssePayload = {
      request_id,
      request_number,
      recipient_id,
      shop_name:      shop_name_snapshot,
      branch_name:    branch_name_snapshot,
      action,
      decline_reason: declineReason,
    };

    sseService.notifyAllCAdmins('prescription_request_responded', ssePayload);

    console.log(
      `[PRxEvents] Broadcasted prescription_request_responded (${action}) to all CAdmins ` +
      `(request ${request_number}, pharmacy ${shop_name_snapshot})`,
    );
  } catch (err) {
    console.error(
      '[PRxEvents] CAdmin SSE broadcast failed (prescription responded):',
      err.message,
    );
  }
}