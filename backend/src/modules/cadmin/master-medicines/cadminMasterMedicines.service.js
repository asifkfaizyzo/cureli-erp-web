// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.service.js (do not remove this comment)
import prisma from "../../../config/prisma.js";
import { fileURLToPath } from "url";
import path from "path";
import { notifyAsync } from "../../notifications/notification.service.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";
import * as audit from "../../audit/index.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client, { S3_BUCKET } from "../../../config/s3.js";
import {
  resolveAssetUrl,
  resolveAssetUrls,
} from "../../../services/assetUrl.service.js";
import { checkSingleMedicine } from "../../medicines/linking.service.js";

// ══════════════════════════════════════════════════════════════
// HELPER: Compute Image Status
// ══════════════════════════════════════════════════════════════

function computeImageStatus(images) {
  if (!images || images.length === 0) return "NONE";
  const hasUploaded = images.some((img) => img.source === "UPLOADED");
  if (hasUploaded) return "VERIFIED";
  return "RAW";
}

async function syncImageStatus(masterMedicineId) {
  const images = await prisma.masterMedicineImage.findMany({
    where: { master_medicine_id: masterMedicineId },
    select: { source: true },
  });

  let newStatus;
  if (images.length === 0) {
    newStatus = "NONE";
  } else if (images.some((img) => img.source === "UPLOADED")) {
    newStatus = "VERIFIED";
  } else {
    newStatus = "RAW";
  }

  await prisma.masterMedicine.update({
    where: { master_medicine_id: masterMedicineId },
    data: { image_status: newStatus },
  });
}

// ══════════════════════════════════════════════════════════════
// GET MASTER MEDICINES (LIST WITH SEARCH & FILTERS)
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicines({
  search = "",
  type = "",
  form = "",
  category = "",
  imageStatus = "",
  prescriptionRequired = null,
  minVariants = null,
  maxVariants = null,
  page = 1,
  limit = 20,
  sort = "generic_name",
  order = "asc",
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = { is_active: true };

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { generic_name: { contains: searchTerm, mode: "insensitive" } },
      { master_key: { contains: searchTerm, mode: "insensitive" } },
      { primary_category: { contains: searchTerm, mode: "insensitive" } },
      {
        variants: {
          some: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { brand: { contains: searchTerm, mode: "insensitive" } },
              { manufacturer: { contains: searchTerm, mode: "insensitive" } },
              { marketer: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (type && (type === "DRUG" || type === "OTC")) {
    where.type = type;
  }

  if (form && form.trim()) {
    where.form = { equals: form.trim(), mode: "insensitive" };
  }

  if (category && category.trim()) {
    where.primary_category = {
      equals: category.trim(),
      mode: "insensitive",
    };
  }

  if (prescriptionRequired !== null) {
    where.prescription_required =
      prescriptionRequired === "true" || prescriptionRequired === true;
  }

  if (minVariants !== null) {
    where.variant_count = {
      ...where.variant_count,
      gte: parseInt(minVariants),
    };
  }
  if (maxVariants !== null) {
    where.variant_count = {
      ...where.variant_count,
      lte: parseInt(maxVariants),
    };
  }
  if (imageStatus && ["RAW", "NONE", "VERIFIED"].includes(imageStatus)) {
    where.image_status = imageStatus;
  }

  const validSortFields = [
    "generic_name",
    "master_key",
    "type",
    "form",
    "variant_count",
    "created_at",
    "primary_category",
  ];
  const sortField = validSortFields.includes(sort) ? sort : "generic_name";
  const sortOrder = order === "desc" ? "desc" : "asc";

  const effectiveSkip = skip;
  const effectiveTake = limitNum;

  const [medicines, total] = await Promise.all([
    prisma.masterMedicine.findMany({
      where,
      include: {
        variants: {
          take: 5,
          orderBy: { mrp: "asc" },
          select: {
            variant_id: true,
            sku_id: true,
            name: true,
            brand: true,
            strength_value: true,
            strength_unit: true,
            mrp: true,
            selling_price: true,
            discount_percent: true,
            manufacturer: true,
            marketer: true,
            pack_size: true,
            images: true,
          },
        },
        images: true,
      },
      orderBy: { [sortField]: sortOrder },
      skip: effectiveSkip,
      take: effectiveTake,
    }),
    prisma.masterMedicine.count({ where }),
  ]);

  const transformedMedicines = medicines.map((med) => {
    const prices = med.variants
      .map((v) => v.mrp)
      .filter((p) => p !== null)
      .map((p) => parseFloat(p));

    const priceRange =
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null;

    const imgStatus = computeImageStatus(med.images);
    const primaryImageObj = med.images.find((img) => img.type === "PRIMARY");
    const primaryImage = resolveAssetUrl(
      primaryImageObj?.url || med.variants[0]?.images?.[0] || null,
    );

    return {
      id: med.master_medicine_id,
      masterKey: med.master_key,
      genericName: med.generic_name,
      type: med.type,
      form: med.form,
      composition: med.composition,
      prescriptionRequired: med.prescription_required,
      primaryCategory: med.primary_category,
      variantCount: med.variant_count,
      priceRange,
      primaryImage,
      imageStatus: imgStatus,
      hasPlaceholder: primaryImage?.includes("PLACEHOLDER") || false,
      previewVariants: med.variants.map((v) => ({
        id: v.variant_id,
        skuId: v.sku_id,
        name: v.name,
        brand: v.brand,
        strength: v.strength_value
          ? `${v.strength_value}${v.strength_unit || ""}`
          : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        sellingPrice: v.selling_price ? parseFloat(v.selling_price) : null,
        discountPercent: v.discount_percent,
        manufacturer: v.manufacturer,
        marketer: v.marketer,
        packSize: v.pack_size,
        primaryImage: resolveAssetUrl(v.images?.[0] || null),
      })),
      createdAt: med.created_at,
      updatedAt: med.updated_at,
    };
  });

  const finalMedicines = transformedMedicines;
  const finalTotal = total;

  return {
    medicines: finalMedicines,
    meta: {
      total: finalTotal,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(finalTotal / limitNum),
      hasNext: pageNum < Math.ceil(finalTotal / limitNum),
      hasPrev: pageNum > 1,
    },
  };
}


// ══════════════════════════════════════════════════════════════
// GET SINGLE MASTER MEDICINE WITH ALL VARIANTS
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineById(id) {
  if (!id) return null;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id).trim());

  let medicine = null;

  // Only query by master_medicine_id if id is a valid UUID
  if (isUUID) {
    medicine = await prisma.masterMedicine.findUnique({
      where: { master_medicine_id: id },
      include: {
        variants: { orderBy: [{ brand: "asc" }, { mrp: "asc" }] },
        images: { orderBy: [{ type: "asc" }, { sequence: "asc" }] },
      },
    });
  }

  // Otherwise or fallback: query by master_key (slug string)
  if (!medicine) {
    medicine = await prisma.masterMedicine.findUnique({
      where: { master_key: id },
      include: {
        variants: { orderBy: [{ brand: "asc" }, { mrp: "asc" }] },
        images: { orderBy: [{ type: "asc" }, { sequence: "asc" }] },
      },
    });
  }

  if (!medicine) return null;

  const prices = medicine.variants
    .map((v) => v.mrp)
    .filter((p) => p !== null)
    .map((p) => parseFloat(p));

  const priceRange =
    prices.length > 0
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null;

  const brands = [
    ...new Set(medicine.variants.map((v) => v.brand).filter(Boolean)),
  ].sort();
  const manufacturers = [
    ...new Set(medicine.variants.map((v) => v.manufacturer).filter(Boolean)),
  ].sort();
  const marketers = [
    ...new Set(medicine.variants.map((v) => v.marketer).filter(Boolean)),
  ].sort();
  const strengths = [
    ...new Set(
      medicine.variants
        .filter((v) => v.strength_value)
        .map((v) => `${v.strength_value}${v.strength_unit || ""}`),
    ),
  ].sort();

  const imageStatus = computeImageStatus(medicine.images);

  return {
    id: medicine.master_medicine_id,
    masterKey: medicine.master_key,
    genericName: medicine.generic_name,
    type: medicine.type,
    form: medicine.form,
    composition: medicine.composition,
    prescriptionRequired: medicine.prescription_required,
    primaryCategory: medicine.primary_category,
    variantCount: medicine.variant_count,
    isActive: medicine.is_active,
    imageStatus,
    priceRange,
    brands,
    manufacturers,
    marketers,
    strengths,
    variants: medicine.variants.map((v) => ({
      id: v.variant_id,
      skuId: v.sku_id,
      name: v.name,
      brand: v.brand,
      composition: v.composition,
      strength: v.strength_value
        ? {
            value: v.strength_value,
            unit: v.strength_unit,
            display: `${v.strength_value}${v.strength_unit || ""}`,
          }
        : null,
      manufacturer: v.manufacturer,
      marketer: v.marketer,
      packSize: v.pack_size,
      pricing: {
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        sellingPrice: v.selling_price ? parseFloat(v.selling_price) : null,
        discountPercent: v.discount_percent,
      },
      description: v.description,
      images: resolveAssetUrls(v.images || []),
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })),
    images: medicine.images.map((img) => ({
      id: img.image_id,
      skuId: img.sku_id,
      url: resolveAssetUrl(img.url),
      type: img.type,
      source: img.source,
      sequence: img.sequence,
      uploadedBy: img.uploaded_by,
      isPlaceholder: img.url?.includes("PLACEHOLDER") || false,
    })),
    createdAt: medicine.created_at,
    updatedAt: medicine.updated_at,
  };
}

// ══════════════════════════════════════════════════════════════
// GET MASTER MEDICINE BY MASTER KEY
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineByKey(masterKey) {
  return getMasterMedicineById(masterKey);
}

// ══════════════════════════════════════════════════════════════
// GET VARIANT BY SKU ID
// ══════════════════════════════════════════════════════════════

export async function getVariantBySkuId(skuId) {
  const variant = await prisma.masterMedicineVariant.findUnique({
    where: { sku_id: skuId },
    include: {
      master: {
        select: {
          master_medicine_id: true,
          master_key: true,
          generic_name: true,
          type: true,
          form: true,
          prescription_required: true,
          primary_category: true,
        },
      },
    },
  });

  if (!variant) return null;

  const images = await prisma.masterMedicineImage.findMany({
    where: { sku_id: skuId },
    orderBy: [{ type: "asc" }, { sequence: "asc" }],
  });

  return {
    id: variant.variant_id,
    skuId: variant.sku_id,
    name: variant.name,
    brand: variant.brand,
    composition: variant.composition,
    strength: variant.strength_value
      ? {
          value: variant.strength_value,
          unit: variant.strength_unit,
          display: `${variant.strength_value}${variant.strength_unit || ""}`,
        }
      : null,
    manufacturer: variant.manufacturer,
    marketer: variant.marketer,
    packSize: variant.pack_size,
    pricing: {
      mrp: variant.mrp ? parseFloat(variant.mrp) : null,
      sellingPrice: variant.selling_price
        ? parseFloat(variant.selling_price)
        : null,
      discountPercent: variant.discount_percent,
    },
    description: variant.description,
    images: images.map((img) => ({
      id: img.image_id,
      url: resolveAssetUrl(img.url),
      type: img.type,
      source: img.source,
      sequence: img.sequence,
      uploadedBy: img.uploaded_by,
    })),
    master: {
      id: variant.master.master_medicine_id,
      masterKey: variant.master.master_key,
      genericName: variant.master.generic_name,
      type: variant.master.type,
      form: variant.master.form,
      prescriptionRequired: variant.master.prescription_required,
      primaryCategory: variant.master.primary_category,
    },
    createdAt: variant.created_at,
    updatedAt: variant.updated_at,
  };
}

// ══════════════════════════════════════════════════════════════
// GET STATISTICS
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineStats() {
  const [
    totalMasters,
    totalVariants,
    totalImages,
    drugCount,
    otcCount,
    categoryCounts,
    formCounts,
    multiVariantCount,
    prescriptionRequiredCount,
    recentlyAdded,
    unmappedCount,
    needsReviewCount,
    totalLinkedCount,
  ] = await Promise.all([
    prisma.masterMedicine.count({ where: { is_active: true } }),
    prisma.masterMedicineVariant.count(),
    prisma.masterMedicineImage.count(),
    prisma.masterMedicine.count({ where: { is_active: true, type: "DRUG" } }),
    prisma.masterMedicine.count({ where: { is_active: true, type: "OTC" } }),
    prisma.masterMedicine.groupBy({
      by: ["primary_category"],
      where: { is_active: true, primary_category: { not: null } },
      _count: { primary_category: true },
      orderBy: { _count: { primary_category: "desc" } },
      take: 10,
    }),
    prisma.masterMedicine.groupBy({
      by: ["form"],
      where: { is_active: true, form: { not: null } },
      _count: { form: true },
      orderBy: { _count: { form: "desc" } },
      take: 10,
    }),
    prisma.masterMedicine.count({
      where: { is_active: true, variant_count: { gt: 1 } },
    }),
    prisma.masterMedicine.count({
      where: { is_active: true, prescription_required: true },
    }),
    prisma.masterMedicine.count({
      where: {
        is_active: true,
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.medicine.count({
      where: {
        master_medicine_id: null,
        linked_variant_id: null,
        link_status: { in: ["PENDING", "UNLINKED"] },
        link_rejected: false,
        is_active: true,
      },
    }),
    prisma.medicine.count({
      where: {
        link_status: "SUGGESTED",
        suggested_master_id: { not: null },
        link_rejected: false,
        is_active: true,
      },
    }),
    prisma.medicine.count({
      where: {
        linked_variant_id: { not: null },
        link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
        is_active: true,
      },
    }),
  ]);

  const imageStatusCounts = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE has_uploaded = true)::int  AS verified,
      COUNT(*) FILTER (WHERE has_any = true AND has_uploaded = false)::int AS raw,
      COUNT(*) FILTER (WHERE has_any = false)::int AS none
    FROM (
      SELECT
        m.master_medicine_id,
        BOOL_OR(i.image_id IS NOT NULL)   AS has_any,
        BOOL_OR(i.source = 'UPLOADED')    AS has_uploaded
      FROM master_medicines m
      LEFT JOIN master_medicine_images i
        ON i.master_medicine_id = m.master_medicine_id
      WHERE m.is_active = true
      GROUP BY m.master_medicine_id
    ) AS agg
  `;

  const verifiedCount = Number(imageStatusCounts[0]?.verified ?? 0);
  const rawCount = Number(imageStatusCounts[0]?.raw ?? 0);
  const noneCount = Number(imageStatusCounts[0]?.none ?? 0);

  return {
    overview: {
      totalMasters,
      totalVariants,
      totalImages,
      avgVariantsPerMaster:
        totalMasters > 0
          ? parseFloat((totalVariants / totalMasters).toFixed(2))
          : 0,
      avgImagesPerVariant:
        totalVariants > 0
          ? parseFloat((totalImages / totalVariants).toFixed(2))
          : 0,
    },
    byType: { drug: drugCount, otc: otcCount },
    byImageStatus: { verified: verifiedCount, raw: rawCount, none: noneCount },
    mapping: {
      unmapped: unmappedCount,
      needsReview: needsReviewCount,
      totalLinked: totalLinkedCount,
    },
    categories: categoryCounts.map((c) => ({
      category: c.primary_category,
      count: c._count.primary_category,
    })),
    forms: formCounts.map((f) => ({ form: f.form, count: f._count.form })),
    insights: {
      multiVariantMasters: multiVariantCount,
      singleVariantMasters: totalMasters - multiVariantCount,
      prescriptionRequired: prescriptionRequiredCount,
      otcMedicines: totalMasters - prescriptionRequiredCount,
      recentlyAdded,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET FILTER OPTIONS
// ══════════════════════════════════════════════════════════════

export async function getFilterOptions() {
  const [forms, categories, brands, manufacturers] = await Promise.all([
    prisma.masterMedicine.findMany({
      where: { is_active: true, form: { not: null } },
      select: { form: true },
      distinct: ["form"],
      orderBy: { form: "asc" },
    }),
    prisma.masterMedicine.findMany({
      where: { is_active: true, primary_category: { not: null } },
      select: { primary_category: true },
      distinct: ["primary_category"],
      orderBy: { primary_category: "asc" },
    }),
    prisma.masterMedicineVariant.groupBy({
      by: ["brand"],
      where: { brand: { not: null } },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 50,
    }),
    prisma.masterMedicineVariant.groupBy({
      by: ["manufacturer"],
      where: { manufacturer: { not: null } },
      _count: { manufacturer: true },
      orderBy: { _count: { manufacturer: "desc" } },
      take: 50,
    }),
  ]);

  return {
    types: ["DRUG", "OTC"],
    forms: forms.map((f) => f.form).filter(Boolean),
    categories: categories.map((c) => c.primary_category).filter(Boolean),
    brands: brands.map((b) => ({ name: b.brand, count: b._count.brand })),
    manufacturers: manufacturers.map((m) => ({
      name: m.manufacturer,
      count: m._count.manufacturer,
    })),
  };
}

// ══════════════════════════════════════════════════════════════
// AUTOCOMPLETE SEARCH
// ══════════════════════════════════════════════════════════════

export async function autocompleteSearch(query, limit = 10) {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  const searchTerm = query.trim();

  const [masterMatches, variantMatches] = await Promise.all([
    prisma.masterMedicine.findMany({
      where: {
        is_active: true,
        OR: [
          { generic_name: { contains: searchTerm, mode: "insensitive" } },
          { master_key: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        master_medicine_id: true,
        master_key: true,
        generic_name: true,
        type: true,
        form: true,
        variant_count: true,
      },
      take: limit,
      orderBy: { generic_name: "asc" },
    }),
    prisma.masterMedicineVariant.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { brand: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        variant_id: true,
        sku_id: true,
        name: true,
        brand: true,
        mrp: true,
        master: {
          select: {
            master_key: true,
            generic_name: true,
            type: true,
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
  ]);

  const suggestions = [];

  for (const m of masterMatches) {
    suggestions.push({
      type: "master",
      id: m.master_medicine_id,
      masterKey: m.master_key,
      label: m.generic_name,
      subLabel: `${m.type} • ${m.form || "N/A"} • ${m.variant_count} variants`,
    });
  }

  for (const v of variantMatches) {
    suggestions.push({
      type: "variant",
      id: v.variant_id,
      skuId: v.sku_id,
      masterKey: v.master.master_key,
      label: v.name,
      subLabel: `${v.brand || "N/A"} • ${v.master.generic_name} • ₹${v.mrp || "N/A"}`,
    });
  }

  return {
    suggestions: suggestions.slice(0, limit),
    query: searchTerm,
  };
}

// ══════════════════════════════════════════════════════════════
// GET UNMAPPED MEDICINES AGGREGATED
// ══════════════════════════════════════════════════════════════

export async function getUnmappedMedicinesAggregated({
  search = "",
  type = "",
  page = 1,
  limit = 20,
  sort = "occurrence_count",
  order = "desc",
  shopIds = [],
  dateFrom = "",
  dateTo = "",
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

  const where = {
    master_medicine_id: null,
    linked_variant_id: null,
    link_status: { in: ["PENDING", "UNLINKED"] },
    link_rejected: false,
    is_active: true,
  };

  if (shopIds.length > 0) {
    where.shop_id = { in: shopIds };
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = new Date(dateFrom + "T00:00:00.000Z");
    if (dateTo) where.created_at.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const rawMedicines = await prisma.medicine.findMany({
    where,
        select: {
      medicine_id: true,
      name: true,
      normalized_name: true,
      generic_name: true,
      manufacturer: true,
      category: true,
      sub_category: true,
      schedule: true,
      hsn_code: true,
      pack_size: true,
      shop_id: true,
      branch_id: true,
      created_at: true,
      updated_at: true,
      resubmission_count: true,
      last_resubmitted_at: true,
      shop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const aggregationMap = new Map();

  for (const med of rawMedicines) {
    const normalizedKey =
      med.normalized_name ||
      med.name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!aggregationMap.has(normalizedKey)) {
      aggregationMap.set(normalizedKey, {
        normalizedName: normalizedKey,
        sampleNames: [],
        sampleNameSet: new Set(),
        medicineIds: [],
        occurrenceCount: 0,
        shopMap: new Map(),
        type: med.category === "OTC" ? "OTC" : "DRUG",
        firstSeenAt: med.created_at,
        lastSeenAt: med.updated_at,
        resubmissionCount: 0,
        lastResubmittedAt: null,
        manufacturers: new Set(),
        genericNames: new Set(),
        categories: new Set(),
        subCategories: new Set(),
        schedules: new Set(),
        hsnCodes: new Set(),
        packSizes: new Set(),
      });
    }

    const group = aggregationMap.get(normalizedKey);

    if (!group.sampleNameSet.has(med.name)) {
      group.sampleNameSet.add(med.name);
      group.sampleNames.push(med.name);
    }

    group.medicineIds.push(med.medicine_id);
    group.occurrenceCount++;

    if (med.manufacturer) group.manufacturers.add(med.manufacturer);
    if (med.generic_name) group.genericNames.add(med.generic_name);
    if (med.category) group.categories.add(med.category);
    if (med.sub_category) group.subCategories.add(med.sub_category);
    if (med.schedule) group.schedules.add(med.schedule);
    if (med.hsn_code) group.hsnCodes.add(med.hsn_code);
    if (med.pack_size) group.packSizes.add(med.pack_size);

    if (med.shop) {
      const shopKey = med.shop.shop_id;
      if (!group.shopMap.has(shopKey)) {
        group.shopMap.set(shopKey, {
          id: med.shop.shop_id,
          name: med.shop.business_name,
          count: 0,
        });
      }
      group.shopMap.get(shopKey).count++;
    }

   if (med.created_at < group.firstSeenAt) group.firstSeenAt = med.created_at;
    if (med.updated_at > group.lastSeenAt) group.lastSeenAt = med.updated_at;

    // Track highest resubmission count across all shop entries
    const medResubCount = med.resubmission_count || 0;
    if (medResubCount > group.resubmissionCount) {
      group.resubmissionCount = medResubCount;
    }
    if (
      med.last_resubmitted_at &&
      (!group.lastResubmittedAt ||
        med.last_resubmitted_at > group.lastResubmittedAt)
    ) {
      group.lastResubmittedAt = med.last_resubmitted_at;
    }
  }

  let results = Array.from(aggregationMap.values()).map((group) => ({
    id: `unmapped_${group.normalizedName.replace(/\s+/g, "_")}`,
    normalizedName: group.normalizedName,
    sampleNames: group.sampleNames.slice(0, 10),
    medicineIds: group.medicineIds,
    occurrenceCount: group.occurrenceCount,
    shopCount: group.shopMap.size,
    type: group.type,
    hasImageSuggestion: false,
    firstSeenAt: group.firstSeenAt,
    lastSeenAt: group.lastSeenAt,
    resubmissionCount: group.resubmissionCount,
    lastResubmittedAt: group.lastResubmittedAt,
    shops: Array.from(group.shopMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    manufacturers: [...group.manufacturers].sort(),
    genericNames: [...group.genericNames].sort(),
    categories: [...group.categories].sort(),
    subCategories: [...group.subCategories].sort(),
    schedules: [...group.schedules].sort(),
    hsnCodes: [...group.hsnCodes].sort(),
    packSizes: [...group.packSizes].sort(),
  }));

  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.normalizedName.includes(searchLower) ||
        item.sampleNames.some((name) =>
          name.toLowerCase().includes(searchLower),
        ) ||
        item.manufacturers.some((m) => m.toLowerCase().includes(searchLower)),
    );
  }

  if (type && (type === "DRUG" || type === "OTC")) {
    results = results.filter((item) => item.type === type);
  }

  const validSortMap = {
    normalizedName: "normalizedName",
    occurrenceCount: "occurrenceCount",
    shopCount: "shopCount",
  };
  const sortField = validSortMap[sort] || "occurrenceCount";

  results.sort((a, b) => {
    if (order === "asc") {
      if (typeof a[sortField] === "string") {
        return a[sortField].localeCompare(b[sortField]);
      }
      return a[sortField] - b[sortField];
    } else {
      if (typeof a[sortField] === "string") {
        return b[sortField].localeCompare(a[sortField]);
      }
      return b[sortField] - a[sortField];
    }
  });

  const total = results.length;
  const skip = (pageNum - 1) * limitNum;

  return {
    unmapped: results.slice(skip, skip + limitNum),
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET NEEDS REVIEW MEDICINES
// ══════════════════════════════════════════════════════════════

export async function getNeedsReviewMedicines({
  search = "",
  confidenceFilter = "",
  page = 1,
  limit = 20,
  shopIds = [],
  dateFrom = "",
  dateTo = "",
  sort = "confidenceScore",
  order = "desc",
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    link_status: "SUGGESTED",
    suggested_master_id: { not: null },
    link_rejected: false,
    is_active: true,
  };

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { normalized_name: { contains: searchTerm, mode: "insensitive" } },
      { manufacturer: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (confidenceFilter === "high") {
    where.link_confidence_score = { gte: 90 };
  } else if (confidenceFilter === "medium") {
    where.link_confidence_score = { gte: 70, lt: 90 };
  } else if (confidenceFilter === "low") {
    where.link_confidence_score = { lt: 70 };
  }

  if (shopIds.length > 0) {
    where.shop_id = { in: shopIds };
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = new Date(dateFrom + "T00:00:00.000Z");
    if (dateTo) where.created_at.lte = new Date(dateTo + "T23:59:59.999Z");
  }

   // Dynamic sorting configuration mapping
  const validSortMap = {
    rawName: "name",
    confidenceScore: "link_confidence_score",
    suggestedMaster: "suggested_master_id", // Maps Suggested Match column directly
    firstSeenAt: "created_at",
  };
  const dbSortField = validSortMap[sort] || "link_confidence_score";
  const dbSortOrder = order === "asc" ? "asc" : "desc";

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id: true,
        name: true,
        normalized_name: true,
        generic_name: true,
        manufacturer: true,
        category: true,
        sub_category: true,
        schedule: true,
        hsn_code: true,
        pack_size: true,
        link_confidence_score: true,
        suggestion_reason: true,
        suggested_master_id: true,
        suggested_variant_id: true,
        shop_id: true,
        branch_id: true,
        created_at: true,
        resubmission_count: true,
        last_resubmitted_at: true,
        shop: {
          select: { shop_id: true, business_name: true },
        },
        branch: {
          select: { branch_id: true, branch_name: true },
        },
      },
      orderBy: { [dbSortField]: dbSortOrder },
      skip,
      take: limitNum,
    }),
    prisma.medicine.count({ where }),
  ]);

  const suggestedMasterIds = [
    ...new Set(medicines.map((m) => m.suggested_master_id).filter(Boolean)),
  ];

  const suggestedMasters = await prisma.masterMedicine.findMany({
    where: { master_medicine_id: { in: suggestedMasterIds } },
    include: {
      images: { where: { type: "PRIMARY" }, take: 1 },
      variants: {
        take: 1,
        orderBy: { mrp: "asc" },
        select: { manufacturer: true, marketer: true },
      },
    },
  });

  const masterMap = new Map(
    suggestedMasters.map((m) => [m.master_medicine_id, m]),
  );

  const reviewItems = medicines.map((med) => {
    const suggestedMaster = masterMap.get(med.suggested_master_id);
    return {
      id: med.medicine_id,
      rawName: med.name,
      normalizedRaw: med.normalized_name || med.name.toLowerCase(),
      shopMedicine: {
        genericName: med.generic_name,
        manufacturer: med.manufacturer,
        category: med.category,
        subCategory: med.sub_category,
        schedule: med.schedule,
        hsnCode: med.hsn_code,
        packSize: med.pack_size,
      },
      suggestedMaster: suggestedMaster
        ? {
            id: suggestedMaster.master_medicine_id,
            masterKey: suggestedMaster.master_key,
            name: suggestedMaster.generic_name,
            type: suggestedMaster.type,
            form: suggestedMaster.form,
            primaryCategory: suggestedMaster.primary_category,
            prescriptionRequired: suggestedMaster.prescription_required,
            manufacturer: suggestedMaster.variants[0]?.manufacturer || null,
            marketer: suggestedMaster.variants[0]?.marketer || null,
            hasImage: suggestedMaster.images.length > 0,
            imageStatus: computeImageStatus(suggestedMaster.images),
          }
        : null,
      suggestedVariantId: med.suggested_variant_id || null,
      confidenceScore: Math.round(med.link_confidence_score || 0),
      confidenceReason: med.suggestion_reason || "Auto-detected match",
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      branchName: med.branch?.branch_name || null,
      occurrenceCount: 1,
      firstSeenAt: med.created_at,
      resubmissionCount: med.resubmission_count || 0,
      lastResubmittedAt: med.last_resubmitted_at,
    };
  });

  const validItems = reviewItems.filter(
    (item) => item.suggestedMaster !== null,
  );

  return {
    reviewItems: validItems,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET LINKED SHOP MEDICINES FOR A MASTER
// ══════════════════════════════════════════════════════════════

export async function getLinkedMedicines(masterMedicineId) {
  const variants = await prisma.masterMedicineVariant.findMany({
    where: { master_medicine_id: masterMedicineId },
    select: { variant_id: true, name: true, sku_id: true },
  });

  const variantIds = variants.map((v) => v.variant_id);
  const variantMap = new Map(variants.map((v) => [v.variant_id, v]));

  const linkedMedicines = await prisma.medicine.findMany({
    where: {
      linked_variant_id: { in: variantIds },
      link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
    },
    select: {
      medicine_id: true,
      name: true,
      normalized_name: true,
      manufacturer: true,
      linked_at: true,
      linked_by_type: true,
      link_status: true,
      link_confidence_score: true,
      linked_variant_id: true,
      linked_variant_sku: true,
      shop: {
        select: { shop_id: true, business_name: true },
      },
    },
    orderBy: { linked_at: "desc" },
  });

  return linkedMedicines.map((med) => {
    const variant = variantMap.get(med.linked_variant_id);
    return {
      id: med.medicine_id,
      originalName: med.name,
      normalizedName: med.normalized_name || med.name.toLowerCase(),
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      manufacturer: med.manufacturer,
      linkedVariantId: med.linked_variant_id,
      linkedVariantSku: med.linked_variant_sku,
      linkedVariantName: variant?.name || null,
      occurrenceCount: 1,
      linkedAt: med.linked_at,
      linkedBy:
        med.linked_by_type === "SYSTEM"
          ? "System"
          : med.linked_by_type === "CADMIN"
            ? "CAdmin"
            : "Shop User",
      linkStatus: med.link_status,
      confidence: med.link_confidence_score,
    };
  });
}

export async function getLinkedMedicinesByVariant(variantId) {
  const variant = await prisma.masterMedicineVariant.findUnique({
    where: { variant_id: variantId },
    select: {
      variant_id: true,
      name: true,
      sku_id: true,
      master_medicine_id: true,
    },
  });

  if (!variant) return [];

  const linkedMedicines = await prisma.medicine.findMany({
    where: {
      linked_variant_id: variantId,
      link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
    },
    select: {
      medicine_id: true,
      name: true,
      normalized_name: true,
      manufacturer: true,
      linked_at: true,
      linked_by_type: true,
      link_status: true,
      link_confidence_score: true,
      shop: {
        select: { shop_id: true, business_name: true },
      },
    },
    orderBy: { linked_at: "desc" },
  });

  return {
    variant: {
      id: variant.variant_id,
      name: variant.name,
      skuId: variant.sku_id,
      masterId: variant.master_medicine_id,
    },
    linkedMedicines: linkedMedicines.map((med) => ({
      id: med.medicine_id,
      originalName: med.name,
      normalizedName: med.normalized_name || med.name.toLowerCase(),
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      manufacturer: med.manufacturer,
      linkedAt: med.linked_at,
      linkedBy:
        med.linked_by_type === "SYSTEM"
          ? "System"
          : med.linked_by_type === "CADMIN"
            ? "CAdmin"
            : "Shop User",
      linkStatus: med.link_status,
      confidence: med.link_confidence_score,
    })),
  };
}

// ══════════════════════════════════════════════════════════════
// ACCEPT REVIEW MATCH
// ══════════════════════════════════════════════════════════════

export async function acceptReviewMatch(
  medicineId,
  cadminId,
  auditContext = {},
) {
  const medicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
  });

  if (!medicine) throw new Error("Medicine not found");
  if (!medicine.suggested_master_id) throw new Error("No suggestion to accept");

  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: medicine.suggested_master_id },
  });
  if (!master) throw new Error("Suggested master no longer exists");

  let targetVariant = null;

  if (medicine.suggested_variant_id) {
    targetVariant = await prisma.masterMedicineVariant.findUnique({
      where: { variant_id: medicine.suggested_variant_id },
    });
  }

  if (!targetVariant) {
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where: {
        master_medicine_id: medicine.suggested_master_id,
        name: { equals: medicine.name, mode: "insensitive" },
      },
    });
  }

  if (!targetVariant) {
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where: { master_medicine_id: medicine.suggested_master_id },
      orderBy: { mrp: "asc" },
    });
  }

  if (!targetVariant) {
    throw new Error(
      "No variants found under this master medicine. Cannot link to a variant.",
    );
  }

  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: medicine.suggested_master_id,
      linked_variant_id: targetVariant.variant_id,
      linked_variant_sku: targetVariant.sku_id,
      link_status: "MANUAL_LINKED",
      link_confidence_score: medicine.link_confidence_score,
      linked_at: new Date(),
      linked_by_id: cadminId,
      linked_by_type: "CADMIN",
      suggested_master_id: null,
      suggested_variant_id: null,
      suggestion_reason: null,
    },
  });

  await audit.log({
    action: audit.AuditAction.MEDICINE_MATCH_ACCEPTED,
    entity_type: audit.EntityType.MEDICINE,
    entity_id: medicineId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      medicine_id: medicineId,
      medicine_name: medicine.name,
      master_medicine_id: medicine.suggested_master_id,
      master_generic_name: master.generic_name,
      variant_id: targetVariant.variant_id,
      variant_name: targetVariant.name,
      variant_sku: targetVariant.sku_id,
      linked_by_cadmin_id: cadminId,
      confidence_score: medicine.link_confidence_score,
    },
  });

  const shopMedicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
    select: { name: true, shop_id: true },
  });

  if (shopMedicine?.shop_id) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.MEDICINE_LINKED,
      context: {
        shop_id: shopMedicine.shop_id,
        medicine_id: medicineId,
        medicine_name: shopMedicine.name,
        variant_name: targetVariant.name,
        master_name: master.generic_name,
      },
    });
  }

  return {
    success: true,
    medicine: updated,
    linkedTo: {
      master_id: master.master_medicine_id,
      master_key: master.master_key,
      generic_name: master.generic_name,
      variant_id: targetVariant.variant_id,
      variant_name: targetVariant.name,
      variant_sku: targetVariant.sku_id,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// REJECT REVIEW MATCH
// ══════════════════════════════════════════════════════════════

export async function rejectReviewMatch(medicineId, auditContext = {}) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      link_status: "PENDING",
      suggested_master_id: null,
      suggestion_reason: null,
      link_confidence_score: null,
    },
  });

  await audit.log({
    action: audit.AuditAction.MEDICINE_MATCH_REJECTED,
    entity_type: audit.EntityType.MEDICINE,
    entity_id: medicineId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      medicine_id: medicineId,
    },
  });

  return { success: true, medicine: updated };
}

// ══════════════════════════════════════════════════════════════
// MATCH UNMAPPED TO VARIANT
// ══════════════════════════════════════════════════════════════

export async function matchUnmappedToVariant(
  medicineIds,
  variantId,
  cadminId,
  auditContext = {},
) {
  const variant = await prisma.masterMedicineVariant.findUnique({
    where: { variant_id: variantId },
    include: {
      master: {
        select: {
          master_medicine_id: true,
          master_key: true,
          generic_name: true,
        },
      },
    },
  });

  if (!variant) throw new Error("Variant not found");

  const result = await prisma.medicine.updateMany({
    where: { medicine_id: { in: medicineIds } },
    data: {
      master_medicine_id: variant.master_medicine_id,
      linked_variant_id: variant.variant_id,
      linked_variant_sku: variant.sku_id,
      link_status: "MANUAL_LINKED",
      link_confidence_score: 100,
      linked_at: new Date(),
      linked_by_id: cadminId,
      linked_by_type: "CADMIN",
      suggested_master_id: null,
      suggested_variant_id: null,
      suggestion_reason: null,
    },
  });

  await audit.log({
    action: audit.AuditAction.MEDICINE_MATCHED_TO_VARIANT,
    entity_type: audit.EntityType.MEDICINE,
    entity_id: null,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      medicine_ids: medicineIds,
      count: result.count,
      variant_id: variant.variant_id,
      variant_name: variant.name,
      variant_sku: variant.sku_id,
      master_id: variant.master.master_medicine_id,
      master_key: variant.master.master_key,
      generic_name: variant.master.generic_name,
      linked_by_cadmin_id: cadminId,
    },
  });

  const affectedMedicines = await prisma.medicine.findMany({
    where: { medicine_id: { in: medicineIds } },
    select: { medicine_id: true, name: true, shop_id: true },
  });

  const shopGroups = new Map();
  for (const med of affectedMedicines) {
    if (!med.shop_id) continue;
    if (!shopGroups.has(med.shop_id)) {
      shopGroups.set(med.shop_id, { names: [], count: 0 });
    }
    const group = shopGroups.get(med.shop_id);
    group.names.push(med.name);
    group.count++;
  }

  for (const [shopId, group] of shopGroups) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.MEDICINE_LINKED,
      context: {
        shop_id: shopId,
        medicine_name: group.names[0],
        variant_name: variant.name,
        master_name: variant.master.generic_name,
        linked_count: group.count,
      },
    });
  }

  return {
    success: true,
    linkedCount: result.count,
    linkedTo: {
      variant_id: variant.variant_id,
      variant_name: variant.name,
      variant_sku: variant.sku_id,
      master_id: variant.master.master_medicine_id,
      master_key: variant.master.master_key,
      generic_name: variant.master.generic_name,
    },
  };
}

export async function matchUnmappedToMaster(
  medicineIds,
  masterMedicineId,
  cadminId,
  auditContext = {},
) {
  const firstVariant = await prisma.masterMedicineVariant.findFirst({
    where: { master_medicine_id: masterMedicineId },
    orderBy: { mrp: "asc" },
  });

  if (!firstVariant) {
    throw new Error(
      "No variants found under this master. Create a variant first, then link.",
    );
  }

  return matchUnmappedToVariant(
    medicineIds,
    firstVariant.variant_id,
    cadminId,
    auditContext,
  );
}

// ══════════════════════════════════════════════════════════════
// IGNORE UNMAPPED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function ignoreUnmappedMedicines(medicineIds, cadminId = null, auditContext = {}) {
  const effectiveCadminId = cadminId || auditContext?.actor_id || null;
  const now = new Date();

  const result = await prisma.medicine.updateMany({
    where: { medicine_id: { in: medicineIds } },
    data: {
      link_status: "UNLINKED",
      link_rejected: true,
      linked_at: now,
      linked_by_id: effectiveCadminId,
      linked_by_type: "CADMIN",
    },
  });

  await audit.log({
    action: audit.AuditAction.UNMAPPED_MEDICINES_IGNORED,
    entity_type: audit.EntityType.MEDICINE,
    entity_id: null,
    actor_id: effectiveCadminId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      medicine_ids: medicineIds,
      ignored_count: result.count,
    },
  });

  return { success: true, ignoredCount: result.count };
}

// ══════════════════════════════════════════════════════════════
// UNLINK SHOP MEDICINE
// ══════════════════════════════════════════════════════════════

export async function unlinkShopMedicine(medicineId, auditContext = {}) {
  const now = new Date();
  const effectiveCadminId = auditContext?.actor_id || null;

  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: null,
      linked_variant_id: null,
      linked_variant_sku: null,
      link_status: "UNLINKED",
      link_rejected: true,
      link_confidence_score: null,
      linked_at: now,
      linked_by_id: effectiveCadminId,
      linked_by_type: "CADMIN",
    },
  });

  await audit.log({
    action: audit.AuditAction.MEDICINE_UNLINKED,
    entity_type: audit.EntityType.MEDICINE,
    entity_id: medicineId,
    actor_id: effectiveCadminId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      medicine_id: medicineId,
    },
  });

  return { success: true, medicine: updated };
}

// ══════════════════════════════════════════════════════════════
// UPLOAD MASTER IMAGE
// ══════════════════════════════════════════════════════════════

export async function uploadMasterImage(
  masterMedicineId,
  imageData,
  cadminName,
  auditContext = {},
) {
  const { buffer, mimetype, originalname, type = "PRIMARY", skuId } = imageData;

  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
    include: {
      variants: { take: 1, select: { sku_id: true } },
    },
  });

  if (!master) throw new Error("Master medicine not found");

  const effectiveSkuId = skuId || master.variants[0]?.sku_id || "master";

  const ext = originalname
    ? "." + originalname.split(".").pop().toLowerCase()
    : mimetype === "image/png"
      ? ".png"
      : mimetype === "image/webp"
        ? ".webp"
        : ".jpg";

  const s3Key = `medicine_images/${effectiveSkuId}/verified_${Date.now()}${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: mimetype,
    }),
  );

  if (type === "PRIMARY") {
    await prisma.masterMedicineImage.updateMany({
      where: {
        master_medicine_id: masterMedicineId,
        type: "PRIMARY",
      },
      data: { type: "GALLERY" },
    });
  }

  const maxSeq = await prisma.masterMedicineImage.aggregate({
    where: { master_medicine_id: masterMedicineId },
    _max: { sequence: true },
  });

  const image = await prisma.masterMedicineImage.create({
    data: {
      master_medicine_id: masterMedicineId,
      sku_id: effectiveSkuId,
      url: s3Key,
      type,
      source: "UPLOADED",
      sequence: (maxSeq._max.sequence || 0) + 1,
      uploaded_by: cadminName,
    },
  });

  await syncImageStatus(masterMedicineId);

  await audit.log({
    action: audit.AuditAction.MASTER_MEDICINE_IMAGE_UPLOADED,
    entity_type: audit.EntityType.MASTER_MEDICINE_IMAGE,
    entity_id: image.image_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      master_medicine_id: masterMedicineId,
      sku_id: effectiveSkuId,
      image_type: type,
      s3_key: s3Key,
      uploaded_by_cadmin: cadminName,
    },
  });

  return image;
}

// ══════════════════════════════════════════════════════════════
// DELETE MASTER IMAGE
// ══════════════════════════════════════════════════════════════

export async function deleteMasterImage(imageId, auditContext = {}) {
  const image = await prisma.masterMedicineImage.findUnique({
    where: { image_id: imageId },
  });

  if (!image) throw new Error("Image not found");

  await prisma.masterMedicineImage.delete({
    where: { image_id: imageId },
  });
  await syncImageStatus(image.master_medicine_id);

  await audit.log({
    action: audit.AuditAction.MASTER_MEDICINE_IMAGE_DELETED,
    entity_type: audit.EntityType.MASTER_MEDICINE_IMAGE,
    entity_id: imageId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      master_medicine_id: image.master_medicine_id,
      sku_id: image.sku_id,
      image_type: image.type,
      url: image.url,
    },
  });

  return { success: true, deletedImage: image };
}

// ══════════════════════════════════════════════════════════════
// GET DISTINCT SHOPS FOR MAPPING FILTER DROPDOWN
// ══════════════════════════════════════════════════════════════

export async function getDistinctShops({
  context = "unmapped",
  search = "",
  page = 1,
  limit = 10,
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  // Build the medicine-level filter based on context
  const medicineWhere =
    context === "review"
      ? {
          link_status: "SUGGESTED",
          suggested_master_id: { not: null },
          link_rejected: false,
          is_active: true,
        }
      : {
          link_status: { in: ["PENDING", "UNLINKED"] },
          linked_variant_id: null,
          master_medicine_id: null,
          link_rejected: false,
          is_active: true,
        };

  const shopWhere = {
    medicines: { some: medicineWhere },
    ...(search?.trim()
      ? { business_name: { contains: search.trim(), mode: "insensitive" } }
      : {}),
  };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where: shopWhere,
      select: { shop_id: true, business_name: true },
      orderBy: { business_name: "asc" },
      skip: offset,
      take: limitNum,
    }),
    prisma.shop.count({ where: shopWhere }),
  ]);

  return {
    shops: shops.map((s) => ({ id: s.shop_id, name: s.business_name })),
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: offset + limitNum < total,
    },
  };
}

export { computeImageStatus };

// ══════════════════════════════════════════════════════════════
// CREATE NEW MASTER MEDICINE + FIRST VARIANT
// ══════════════════════════════════════════════════════════════

export async function createMasterMedicine(data, cadminId, auditContext = {}) {
  const {
    name,
    genericName,
    masterKey,
    type,
    form,
    composition = [],
    manufacturer,
    marketer,
    packSize,
    prescriptionRequired = false,
    hsn_code,
    schedule,
    category,
    subCategory,
  } = data;

  if (!name || !genericName || !type || !form || !manufacturer) {
    throw new Error(
      "name, genericName, type, form, and manufacturer are required",
    );
  }

  const finalKey =
    masterKey ||
    genericName
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "_")
      .trim() + (form ? `_${form.toLowerCase()}` : "");

  // Check for existing master medicine with this key
  const existing = await prisma.masterMedicine.findUnique({
    where: { master_key: finalKey },
    include: {
      variants: {
        orderBy: { mrp: "asc" },
        select: {
          variant_id: true,
          sku_id: true,
          name: true,
          brand: true,
          manufacturer: true,
          pack_size: true,
          mrp: true,
          selling_price: true,
        },
      },
      images: {
        where: { type: "PRIMARY" },
        take: 1,
        select: { url: true },
      },
    },
  });

  if (existing) {
    const error = new Error(`A master medicine with key "${finalKey}" already exists`);
    error.code = "DUPLICATE_MASTER_KEY";
    error.statusCode = 409;
    error.existingMaster = {
      id: existing.master_medicine_id,
      masterKey: existing.master_key,
      genericName: existing.generic_name,
      type: existing.type,
      form: existing.form,
      variantCount: existing.variant_count,
      primaryImage: resolveAssetUrl(existing.images?.[0]?.url || null),
      variants: existing.variants.map((v) => ({
        id: v.variant_id,
        skuId: v.sku_id,
        name: v.name,
        brand: v.brand,
        manufacturer: v.manufacturer,
        packSize: v.pack_size,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        sellingPrice: v.selling_price ? parseFloat(v.selling_price) : null,
      })),
    };
    throw error;
  }

  const compositionJson =
    Array.isArray(composition) && composition.length > 0
      ? composition
          .filter((c) => c.name && c.name.trim())
          .map((c) => ({
            name: c.name.trim(),
            strength: c.strength?.trim() || null,
          }))
      : [];

  const result = await prisma.$transaction(async (tx) => {
    const master = await tx.masterMedicine.create({
      data: {
        master_key: finalKey,
        generic_name: genericName.trim(),
        type,
        form: form || null,
        composition: compositionJson,
        prescription_required: prescriptionRequired,
        primary_category: category || null,
        variant_count: 1,
        is_active: true,
      },
    });

    const skuId = `MM${Date.now().toString(36).toUpperCase()}`;

    let strengthValue = null;
    let strengthUnit = null;
    if (compositionJson.length > 0 && compositionJson[0].strength) {
      const match = compositionJson[0].strength.match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        strengthValue = parseFloat(match[1]);
        strengthUnit = match[2] || null;
      }
    }

    const variant = await tx.masterMedicineVariant.create({
      data: {
        master_medicine_id: master.master_medicine_id,
        sku_id: skuId,
        name: name.trim(),
        brand: null,
        composition: compositionJson,
        strength_value: strengthValue,
        strength_unit: strengthUnit,
        manufacturer: manufacturer.trim(),
        marketer: marketer?.trim() || manufacturer.trim(),
        pack_size: packSize || null,
        mrp: null,
        selling_price: null,
        discount_percent: null,
        description: null,
        images: [],
      },
    });

    await audit.log(
      {
        action: audit.AuditAction.MASTER_MEDICINE_CREATED,
        entity_type: audit.EntityType.MASTER_MEDICINE,
        entity_id: master.master_medicine_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          master_key: master.master_key,
          generic_name: master.generic_name,
          type: master.type,
          form: master.form,
          created_by_cadmin_id: cadminId,
          first_variant_sku: skuId,
        },
      },
      { tx },
    );

    return { master, variant, skuId };
  });

  return {
    success: true,
    master: {
      id: result.master.master_medicine_id,
      masterKey: result.master.master_key,
      genericName: result.master.generic_name,
      type: result.master.type,
      form: result.master.form,
    },
    variant: {
      id: result.variant.variant_id,
      skuId: result.skuId,
      name: result.variant.name,
      manufacturer: result.variant.manufacturer,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// CREATE VARIANT FOR EXISTING MASTER MEDICINE
// ══════════════════════════════════════════════════════════════

export async function createVariantForMasterMedicine(
  masterMedicineId,
  variantData,
  cadminId,
  auditContext = {},
) {
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });

  if (!master) {
    throw new Error("Master medicine not found");
  }

  const {
    name,
    brand = null,
    composition = [],
    manufacturer,
    marketer = null,
    packSize = null,
    mrp = null,
    sellingPrice = null,
    discountPercent = null,
    description = null,
  } = variantData;

  if (!name || !manufacturer) {
    throw new Error("Variant name and manufacturer are required");
  }

  const skuId = `MM${Date.now().toString(36).toUpperCase()}`;

  const compositionJson =
    Array.isArray(composition) && composition.length > 0
      ? composition
          .filter((c) => c.name && c.name.trim())
          .map((c) => ({
            name: c.name.trim(),
            strength: c.strength?.trim() || null,
          }))
      : [];

  let strengthValue = null;
  let strengthUnit = null;
  if (compositionJson.length > 0 && compositionJson[0].strength) {
    const match = compositionJson[0].strength.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      strengthValue = parseFloat(match[1]);
      strengthUnit = match[2] || null;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const variant = await tx.masterMedicineVariant.create({
      data: {
        master_medicine_id: masterMedicineId,
        sku_id: skuId,
        name: name.trim(),
        brand: brand ? brand.trim() : null,
        composition: compositionJson.length > 0 ? compositionJson : (master.composition || []),
        strength_value: strengthValue,
        strength_unit: strengthUnit,
        manufacturer: manufacturer.trim(),
        marketer: marketer?.trim() || manufacturer.trim(),
        pack_size: packSize || null,
        mrp: mrp ? parseFloat(mrp) : null,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : null,
        discount_percent: discountPercent ? parseFloat(discountPercent) : null,
        description: description || null,
        images: [],
      },
    });

    await tx.masterMedicine.update({
      where: { master_medicine_id: masterMedicineId },
      data: {
        variant_count: { increment: 1 },
      },
    });

    await audit.log(
      {
        action: audit.AuditAction.MASTER_MEDICINE_CREATED,
        entity_type: audit.EntityType.MASTER_MEDICINE,
        entity_id: variant.variant_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          master_medicine_id: masterMedicineId,
          master_key: master.master_key,
          variant_id: variant.variant_id,
          variant_name: variant.name,
          sku_id: skuId,
          created_by_cadmin_id: cadminId,
        },
      },
      { tx },
    );

    return { variant, skuId };
  });

  return {
    success: true,
    master: {
      id: master.master_medicine_id,
      masterKey: master.master_key,
      genericName: master.generic_name,
    },
    variant: {
      id: result.variant.variant_id,
      skuId: result.skuId,
      name: result.variant.name,
      manufacturer: result.variant.manufacturer,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET MAPPING HISTORY — WITH EXACT SCHEMA RESOLUTION
// ══════════════════════════════════════════════════════════════

export async function getMappingHistory({
  search = "",
  status = "",
  page = 1,
  limit = 20,
  sort = "actionDate",
  order = "desc",
  shopIds = [],
  dateFrom = "",
  dateTo = "",
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    is_active: true,
    link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED", "UNLINKED"] },
  };

  if (status === "linked") {
    where.link_status = { in: ["AUTO_LINKED", "MANUAL_LINKED"] };
  } else if (status === "unlinked" || status === "ignored") {
    where.link_status = "UNLINKED";
  }

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { normalized_name: { contains: searchTerm, mode: "insensitive" } },
      { manufacturer: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const isValidUUID = (val) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof val === "string" && uuidRegex.test(val.trim());
  };

  if (shopIds && shopIds.length > 0) {
    const validShopIds = shopIds.filter(isValidUUID);
    if (validShopIds.length > 0) {
      where.shop_id = { in: validShopIds };
    }
  }

  if ((dateFrom && String(dateFrom).trim() !== "") || (dateTo && String(dateTo).trim() !== "")) {
    where.linked_at = {};
    if (dateFrom && String(dateFrom).trim() !== "") {
      const parsedDate = new Date(String(dateFrom).trim() + "T00:00:00.000Z");
      if (!isNaN(parsedDate.getTime())) {
        where.linked_at.gte = parsedDate;
      }
    }
    if (dateTo && String(dateTo).trim() !== "") {
      const parsedDate = new Date(String(dateTo).trim() + "T23:59:59.999Z");
      if (!isNaN(parsedDate.getTime())) {
        where.linked_at.lte = parsedDate;
      }
    }
    if (Object.keys(where.linked_at).length === 0) {
      delete where.linked_at;
    }
  }

  const validSortMap = {
    rawName: "name",
    actionDate: "linked_at",
    status: "link_status",
  };
  const dbSortField = validSortMap[sort] || "linked_at";
  const dbSortOrder = order === "asc" ? "asc" : "desc";

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id: true,
        name: true,
        normalized_name: true,
        generic_name: true,
        manufacturer: true,
        link_status: true,
        link_confidence_score: true,
        linked_at: true,
        linked_by_id: true,
        linked_by_type: true,
        linked_variant_id: true,
        linked_variant_sku: true,
        created_at: true,
        updated_at: true,
        shop_id: true,
        branch_id: true,
        shop: {
          select: { shop_id: true, business_name: true },
        },
        linkedVariant: {
          select: {
            variant_id: true,
            name: true,
            sku_id: true,
          },
        },
      },
      orderBy: { [dbSortField]: dbSortOrder },
      skip,
      take: limitNum,
    }),
    prisma.medicine.count({ where }),
  ]);

  // ── Retroactive Audit Log Lookup for Ignored items with null linked_by_id ──
  const unlinkedWithoutActor = medicines.filter(
    (m) => m.link_status === "UNLINKED" && !m.linked_by_id
  );

  const fallbackAuditMap = new Map();

  if (unlinkedWithoutActor.length > 0) {
    try {
      const recentIgnoreLogs = await prisma.auditLog.findMany({
        where: {
          action: { in: ["UNMAPPED_MEDICINES_IGNORED", "MEDICINE_UNLINKED", "MEDICINE_MATCH_REJECTED"] },
        },
        select: {
          actor_id: true,
          created_at: true,
          metadata: true,
          entity_id: true,
        },
        orderBy: { created_at: "desc" },
        take: 100,
      });

      for (const med of unlinkedWithoutActor) {
        for (const log of recentIgnoreLogs) {
          const medIdsInLog = Array.isArray(log.metadata?.medicine_ids)
            ? log.metadata.medicine_ids
            : [log.entity_id].filter(Boolean);

          if (medIdsInLog.includes(med.medicine_id)) {
            fallbackAuditMap.set(med.medicine_id, {
              actor_id: log.actor_id,
              date: log.created_at,
            });
            break;
          }
        }
      }
    } catch (auditErr) {
      console.warn("[getMappingHistory] Audit lookup fallback failed:", auditErr.message);
    }
  }

  // ── Collect Actor IDs ──
  const cadminIds = new Set();
  const shopUserIds = new Set();

  medicines.forEach((m) => {
    const fallback = fallbackAuditMap.get(m.medicine_id);
    const actorId = m.linked_by_id || fallback?.actor_id;

    if (actorId) {
      const type = String(m.linked_by_type || "CADMIN").toUpperCase().trim();
      if (type === "CADMIN") {
        cadminIds.add(actorId);
      } else {
        shopUserIds.add(actorId);
      }
    }
  });

  const validCadminIds = Array.from(cadminIds).filter(isValidUUID);
  const validShopUserIds = Array.from(shopUserIds).filter(isValidUUID);

  // ── Exact Schema Lookups ──
  let cadmins = [];
  if (validCadminIds.length > 0) {
    try {
      cadmins = await prisma.cAdmin.findMany({
        where: { cadmin_id: { in: validCadminIds } },
        select: {
          cadmin_id: true,
          name: true,
          email: true,
          username: true,
        },
      });
    } catch (err) {
      console.error("[getMappingHistory] CAdmin query failed:", err.message);
    }
  }

  let shopUsers = [];
  if (validShopUserIds.length > 0) {
    try {
      shopUsers = await prisma.user.findMany({
        where: { user_id: { in: validShopUserIds } },
        select: {
          user_id: true,
          full_name: true,
          username: true,
          email: true,
        },
      });
    } catch (err) {
      console.error("[getMappingHistory] User query failed:", err.message);
    }
  }

  const actorMap = new Map();
  cadmins.forEach((c) => {
    const displayName = c.username || c.name || c.email || "cadmin";
    actorMap.set(c.cadmin_id, displayName);
  });
  shopUsers.forEach((u) => {
    const displayName = u.username || u.full_name || u.email || "Shop User";
    actorMap.set(u.user_id, displayName);
  });

  const historyItems = medicines.map((med) => {
    const fallback = fallbackAuditMap.get(med.medicine_id);
    const effectiveActorId = med.linked_by_id || fallback?.actor_id;
    const effectiveDate = med.linked_at || fallback?.date || med.updated_at || med.created_at;

    let actorName = "—";
    if (med.link_status === "AUTO_LINKED") {
      actorName = "System";
    } else if (effectiveActorId && actorMap.has(effectiveActorId)) {
      actorName = actorMap.get(effectiveActorId);
    } else if (med.link_status === "UNLINKED" || med.linked_by_type === "CADMIN") {
      actorName = "CAdmin";
    } else if (med.linked_by_type === "USER") {
      actorName = "Shop User";
    }

    return {
      id: med.medicine_id,
      rawName: med.name,
      normalizedRaw: med.normalized_name || med.name.toLowerCase(),
      manufacturer: med.manufacturer,
      status: med.link_status,
      linkedVariant: med.linkedVariant
        ? {
            id: med.linkedVariant.variant_id,
            name: med.linkedVariant.name,
            skuId: med.linkedVariant.sku_id,
          }
        : null,
      confidenceScore: med.link_confidence_score,
      actionBy: actorName,
      actionDate: effectiveDate,
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
    };
  });

  return {
    history: historyItems,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}
// ══════════════════════════════════════════════════════════════
// UNIGNORE MEDICINE
// ══════════════════════════════════════════════════════════════

export async function unignoreShopMedicine(medicineId, auditContext = {}) {
  const medicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
  });

  if (!medicine) throw new Error("Medicine not found");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Reset ignoration / unlinked flags
    const updated = await tx.medicine.update({
      where: { medicine_id: medicineId },
      data: {
        link_rejected: false,
        link_status: "PENDING",
        suggested_master_id: null,
        suggested_variant_id: null,
        suggestion_reason: null,
        link_confidence_score: null,
      },
    });

    // 2. Re-run auto-matcher
    try {
      const matchResult = await checkSingleMedicine({
        name: updated.name,
        manufacturer: updated.manufacturer,
        generic_name: updated.generic_name,
      });

      if (matchResult.status === "AUTO_LINKED") {
        await tx.medicine.update({
          where: { medicine_id: medicineId },
          data: {
            master_medicine_id: matchResult.master_medicine_id,
            linked_variant_id: matchResult.matched_variant?.variant_id ?? null,
            linked_variant_sku: matchResult.matched_variant?.sku_id ?? null,
            link_status: "AUTO_LINKED",
            link_confidence_score: matchResult.confidence,
            linked_at: new Date(),
            linked_by_type: "SYSTEM",
            suggestion_reason: matchResult.reason,
          },
        });
      } else if (matchResult.status === "PENDING") {
        await tx.medicine.update({
          where: { medicine_id: medicineId },
          data: {
            link_status: "SUGGESTED",
            link_confidence_score: matchResult.confidence,
            suggested_master_id: matchResult.suggested_master_id,
            suggestion_reason: matchResult.reason,
          },
        });
      }
    } catch (matchError) {
      console.warn(`Auto-match failed for unignored medicine ${medicineId}:`, matchError.message);
    }

    // 3. Log Audit Trail
    await audit.log(
      {
        action: audit.AuditAction.MEDICINE_UNIGNORED,
        entity_type: audit.EntityType.MEDICINE,
        entity_id: medicineId,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          medicine_id: medicineId,
          medicine_name: medicine.name,
          manufacturer: medicine.manufacturer,
        },
      },
      { tx },
    );

    return updated;
  });

  return result;
}