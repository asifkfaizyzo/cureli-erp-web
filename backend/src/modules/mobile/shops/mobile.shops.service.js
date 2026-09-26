// backend/src/modules/mobile/shops/mobile.shops.service.js (do not remove this comment)
// backend/src/modules/mobile/shops/mobile.shops.service.js
//
// ◄◄ CHANGED: Now imports timing logic from shared shopTiming utility.
// ◄◄ CHANGED: Adds holiday-aware status messages to all branch payloads.
// ◄◄ CHANGED: Sorting puts open shops first, closed shops last.

import prisma from "../../../config/prisma.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";
import {
  computeBranchStatus,
  buildBranchHolidayMap,
} from "../../../utils/shopTiming.js";

// ── Marketplace asset resolver ────────────────────────────────

const PUBLIC_API_ORIGIN = process.env.PUBLIC_API_ORIGIN || null;

if (!PUBLIC_API_ORIGIN) {
  console.warn(
    "[mobile.shops] WARNING: PUBLIC_API_ORIGIN is not set. " +
      "Marketplace asset URLs (logo/banner/branch image) will be returned " +
      "as relative paths and will not load in the mobile app.",
  );
}

function resolveMarketplaceAsset(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (!PUBLIC_API_ORIGIN) return pathOrUrl;
  const origin = PUBLIC_API_ORIGIN.endsWith("/")
    ? PUBLIC_API_ORIGIN.slice(0, -1)
    : PUBLIC_API_ORIGIN;
  const suffix = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${suffix}`;
}

// ── Haversine distance ────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return Math.round(km * 10) / 10;
}

// ── Feed item helpers ─────────────────────────────────────────

function resolveVariantImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((key) => resolveAssetUrl(key))
    .filter((url) => typeof url === "string" && url.length > 0);
}

function buildStrength(strengthValue, strengthUnit) {
  if (strengthValue === null || strengthValue === undefined) return null;
  return `${strengthValue}${strengthUnit || ""}`;
}

function toFeedItem(variant, listingRxOverride = null) {
  const images = resolveVariantImages(variant.images);
  return {
    variantId: variant.variant_id,
    skuId: variant.sku_id,
    name: variant.name,
    brand: variant.brand ?? null,
    composition: variant.composition ?? [],
    strength: buildStrength(variant.strength_value, variant.strength_unit),
    manufacturer: variant.manufacturer ?? null,
    packSize: variant.pack_size ?? null,
    image: images[0] ?? null,
    prescriptionRequired:
      listingRxOverride !== null
        ? listingRxOverride
        : (variant.master?.prescription_required ?? false),
    form: variant.master?.form ?? null,
    category: variant.master?.primary_category ?? null,
    genericName: variant.master?.generic_name ?? null,
    type: variant.master?.type ?? null,
  };
}

const VARIANT_SELECT = {
  variant_id: true,
  sku_id: true,
  name: true,
  brand: true,
  composition: true,
  strength_value: true,
  strength_unit: true,
  manufacturer: true,
  pack_size: true,
  images: true,
  master: {
    select: {
      generic_name: true,
      type: true,
      form: true,
      prescription_required: true,
      primary_category: true,
    },
  },
};

// ── Shape helpers ─────────────────────────────────────────────

/**
 * Shape a BranchMarketplaceSettings row into a BranchResult.
 * ◄◄ CHANGED: Now accepts holidayDates and uses computeBranchStatus.
 */
function shapeBranch(bs, userLat, userLng, listedMedicineCount = 0, holidayDates = []) {
  const lat = bs.latitude ? Number(bs.latitude) : null;
  const lng = bs.longitude ? Number(bs.longitude) : null;

  // ◄◄ CHANGED: Use unified timing engine
  const { isOpen, statusMessage } = computeBranchStatus(
    {
      is24Hours: bs.is_24_hours,
      openingTime: bs.opening_time,
      closingTime: bs.closing_time,
      openDays: bs.open_days ?? [],
    },
    holidayDates,
  );

  return {
    branchId: bs.branch_id,
    branchName: bs.branch?.branch_name ?? null,
    address: bs.formatted_address ?? null,
    latitude: lat,
    longitude: lng,
    distanceKm: haversineKm(userLat, userLng, lat, lng),
    isOpen,
    statusMessage, // ◄◄ NEW
    is24Hours: bs.is_24_hours,
    openDays: bs.open_days ?? [],
    openingTime: bs.opening_time ?? null,
    closingTime: bs.closing_time ?? null,
    pickupEnabled: bs.pickup_enabled,
    deliveryEnabled: bs.delivery_enabled,
    contact: bs.contact_override ?? bs.branch?.contact_number ?? null,
    marketplaceEnabled: bs.marketplace_enabled,
    listedMedicineCount,
    deliveryTimeEstimate: null,
  };
}

// ── SEARCH SHOPS ──────────────────────────────────────────────

export async function searchShops({ q, lat, lng, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const hasLocation = lat != null && lng != null;
  const hasQuery = q && q.trim().length >= 2;
  const RADIUS_LIMIT_KM = 20.0;

  const profileWhere = {
    is_live: true,
    ...(hasQuery
      ? {
          OR: [
            { storefront_name: { contains: q.trim(), mode: "insensitive" } },
            {
              storefront_description: {
                contains: q.trim(),
                mode: "insensitive",
              },
            },
            {
              shop: {
                business_name: { contains: q.trim(), mode: "insensitive" },
              },
            },
            {
              branchSettings: {
                some: {
                  marketplace_enabled: true,
                  formatted_address: {
                    contains: q.trim(),
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [profiles, total] = await Promise.all([
    prisma.marketplaceProfile.findMany({
      where: profileWhere,
      select: {
        marketplace_profile_id: true,
        shop_id: true,
        storefront_name: true,
        storefront_description: true,
        logo_url: true,
        shop: {
          select: { business_name: true, shop_id: true },
        },
        branchSettings: {
          where: { marketplace_enabled: true },
          select: {
            branch_id: true,
            marketplace_enabled: true,
            latitude: true,
            longitude: true,
            formatted_address: true,
            opening_time: true,
            closing_time: true,
            open_days: true,
            is_24_hours: true,
            pickup_enabled: true,
            delivery_enabled: true,
            contact_override: true,
            branch: {
              select: { branch_name: true, contact_number: true },
            },
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.marketplaceProfile.count({ where: profileWhere }),
  ]);

  const shopIds = profiles.map((p) => p.shop_id);

  const listingCounts = await prisma.marketplaceListing.groupBy({
    by: ["shop_id"],
    where: {
      shop_id: { in: shopIds },
      is_visible: true,
      stock_status: "IN_STOCK",
    },
    _count: { listing_id: true },
  });

  const countMap = new Map(
    listingCounts.map((lc) => [lc.shop_id, lc._count.listing_id]),
  );

  // ◄◄ CHANGED: Fetch holidays for all branches in this result set
  const allBranchIds = profiles.flatMap((p) =>
    p.branchSettings.map((bs) => bs.branch_id),
  );
  const shopToBranches = new Map();
  for (const p of profiles) {
    shopToBranches.set(
      p.shop_id,
      p.branchSettings.map((bs) => bs.branch_id),
    );
  }
  const holidayMap = await buildBranchHolidayMap(
    prisma,
    allBranchIds,
    shopIds,
    shopToBranches,
  );

  const shops = profiles
    .map((profile) => {
      const name = profile.storefront_name || profile.shop.business_name;
      const listedMedicineCount = countMap.get(profile.shop_id) ?? 0;

      let nearestBranch = null;

      if (profile.branchSettings.length > 0) {
        if (hasLocation) {
          const withDistance = profile.branchSettings.map((bs) => ({
            bs,
            dist: haversineKm(
              lat,
              lng,
              bs.latitude ? Number(bs.latitude) : null,
              bs.longitude ? Number(bs.longitude) : null,
            ),
          }));

          withDistance.sort((a, b) => {
            if (a.dist === null) return 1;
            if (b.dist === null) return -1;
            return a.dist - b.dist;
          });

          const holidays = holidayMap.get(withDistance[0].bs.branch_id) || [];
          nearestBranch = shapeBranch(
            withDistance[0].bs,
            lat,
            lng,
            listedMedicineCount,
            holidays,
          );
        } else {
          const sorted = [...profile.branchSettings].sort((a, b) =>
            (a.branch?.branch_name ?? "").localeCompare(
              b.branch?.branch_name ?? "",
            ),
          );
          const holidays = holidayMap.get(sorted[0].branch_id) || [];
          nearestBranch = shapeBranch(
            sorted[0],
            null,
            null,
            listedMedicineCount,
            holidays,
          );
        }
      }

      return {
        shopId: profile.shop_id,
        name,
        description: profile.storefront_description ?? null,
        logoUrl: resolveMarketplaceAsset(profile.logo_url),
        nearestBranch,
        totalBranches: profile.branchSettings.length,
        listedMedicineCount,
        rating: null,
      };
    })
    .filter((shop) => {
      if (!hasLocation || !shop.nearestBranch) return true;
      return (
        shop.nearestBranch.distanceKm !== null &&
        shop.nearestBranch.distanceKm <= RADIUS_LIMIT_KM
      );
    })
    // ◄◄ CHANGED: Open shops first, then by distance/count
    .sort((a, b) => {
      const aOpen = a.nearestBranch?.isOpen ? 1 : 0;
      const bOpen = b.nearestBranch?.isOpen ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;

      if (hasLocation) {
        const dA = a.nearestBranch?.distanceKm ?? Infinity;
        const dB = b.nearestBranch?.distanceKm ?? Infinity;
        return dA - dB;
      }
      return b.listedMedicineCount - a.listedMedicineCount;
    });

  const totalPages = Math.ceil(total / limit);

  return {
    shops,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ── GET SHOP PROFILE ──────────────────────────────────────────

export async function getShopProfile(shopId, lat, lng) {
  const hasLocation = lat != null && lng != null;
  const RADIUS_LIMIT_KM = 20.0;

  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id: shopId },
    select: {
      marketplace_profile_id: true,
      shop_id: true,
      storefront_name: true,
      storefront_description: true,
      support_phone: true,
      logo_url: true,
      banner_url: true,
      is_live: true,
      marketplace_status: true,
      shop: {
        select: { business_name: true, city: true, state: true },
      },
      branchSettings: {
        select: {
          branch_id: true,
          marketplace_enabled: true,
          latitude: true,
          longitude: true,
          formatted_address: true,
          opening_time: true,
          closing_time: true,
          open_days: true,
          is_24_hours: true,
          pickup_enabled: true,
          delivery_enabled: true,
          contact_override: true,
          shop_image_url: true,
          branch: {
            select: {
              branch_name: true,
              contact_number: true,
              is_active: true,
            },
          },
        },
      },
    },
  });

  if (!profile) return null;
  if (!profile.is_live) return null;

  const branchIds = profile.branchSettings.map((bs) => bs.branch_id);

  const branchListingCounts = await prisma.marketplaceListing.groupBy({
    by: ["branch_id"],
    where: {
      branch_id: { in: branchIds },
      is_visible: true,
      stock_status: "IN_STOCK",
    },
    _count: { listing_id: true },
  });

  const branchCountMap = new Map(
    branchListingCounts.map((blc) => [blc.branch_id, blc._count.listing_id]),
  );

  // ◄◄ CHANGED: Fetch holidays for this shop's branches
  const shopToBranches = new Map([[shopId, branchIds]]);
  const holidayMap = await buildBranchHolidayMap(
    prisma,
    branchIds,
    [shopId],
    shopToBranches,
  );

  const branches = profile.branchSettings
    .map((bs) => {
      const count = branchCountMap.get(bs.branch_id) ?? 0;
      const holidays = holidayMap.get(bs.branch_id) || [];
      const shaped = shapeBranch(
        bs,
        hasLocation ? lat : null,
        hasLocation ? lng : null,
        count,
        holidays,
      );
      return {
        ...shaped,
        shopImageUrl: resolveMarketplaceAsset(bs.shop_image_url),
        isActive: bs.branch?.is_active ?? true,
      };
    })
    .filter((b) => {
      if (!hasLocation) return true;
      return b.distanceKm !== null && b.distanceKm <= RADIUS_LIMIT_KM;
    });

  // ◄◄ CHANGED: Open branches first, then by distance/name
  branches.sort((a, b) => {
    if (a.marketplaceEnabled !== b.marketplaceEnabled) {
      return a.marketplaceEnabled ? -1 : 1;
    }
    const aOpen = a.isOpen ? 1 : 0;
    const bOpen = b.isOpen ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;

    if (hasLocation) {
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    }
    return (a.branchName ?? "").localeCompare(b.branchName ?? "");
  });

  const name = profile.storefront_name || profile.shop.business_name;

  return {
    shopId: profile.shop_id,
    name,
    description: profile.storefront_description ?? null,
    logoUrl: resolveMarketplaceAsset(profile.logo_url),
    bannerUrl: resolveMarketplaceAsset(profile.banner_url),
    supportPhone: profile.support_phone ?? null,
    marketplaceStatus: profile.marketplace_status,
    isLive: profile.is_live,
    branches,
    rating: null,
  };
}

// ── GET BRANCH MEDICINES ──────────────────────────────────────

export async function getBranchMedicines(
  shopId,
  branchId,
  { search, page = 1, limit = 20 },
) {
  const skip = (page - 1) * limit;

  const branch = await prisma.branchMarketplaceSettings.findFirst({
    where: {
      branch_id: branchId,
      marketplaceProfile: { shop_id: shopId, is_live: true },
    },
    select: { branch_id: true },
  });

  if (!branch) return null;

  const searchFilter =
    search && search.trim().length >= 1
      ? {
          OR: [
            {
              linkedVariant: {
                name: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              linkedVariant: {
                brand: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              linkedVariant: {
                master: {
                  generic_name: {
                    contains: search.trim(),
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {};

  const where = {
    shop_id: shopId,
    branch_id: branchId,
    is_visible: true,
    stock_status: "IN_STOCK",
    ...searchFilter,
  };

  const allListings = await prisma.marketplaceListing.findMany({
    where,
    orderBy: { linkedVariant: { name: "asc" } },
    select: {
      listing_id: true,
      marketplace_price: true,
      requires_prescription: true,
      stock_status: true,
      linkedVariant: { select: VARIANT_SELECT },
    },
  });

  const seenVariantIds = new Set();
  const uniqueListings = allListings.filter((l) => {
    if (!l.linkedVariant) return false;
    const vid = l.linkedVariant.variant_id;
    if (seenVariantIds.has(vid)) return false;
    seenVariantIds.add(vid);
    return true;
  });

  const total = uniqueListings.length;
  const totalPages = Math.ceil(total / limit);
  const pageListings = uniqueListings.slice(skip, skip + limit);

  const medicines = pageListings.map((l) => ({
    ...toFeedItem(l.linkedVariant, l.requires_prescription),
    listingPrice: l.marketplace_price ? Number(l.marketplace_price) : null,
    requiresPrescription: l.requires_prescription,
    stockStatus: l.stock_status,
  }));

  return {
    medicines,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}