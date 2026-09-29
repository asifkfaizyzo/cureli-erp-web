// backend/src/modules/rider/shops/rider.shops.service.js (do not remove this comment)
import prisma from "../../../config/prisma.js";
import {
  computeBranchStatus,
  buildBranchHolidayMap,
} from "../../../utils/shopTiming.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";

/**
 * Resolves raw database logo keys/filenames to fully qualified S3/CloudFront URLs
 */
function resolveShopLogo(logoUrl) {
  if (!logoUrl) return null;
  
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
    return logoUrl;
  }

  let cleanKey = logoUrl.startsWith("/") ? logoUrl.slice(1) : logoUrl;
  if (!cleanKey.includes("/")) {
    cleanKey = `marketplace_assets/${cleanKey}`;
  }

  return resolveAssetUrl(cleanKey);
}

export async function getNearbyShops(lat, lng, radiusKm) {
  // 1. Raw SQL with Haversine formula
  const shops = await prisma.$queryRaw`
    SELECT
      bms.branch_id::text,
      b.shop_id::text AS shop_id,
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
      mp.logo_url,
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

  // 2. Map branches to their shops for Holiday check
  const branchIds = shops.map((s) => s.branch_id);
  const shopIds = shops.map((s) => s.shop_id);

  const shopToBranches = new Map();
  for (const s of shops) {
    if (!shopToBranches.has(s.shop_id)) {
      shopToBranches.set(s.shop_id, []);
    }
    shopToBranches.get(s.shop_id).push(s.branch_id);
  }

  // Use the standard marketplace holiday builder
  const holidayMap = await buildBranchHolidayMap(
    prisma,
    branchIds,
    shopIds,
    shopToBranches
  );

  // 3. Compute real-time status utilizing shopTiming.js engine
  return shops.map((shop) => {
    const holidays = holidayMap.get(shop.branch_id) || [];

    const { isOpen, statusMessage } = computeBranchStatus(
      {
        is24Hours: shop.is_24_hours,
        openingTime: shop.opening_time,
        closingTime: shop.closing_time,
        openDays: shop.open_days ?? [],
      },
      holidays
    );

    return {
      branch_id: shop.branch_id,
      shop_name: shop.shop_name,
      branch_name: shop.branch_name,
      lat: shop.lat,
      lng: shop.lng,
      address: shop.address,
      is_open: isOpen,
      status_message: statusMessage,
      is_live: shop.is_live,
      distance_km: Math.round(shop.distance_km * 10) / 10,
      logo_url: resolveShopLogo(shop.logo_url), // Resolved via assetUrl service!
    };
  });
}