// backend/src/modules/marketplace-listings/listings.service.js (do not remove this comment)
// backend/src/modules/marketplace-listings/listings.service.js

import prisma from "../../config/prisma.js";
import { resolveAssetUrl } from "../../services/assetUrl.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 10;

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function resolveCallerBranch(caller, requestedBranchId) {
  if (caller.role === "super_admin") {
    if (!requestedBranchId) throw new Error("branch_id is required");
    return requestedBranchId;
  }
  return caller.branch_id;
}

async function assertBranchBelongsToShop(branch_id, shop_id) {
  const branch = await prisma.branch.findFirst({
    where: { branch_id, shop_id, is_active: true },
    select: { branch_id: true },
  });
  if (!branch)
    throw new Error("Branch not found or does not belong to this shop");
}

/**
 * Resolve image URL from a storage key or filename.
 * Handles full paths and bare filenames (using sku_id to build path).
 */
function resolveVariantImageUrl(variant) {
  if (!variant) return null;

  let imgs = variant.images;
  if (typeof imgs === "string") {
    try {
      imgs = JSON.parse(imgs);
    } catch {
      imgs = [];
    }
  }

  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    if (!first) return null;
    if (first.startsWith("medicine_images/")) return resolveAssetUrl(first);
    if (variant.sku_id)
      return resolveAssetUrl(`medicine_images/${variant.sku_id}/${first}`);
    return resolveAssetUrl(first);
  }

  return null;
}

async function getErpStock(medicine_id, branch_id) {
  const result = await prisma.inventory.aggregate({
    where: {
      medicine_id,
      branch_id,
      is_active: true,
      is_expired: false,
    },
    _sum: { available_stock: true },
  });
  return Number(result._sum.available_stock ?? 0);
}

async function getLatestSellingRate(medicine_id, branch_id) {
  const batch = await prisma.inventory.findFirst({
    where: {
      medicine_id,
      branch_id,
      is_active: true,
      is_expired: false,
      selling_rate: { not: null },
    },
    orderBy: { last_purchase_date: "desc" },
    select: { selling_rate: true },
  });
  return batch?.selling_rate ? Number(batch.selling_rate) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE LISTING FOR A MEDICINE
// ─────────────────────────────────────────────────────────────────────────────

export async function createListingForMedicine(
  medicine_id,
  branch_id,
  shop_id,
  variant_id
) {
  const existing = await prisma.marketplaceListing.findUnique({
    where: { medicine_id_branch_id: { medicine_id, branch_id } },
    select: { listing_id: true },
  });
  if (existing) return existing;

  const defaultPrice = await getLatestSellingRate(medicine_id, branch_id);

  return await prisma.marketplaceListing.create({
    data: {
      shop_id,
      branch_id,
      medicine_id,
      linked_variant_id: variant_id,
      is_visible: false,
      stock_status: "IN_STOCK",
      marketplace_price: defaultPrice,
      requires_prescription: false,
    },
    select: { listing_id: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLE UNLINK
// ─────────────────────────────────────────────────────────────────────────────

export async function handleMedicineUnlinked(medicine_id, branch_id) {
  await prisma.marketplaceListing.updateMany({
    where: { medicine_id, branch_id },
    data: { is_visible: false },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET BRANCH SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export async function getBranchSummary(shop_id, caller) {
  const branchSettings = await prisma.branchMarketplaceSettings.findMany({
    where: {
      marketplaceProfile: { shop_id },
      ...(caller.role !== "super_admin"
        ? { branch_id: caller.branch_id }
        : {}),
    },
    select: {
      branch_id: true,
      marketplace_enabled: true,
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          is_active: true,
        },
      },
    },
  });

  const summaries = await Promise.all(
    branchSettings.map(async (bs) => {
      const [liveCount, hiddenCount, outOfStockCount, totalLinked] =
        await Promise.all([
          prisma.marketplaceListing.count({
            where: {
              branch_id: bs.branch_id,
              shop_id,
              is_visible: true,
              stock_status: "IN_STOCK",
            },
          }),
          prisma.marketplaceListing.count({
            where: {
              branch_id: bs.branch_id,
              shop_id,
              is_visible: false,
            },
          }),
          prisma.marketplaceListing.count({
            where: {
              branch_id: bs.branch_id,
              shop_id,
              stock_status: "OUT_OF_STOCK",
            },
          }),
          prisma.marketplaceListing.count({
            where: { branch_id: bs.branch_id, shop_id },
          }),
        ]);

      return {
        branch_id: bs.branch_id,
        branch_name: bs.branch.branch_name,
        marketplace_enabled: bs.marketplace_enabled,
        live_count: liveCount,
        hidden_count: hiddenCount,
        out_of_stock_count: outOfStockCount,
        total_linked: totalLinked,
      };
    })
  );

  return summaries;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getCategories(shop_id, branch_id, caller) {
  const effectiveBranchId = resolveCallerBranch(caller, branch_id);
  await assertBranchBelongsToShop(effectiveBranchId, shop_id);

  const listings = await prisma.marketplaceListing.findMany({
    where: { shop_id, branch_id: effectiveBranchId },
    select: {
      linkedVariant: {
        select: {
          master: {
            select: { primary_category: true },
          },
        },
      },
    },
  });

  const categoryMap = new Map();
  for (const listing of listings) {
    const cat = listing.linkedVariant?.master?.primary_category;
    if (!cat) continue;
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }

  const visibilityRows = await prisma.branchCategoryVisibility.findMany({
    where: { branch_id: effectiveBranchId, shop_id },
    select: { category_name: true, is_enabled: true },
  });
  const visibilityMap = new Map(
    visibilityRows.map((r) => [r.category_name, r.is_enabled])
  );

  const categories = Array.from(categoryMap.entries())
    .map(([category_name, count]) => ({
      category_name,
      display_name: category_name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" "),
      count,
      is_enabled: visibilityMap.has(category_name)
        ? visibilityMap.get(category_name)
        : true,
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  return categories;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CATEGORY VISIBILITY
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCategoryVisibility(
  shop_id,
  branch_id,
  category_name,
  is_enabled,
  caller
) {
  if (caller.role === "staff") {
    throw new Error("Staff cannot modify category visibility");
  }

  const effectiveBranchId = resolveCallerBranch(caller, branch_id);
  await assertBranchBelongsToShop(effectiveBranchId, shop_id);

  await prisma.branchCategoryVisibility.upsert({
    where: {
      branch_id_category_name: {
        branch_id: effectiveBranchId,
        category_name,
      },
    },
    create: {
      branch_id: effectiveBranchId,
      shop_id,
      category_name,
      is_enabled,
    },
    update: { is_enabled },
  });

  return { branch_id: effectiveBranchId, category_name, is_enabled };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getListings(shop_id, query, caller) {
  const {
    branch_id,
    page = 1,
    limit = 20,
    search = "",
    category = "",
    visibility = "all",
    stock = "all",
    sort = "name_asc",
    tab = "linked",
  } = query;

  const effectiveBranchId = resolveCallerBranch(caller, branch_id);
  await assertBranchBelongsToShop(effectiveBranchId, shop_id);

  if (tab === "unlinked") {
    return getUnlinkedMedicines(shop_id, effectiveBranchId, {
      page,
      limit,
      search,
    });
  }

  return getLinkedListings(shop_id, effectiveBranchId, {
    page: Number(page),
    limit: Number(limit),
    search,
    category,
    visibility,
    stock,
    sort,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET LINKED LISTINGS — internal
// ─────────────────────────────────────────────────────────────────────────────

async function getLinkedListings(shop_id, branch_id, filters) {
  const { page, limit, search, category, visibility, stock, sort } = filters;
  const skip = (page - 1) * limit;

  const where = { shop_id, branch_id };

  if (visibility === "visible") where.is_visible = true;
  if (visibility === "hidden") where.is_visible = false;
  if (stock === "in_stock") where.stock_status = "IN_STOCK";
  if (stock === "out_of_stock") where.stock_status = "OUT_OF_STOCK";

  const categoryFilter = category
    ? {
        linkedVariant: {
          master: {
            primary_category: { equals: category, mode: "insensitive" },
          },
        },
      }
    : {};

  const searchFilter =
    search.trim().length > 0
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
            {
              medicine: {
                manufacturer: {
                  contains: search.trim(),
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {};

  const combinedWhere = { ...where, ...categoryFilter, ...searchFilter };

  const orderByMap = {
    name_asc: { linkedVariant: { name: "asc" } },
    name_desc: { linkedVariant: { name: "desc" } },
    price_asc: { marketplace_price: "asc" },
    price_desc: { marketplace_price: "desc" },
    stock_asc: { linkedVariant: { name: "asc" } },
  };
  const orderBy = orderByMap[sort] ?? { linkedVariant: { name: "asc" } };

  const includeClause = {
    medicine: {
      select: {
        medicine_id: true,
        name: true,
        manufacturer: true,
      },
    },
    linkedVariant: {
      select: {
        variant_id: true,
        sku_id: true,
        name: true,
        brand: true,
        pack_size: true,
        manufacturer: true,
        selling_price: true,
        images: true,
        master: {
          select: {
            master_medicine_id: true,
            generic_name: true,
            primary_category: true,
            form: true,
          },
        },
      },
    },
  };

  const [rawListings, total] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: combinedWhere,
      include: includeClause,
      orderBy,
      skip,
      take: Number(limit),
    }),
    prisma.marketplaceListing.count({ where: combinedWhere }),
  ]);

  const enriched = await Promise.all(
    rawListings.map(async (listing) => {
      const erpStock = await getErpStock(listing.medicine_id, branch_id);
      const imageUrl = resolveVariantImageUrl(listing.linkedVariant);

      return {
        listing_id: listing.listing_id,
        medicine_id: listing.medicine_id,
        branch_id: listing.branch_id,

        catalog_name: listing.linkedVariant?.name ?? listing.medicine.name,
        brand: listing.linkedVariant?.brand ?? null,
        generic_name: listing.linkedVariant?.master?.generic_name ?? null,
        primary_category:
          listing.linkedVariant?.master?.primary_category ?? null,
        pack_size: listing.linkedVariant?.pack_size ?? null,
        form: listing.linkedVariant?.master?.form ?? null,
        manufacturer:
          listing.linkedVariant?.manufacturer ?? listing.medicine.manufacturer,
        image_url: imageUrl,

        erp_name: listing.medicine.name,
        erp_stock: erpStock,
        is_low_stock: erpStock > 0 && erpStock <= LOW_STOCK_THRESHOLD,

        is_visible: listing.is_visible,
        stock_status: listing.stock_status,
        requires_prescription: listing.requires_prescription,
        marketplace_price:
          listing.marketplace_price != null
            ? Number(listing.marketplace_price)
            : null,
      };
    })
  );

  if (sort === "stock_asc") {
    enriched.sort((a, b) => a.erp_stock - b.erp_stock);
  }

  return {
    items: enriched,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET UNLINKED MEDICINES — internal
// ─────────────────────────────────────────────────────────────────────────────

async function getUnlinkedMedicines(shop_id, branch_id, filters) {
  const { page = 1, limit = 20, search = "" } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    shop_id,
    branch_id,
    linked_variant_id: null,
    link_rejected: false,
  };

  if (search.trim().length > 0) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { manufacturer: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id: true,
        name: true,
        manufacturer: true,
        link_status: true,
        category: true,
      },
      orderBy: { name: "asc" },
      skip,
      take: Number(limit),
    }),
    prisma.medicine.count({ where }),
  ]);

  const enriched = await Promise.all(
    medicines.map(async (m) => {
      const erpStock = await getErpStock(m.medicine_id, branch_id);
      return {
        medicine_id: m.medicine_id,
        erp_name: m.name,
        manufacturer: m.manufacturer,
        link_status: m.link_status,
        erp_stock: erpStock,
      };
    })
  );

  return {
    items: enriched,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET LISTING DETAIL — lazy loaded when drawer opens
// ─────────────────────────────────────────────────────────────────────────────

export async function getListingDetail(listing_id, shop_id, caller) {
  // Fetch the listing with all relations
  const listing = await prisma.marketplaceListing.findUnique({
    where: { listing_id },
    include: {
      medicine: {
        select: {
          medicine_id: true,
          name: true,
          generic_name: true,
          manufacturer: true,
          category: true,
          sub_category: true,
          schedule: true,
          hsn_code: true,
          pack_size: true,
          unit_of_measure: true,
          gst_percentage: true,
          cgst_percentage: true,
          sgst_percentage: true,
          rack_no: true,
          link_status: true,
          linked_at: true,
          linked_by_type: true,
          link_confidence_score: true,
        },
      },
      linkedVariant: {
        select: {
          variant_id: true,
          sku_id: true,
          name: true,
          brand: true,
          pack_size: true,
          manufacturer: true,
          marketer: true,
          selling_price: true,
          mrp: true,
          strength_value: true,
          strength_unit: true,
          composition: true,
          description: true,
          images: true,
          master: {
            select: {
              master_medicine_id: true,
              master_key: true,
              generic_name: true,
              primary_category: true,
              form: true,
              type: true,
              composition: true,
            },
          },
        },
      },
    },
  });

  if (!listing) throw new Error("Listing not found");
  if (listing.shop_id !== shop_id) throw new Error("Listing not found");

  // Branch access check for non-SA
  if (
    caller.role !== "super_admin" &&
    listing.branch_id !== caller.branch_id
  ) {
    throw new Error("Access denied to this listing");
  }

  // Fetch all images from MasterMedicineImage table using sku_id
  // This is the proper source — ordered PRIMARY first then GALLERY
  const variantImages = listing.linkedVariant?.sku_id
    ? await prisma.masterMedicineImage.findMany({
        where: { sku_id: listing.linkedVariant.sku_id },
        orderBy: [{ type: "asc" }, { sequence: "asc" }],
        select: {
          image_id: true,
          url: true,
          type: true,
          sequence: true,
          source: true,
        },
      })
    : [];

  // Resolve all image URLs
  const resolvedImages = variantImages.map((img) => ({
    image_id: img.image_id,
    url: resolveAssetUrl(img.url),
    type: img.type,
    sequence: img.sequence,
    source: img.source,
  }));

  // If no images in MasterMedicineImage table, fall back to variant JSON array
  let allImages = resolvedImages;
  if (allImages.length === 0 && listing.linkedVariant?.images) {
    let imgs = listing.linkedVariant.images;
    if (typeof imgs === "string") {
      try {
        imgs = JSON.parse(imgs);
      } catch {
        imgs = [];
      }
    }
    if (Array.isArray(imgs)) {
      allImages = imgs
        .filter(Boolean)
        .map((filename, index) => {
          const key = filename.startsWith("medicine_images/")
            ? filename
            : `medicine_images/${listing.linkedVariant.sku_id}/${filename}`;
          return {
            image_id: `json_${index}`,
            url: resolveAssetUrl(key),
            type: index === 0 ? "PRIMARY" : "GALLERY",
            sequence: index,
            source: "SCRAPED",
          };
        });
    }
  }

  // Get ERP stock
  const erpStock = await getErpStock(listing.medicine_id, listing.branch_id);

  // Get inventory batches for additional context
  const inventoryBatches = await prisma.inventory.findMany({
    where: {
      medicine_id: listing.medicine_id,
      branch_id: listing.branch_id,
      is_active: true,
      is_expired: false,
    },
    select: {
      batch_number: true,
      expiry_date: true,
      available_stock: true,
      selling_rate: true,
      mrp: true,
    },
    orderBy: { expiry_date: "asc" },
    take: 5,
  });

  const variant = listing.linkedVariant;
  const medicine = listing.medicine;

  return {
    // ── Listing controls ──
    listing_id: listing.listing_id,
    medicine_id: listing.medicine_id,
    branch_id: listing.branch_id,
    is_visible: listing.is_visible,
    stock_status: listing.stock_status,
    marketplace_price:
      listing.marketplace_price != null
        ? Number(listing.marketplace_price)
        : null,
    requires_prescription: listing.requires_prescription,
    created_at: listing.created_at,
    updated_at: listing.updated_at,

    // ── Catalog identity ──
    catalog: {
      variant_id: variant?.variant_id ?? null,
      sku_id: variant?.sku_id ?? null,
      catalog_name: variant?.name ?? medicine.name,
      brand: variant?.brand ?? null,
      generic_name: variant?.master?.generic_name ?? null,
      primary_category: variant?.master?.primary_category ?? null,
      form: variant?.master?.form ?? null,
      type: variant?.master?.type ?? null,
      pack_size: variant?.pack_size ?? null,
      manufacturer: variant?.manufacturer ?? medicine.manufacturer,
      marketer: variant?.marketer ?? null,
      strength:
        variant?.strength_value != null
          ? `${variant.strength_value}${variant.strength_unit ?? ""}`
          : null,
      composition: variant?.composition ?? variant?.master?.composition ?? null,
      description: variant?.description ?? null,
      catalog_mrp: variant?.mrp ? Number(variant.mrp) : null,
      catalog_selling_price: variant?.selling_price
        ? Number(variant.selling_price)
        : null,
      master_medicine_id: variant?.master?.master_medicine_id ?? null,
      master_key: variant?.master?.master_key ?? null,
    },

    // ── All images ──
    images: allImages,

    // ── ERP medicine details ──
    erp: {
      erp_name: medicine.name,
      generic_name: medicine.generic_name ?? null,
      manufacturer: medicine.manufacturer,
      category: medicine.category ?? null,
      sub_category: medicine.sub_category ?? null,
      schedule: medicine.schedule ?? null,
      hsn_code: medicine.hsn_code ?? null,
      pack_size: medicine.pack_size ?? null,
      unit_of_measure: medicine.unit_of_measure,
      gst_percentage: medicine.gst_percentage
        ? Number(medicine.gst_percentage)
        : null,
      cgst_percentage: medicine.cgst_percentage
        ? Number(medicine.cgst_percentage)
        : null,
      sgst_percentage: medicine.sgst_percentage
        ? Number(medicine.sgst_percentage)
        : null,
      rack_no: medicine.rack_no ?? null,
      link_status: medicine.link_status,
      linked_at: medicine.linked_at,
      linked_by_type: medicine.linked_by_type,
      link_confidence_score: medicine.link_confidence_score
        ? Number(medicine.link_confidence_score)
        : null,
    },

    // ── ERP stock ──
    erp_stock: erpStock,
    is_low_stock: erpStock > 0 && erpStock <= LOW_STOCK_THRESHOLD,
    inventory_batches: inventoryBatches.map((b) => ({
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      available_stock: Number(b.available_stock),
      selling_rate: b.selling_rate ? Number(b.selling_rate) : null,
      mrp: b.mrp ? Number(b.mrp) : null,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE SINGLE LISTING
// ─────────────────────────────────────────────────────────────────────────────

export async function updateListing(shop_id, listing_id, patch, caller) {
  if (caller.role === "staff") {
    throw new Error("Staff cannot modify listings");
  }

  const listing = await prisma.marketplaceListing.findUnique({
    where: { listing_id },
    select: { listing_id: true, branch_id: true, shop_id: true },
  });

  if (!listing) throw new Error("Listing not found");
  if (listing.shop_id !== shop_id) throw new Error("Listing not found");

  if (
    caller.role !== "super_admin" &&
    listing.branch_id !== caller.branch_id
  ) {
    throw new Error("Access denied to this listing");
  }

  const allowedPatch = {};
  if (patch.is_visible !== undefined)
    allowedPatch.is_visible = patch.is_visible;
  if (patch.stock_status !== undefined)
    allowedPatch.stock_status = patch.stock_status;
  if (patch.requires_prescription !== undefined)
    allowedPatch.requires_prescription = patch.requires_prescription;
  if (patch.marketplace_price !== undefined) {
    const price = Number(patch.marketplace_price);
    if (isNaN(price) || price < 0) throw new Error("Invalid marketplace_price");
    allowedPatch.marketplace_price = price;
  }

  if (Object.keys(allowedPatch).length === 0) {
    throw new Error("No valid fields to update");
  }

  const updated = await prisma.marketplaceListing.update({
    where: { listing_id },
    data: allowedPatch,
    select: {
      listing_id: true,
      is_visible: true,
      stock_status: true,
      requires_prescription: true,
      marketplace_price: true,
      updated_at: true,
    },
  });

  return {
    ...updated,
    marketplace_price: updated.marketplace_price
      ? Number(updated.marketplace_price)
      : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK UPDATE LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkUpdateListings(shop_id, listing_ids, patch, caller) {
  if (caller.role === "staff") {
    throw new Error("Staff cannot perform bulk actions");
  }

  if (!listing_ids || listing_ids.length === 0) {
    throw new Error("No listing IDs provided");
  }

  const listings = await prisma.marketplaceListing.findMany({
    where: { listing_id: { in: listing_ids }, shop_id },
    select: { listing_id: true, branch_id: true },
  });

  if (listings.length !== listing_ids.length) {
    throw new Error("One or more listings not found");
  }

  if (caller.role !== "super_admin") {
    const forbidden = listings.filter(
      (l) => l.branch_id !== caller.branch_id
    );
    if (forbidden.length > 0) {
      throw new Error("Access denied to one or more listings");
    }
  }

  const allowedPatch = {};
  if (patch.is_visible !== undefined)
    allowedPatch.is_visible = patch.is_visible;
  if (patch.stock_status !== undefined)
    allowedPatch.stock_status = patch.stock_status;
  if (patch.requires_prescription !== undefined)
    allowedPatch.requires_prescription = patch.requires_prescription;
  if (patch.marketplace_price !== undefined) {
    const price = Number(patch.marketplace_price);
    if (isNaN(price) || price < 0) throw new Error("Invalid marketplace_price");
    allowedPatch.marketplace_price = price;
  }

  if (Object.keys(allowedPatch).length === 0) {
    throw new Error("No valid fields to update");
  }

  const result = await prisma.marketplaceListing.updateMany({
    where: { listing_id: { in: listing_ids }, shop_id },
    data: allowedPatch,
  });

  return { updated_count: result.count };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function syncInventory(shop_id, branch_id, caller) {
  if (caller.role === "staff") {
    throw new Error("Staff cannot sync inventory");
  }

  const effectiveBranchId = resolveCallerBranch(caller, branch_id);
  await assertBranchBelongsToShop(effectiveBranchId, shop_id);

  const listings = await prisma.marketplaceListing.findMany({
    where: { shop_id, branch_id: effectiveBranchId },
    select: {
      listing_id: true,
      medicine_id: true,
      stock_status: true,
    },
  });

  let flippedToOutOfStock = 0;
  let flippedToInStock = 0;

  await Promise.all(
    listings.map(async (listing) => {
      const erpStock = await getErpStock(
        listing.medicine_id,
        effectiveBranchId
      );

      if (listing.stock_status === "IN_STOCK" && erpStock === 0) {
        await prisma.marketplaceListing.update({
          where: { listing_id: listing.listing_id },
          data: { stock_status: "OUT_OF_STOCK" },
        });
        flippedToOutOfStock++;
      } else if (listing.stock_status === "OUT_OF_STOCK" && erpStock > 0) {
        await prisma.marketplaceListing.update({
          where: { listing_id: listing.listing_id },
          data: { stock_status: "IN_STOCK" },
        });
        flippedToInStock++;
      }
    })
  );

  const existingMedicineIds = new Set(listings.map((l) => l.medicine_id));

  const linkedMedicines = await prisma.medicine.findMany({
    where: {
      shop_id,
      branch_id: effectiveBranchId,
      linked_variant_id: { not: null },
      link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
    },
    select: {
      medicine_id: true,
      branch_id: true,
      shop_id: true,
      linked_variant_id: true,
    },
  });

  const missing = linkedMedicines.filter(
    (m) => !existingMedicineIds.has(m.medicine_id)
  );

  let newListingsCreated = 0;
  for (const m of missing) {
    await createListingForMedicine(
      m.medicine_id,
      m.branch_id,
      m.shop_id,
      m.linked_variant_id
    );
    newListingsCreated++;
  }

  return {
    flipped_to_out_of_stock: flippedToOutOfStock,
    flipped_to_in_stock: flippedToInStock,
    new_listings_created: newListingsCreated,
    total_listings: listings.length + newListingsCreated,
  };
}