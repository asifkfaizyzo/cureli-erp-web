// backend/src/modules/mobile/orders/mobile.orders.controller.js (do not remove this comment)
// backend/src/modules/mobile/orders/mobile.orders.controller.js

import {
  placeOrder,
  getMobileOrders,
  getMobileOrderDetail,
  cancelOrder,
  getPrescriptionSignedUrl,
  getReorderItems,
} from '../../marketplace-orders/marketplace.orders.service.js';
import { getInvoiceDownloadUrl } from '../invoice/invoice.service.js';
import { placeOrderSchema, listMobileOrdersSchema } from './mobile.orders.schema.js';
import { success, fail } from '../../../utils/response.js';

export async function placeOrderHandler(req, res) {
  try {
    const parsed = placeOrderSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await placeOrder({
      customer_id:         req.mobileUser.id,
      branch_id:           parsed.data.branch_id,
      items:               parsed.data.items,
      delivery_address_id: parsed.data.delivery_address_id,
      notes:               parsed.data.notes ?? null,
      prescription_files:  parsed.data.prescription_files ?? [],
    });

    return success(res, result, 'Order placed successfully', 201);
  } catch (err) {
    console.error('[Mobile Orders] placeOrder error:', err.message);

    const userFacingErrors = [
      'Customer account is not active',
      'Delivery address not found',
      'Branch is not available',
      'This branch is not accepting marketplace orders',
      'One or more items are no longer available',
      'One or more items are no longer listed',
      'One or more items are out of stock',
      'One or more items have no price set',
      'This order requires a prescription. Please upload at least one prescription file.',
      'Order must contain at least one item',
    ];

    if (userFacingErrors.includes(err.message)) return fail(res, err.message, 400);
    return fail(res, 'Failed to place order', 500);
  }
}

export async function listOrdersHandler(req, res) {
  try {
    const parsed = listMobileOrdersSchema.safeParse(req.query);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await getMobileOrders(req.mobileUser.id, parsed.data);
    return success(res, result, 'Orders fetched');
  } catch (err) {
    console.error('[Mobile Orders] listOrders error:', err.message);
    return fail(res, 'Failed to fetch orders', 500);
  }
}

export async function getOrderDetailHandler(req, res) {
  try {
    const order = await getMobileOrderDetail(req.params.orderId, req.mobileUser.id);
    return success(res, order, 'Order fetched');
  } catch (err) {
    console.error('[Mobile Orders] getOrderDetail error:', err.message);
    if (err.message === 'Order not found') return fail(res, 'Order not found', 404);
    return fail(res, 'Failed to fetch order', 500);
  }
}

export async function cancelOrderHandler(req, res) {
  try {
    const result = await cancelOrder(req.params.orderId, req.mobileUser.id);
    return success(res, result, 'Order cancelled');
  } catch (err) {
    console.error('[Mobile Orders] cancelOrder error:', err.message);
    if (err.message === 'Order not found')            return fail(res, 'Order not found', 404);
    if (err.message.startsWith('Cannot transition')) return fail(res, 'This order can no longer be cancelled', 409);
    return fail(res, 'Failed to cancel order', 500);
  }
}

export async function getPrescriptionUrlHandler(req, res) {
  try {
    const result = await getPrescriptionSignedUrl(
      req.params.prescriptionId,
      'customer',
      req.mobileUser.id,
    );
    return success(res, result, 'Signed URL generated');
  } catch (err) {
    console.error('[Mobile Orders] getPrescriptionUrl error:', err.message);
    if (err.message === 'Prescription not found') return fail(res, 'Prescription not found', 404);
    if (err.message === 'Prescription expired')   return fail(res, 'Prescription has expired', 410);
    return fail(res, 'Failed to generate URL', 500);
  }
}

export async function getReorderItemsHandler(req, res) {
  try {
    const result = await getReorderItems(req.params.orderId, req.mobileUser.id);
    return success(res, result, 'Reorder items fetched');
  } catch (err) {
    console.error('[Mobile Orders] getReorderItems error:', err.message);
    if (err.message === 'Order not found') return fail(res, 'Order not found', 404);
    return fail(res, 'Failed to fetch reorder items', 500);
  }
}

export async function getInvoiceDownloadHandler(req, res) {
  try {
    const data = await getInvoiceDownloadUrl(
      req.params.orderId,
      'customer',
      req.mobileUser.id,
    );
    return success(res, data, 'Invoice URL generated');
  } catch (err) {
    console.error('[Mobile Orders] getInvoiceDownload error:', err.message);
    if (err.message.includes('not found'))  return fail(res, err.message, 404);
    if (err.message.includes('not yet'))    return fail(res, err.message, 404);
    return fail(res, 'Failed to get invoice URL', 400);
  }
}