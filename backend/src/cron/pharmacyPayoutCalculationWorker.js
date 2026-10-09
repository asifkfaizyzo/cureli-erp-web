import cronLogger from "../utils/cronLogger.js";
import { refreshAllPharmacyPayouts } from "../modules/cadmin/pharmacy-payouts/cadmin.pharmacyPayouts.service.js";

export async function runPharmacyPayoutCalculation() {
  cronLogger.info("Starting daily pharmacy payout calculation...");

  try {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);

    const weekStartStr = `${thisMonday.getFullYear()}-${String(thisMonday.getMonth() + 1).padStart(2, "0")}-${String(thisMonday.getDate()).padStart(2, "0")}`;

    cronLogger.info(`Calculating pharmacy payouts for current week: ${weekStartStr}`);

    const result = await refreshAllPharmacyPayouts(weekStartStr, null);

    cronLogger.success(
      `Pharmacy payout calculation complete: ${result.refreshed}/${result.total} shops refreshed, ${result.failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Pharmacy payout calculation failed", err);
  }
}