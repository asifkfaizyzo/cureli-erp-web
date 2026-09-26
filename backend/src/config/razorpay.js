// backend/src/config/razorpay.js (do not remove this comment)
import Razorpay from "razorpay";
import crypto from "crypto";

// ── Live instance (ERP / existing flows) ─────────────────────────────────────
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Mobile instance (can be test or live independently) ───────────────────────
export const razorpayMobile = new Razorpay({
  key_id: process.env.RAZORPAY_MOBILE_KEY_ID || process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_MOBILE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
});

export const RAZORPAY_CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";
export const RAZORPAY_MOBILE_CURRENCY = process.env.RAZORPAY_MOBILE_CURRENCY || process.env.RAZORPAY_CURRENCY || "INR";

/**
 * Verify signature — accepts a custom secret so it works for both instances
 */
export function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  const body = orderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

// Convenience wrappers so call sites don't need to pass the secret manually
export function verifyMobilePaymentSignature(orderId, paymentId, signature) {
  return verifyPaymentSignature(
    orderId,
    paymentId,
    signature,
    process.env.RAZORPAY_MOBILE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET
  );
}

export function verifyErpPaymentSignature(orderId, paymentId, signature) {
  return verifyPaymentSignature(
    orderId,
    paymentId,
    signature,
    process.env.RAZORPAY_KEY_SECRET
  );
}