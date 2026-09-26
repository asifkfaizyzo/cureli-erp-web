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