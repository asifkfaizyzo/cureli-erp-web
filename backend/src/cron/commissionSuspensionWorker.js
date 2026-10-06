// backend/src/cron/commissionSuspensionWorker.js

import prisma from "../config/prisma.js";
import cronLogger from "../utils/cronLogger.js";
import * as audit from "../modules/audit/index.js";
import { notifyAsync, NOTIFICATION_EVENTS } from "../modules/notifications/index.js";

/**
 * Checks if the default commission rule's suspension timer has expired.
 * If so, auto-resumes commission and notifies all live pharmacies + CAdmins.
 *
 * Runs every 15 minutes via cron lock.
 */
export async function checkCommissionSuspensionExpiry() {
  try {
    const now = new Date();

    // Find default rule that is suspended with a past expiry date
    const expiredSuspension = await prisma.commissionRule.findFirst({
      where: {
        is_default: true,
        is_suspended: true,
        suspended_until: {
          not: null,
          lte: now,
        },
      },
    });

    if (!expiredSuspension) {
      return; // Nothing to do
    }

    cronLogger.info(
      `[Commission] Suspension timer expired for default rule "${expiredSuspension.name}" ` +
      `(was suspended until ${expiredSuspension.suspended_until.toISOString()}). Auto-resuming...`
    );

    // ── 1. Clear suspension ──────────────────────────────────────────────
    const updated = await prisma.commissionRule.update({
      where: { rule_id: expiredSuspension.rule_id },
      data: {
        is_suspended: false,
        suspended_until: null,
      },
    });

    cronLogger.success(
      `[Commission] Auto-resumed default rule "${updated.name}"`
    );

    // ── 2. Build rate description for notifications ──────────────────────
    const rateDescription = buildRateDescription(updated);

    // ── 3. Audit log ─────────────────────────────────────────────────────
    const systemContext = audit.buildSystemContext
      ? audit.buildSystemContext("commission-suspension-cron")
      : {
          actor_type: audit.ActorType.SYSTEM,
          actor_id: null,
        };

    audit
      .log({
        action: audit.AuditAction.COMMISSION_AUTO_RESUMED,
        entity_type: audit.EntityType.COMMISSION_RULE,
        entity_id: updated.rule_id,
        ...systemContext,
        reason_code: audit.AuditReasonCode.AUTOMATION,
        metadata: {
          rule_name: updated.name,
          previously_suspended_until: expiredSuspension.suspended_until.toISOString(),
          resumed_rate: rateDescription,
          triggered_by: "commission_suspension_cron",
        },
      })
      .catch((err) =>
        cronLogger.error("[Commission] Failed to log auto-resume audit:", err)
      );

    // ── 4. Notify all live pharmacies ────────────────────────────────────
    try {
      const liveShops = await prisma.marketplaceProfile.findMany({
        where: { is_live: true },
        select: { shop_id: true },
      });

      if (liveShops.length > 0) {
        const shopIds = liveShops.map((s) => s.shop_id);

        const users = await prisma.user.findMany({
          where: {
            shop_id: { in: shopIds },
            is_active: true,
            role: { in: ["super_admin", "owner"] },
          },
          select: {
            user_id: true,
            email: true,
            full_name: true,
            shop_id: true,
          },
        });

        if (users.length > 0) {
          const recipients = users.map((u) => ({
            email: u.email || null,
            name: u.full_name || "Pharmacy Owner",
            user_id: u.user_id,
            shop_id: u.shop_id,
            type: "user",
          }));

          notifyAsync({
            type: NOTIFICATION_EVENTS.COMMISSION_RESUMED,
            context: {
              title: "Commission Automatically Resumed",
              message:
                `The temporary commission waiver has ended. ` +
                `Your marketplace commission rate is now ${rateDescription}. ` +
                `This was automatically re-enabled as per the scheduled timer.`,
              rule_name: updated.name,
              description_text: rateDescription,
              auto_resumed: true,
            },
            channels: ["inapp", "email"],
            audience: recipients,
          });

          cronLogger.info(
            `[Commission] Auto-resume notification sent to ${recipients.length} pharmacy user(s)`
          );
        }
      }
    } catch (notifyErr) {
      cronLogger.error(
        "[Commission] Failed to send auto-resume notifications:",
        notifyErr
      );
    }

    // ── 5. Notify CAdmins ────────────────────────────────────────────────
    try {
      const cadmins = await prisma.cAdmin.findMany({
        where: { is_active: true },
        select: {
          cadmin_id: true,
          email: true,
          name: true,
        },
      });

      if (cadmins.length > 0) {
        const cadminRecipients = cadmins.map((c) => ({
          email: c.email || null,
          name: c.name || "Admin",
          cadmin_id: c.cadmin_id,
          type: "cadmin",
        }));

        notifyAsync({
          type: NOTIFICATION_EVENTS.COMMISSION_RESUMED,
          context: {
            title: "Commission Auto-Resumed",
            message:
              `The scheduled commission suspension for "${updated.name}" has expired. ` +
              `Commission rate is now ${rateDescription}.`,
            rule_name: updated.name,
            description_text: rateDescription,
            auto_resumed: true,
          },
          channels: ["inapp"],
          audience: cadminRecipients,
        });

        cronLogger.info(
          `[Commission] Auto-resume notification sent to ${cadminRecipients.length} CAdmin(s)`
        );
      }
    } catch (cadminNotifyErr) {
      cronLogger.error(
        "[Commission] Failed to notify CAdmins of auto-resume:",
        cadminNotifyErr
      );
    }
  } catch (err) {
    cronLogger.error("[Commission] Suspension expiry check failed:", err);
  }
}

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────

function buildRateDescription(rule) {
  switch (rule.commission_type) {
    case "FLAT_PERCENT":
      return `${rule.flat_percent}% of ${rule.commission_base.toLowerCase().replace(/_/g, " ")}`;
    case "FLAT_AMOUNT":
      return `₹${rule.flat_amount} per order`;
    case "HYBRID":
      return `${rule.hybrid_percent}% + ₹${rule.hybrid_flat_amount} per order`;
    case "CAPPED_PERCENT":
      return `${rule.capped_percent}% (max ₹${rule.capped_max_amount})`;
    default:
      return "Unknown";
  }
}