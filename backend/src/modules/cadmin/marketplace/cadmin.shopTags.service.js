// backend/src/modules/cadmin/marketplace/cadmin.shopTags.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";

// ── LIST ALL TAGS ────────────────────────────────────────────
export async function listTags() {
  return prisma.shopTag.findMany({
    orderBy: [{ sort_order: "asc" }, { label: "asc" }],
  });
}

// ── CREATE TAG ───────────────────────────────────────────────
export async function createTag(data) {
  const existing = await prisma.shopTag.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    const err = new Error(`Tag with slug "${data.slug}" already exists`);
    err.statusCode = 409;
    throw err;
  }

  return prisma.shopTag.create({
    data: {
      slug: data.slug,
      label: data.label,
      description: data.description ?? null,
      color_hex: data.color_hex ?? "#6366F1",
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    },
  });
}

// ── UPDATE TAG ───────────────────────────────────────────────
export async function updateTag(tagId, data) {
  const existing = await prisma.shopTag.findUnique({
    where: { tag_id: tagId },
  });
  if (!existing) {
    const err = new Error("Tag not found");
    err.statusCode = 404;
    throw err;
  }

  // If slug is being changed, check uniqueness
  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.shopTag.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken) {
      const err = new Error(`Slug "${data.slug}" is already taken`);
      err.statusCode = 409;
      throw err;
    }
  }

  return prisma.shopTag.update({
    where: { tag_id: tagId },
    data: {
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.label !== undefined && { label: data.label }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color_hex !== undefined && { color_hex: data.color_hex }),
      ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
    },
  });
}

// ── DELETE / DEACTIVATE TAG ──────────────────────────────────
export async function deleteTag(tagId) {
  const existing = await prisma.shopTag.findUnique({
    where: { tag_id: tagId },
  });
  if (!existing) {
    const err = new Error("Tag not found");
    err.statusCode = 404;
    throw err;
  }

  // Check how many shops use this tag
  const usageCount = await prisma.marketplaceProfile.count({
    where: { shop_tags: { has: existing.slug } },
  });

  if (usageCount > 0) {
    // Soft-deactivate instead of hard delete
    return prisma.shopTag.update({
      where: { tag_id: tagId },
      data: { is_active: false },
    });
  }

  // Safe to hard delete
  return prisma.shopTag.delete({
    where: { tag_id: tagId },
  });
}

// ── REORDER TAGS ─────────────────────────────────────────────
export async function reorderTags(orderedIds) {
  const ops = orderedIds.map((tagId, index) =>
    prisma.shopTag.update({
      where: { tag_id: tagId },
      data: { sort_order: index },
    })
  );

  return prisma.$transaction(ops);
}

// ── GET ACTIVE TAGS (for ERP + Mobile) ───────────────────────
export async function getActiveTags() {
  return prisma.shopTag.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    select: {
      slug: true,
      label: true,
      description: true,
      color_hex: true,
    },
  });
}

// ── RESOLVE SLUGS → TAG OBJECTS ──────────────────────────────
// Used by mobile API to convert shop_tags slugs to full objects.
// Accepts a pre-fetched tagMap for batch efficiency.
export function resolveShopTags(slugs, tagMap) {
  if (!Array.isArray(slugs) || slugs.length === 0) return [];
  return slugs
    .map((slug) => tagMap.get(slug))
    .filter(Boolean);
}

// ── BUILD TAG MAP ────────────────────────────────────────────
// Fetches all active tags and returns a Map<slug, {slug, label, colorHex, description}>
export async function buildTagMap() {
  const tags = await getActiveTags();
  const map = new Map();
  for (const t of tags) {
    map.set(t.slug, {
      slug: t.slug,
      label: t.label,
      colorHex: t.color_hex,
      description: t.description,
    });
  }
  return map;
}