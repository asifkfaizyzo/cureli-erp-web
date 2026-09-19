// backend/src/modules/marketplace-orders/marketplace.orders.controller.js
// Full file — updated to use unified transitionOrderStatus

import {
  getErpOrders,
  getErpOrderDetail,
  transitionOrderStatus,
  getPrescriptionSignedUrl,
  getMarketplaceBillingData,
  regenerateInvoicePdf,
} from './marketplace.orders.service.js';
import {
  rejectOrderSchema,
  listOrdersSchema,
} from './marketplace.orders.schema.js';
import { success, fail } from '../../utils/response.js';

export async function listOrders(req, res) {
  try {
    const parsed = listOrdersSchema.safeParse(req.query);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await getErpOrders(req.user.shop_id, parsed.data);
    return success(res, result, 'Orders fetched');
  } catch (err) {
    console.error('[ERP Orders] listOrders error:', err.message);
    return fail(res, 'Failed to fetch orders', 500);
  }
}

export async function getOrderDetail(req, res) {
  try {
    const order = await getErpOrderDetail(req.params.orderId, req.user.shop_id);
    return success(res, order, 'Order fetched');
  } catch (err) {
    console.error('[ERP Orders] getOrderDetail error:', err.message);
    if (err.message === 'Order not found') return fail(res, 'Order not found', 404);
    return fail(res, 'Failed to fetch order', 500);
  }
}

export async function acceptOrder(req, res) {
  try {
    const result = await transitionOrderStatus({
      order_id:      req.params.orderId,
      target_status: 'ACCEPTED',
      actor_type:    'pharmacy',
      actor_id:      req.user.user_id,
      shop_id:       req.user.shop_id,
    });
    return success(res, result, 'Order accepted');
  } catch (err) {
    console.error('[ERP Orders] acceptOrder error:', err.message);
    if (err.message === 'Order not found')            return fail(res, 'Order not found', 404);
    if (err.message.startsWith('Cannot transition')) return fail(res, err.message, 409);
    return fail(res, 'Failed to accept order', 500);
  }
}

export async function rejectOrder(req, res) {
  try {
    const parsed = rejectOrderSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await transitionOrderStatus({
      order_id:      req.params.orderId,
      target_status: 'REJECTED',
      actor_type:    'pharmacy',
      actor_id:      req.user.user_id,
      shop_id:       req.user.shop_id,
      reason:        parsed.data.rejection_reason,
      reason_other:  parsed.data.rejection_reason_other ?? null,
    });
    return success(res, result, 'Order rejected');
  } catch (err) {
    console.error('[ERP Orders] rejectOrder error:', err.message);
    if (err.message === 'Order not found')            return fail(res, 'Order not found', 404);
    if (err.message.startsWith('Cannot transition')) return fail(res, err.message, 409);
    return fail(res, 'Failed to reject order', 500);
  }
}

export async function markReady(req, res) {
  try {
    const result = await transitionOrderStatus({
      order_id:      req.params.orderId,
      target_status: 'READY_FOR_PICKUP',
      actor_type:    'pharmacy',
      actor_id:      req.user.user_id,
      shop_id:       req.user.shop_id,
    });
    return success(res, result, 'Order marked as ready for pickup');
  } catch (err) {
    console.error('[ERP Orders] markReady error:', err.message);
    if (err.message === 'Order not found')            return fail(res, 'Order not found', 404);
    if (err.message.startsWith('Cannot transition')) return fail(res, err.message, 409);
    return fail(res, 'Failed to update order', 500);
  }
}

export async function completeOrder(req, res) {
  try {
    const result = await transitionOrderStatus({
      order_id:      req.params.orderId,
      target_status: 'COMPLETED',
      actor_type:    'pharmacy',
      actor_id:      req.user.user_id,
      shop_id:       req.user.shop_id,
    });
    return success(res, result, 'Order completed');
  } catch (err) {
    console.error('[ERP Orders] completeOrder error:', err.message);
    if (err.message === 'Order not found')            return fail(res, 'Order not found', 404);
    if (err.message.startsWith('Cannot transition')) return fail(res, err.message, 409);
    return fail(res, 'Failed to complete order', 500);
  }
}

export async function getPrescriptionUrl(req, res) {
  try {
    const result = await getPrescriptionSignedUrl(
      req.params.prescriptionId,
      'pharmacy',
      req.user.shop_id,
    );
    return success(res, result, 'Signed URL generated');
  } catch (err) {
    console.error('[ERP Orders] getPrescriptionUrl error:', err.message);
    if (err.message === 'Prescription not found') return fail(res, 'Prescription not found', 404);
    if (err.message === 'Prescription expired')   return fail(res, 'Prescription has expired', 410);
    return fail(res, 'Failed to generate URL', 500);
  }
}

export async function getBillingData(req, res) {
  try {
    const data = await getMarketplaceBillingData(
      req.params.orderId,
      req.user.shop_id,
    );
    return success(res, data, 'Billing data fetched');
  } catch (err) {
    console.error('[ERP Orders] getBillingData error:', err.message);
    if (err.message.includes('not found')) return fail(res, err.message, 404);
    return fail(res, 'Failed to fetch billing data', 500);
  }
}

export async function regenerateInvoice(req, res) {
  try {
    const result = await regenerateInvoicePdf(
      req.params.orderId,
      req.user.shop_id,
    );
    const message = result.already_exists
      ? 'Invoice already exists'
      : 'Invoice regenerated successfully';
    return success(res, result, message);
  } catch (err) {
    console.error('[ERP Orders] regenerateInvoice error:', err.message);
    if (err.message.includes('not found')) return fail(res, err.message, 404);
    if (err.message.includes('not been billed')) return fail(res, err.message, 400);
    return fail(res, 'Failed to regenerate invoice', 500);
  }
}