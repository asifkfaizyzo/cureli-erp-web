import cronLogger from "../utils/cronLogger.js";
import { finalizePharmacyPayoutWeek } from "../modules/cadmin/pharmacy-payouts/cadmin.pharmacyPayouts.service.js";

export async function runPharmacyPayoutFinalization() {
  cronLogger.info("Starting weekly pharmacy payout finalization...");

  try {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    const prevMonday = new Date(thisMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);

    const weekStartStr = `${prevMonday.getFullYear()}-${String(prevMonday.getMonth() + 1).padStart(2, "0")}-${String(prevMonday.getDate()).padStart(2, "0")}`;

    cronLogger.info(`Finalizing pharmacy payouts for week: ${weekStartStr}`);

    const result = await finalizePharmacyPayoutWeek(weekStartStr);

    cronLogger.success(
      `Pharmacy payout finalization complete: ${result.finalized}/${result.total_drafts} drafts finalized`,
    );
  } catch (err) {
    cronLogger.error("Pharmacy payout finalization failed", err);
  }
}