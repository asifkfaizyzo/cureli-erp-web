// backend/src/modules/cadmin/auth/cadminPassword.service.js (do not remove this comment)
// backend/src/modules/cadmin/auth/cadminPassword.service.js

import prisma from "../../../config/prisma.js";
import { generateResetToken, hashToken } from "../../../utils/resetToken.js";
import { hashPassword } from "../../../utils/hash.js";
import { notify } from "../../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";
import * as audit from "../../audit/index.js";

export async function requestCAdminPasswordReset(email, auditContext = {}) {
  const admin = await prisma.cAdmin.findUnique({ where: { email } });

  if (!admin) {
    // Avoid email enumeration - silent return
    return { success: true };
  }

  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.cAdmin.update({
    where: { cadmin_id: admin.cadmin_id },
    data: {
      reset_token: hashedToken,
      reset_token_expires: expiresAt,
    },
  });

  const resetUrl = `${process.env.ADMIN_FRONTEND_ORIGIN}/admin-reset-password?token=${resetToken}`;

  // Send notification
  await notify({
    type: NOTIFICATION_EVENTS.CADMIN_PASSWORD_RESET_REQUESTED,
    context: {
      email: admin.email,
      name: admin.name,
      resetUrl,
      expires_in_minutes: 15,
    },
  });

  // Note: We don't audit password reset *requests* to avoid spam logging
  // Only successful resets are audited below

  return { success: true };
}

export async function resetCAdminPassword(
  token,
  newPassword,
  auditContext = {},
) {
  const hashed = hashToken(token);

  const admin = await prisma.cAdmin.findFirst({
    where: {
      reset_token: hashed,
      reset_token_expires: { gt: new Date() },
    },
  });

  if (!admin) {
    const err = new Error("Invalid or expired reset token");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.cAdmin.update({
      where: { cadmin_id: admin.cadmin_id },
      data: {
        password_hash: newHash,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    //  AUDIT LOG: Password reset completed (SECURITY ACTION)
    await audit.log(
      {
        action: audit.AuditAction.CADMIN_PASSWORD_RESET_COMPLETED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: admin.cadmin_id,
        actor_type: audit.ActorType.CADMIN,
        actor_id: admin.cadmin_id,
        actor_role: admin.role,
        ...auditContext,
        reason_code: audit.AuditReasonCode.SECURITY_ACTION,
        metadata: {
          username: admin.username,
          reset_method: "email",
        },
      },
      { tx },
    );
  });

  return { success: true };
}
