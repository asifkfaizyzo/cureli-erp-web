import prisma from "../../../config/prisma.js";

// ── Helpers ──────────────────────────────────────────────────

/**
 * Returns current IST day name in uppercase (e.g., "MONDAY").
 */
function getCurrentDayName() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).toUpperCase();
}

/**
 * Returns current IST time as "HH:MM" (24-hour).
 */
function getCurrentISTTime() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return istString;
}

/**
 * Determines if a shop branch is currently open.
 *
 * Rules:
 * 1. is_24_hours → always open
 * 2. open_days is non-empty AND current day not in list → closed
 * 3. Current time outside opening_time–closing_time → closed
 * 4. Overnight hours (e.g., 22:00–06:00) handled correctly
 * 5. Holiday today → closed
 */
function calculateIsOpen(shop, holidaysSet) {
  // Holiday override
  if (holidaysSet.has(shop.branch_id)) return false;

  // 24-hour shop
  if (shop.is_24_hours) return true;

  // No hours configured — assume open if live
  if (!shop.opening_time || !shop.closing_time) return true;

  // Day check
  const currentDay = getCurrentDayName();
  if (
    shop.open_days &&
    shop.open_days.length > 0 &&
    !shop.open_days.includes(currentDay)
  ) {
    return false;
  }

  // Time check
  const now = getCurrentISTTime(); // "HH:MM"
  const open = shop.opening_time; // "HH:MM"
  const close = shop.closing_time; // "HH:MM"

  if (open <= close) {
    // Normal hours: e.g., 09:00–21:00
    return now >= open && now <= close;
  } else {
    // Overnight hours: e.g., 22:00–06:00
    return now >= open || now <= close;
  }
}

// ── Main Service ─────────────────────────────────────────────

export async function getNearbyShops(lat, lng, radiusKm) {
  // 1. Raw SQL with Haversine formula
  //    Prisma doesn't support geospatial natively, so we use $queryRaw.
  //    All decimal columns are cast to float8 for math operations.
  const shops = await prisma.$queryRaw`
    SELECT
      bms.branch_id::text,
      s.business_name AS shop_name,
      b.branch_name,
      bms.latitude::float8 AS lat,
      bms.longitude::float8 AS lng,
      COALESCE(bms.formatted_address, b.address_line_1, '') AS address,
      bms.opening_time,
      bms.closing_time,
      bms.is_24_hours,
      bms.open_days,
      mp.is_live,
      (
        6371 * acos(
          cos(radians(${lat})) *
          cos(radians(bms.latitude::float8)) *
          cos(radians(bms.longitude::float8) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(bms.latitude::float8))
        )
      )::float8 AS distance_km
    FROM branch_marketplace_settings bms
    JOIN branches b ON b.branch_id = bms.branch_id
    JOIN shops s ON s.shop_id = b.shop_id
    JOIN marketplace_profiles mp ON mp.shop_id = s.shop_id
    WHERE bms.latitude IS NOT NULL
      AND bms.longitude IS NOT NULL
      AND s.is_active = true
      AND mp.marketplace_status = 'LIVE'
      AND (
        6371 * acos(
          cos(radians(${lat})) *
          cos(radians(bms.latitude::float8)) *
          cos(radians(bms.longitude::float8) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(bms.latitude::float8))
        )
      ) <= ${radiusKm}
    ORDER BY distance_km ASC
    LIMIT 200
  `;

  if (shops.length === 0) return [];

  // 2. Batch-fetch today's holidays for all returned branches
  const branchIds = shops.map((s) => s.branch_id);
  const todayIST = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // "YYYY-MM-DD"

  const holidays = await prisma.branchHoliday.findMany({
    where: {
      branch_id: { in: branchIds },
      holiday_date: new Date(todayIST + "T00:00:00.000Z"),
    },
    select: { branch_id: true },
  });

  const holidaysSet = new Set(holidays.map((h) => h.branch_id));

  // 3. Calculate is_open for each shop
  return shops.map((shop) => ({
    branch_id: shop.branch_id,
    shop_name: shop.shop_name,
    branch_name: shop.branch_name,
    lat: shop.lat,
    lng: shop.lng,
    address: shop.address,
    is_open: calculateIsOpen(shop, holidaysSet),
    is_live: shop.is_live,
    distance_km: Math.round(shop.distance_km * 10) / 10,
  }));
}