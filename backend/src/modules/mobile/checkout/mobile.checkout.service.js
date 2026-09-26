// backend/src/modules/mobile/checkout/mobile.checkout.service.js (do not remove this comment)
import prisma from "../../../config/prisma.js";
import {
  razorpayMobile,
  RAZORPAY_MOBILE_CURRENCY,
  verifyMobilePaymentSignature,
} from "../../../config/razorpay.js";
import { computePricing, normaliseConfig } from "./pricing.engine.js";
import { fireOrderPlacedEvents } from "../../marketplace-orders/marketplace.orders.events.js";
import { generateDistinctOtps } from "../../marketplace-orders/marketplace.orders.service.js";
import { markConverted } from "../../prescription-requests/prescription.requests.service.js";
import {
  validateCouponForCustomer,
  recordCouponUsage,
} from "../../coupons/coupon.service.js";
import { redeemPoints } from "../../loyalty/loyalty.service.js";
import { getLoyaltyConfig } from "../../loyalty/loyalty.config.service.js";
import { validateRedemption } from "../../loyalty/loyalty.engine.js";

const SESSION_TTL_MINS = 15;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD CONFIG (cached in memory, invalidated by version change)
// ─────────────────────────────────────────────────────────────────────────────

let _configCache = null;
let _configVersion = null;

async function getConfig() {
  const row = await prisma.deliveryPricingConfig.findFirst();
  if (!row) throw new Error("Pricing config not initialised");

  const version = row.version;
  if (_configVersion !== version || !_configCache) {
    _configCache = normaliseConfig(row);
    _configVersion = version;
  }

  return _configCache;
}

/**
 * Fetch the actual payment method from Razorpay (card, upi, netbanking, wallet).
 * Returns a friendly string like "RAZORPAY_UPI" or "RAZORPAY_CARD".
 * Falls back to "RAZORPAY" if the API call fails.
 */
async function resolveRazorpayMethod(razorpay_payment_id) {
  if (!razorpay_payment_id) return "RAZORPAY";
  try {
    const payment = await razorpayMobile.payments.fetch(razorpay_payment_id);
    const method = payment?.method?.toUpperCase(); // "card" | "upi" | "netbanking" | "wallet" | "emi"
    if (method) return `RAZORPAY_${method}`;
    return "RAZORPAY";
  } catch (err) {
    console.error(
      "[Checkout] Failed to fetch Razorpay payment method:",
      err.message,
    );
    return "RAZORPAY";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE — no side effects, returns full pricing breakdown with discounts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {{variantId: string, quantity: number}[]} params.items
 * @param {number} params.distance_km
 * @param {number} [params.tip]
 * @param {string} params.branch_id
 * @param {string|null} [params.coupon_code]
 * @param {number} [params.loyalty_points_to_redeem]
 * @param {string|null} [params.customer_id]
 */
export async function getQuote({
  items,
  distance_km,
  tip = 0,
  branch_id,
  coupon_code = null,
  loyalty_points_to_redeem = 0,
  customer_id = null,
}) {
  const subtotal = await resolveSubtotal(items, branch_id);
  const config = await getConfig();

  const basePricing = computePricing({ subtotal, distance_km, tip, config });

  if (!basePricing.delivery_available) {
    return {
      ...basePricing,
      coupon_code: null,
      coupon_discount: 0,
      coupon_reason: null,
      loyalty_points_redeemed: 0,
      loyalty_discount: 0,
      loyalty_reason: null,
    };
  }

  // ── 1. Coupon Discount Calculation ─────────────────────────
  let coupon_discount = 0;
  let applied_coupon_code = null;
  let coupon_reason = null;

  if (coupon_code && customer_id) {
    const couponResult = await validateCouponForCustomer({
      code: coupon_code,
      customer_id,
      subtotal,
    });

    if (couponResult.valid) {
      coupon_discount = couponResult.discount;
      applied_coupon_code = couponResult.coupon.code;
    } else {
      coupon_reason = couponResult.reason;
    }
  }

  const effective_subtotal = Math.max(0, subtotal - coupon_discount);

  // ── 2. Loyalty Points Discount Calculation ─────────────────
  let loyalty_discount = 0;
  let points_redeemed = 0;
  let loyalty_reason = null;

  if (loyalty_points_to_redeem > 0 && customer_id) {
    const loyaltyConfig = await getLoyaltyConfig();
    const user = await prisma.cureliMobileUser.findUnique({
      where: { id: customer_id },
      select: { loyalty_points_balance: true },
    });
    const balance = user?.loyalty_points_balance ?? 0;

    const loyaltyResult = validateRedemption({
      config: loyaltyConfig,
      userBalance: balance,
      pointsRequested: loyalty_points_to_redeem,
      effectiveSubtotal: effective_subtotal,
    });

    if (loyaltyResult.valid) {
      loyalty_discount = loyaltyResult.discount;
      points_redeemed = loyaltyResult.allowedPoints;
    } else {
      loyalty_reason = loyaltyResult.reason;
    }
  }

  // Combined discounts cannot reduce payable total below ₹1.00 (Razorpay minimum)
  const combinedDiscounts = coupon_discount + loyalty_discount;
  const rawGrandTotal = basePricing.grand_total - combinedDiscounts;
  const grand_total = parseFloat(Math.max(1, rawGrandTotal).toFixed(2));

  return {
    ...basePricing,
    coupon_code: applied_coupon_code,
    coupon_discount,
    coupon_reason,
    loyalty_points_redeemed: points_redeemed,
    loyalty_discount,
    loyalty_reason,
    grand_total,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SESSION — validates cart, discounts, creates Razorpay order, persists session
// ─────────────────────────────────────────────────────────────────────────────

export async function createCheckoutSession({
  customer_id,
  branch_id,
  items: cartItems,
  delivery_address_id,
  distance_km,
  tip = 0,
  prescription_files = [],
  patient,
  prescription_request_id = null,
  prescription_recipient_id = null,
  coupon_code = null,
  loyalty_points_to_redeem = 0,
}) {
  const config = await getConfig();

  // ── 1. Validate customer ─────────────────────────────────
  const customer = await prisma.cureliMobileUser.findUnique({
    where: { id: customer_id },
    select: {
      id: true,
      status: true,
      full_name: true,
      phone: true,
      loyalty_points_balance: true,
    },
  });
  if (!customer || customer.status !== "active")
    throw new Error("Customer account is not active");

  // ── 2. Validate address ──────────────────────────────────
  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: delivery_address_id, user_id: customer_id, deleted_at: null },
  });
  if (!address) throw new Error("Delivery address not found");

  // ── 3. Validate branch ───────────────────────────────────
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id },
    select: {
      marketplace_enabled: true,
      branch: { select: { shop_id: true, branch_name: true, is_active: true } },
    },
  });
  if (!branchSettings || !branchSettings.branch.is_active)
    throw new Error("Branch is not available");
  if (!branchSettings.marketplace_enabled)
    throw new Error("This branch is not accepting marketplace orders");

  const shop_id = branchSettings.branch.shop_id;

  // ── 4. Validate and snapshot items ───────────────────────
  const { resolvedItems, subtotal, requiresPrescription } =
    await validateAndSnapshotItems(cartItems, branch_id);

  // ── 5. Prescription gate ─────────────────────────────────
  if (requiresPrescription && prescription_files.length === 0) {
    throw new Error(
      "This order requires a prescription. Please upload at least one prescription file.",
    );
  }

  // ── 6. Base pricing calculation ──────────────────────────
  const pricing = computePricing({ subtotal, distance_km, tip, config });

  if (!pricing.delivery_available) {
    throw new Error(pricing.unavailable_reason);
  }

  // ── 7. Validate & Calculate Coupon Discount ──────────────
  let coupon_discount_amount = 0;
  let applied_coupon_code = null;
  let applied_coupon_id = null;

  if (coupon_code) {
    const couponValidation = await validateCouponForCustomer({
      code: coupon_code,
      customer_id,
      subtotal,
    });

    if (!couponValidation.valid) {
      throw new Error(couponValidation.reason || "Invalid coupon code");
    }

    coupon_discount_amount = couponValidation.discount;
    applied_coupon_code = couponValidation.coupon.code;
    applied_coupon_id = couponValidation.coupon.coupon_id;
  }

  const effective_subtotal = Math.max(0, subtotal - coupon_discount_amount);

  // ── 8. Validate & Calculate Loyalty Points ───────────────
  let loyalty_discount_amount = 0;
  let points_to_redeem = 0;

  if (loyalty_points_to_redeem > 0) {
    const loyaltyConfig = await getLoyaltyConfig();

    const redemptionValidation = validateRedemption({
      config: loyaltyConfig,
      userBalance: customer.loyalty_points_balance,
      pointsRequested: loyalty_points_to_redeem,
      effectiveSubtotal: effective_subtotal,
    });

    if (!redemptionValidation.valid) {
      throw new Error(
        redemptionValidation.reason || "Invalid loyalty point redemption",
      );
    }

    points_to_redeem = redemptionValidation.allowedPoints;
    loyalty_discount_amount = redemptionValidation.discount;
  }

  // Final grand total after all discounts (min payable ₹1.00)
  const totalDiscount = coupon_discount_amount + loyalty_discount_amount;
  const grand_total = parseFloat(
    Math.max(1, pricing.grand_total - totalDiscount).toFixed(2),
  );

  // ── 9. Snapshot address ──────────────────────────────────
  const address_snapshot = {
    label: address.label,
    address_line_1: address.address_line_1,
    address_line_2: address.address_line_2 ?? null,
    landmark: address.landmark ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    latitude: address.latitude ? Number(address.latitude) : null,
    longitude: address.longitude ? Number(address.longitude) : null,
    recipient_name: address.recipient_name ?? null,
    recipient_phone: address.recipient_phone ?? null,
  };

  // ── 10. Create Razorpay order ────────────────────────────
  const amount_paise = Math.round(grand_total * 100);

  const rzpOrder = await razorpayMobile.orders.create({
    amount: amount_paise,
    currency: RAZORPAY_MOBILE_CURRENCY,
    notes: {
      customer_id,
      branch_id,
      shop_id,
      coupon_code: applied_coupon_code ?? "",
      loyalty_points: String(points_to_redeem),
    },
  });

  // ── 11. Persist CheckoutSession ──────────────────────────
  const expires_at = new Date(Date.now() + SESSION_TTL_MINS * 60 * 1000);

  const session = await prisma.checkoutSession.create({
    data: {
      customer_id,
      branch_id,
      razorpay_order_id: rzpOrder.id,
      cart_snapshot: resolvedItems,
      delivery_address_id,
      delivery_address_snapshot: address_snapshot,
      subtotal: pricing.subtotal,
      service_charge: pricing.service_charge,
      delivery_fee: pricing.delivery_fee,
      km_surcharge: pricing.km_surcharge,
      tip: pricing.tip,
      coupon_code: applied_coupon_code,
      coupon_discount_amount,
      loyalty_points_redeemed: points_to_redeem,
      loyalty_discount_amount,
      grand_total,
      distance_km,
      prescription_files,
      patient_is_self: patient.is_self,
      patient_name_snapshot: patient.name,
      patient_age_snapshot: patient.age,
      patient_sex_snapshot: patient.sex,
      prescription_request_id,
      prescription_recipient_id,

      status: "created",
      expires_at,
    },
  });

  return {
    session_id: session.session_id,
    razorpay_order_id: rzpOrder.id,
    amount_paise,
    currency: RAZORPAY_MOBILE_CURRENCY,
    key_id: process.env.RAZORPAY_MOBILE_KEY_ID,
    pricing: {
      ...pricing,
      coupon_code: applied_coupon_code,
      coupon_discount: coupon_discount_amount,
      loyalty_points_redeemed: points_to_redeem,
      loyalty_discount: loyalty_discount_amount,
      grand_total,
    },
    expires_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM — verifies payment, creates order
// ─────────────────────────────────────────────────────────────────────────────

export async function confirmCheckoutPayment({
  session_id,
  customer_id,
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
}) {
  // ── 1. Fetch session ─────────────────────────────────────
  const session = await prisma.checkoutSession.findUnique({
    where: { session_id },
  });

  if (!session || session.customer_id !== customer_id)
    throw new Error("Session not found");
  if (session.status === "expired") throw new Error("Session expired");

  // ── 2. IDEMPOTENCY: Webhook already processed this payment ──
  //    Razorpay webhook (payment.captured) can beat the app's
  //    /confirm call by milliseconds. If the session is already
  //    paid AND has an order, return that order as success.
  if (session.status === "paid" && session.order_id) {
    const existingOrder = await prisma.marketplaceOrder.findUnique({
      where: { order_id: session.order_id },
    });
    if (existingOrder) {
      return {
        order_id: existingOrder.order_id,
        order_number: existingOrder.order_number,
        status: existingOrder.status,
        total_amount: Number(existingOrder.total_amount),
        placed_at: existingOrder.placed_at,
      };
    }
  }

  if (new Date() > session.expires_at) {
    await prisma.checkoutSession.update({
      where: { session_id },
      data: { status: "expired" },
    });
    throw new Error("Session expired");
  }

  // ── 3. Verify Razorpay signature ─────────────────────────
  const isValid = verifyMobilePaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isValid) {
    await prisma.checkoutSession.update({
      where: { session_id },
      data: { status: "failed" },
    });
    throw new Error("Invalid payment signature");
  }

  // ── 4. Create MarketplaceOrder + mark session paid (atomic) ─
  const order = await _createOrderFromSession({
    session,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    resolved_payment_method: null, // Will fetch the actual method dynamically from Razorpay
  });

  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    total_amount: Number(order.total_amount),
    placed_at: order.placed_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK — safety net, idempotent
// ─────────────────────────────────────────────────────────────────────────────

export async function handleCheckoutWebhook(payload) {
  const event = payload?.event;

  if (event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    const rzp_order = payment?.order_id;
    const payment_id = payment?.id;

    if (!rzp_order || !payment_id) return;

    const session = await prisma.checkoutSession.findUnique({
      where: { razorpay_order_id: rzp_order },
    });

    if (!session) return;
    if (session.status === "paid") return;
    if (session.status === "expired") return;
    if (session.order_id) return;

    const rzpMethod = payment?.method?.toUpperCase()
      ? `RAZORPAY_${payment.method.toUpperCase()}`
      : "RAZORPAY";

    await _createOrderFromSession({
      session,
      razorpay_payment_id: payment_id,
      razorpay_order_id: rzp_order,
      razorpay_signature: null,
      resolved_payment_method: rzpMethod,
    });

    console.log(`[Webhook] Order created from session ${session.session_id}`);
  }

  if (event === "payment.failed") {
    const payment = payload.payload?.payment?.entity;
    const rzp_order = payment?.order_id;
    if (!rzp_order) return;

    await prisma.checkoutSession.updateMany({
      where: { razorpay_order_id: rzp_order, status: "created" },
      data: { status: "failed" },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — create order from session (shared by confirm + webhook)
// ─────────────────────────────────────────────────────────────────────────────

async function _createOrderFromSession({
  session,
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
  resolved_payment_method = null,
}) {
  // Guard: check session hasn't already produced an order (race condition)
  const fresh = await prisma.checkoutSession.findUnique({
    where: { session_id: session.session_id },
    select: { order_id: true, status: true },
  });
  if (fresh?.order_id)
    return prisma.marketplaceOrder.findUnique({
      where: { order_id: fresh.order_id },
    });
  if (fresh?.status === "paid")
    return prisma.marketplaceOrder.findUnique({
      where: { order_id: fresh.order_id },
    });

  // Resolve branch → shop
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id: session.branch_id },
    select: { branch: { select: { shop_id: true } } },
  });
  const shop_id = branchSettings.branch.shop_id;

  // Fetch customer snapshot
  const customer = await prisma.cureliMobileUser.findUnique({
    where: { id: session.customer_id },
    select: { full_name: true, phone: true },
  });

  const now = new Date();
  const order_number = await _generateOrderNumber();
  const { pickup_otp, delivery_otp } = generateDistinctOtps();

  const cartItems = session.cart_snapshot;
  const requiresPrescription = cartItems.some(
    (i) => i.requires_prescription_snapshot,
  );

  const createdOrder = await prisma.$transaction(async (tx) => {
    // 1. Deduct loyalty points atomically if requested
    if (session.loyalty_points_redeemed > 0) {
      const effective_subtotal = Math.max(
        0,
        Number(session.subtotal) - Number(session.coupon_discount_amount ?? 0),
      );
      await redeemPoints(
        {
          customer_id: session.customer_id,
          points_requested: session.loyalty_points_redeemed,
          effective_subtotal,
        },
        tx,
      );
    }

    // 2. Create Marketplace Order
    const order = await tx.marketplaceOrder.create({
      data: {
        order_number,
        shop_id,
        branch_id: session.branch_id,
        customer_id: session.customer_id,
        delivery_address_id: session.delivery_address_id,
        delivery_address_snapshot: session.delivery_address_snapshot,
        customer_name_snapshot: customer.full_name ?? customer.phone,
        customer_phone_snapshot: customer.phone,
        status: "PLACED",
        payment_method:
          resolved_payment_method ??
          (await resolveRazorpayMethod(razorpay_payment_id)),
        payment_status: "PAID",
        subtotal: session.subtotal,
        service_charge: session.service_charge,
        delivery_fee: session.delivery_fee,
        km_surcharge: session.km_surcharge,
        tip: session.tip,
        coupon_code: session.coupon_code,
        coupon_discount_amount: session.coupon_discount_amount,
        loyalty_points_redeemed: session.loyalty_points_redeemed,
        loyalty_discount_amount: session.loyalty_discount_amount,
        total_amount: session.grand_total,
        distance_km: session.distance_km,
        requires_prescription: requiresPrescription,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: razorpay_signature ?? null,
        checkout_session_id: session.session_id,
        notes: null,
        patient_is_self: session.patient_is_self,
        patient_name_snapshot: session.patient_name_snapshot ?? null,
        patient_age_snapshot: session.patient_age_snapshot ?? null,
        patient_sex_snapshot: session.patient_sex_snapshot ?? null,
        pickup_otp,
        delivery_otp,
        placed_at: now,
      },
    });

    // 3. Record coupon usage if applied
    if (session.coupon_code) {
      const coupon = await tx.coupon.findUnique({
        where: { code: session.coupon_code },
      });
      if (coupon) {
        await recordCouponUsage(
          {
            coupon_id: coupon.coupon_id,
            customer_id: session.customer_id,
            order_id: order.order_id,
            discount_amount: Number(session.coupon_discount_amount),
          },
          tx,
        );
      }
    }

    // 4. Create order items
    await tx.marketplaceOrderItem.createMany({
      data: cartItems.map((item) => ({
        order_id: order.order_id,
        listing_id: item.listing_id,
        medicine_id: item.medicine_id,
        variant_id: item.variant_id,
        medicine_name_snapshot: item.medicine_name_snapshot,
        variant_sku_snapshot: item.variant_sku_snapshot,
        brand_snapshot: item.brand_snapshot,
        pack_size_snapshot: item.pack_size_snapshot,
        unit_price_snapshot: item.unit_price_snapshot,
        mrp_snapshot: item.mrp_snapshot,
        requires_prescription_snapshot: item.requires_prescription_snapshot,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
    });

    // 5. Create prescription records
    const files = session.prescription_files ?? [];
    if (files.length > 0) {
      await tx.marketplaceOrderPrescription.createMany({
        data: files.map((file, index) => ({
          order_id: order.order_id,
          storage_key: file.prescription_key,
          original_name: file.original_name,
          mime_type: file.mime_type,
          file_size: file.file_size,
          sequence: index,
        })),
      });
    }

    // 6. Status history
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id: order.order_id,
        from_status: null,
        to_status: "PLACED",
        changed_by_type: "customer",
        changed_by_id: session.customer_id,
        reason: null,
      },
    });

    // 7. Mark session paid
    await tx.checkoutSession.update({
      where: { session_id: session.session_id },
      data: {
        status: "paid",
        paid_at: now,
        order_id: order.order_id,
      },
    });

    return order;
  });

  // Fire events post-commit
  await fireOrderPlacedEvents({
    ...createdOrder,
    items: cartItems,
  });

  // Link order back to prescription request if applicable
  if (session.prescription_request_id && session.prescription_recipient_id) {
    markConverted(
      session.prescription_request_id,
      session.prescription_recipient_id,
      createdOrder.order_id,
    ).catch((err) =>
      console.error(
        "[Checkout] markConverted failed (non-fatal):",
        err.message,
      ),
    );
  }

  return createdOrder;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function _generateOrderNumber() {
  const result =
    await prisma.$queryRaw`SELECT nextval('marketplace_order_seq') as seq`;
  const seq = result[0].seq;
  return `MKT-${String(seq).padStart(6, "0")}`;
}

async function resolveSubtotal(items, branch_id) {
  let subtotal = 0;
  for (const { variantId, quantity } of items) {
    const query = { linked_variant_id: variantId };

    if (branch_id) {
      query.branch_id = branch_id;
    }

    const listing = await prisma.marketplaceListing.findFirst({
      where: query,
      select: { marketplace_price: true },
    });

    if (listing?.marketplace_price) {
      subtotal += Number(listing.marketplace_price) * quantity;
    }
  }
  return subtotal;
}

async function validateAndSnapshotItems(cartItems, branch_id) {
  const resolvedItems = [];
  let subtotal = 0;
  let requiresPrescription = false;

  for (const { variantId, quantity } of cartItems) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: { linked_variant_id: variantId, branch_id },
      select: {
        listing_id: true,
        medicine_id: true,
        linked_variant_id: true,
        is_visible: true,
        stock_status: true,
        marketplace_price: true,
        requires_prescription: true,
        linkedVariant: {
          select: {
            name: true,
            sku_id: true,
            brand: true,
            pack_size: true,
            mrp: true,
          },
        },
      },
    });

    if (!listing) throw new Error("One or more items are no longer available");
    if (!listing.is_visible)
      throw new Error("One or more items are no longer listed");
    if (listing.stock_status !== "IN_STOCK")
      throw new Error("One or more items are out of stock");
    if (listing.marketplace_price === null)
      throw new Error("One or more items have no price set");

    if (listing.requires_prescription) requiresPrescription = true;

    const unitPrice = Number(listing.marketplace_price);
    const mrp = listing.linkedVariant?.mrp
      ? Number(listing.linkedVariant.mrp)
      : unitPrice;
    const line_total = unitPrice * quantity;
    subtotal += line_total;

    resolvedItems.push({
      listing_id: listing.listing_id,
      medicine_id: listing.medicine_id,
      variant_id: listing.linked_variant_id,
      medicine_name_snapshot: listing.linkedVariant?.name ?? "Unknown",
      variant_sku_snapshot: listing.linkedVariant?.sku_id ?? "",
      brand_snapshot: listing.linkedVariant?.brand ?? null,
      pack_size_snapshot: listing.linkedVariant?.pack_size ?? null,
      unit_price_snapshot: unitPrice,
      mrp_snapshot: mrp,
      requires_prescription_snapshot: listing.requires_prescription,
      quantity,
      line_total,
    });
  }

  return { resolvedItems, subtotal, requiresPrescription };
}
