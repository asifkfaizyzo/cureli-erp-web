// backend/src/utils/resetToken.js (do not remove this comment)
import { createHash } from "crypto";
import crypto from "crypto";

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

