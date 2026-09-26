// backend/src/modules/mobile/checkout/mobile.checkout.controller.js (do not remove this comment)
// backend/src/modules/mobile/checkout/mobile.checkout.controller.js
import crypto from "crypto";
import {
  getQuote,
  createCheckoutSession,
  confirmCheckoutPayment,
  handleCheckoutWebhook,
} from "./mobile.checkout.service.js";
import {
  quoteSchema,
  createSessionSchema,
  confirmSchema,
} from "./mobile.checkout.schema.js";
import { success, fail } from "../../../utils/response.js";

export async function quoteHandler(req, res) {
  try {
    const parsed = quoteSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const customer_id = req.mobileUser?.id ?? null;

    // ── BULLETPROOF FALLBACKS (Bypass Zod stripping) ────────────────────────
    const coupon_code = parsed.data.coupon_code !== undefined
      ? parsed.data.coupon_code
      : (req.body.coupon_code ?? null);

    const raw_loyalty = parsed.data.loyalty_points_to_redeem !== undefined
      ? parsed.data.loyalty_points_to_redeem
      : req.body.loyalty_points_to_redeem;

    const loyalty_points_to_redeem = raw_loyalty ? Number(raw_loyalty) : 0;
    // ────────────────────────────────────────────────────────────────────────

    const result = await getQuote({
      items: parsed.data.items,
      distance_km: parsed.data.distance_km,
      tip: parsed.data.tip,
      branch_id: parsed.data.branch_id,
      coupon_code,
      loyalty_points_to_redeem,
      customer_id,
    });

    return success(res, result, "Quote calculated");
  } catch (err) {
    console.error("[Checkout] quote error:", err.message);
    return fail(res, err.message || "Failed to calculate quote", 500);
  }
}

export async function createSessionHandler(req, res) {
  try {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    // ── BULLETPROOF FALLBACKS (Bypass Zod stripping) ────────────────────────
    const coupon_code = parsed.data.coupon_code !== undefined
      ? parsed.data.coupon_code
      : (req.body.coupon_code ?? null);

    const raw_loyalty = parsed.data.loyalty_points_to_redeem !== undefined
      ? parsed.data.loyalty_points_to_redeem
      : req.body.loyalty_points_to_redeem;

    const loyalty_points_to_redeem = raw_loyalty ? Number(raw_loyalty) : 0;
    // ────────────────────────────────────────────────────────────────────────

    const result = await createCheckoutSession({
      customer_id: req.mobileUser.id,
      branch_id: parsed.data.branch_id,
      delivery_address_id: parsed.data.delivery_address_id,
      items: parsed.data.items,
      distance_km: parsed.data.distance_km,
      tip: parsed.data.tip,
      prescription_files: parsed.data.prescription_files ?? [],
      patient: parsed.data.patient,
      prescription_request_id: parsed.data.prescription_request_id ?? null,
      prescription_recipient_id: parsed.data.prescription_recipient_id ?? null,
      coupon_code,
      loyalty_points_to_redeem,
    });

    return success(res, result, "Checkout session created", 201);
  } catch (err) {
    console.error("[Checkout] createSession error:", err.message);

    const knownErrors = [
      "Customer account is not active",
      "Delivery address not found",
      "Branch is not available",
      "This branch is not accepting marketplace orders",
      "One or more items are no longer available",
      "One or more items are no longer listed",
      "One or more items are out of stock",
      "One or more items have no price set",
      "This order requires a prescription. Please upload at least one prescription file.",
    ];

    if (knownErrors.includes(err.message)) return fail(res, err.message, 400);
    if (err.message.startsWith("Delivery not available"))
      return fail(res, err.message, 400);
    return fail(res, err.message || "Failed to create checkout session", 500);
  }
}

export async function confirmHandler(req, res) {
  try {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await confirmCheckoutPayment({
      session_id: parsed.data.session_id,
      customer_id: req.mobileUser.id,
      razorpay_payment_id: parsed.data.razorpay_payment_id,
      razorpay_order_id: parsed.data.razorpay_order_id,
      razorpay_signature: parsed.data.razorpay_signature,
    });

    return success(res, result, "Payment confirmed, order placed");
  } catch (err) {
    console.error("[Checkout] confirm error:", err.message);
    if (err.message === "Session not found")
      return fail(res, "Session not found", 404);
    if (err.message === "Session expired")
      return fail(
        res,
        "Your checkout session has expired. Please try again.",
        410,
      );
    if (err.message === "Already paid")
      return fail(res, "This order has already been placed.", 409);
    if (err.message === "Invalid payment signature")
      return fail(res, "Payment verification failed.", 400);
    return fail(res, err.message || "Failed to confirm payment", 500);
  }
}

export async function webhookHandler(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody ?? JSON.stringify(req.body);
    const secret = process.env.RAZORPAY_MOBILE_WEBHOOK_SECRET;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ success: false });
    }

    await handleCheckoutWebhook(req.body);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Webhook] checkout error:", err.message);
    return res.status(200).json({ success: true });
  }
}

export const handleGetQuote = quoteHandler;
export const handleCreateSession = createSessionHandler;
export const handleConfirmPayment = confirmHandler;