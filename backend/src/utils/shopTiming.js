// backend/src/utils/shopTiming.js (do not remove this comment)
// backend/src/utils/shopTiming.js
//
// Unified branch timing engine for the Cureli marketplace.
// Single source of truth for open/closed computation, "closes soon"
// detection, and human-readable status messages.
//
// Used by:
//   - mobile.shops.service.js   (search + profile)
//   - mobile.medicines.service.js (medicine → pharmacy listings)
//
// All time logic runs in IST (UTC+5:30) regardless of server timezone.

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CLOSES_SOON_MINS = 45;
const OPENS_SOON_MINS = 45;

// ── IST helpers ───────────────────────────────────────────────

/**
 * Get current IST date/time components.
 * Works correctly regardless of the server's system timezone.
 */
export function getNowIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const ist = new Date(istMs);
  return {
    hours: ist.getHours(),
    minutes: ist.getMinutes(),
    dayOfWeek: ist.getDay(),
    year: ist.getFullYear(),
    month: ist.getMonth() + 1,
    day: ist.getDate(),
    date: ist,
  };
}

/**
 * Parse "HH:MM" → total minutes since midnight.
 * Returns null for null/undefined/malformed input.
 */
export function toMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Convert "HH:MM" (24h) → "H:MM AM/PM" (12h).
 * Examples: "09:00" → "9:00 AM", "21:30" → "9:30 PM", "00:00" → "12:00 AM"
 */
export function formatTime12(timeStr) {
  if (!timeStr) return null;
  const mins = toMinutes(timeStr);
  if (mins === null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Convert any JS Date to "YYYY-MM-DD" in IST.
 * Used for comparing Prisma holiday dates against IST calendar.
 */
export function getISTDateString(date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const ist = new Date(istMs);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Core open/closed check ────────────────────────────────────

/**
 * Compute whether a branch is currently open.
 * Handles day-of-week, overnight windows, and 24h branches.
 *
 * @param {boolean}     is24Hours
 * @param {string|null} openingTime  "HH:MM"
 * @param {string|null} closingTime  "HH:MM"
 * @param {string[]}    openDays     ["MON","TUE",...]
 * @returns {boolean}
 */
export function computeIsOpen(is24Hours, openingTime, closingTime, openDays = []) {
  if (is24Hours) return true;

  const ist = getNowIST();
  const todayDay = DAY_NAMES[ist.dayOfWeek];

  if (!Array.isArray(openDays) || openDays.length === 0) return false;
  if (!openDays.includes(todayDay)) return false;

  const open = toMinutes(openingTime);
  const close = toMinutes(closingTime);
  if (open === null || close === null) return false;

  const nowMins = ist.hours * 60 + ist.minutes;

  if (open <= close) {
    return nowMins >= open && nowMins < close;
  } else {
    // Overnight window e.g. 22:00 → 06:00
    return nowMins >= open || nowMins < close;
  }
}

// ── Next open slot finder ─────────────────────────────────────

/**
 * Scan forward up to maxDays to find the next day the branch is open
 * (present in openDays AND not in the holiday list).
 *
 * @param {string[]} openDays          ["MON","TUE",...]
 * @param {string}   openingTime       "HH:MM"
 * @param {string[]} holidayDateStrings ["YYYY-MM-DD",...] in IST
 * @param {number}   maxDays           search window (default 7)
 * @returns {{ dayLabel: string, offset: number, openingTime: string } | null}
 */
export function findNextOpenSlot(openDays, openingTime, holidayDateStrings, maxDays = 7) {
  if (!Array.isArray(openDays) || openDays.length === 0) return null;
  if (!openingTime) return null;

  const ist = getNowIST();
  const todayDayIdx = ist.dayOfWeek;
  const nowMins = ist.hours * 60 + ist.minutes;
  const openMins = toMinutes(openingTime);

  for (let offset = 0; offset < maxDays; offset++) {
    const checkDayIdx = (todayDayIdx + offset) % 7;
    const checkDayName = DAY_NAMES[checkDayIdx];

    if (!openDays.includes(checkDayName)) continue;

    // Compute IST date string for this offset
    const checkDate = new Date(ist.date);
    checkDate.setDate(checkDate.getDate() + offset);
    const checkDateStr = getISTDateString(checkDate);

    // Skip holidays
    if (holidayDateStrings.includes(checkDateStr)) continue;

    // If today, only count if opening time hasn't passed yet
    if (offset === 0 && openMins !== null && nowMins >= openMins) {
      continue;
    }

    return {
      dayLabel: DAY_LABELS[checkDayIdx],
      offset,
      openingTime,
    };
  }

  return null;
}

// ── Full status computation ───────────────────────────────────

/**
 * Compute branch open/closed status with a human-readable message.
 *
 * @param {object}   config
 * @param {boolean}  config.is24Hours
 * @param {string|null} config.openingTime  "HH:MM"
 * @param {string|null} config.closingTime  "HH:MM"
 * @param {string[]} config.openDays        ["MON","TUE",...]
 * @param {string[]} holidayDateStrings     ["YYYY-MM-DD",...] in IST
 * @returns {{ isOpen: boolean, statusMessage: string }}
 */
export function computeBranchStatus(config, holidayDateStrings = []) {
  const { is24Hours, openingTime, closingTime, openDays = [] } = config;

  // ── 24-hour branches ──────────────────────────────────────
  if (is24Hours) {
    return { isOpen: true, statusMessage: "Open 24 hours" };
  }

  const ist = getNowIST();
  const todayDay = DAY_NAMES[ist.dayOfWeek];
  const nowMins = ist.hours * 60 + ist.minutes;
  const todayStr = getISTDateString(ist.date);

  const isTodayOpenDay = Array.isArray(openDays) && openDays.includes(todayDay);
  const isTodayHoliday = holidayDateStrings.includes(todayStr);

  const openMins = toMinutes(openingTime);
  const closeMins = toMinutes(closingTime);

  // ── Check if currently open ───────────────────────────────
  const rawIsOpen = computeIsOpen(false, openingTime, closingTime, openDays);
  const isOpen = rawIsOpen && !isTodayHoliday;

  if (isOpen) {
    // Check "closes soon"
    if (closeMins !== null) {
      let minsUntilClose;
      if (openMins !== null && openMins <= closeMins) {
        // Normal window
        minsUntilClose = closeMins - nowMins;
      } else {
        // Overnight window
        minsUntilClose =
          nowMins >= (openMins ?? 0)
            ? 1440 - nowMins + closeMins
            : closeMins - nowMins;
      }

      if (minsUntilClose > 0 && minsUntilClose <= CLOSES_SOON_MINS) {
        return {
          isOpen: true,
          statusMessage: `Closes soon at ${formatTime12(closingTime)}`,
        };
      }
    }
    return {
      isOpen: true,
      statusMessage: `Open until ${formatTime12(closingTime)}`,
    };
  }

  // ── Shop is closed — determine when it opens next ─────────

  // Case 1: Opens later today (not a holiday, open day, before opening time)
  if (isTodayOpenDay && !isTodayHoliday && openMins !== null && nowMins < openMins) {
    const minsUntilOpen = openMins - nowMins;
    if (minsUntilOpen <= OPENS_SOON_MINS) {
      return {
        isOpen: false,
        statusMessage: `Opens soon at ${formatTime12(openingTime)}`,
      };
    }
    return {
      isOpen: false,
      statusMessage: `Opens today at ${formatTime12(openingTime)}`,
    };
  }

  // Case 2: Find next open day (skipping holidays and non-open days)
  const nextSlot = findNextOpenSlot(openDays, openingTime, holidayDateStrings, 7);

  if (!nextSlot) {
    return { isOpen: false, statusMessage: "Closed" };
  }

  if (nextSlot.offset === 1) {
    return {
      isOpen: false,
      statusMessage: `Opens tomorrow at ${formatTime12(nextSlot.openingTime)}`,
    };
  }

  return {
    isOpen: false,
    statusMessage: `Opens ${nextSlot.dayLabel} at ${formatTime12(nextSlot.openingTime)}`,
  };
}

// ── Holiday map builder ───────────────────────────────────────

/**
 * Build a Map<branchId, string[]> of IST holiday date strings
 * for the next 7 days. Handles both BRANCH and SHOP scope holidays.
 *
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string[]} branchIds
 * @param {string[]} shopIds
 * @param {Map<string, string[]>} shopToBranches  shopId → branchId[]
 * @returns {Promise<Map<string, string[]>>}
 */
export async function buildBranchHolidayMap(prisma, branchIds, shopIds, shopToBranches) {
  if (branchIds.length === 0 && shopIds.length === 0) {
    return new Map();
  }

  const ist = getNowIST();
  const todayStr = `${ist.year}-${String(ist.month).padStart(2, "0")}-${String(ist.day).padStart(2, "0")}`;
  const nextWeek = new Date(ist.date);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nwStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, "0")}-${String(nextWeek.getDate()).padStart(2, "0")}`;

  const orConditions = [];
  if (branchIds.length > 0) {
    orConditions.push({ branch_id: { in: branchIds } });
  }
  if (shopIds.length > 0) {
    orConditions.push({ shop_id: { in: shopIds } });
  }

  const holidays = await prisma.branchHoliday.findMany({
    where: {
      OR: orConditions,
      holiday_date: {
        gte: new Date(todayStr + "T00:00:00.000Z"),
        lte: new Date(nwStr + "T23:59:59.999Z"),
      },
    },
    select: {
      branch_id: true,
      shop_id: true,
      holiday_date: true,
      scope: true,
    },
  });

  const map = new Map();
  for (const bId of branchIds) {
    map.set(bId, []);
  }

  for (const h of holidays) {
    const dateStr = getISTDateString(h.holiday_date);

    if (h.scope === "BRANCH") {
      const arr = map.get(h.branch_id);
      if (arr && !arr.includes(dateStr)) arr.push(dateStr);
    } else {
      // SHOP scope — expand to all branches of this shop
      const bIds = shopToBranches.get(h.shop_id) || [];
      for (const bId of bIds) {
        const arr = map.get(bId);
        if (arr && !arr.includes(dateStr)) arr.push(dateStr);
      }
    }
  }

  return map;
}