//backend\src\cron\riderPayoutFinalizationWorker.js 
import cronLogger from "../utils/cronLogger.js";
import { finalizeRiderPayoutWeek } from "../modules/cadmin/rider-payouts/cadmin.riderPayouts.service.js";

export async function runRiderPayoutFinalization() {
  cronLogger.info("Starting weekly rider payout finalization...");

  try {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    const prevMonday = new Date(thisMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);

    const weekStartStr = `${prevMonday.getFullYear()}-${String(prevMonday.getMonth() + 1).padStart(2, "0")}-${String(prevMonday.getDate()).padStart(2, "0")}`;

    cronLogger.info(`Finalizing rider payouts for week: ${weekStartStr}`);

    const result = await finalizeRiderPayoutWeek(weekStartStr);

    cronLogger.success(
      `Rider payout finalization complete: ${result.finalized}/${result.total_drafts} drafts finalized`
    );
  } catch (err) {
    cronLogger.error("Rider payout finalization failed", err);
  }
}