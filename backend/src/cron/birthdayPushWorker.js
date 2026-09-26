// backend/src/cron/birthdayPushWorker.js (do not remove this comment)
// backend/src/cron/birthdayPushWorker.js
// ============================================
// BIRTHDAY PUSH NOTIFICATION WORKER
// Runs daily at 11:00 AM IST (05:30 UTC)
// Sends push notifications to mobile users whose birthday is today
// ============================================

import prisma from "../config/prisma.js";
import { sendPushToUser } from "../modules/mobile/push/mobile.push.service.js";
import cronLogger from "../utils/cronLogger.js";

/**
 * Find all active mobile users whose birthday matches today (IST)
 * and send them a birthday push notification.
 *
 * Deduplication: checks if a birthday notification was already sent
 * to the user today to prevent duplicates on cron retries.
 */
export async function runBirthdayPushJob() {
  cronLogger.info("Starting birthday push notification job...");

  try {
    // ── 1. Calculate today's date in IST (UTC+5:30) ──────────────────
    const now = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);

    const month = istNow.getUTCMonth() + 1; // 1–12
    const day = istNow.getUTCDate();        // 1–31
    const year = istNow.getUTCFullYear();

    // ── 2. Query users with matching birthday ────────────────────────
    // Using raw SQL because Prisma doesn't support EXTRACT natively
    const birthdayUsers = await prisma.$queryRaw`
      SELECT id, full_name
      FROM cureli_mobile_users
      WHERE status = 'active'
        AND deleted_at IS NULL
        AND date_of_birth IS NOT NULL
        AND EXTRACT(MONTH FROM date_of_birth) = ${month}
        AND EXTRACT(DAY FROM date_of_birth) = ${day}
    `;

    if (birthdayUsers.length === 0) {
      cronLogger.info("No birthdays today");
      return;
    }

    cronLogger.info(`Found ${birthdayUsers.length} birthday(s) today (IST ${month}/${day})`);

    // ── 3. Compute start of today in UTC for deduplication ───────────
    const startOfTodayIST = new Date(Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
    ));
    const startOfTodayUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET_MS);

    // ── 4. Send push to each birthday user ───────────────────────────
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of birthdayUsers) {
      try {
        // Deduplication: skip if a birthday push was already sent today
        const alreadySent = await prisma.cureliMobileNotification.findFirst({
          where: {
            user_id: user.id,
            category: "promotions",
            created_at: { gte: startOfTodayUTC },
            title: { startsWith: "🎂 Happy Birthday" },
          },
        });

        if (alreadySent) {
          skipped++;
          continue;
        }

        const firstName = user.full_name?.split(" ")[0] || "there";

        await sendPushToUser({
          userId: user.id,
          title: `🎂 Happy Birthday, ${firstName}!`,
          body: `Wishing you a healthy and happy birthday! 🎉 Explore exclusive wellness deals on Cureli today.`,
          category: "promotions",
          data: {
            screen: "home",
            type: "birthday",
            year: String(year),
          },
        });

        sent++;
      } catch (err) {
        failed++;
        cronLogger.error(
          `Failed to send birthday push to user ${user.id}: ${err.message}`,
        );
      }
    }

    cronLogger.info(
      `Birthday push complete: ${sent} sent, ${skipped} skipped (dup), ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Birthday push job failed", err);
  }
}