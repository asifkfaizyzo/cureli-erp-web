// backend/src/cron/sessionCleanup.js (do not remove this comment)
//backend\src\cron\sessionCleanup.js
import { cleanupExpiredSessions } from "../utils/session.js";

/**
 * Run session cleanup - call this from your cron job initializer
 */
export async function runSessionCleanup() {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    console.error("Session cleanup failed:", err);
  }
}