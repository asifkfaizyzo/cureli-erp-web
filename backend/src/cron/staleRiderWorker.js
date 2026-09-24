import prisma from "../config/prisma.js";

const STALE_THRESHOLD_MINUTES = 5;
const LOG_PREFIX = "[Cron:StaleRider]";

/**
 * Finds riders who are marked online but haven't sent a location
 * update in the last 5 minutes. Sets them offline and closes
 * their open RiderOnlineSession records.
 *
 * Intended to run every 2 minutes via node-cron.
 */
export async function staleRiderWorker() {
  try {
    const threshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

    // 1. Find stale riders
    const staleRiders = await prisma.rider.findMany({
      where: {
        is_online: true,
        OR: [
          { last_location_at: null },
          { last_location_at: { lt: threshold } },
        ],
      },
      select: { rider_id: true, last_location_at: true },
    });

    if (staleRiders.length === 0) return;

    const staleIds = staleRiders.map((r) => r.rider_id);

    // 2. Set riders offline + close sessions in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.rider.updateMany({
        where: { rider_id: { in: staleIds } },
        data: { is_online: false },
      });

      // Close all open sessions for stale riders
      const openSessions = await tx.riderOnlineSession.findMany({
        where: {
          rider_id: { in: staleIds },
          went_offline_at: null,
        },
        select: { session_id: true, went_online_at: true },
      });

      const now = new Date();
      for (const session of openSessions) {
        const durationMs = now.getTime() - new Date(session.went_online_at).getTime();
        const durationMinutes = Math.round((durationMs / 60_000) * 100) / 100;

        await tx.riderOnlineSession.update({
          where: { session_id: session.session_id },
          data: {
            went_offline_at: now,
            duration_minutes: durationMinutes,
            closed_by: "stale_cron",
          },
        });
      }
    });

    console.log(
      `${LOG_PREFIX} Offlined ${staleIds.length} stale rider(s): ${staleIds.join(", ")}`,
    );
  } catch (err) {
    console.error(`${LOG_PREFIX} Error:`, err.message);
  }
}