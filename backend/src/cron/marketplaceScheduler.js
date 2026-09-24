// backend/src/cron/marketplaceScheduler.js (do not remove this comment)
// backend/src/cron/marketplaceScheduler.js
// NEW FILE
//
// Runs every minute. For each marketplace-enabled branch:
//   - Checks current IST day against open_days
//   - Checks BranchHoliday overrides for today
//   - Opens or closes the branch by toggling marketplace_enabled
//   - Fires SSE to mobile customers when state changes
//
// Auto-close: sets marketplace_enabled = false at closing_time.
// Existing PLACED/ACCEPTED orders continue to be processed — placeOrder()
// blocks new orders via the marketplace_enabled check, but in-progress
// orders are unaffected.
//
// Auto-open: sets marketplace_enabled = true at opening_time only if:
//   1. Today is in open_days
//   2. No holiday override exists for today
//   3. Branch is not manually disabled (tracked via auto_schedule_paused)
//
// NOTE: We do NOT auto-open branches that were manually disabled by the
// pharmacist mid-day. The field `schedule_managed` on
// BranchMarketplaceSettings tracks this:
//   true  = cron manages this branch
//   false = manually overridden, cron skips auto-open (but still auto-closes)
//
// Wait — schema doesn't have schedule_managed yet. But looking at the
// requirement: "they can always manually turn off the shop if they want
// to go early". This means if they manually turn off mid-day, the cron
// should NOT re-open it until the next scheduled open time the next day.
//
// Solution: track `last_auto_opened_date` (Date) on the settings.
// If the branch is currently disabled AND last_auto_opened_date = today,
// it means someone manually closed it → skip auto-open.
// If last_auto_opened_date != today → safe to auto-open.
//
// This requires one more schema field. Adding it inline below.

import prisma from "../config/prisma.js";
import { sseService } from "../services/sse.service.js";
import cronLogger from "../utils/cronLogger.js";
import { withCronLock } from "./cronLock.js";

// ── IST helpers (mirrors mobile.shops.service.js) ────────────────────────────

/**
 * Returns current IST date and time components.
 * IST = UTC + 5h30m
 */
function getNowIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const ist = new Date(istMs);

  // Day of week as 3-letter uppercase string
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = days[ist.getDay()];

  // YYYY-MM-DD string in IST for holiday comparison
  const dateStr = ist.toISOString().slice(0, 10);

  return {
    hours: ist.getHours(),
    minutes: ist.getMinutes(),
    dayOfWeek, // 'MON', 'TUE', etc.
    dateStr, // '2026-07-17'
    totalMinutes: ist.getHours() * 60 + ist.getMinutes(),
  };
}

/**
 * Parse "HH:MM" → total minutes since midnight.
 * Returns null on bad input.
 */
function toMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Determine if the branch SHOULD be open right now based on schedule.
 * Does NOT check holidays — caller handles that.
 *
 * @param {object} bs - BranchMarketplaceSettings row
 * @param {object} now - result of getNowIST()
 * @returns {boolean}
 */
function shouldBeOpenBySchedule(bs, now) {
  // 24-hour branch → always open (holidays can still override)
  if (bs.is_24_hours) return true;

  // Check day of week
  if (!bs.open_days || !bs.open_days.includes(now.dayOfWeek)) return false;

  // Check time window
  const open = toMinutes(bs.opening_time);
  const close = toMinutes(bs.closing_time);

  if (open === null || close === null) return false;

  const nowMins = now.totalMinutes;

  if (open <= close) {
    // Normal window e.g. 09:00 → 21:00
    return nowMins >= open && nowMins < close;
  } else {
    // Overnight window e.g. 22:00 → 06:00
    return nowMins >= open || nowMins < close;
  }
}

// ── Fire SSE to mobile customers of a branch ─────────────────────────────────

/**
 * Notify all connected mobile customers about a branch status change.
 * We don't have a branch→customer mapping in SSE — we broadcast to
 * all connected mobile clients. The mobile client ignores events for
 * branches it doesn't have open.
 *
 * @param {string} branch_id
 * @param {boolean} is_open
 * @param {object} bs - branch settings for open/close time info
 */
function fireBranchStatusSSE(branch_id, is_open, bs) {
  const payload = {
    branch_id,
    is_open,
    opening_time: bs.opening_time ?? null,
    closing_time: bs.closing_time ?? null,
    is_24_hours: bs.is_24_hours,
  };

  // Broadcast to all connected mobile clients
  // (mobile ignores events for branches not currently displayed)
  for (const [customerId] of sseService.mobileClients) {
    sseService.notifyMobile(customerId, "branch_status_changed", payload);
  }

  cronLogger.info(
    `[MarketplaceScheduler] SSE branch_status_changed → branch ${branch_id} is_open=${is_open}`,
  );
}

// ── Main job ──────────────────────────────────────────────────────────────────

export async function runMarketplaceScheduler() {
  const now = getNowIST();

  // Fetch all branches that are part of a LIVE marketplace
  // and not is_24_hours=false with no open_days (would never auto-open)
  const allBranchSettings = await prisma.branchMarketplaceSettings.findMany({
    where: {
      marketplaceProfile: {
        is_live: true,
        marketplace_status: "LIVE",
      },
    },
    select: {
      branch_id: true,
      marketplace_enabled: true,
      is_24_hours: true,
      open_days: true,
      opening_time: true,
      closing_time: true,
      last_auto_opened_date: true,
      marketplaceProfile: {
        select: { shop_id: true },
      },
    },
  });

  if (allBranchSettings.length === 0) return;

  // Fetch all holidays for today in one query
  // Includes both BRANCH and SHOP scope
  const todayHolidays = await prisma.branchHoliday.findMany({
    where: {
      holiday_date: {
        // Match today's date in IST
        // We compare as a date string — Prisma Date stores as midnight UTC
        // We need to compare against the IST date.
        // Strategy: fetch a range covering the IST day.
        gte: new Date(`${now.dateStr}T00:00:00.000Z`),
        lt: new Date(`${now.dateStr}T23:59:59.999Z`),
      },
    },
    select: {
      branch_id: true,
      shop_id: true,
      scope: true,
    },
  });

  // Build lookup sets for O(1) holiday checks
  const branchHolidaySet = new Set(
    todayHolidays.filter((h) => h.scope === "BRANCH").map((h) => h.branch_id),
  );

  const shopHolidaySet = new Set(
    todayHolidays.filter((h) => h.scope === "SHOP").map((h) => h.shop_id),
  );

  let opened = 0;
  let closed = 0;

  for (const bs of allBranchSettings) {
    const shopId = bs.marketplaceProfile?.shop_id;

    try {
      // ── Check holiday override ──────────────────────────────────────────
      const isHoliday =
        branchHolidaySet.has(bs.branch_id) ||
        (shopId && shopHolidaySet.has(shopId));

      // ── Determine target state ──────────────────────────────────────────
      const targetOpen = isHoliday ? false : shouldBeOpenBySchedule(bs, now);

      // ── Skip if no state change needed ──────────────────────────────────
      if (targetOpen === bs.marketplace_enabled) continue;

      // ── Skip auto-open if manually closed today ─────────────────────────
      // If the branch is currently closed AND we last auto-opened it today,
      // the pharmacist has manually closed it — respect that decision.
      // We still allow auto-close (targetOpen=false) to proceed.
      if (targetOpen === true && bs.last_auto_opened_date === now.dateStr) {
        // Was auto-opened today then manually closed → skip re-opening
        continue;
      }

      // ── Apply state change ──────────────────────────────────────────────
      const updateData = {
        marketplace_enabled: targetOpen,
      };

      if (targetOpen === true) {
        // Record that we auto-opened today (prevents re-open after manual close)
        updateData.last_auto_opened_date = now.dateStr;
      }

      await prisma.branchMarketplaceSettings.update({
        where: { branch_id: bs.branch_id },
        data: updateData,
      });

      // ── Fire SSE to mobile ──────────────────────────────────────────────
      fireBranchStatusSSE(bs.branch_id, targetOpen, bs);

      if (targetOpen) {
        opened++;
        cronLogger.info(
          `[MarketplaceScheduler] Auto-opened branch ${bs.branch_id}`,
        );
      } else {
        closed++;
        cronLogger.info(
          `[MarketplaceScheduler] Auto-closed branch ${bs.branch_id}`,
        );
      }
    } catch (err) {
      cronLogger.error(
        `[MarketplaceScheduler] Failed to process branch ${bs.branch_id}: ${err.message}`,
      );
    }
  }

  if (opened > 0 || closed > 0) {
    cronLogger.info(
      `[MarketplaceScheduler] Done — opened: ${opened}, closed: ${closed}`,
    );
  }
}
