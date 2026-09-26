// backend/src/modules/auth/auth.service.js (do not remove this comment)
// backend/src/modules/auth/auth.service.js

import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import { generateResetToken, hashToken } from "../../utils/tokens.js";
import jwt from "jsonwebtoken";
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
} from "../../config/jwt.js";
import { notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";
import * as audit from "../audit/index.js";
import { invalidateAllUserSessions } from "../../utils/session.js";

export async function createOwnerAccount(
  { first_name, last_name, email, password },
  auditContext,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.login_provider === "google") {
      const err = new Error(
        "Email already registered via Google. Please login with Google.",
      );
      err.code = "EMAIL_GOOGLE_EXISTS";
      throw err;
    }
    const err = new Error("Email already registered.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const password_hash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      email,
      password_hash,
      login_provider: "password",
      role: "super_admin",
      status: "pending_setup",
      is_active: true,
    },
  });

  // Audit: User account created (will become shop owner)
  await audit.log({
    action: audit.AuditAction.USER_CREATED,
    entity_type: audit.EntityType.USER,
    entity_id: user.user_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      email: user.email,
      role: user.role,
      login_provider: user.login_provider,
      is_owner_account: true,
    },
  });

  const accessToken = jwt.sign(
    { user_id: user.user_id, role: user.role, status: user.status },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES },
  );

  const refreshToken = jwt.sign({ user_id: user.user_id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });

  return {
    user,
    tokens: { accessToken, refreshToken },
  };
}

// No audit needed - just sends reset email (no state change yet)
export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal whether email exists
    return { success: true };
  }

  if (user.login_provider === "google" && !user.password_hash) {
    return { success: true };
  }

  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      reset_token: hashedToken,
      reset_token_expires: expiresAt,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await notify({
    type: NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED,
    context: {
      email: user.email,
      name: user.first_name,
      resetUrl,
      expires_in_minutes: 15,
    },
  });

  return { success: true };
}

export async function resetPassword(token, newPassword, auditContext) {
  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      reset_token: hashedToken,
      reset_token_expires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  const password_hash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      password_hash,
      reset_token: null,
      reset_token_expires: null,
    },
  });
  await invalidateAllUserSessions(user.user_id, "password_reset");

  // Audit: Password reset completed (SECURITY ACTION - must not fail)
  await audit.log({
    action: audit.AuditAction.PASSWORD_RESET_COMPLETED,
    entity_type: audit.EntityType.USER,
    entity_id: user.user_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user.user_id, // User resetting their own password
    actor_role: user.role,
    shop_id: user.shop_id,
    branch_id: user.branch_id,
    ...auditContext, // For IP and user agent
    reason_code: audit.AuditReasonCode.SECURITY_ACTION,
    metadata: {
      reset_method: "email_token",
    },
  });

  //  Notify user about password change (security alert - fire-and-forget)
  notify({
    type: NOTIFICATION_EVENTS.PASSWORD_CHANGED,
    context: {
      user_id: user.user_id,
      email: user.email,
      name: user.first_name || user.full_name || "User",
    },
  }).catch((err) =>
    console.error("[Notification] PASSWORD_CHANGED failed:", err),
  );

  return { success: true };
}

// 📋 NOTIFICATIONS ADDED:
// - PASSWORD_CHANGED: Sent after successful password reset (security alert to user)
