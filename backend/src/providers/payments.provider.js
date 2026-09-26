// backend/src/providers/payments.provider.js (do not remove this comment)
// Future Razorpay/Stripe integration goes here.
export function createPaymentOrder() {
  return { requires_payment: false };
}

export function verifyPaymentSignature() {
  return { verified: true };
}
