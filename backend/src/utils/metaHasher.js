// backend/src/utils/metaHasher.js

import crypto from "crypto";

/**
 * Normalizes and computes SHA-256 hash according to Meta CAPI specification.
 * Never logs raw or unhashed user signals.
 */

export function hashSha256(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function normalizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  return hashSha256(email.trim().toLowerCase());
}

export function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  
  // Default to India country code 91 if 10 digits
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return hashSha256(digits);
}

export function normalizeName(name) {
  if (!name || typeof name !== "string") return null;
  return hashSha256(name.trim().toLowerCase());
}

export function normalizeExternalId(userId) {
  if (!userId || typeof userId !== "string") return null;
  return hashSha256(userId.trim().toLowerCase());
}

export function buildHashedUserData({ email, phone, fullName, userId }) {
  const userData = {};
  
  const em = normalizeEmail(email);
  if (em) userData.em = [em];

  const ph = normalizePhone(phone);
  if (ph) userData.ph = [ph];

  const fn = normalizeName(fullName);
  if (fn) userData.fn = [fn];

  const extId = normalizeExternalId(userId);
  if (extId) userData.external_id = [extId];

  userData.country = [hashSha256("in")];

  return userData;
}