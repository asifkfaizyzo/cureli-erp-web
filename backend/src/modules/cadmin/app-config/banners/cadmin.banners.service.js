// backend/src/modules/cadmin/app-config/banners/cadmin.banners.service.js (do not remove this comment)
// src/modules/cadmin/app-config/banners/cadmin.banners.service.js

import prisma from "../../../../config/prisma.js";
import {
  uploadFile,
  deleteFile,
} from "../../../../services/fileStorage.service.js";
import { resolveAssetUrl } from "../../../../services/assetUrl.service.js";

const BANNER_FOLDER = "banner_images";
const MAX_SLIDES    = 8;
const MAX_STRIPS    = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveSlide(row) {
  return {
    slideId:           row.slide_id,
    position:          row.position,
    title:             row.title ?? "",
    subtitle:          row.subtitle ?? null,
    imageUrl:          row.image_storage_key ? resolveAssetUrl(row.image_storage_key) : null,
    imageOriginalName: row.image_original_name ?? null,
    imageFileSize:     row.image_file_size ?? null,
    ctaLabel:          row.cta_label ?? null,
    ctaAction:         row.cta_action,
    ctaActionValue:    row.cta_action_value ?? null,
    isActive:          row.is_active,
    gradientIndex:     row.gradient_index,
    // ── new ──────────────────────────────────────────────────────────────────
    gradientColor1:    row.gradient_color_1 ?? null,
    gradientColor2:    row.gradient_color_2 ?? null,
    gradientAngle:     row.gradient_angle ?? null,
    // ─────────────────────────────────────────────────────────────────────────
    placeholderIcon:   row.placeholder_icon,
    updatedByName:     row.updated_by_name ?? null,
    updatedAt:         row.updated_at,
    layoutMode:        row.layout_mode ?? "TEXT_WITH_IMAGE",
  };
}

function resolveStrip(row) {
  if (!row) return null;
  return {
    stripId:           row.strip_id,
    position:          row.position,
    imageUrl:          row.image_storage_key ? resolveAssetUrl(row.image_storage_key) : null,
    imageOriginalName: row.image_original_name ?? null,
    imageFileSize:     row.image_file_size ?? null,
    ctaAction:         row.cta_action,
    ctaActionValue:    row.cta_action_value ?? null,
    isActive:          row.is_active,
    updatedByName:     row.updated_by_name ?? null,
    updatedAt:         row.updated_at,
  };
}

async function deleteS3Image(storageKey) {
  if (!storageKey) return;
  try {
    const filename = storageKey.replace(`${BANNER_FOLDER}/`, "");
    await deleteFile({ folder: BANNER_FOLDER, filename });
  } catch (err) {
    console.warn("[banners] S3 delete failed:", err.message);
  }
}

async function uploadS3Image(file) {
  const uploaded = await uploadFile({
    buffer:       file.buffer,
    folder:       BANNER_FOLDER,
    originalName: file.originalname,
    mimetype:     file.mimetype,
    size:         file.size,
  });
  return `${BANNER_FOLDER}/${uploaded.storage_key}`;
}

// ── Slides ────────────────────────────────────────────────────────────────────

export async function listSlides() {
  const rows = await prisma.homeBannerSlide.findMany({
    orderBy: { position: "asc" },
  });
  return rows.map(resolveSlide);
}

export async function createSlide(data, actor) {
  const count = await prisma.homeBannerSlide.count();
  if (count >= MAX_SLIDES) {
    const err = new Error(`Maximum ${MAX_SLIDES} slides allowed`);
    err.code = "MAX_SLIDES_REACHED";
    throw err;
  }

  const last = await prisma.homeBannerSlide.findFirst({
    orderBy: { position: "desc" },
    select:  { position: true },
  });
  const position = (last?.position ?? -1) + 1;

  const row = await prisma.homeBannerSlide.create({
    data: {
      position,
      title:                data.title ?? "",
      subtitle:             data.subtitle ?? null,
      cta_label:            data.ctaLabel ?? null,
      cta_action:           data.ctaAction ?? "NONE",
      cta_action_value:     data.ctaActionValue ?? null,
      is_active:            data.isActive ?? true,
      gradient_index:       data.gradientIndex ?? 0,
      // ── new ──────────────────────────────────────────────────────────────
      gradient_color_1:     data.gradientColor1 ?? null,
      gradient_color_2:     data.gradientColor2 ?? null,
      gradient_angle:       data.gradientAngle  ?? null,
      // ─────────────────────────────────────────────────────────────────────
      placeholder_icon:     data.placeholderIcon ?? "medkit-outline",
      layout_mode:          data.layoutMode ?? "TEXT_WITH_IMAGE",
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return resolveSlide(row);
}

export async function updateSlide(slideId, data, actor) {
  const existing = await prisma.homeBannerSlide.findUnique({
    where: { slide_id: slideId },
  });
  if (!existing) {
    const err = new Error("Slide not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const row = await prisma.homeBannerSlide.update({
    where: { slide_id: slideId },
    data: {
      title:                data.title ?? existing.title,
      subtitle:             data.subtitle ?? null,
      cta_label:            data.ctaLabel ?? null,
      cta_action:           data.ctaAction ?? existing.cta_action,
      cta_action_value:     data.ctaActionValue ?? null,
      is_active:            data.isActive ?? existing.is_active,
      gradient_index:       data.gradientIndex ?? existing.gradient_index,
      // ── new ──────────────────────────────────────────────────────────────
      gradient_color_1:     data.gradientColor1 ?? null,
      gradient_color_2:     data.gradientColor2 ?? null,
      gradient_angle:       data.gradientAngle  ?? null,
      // ─────────────────────────────────────────────────────────────────────
      placeholder_icon:     data.placeholderIcon ?? existing.placeholder_icon,
      layout_mode:          data.layoutMode ?? existing.layout_mode,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return resolveSlide(row);
}

export async function uploadSlideImage(slideId, file, actor) {
  const existing = await prisma.homeBannerSlide.findUnique({
    where: { slide_id: slideId },
  });
  if (!existing) {
    const err = new Error("Slide not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await deleteS3Image(existing.image_storage_key);
  const storageKey = await uploadS3Image(file);

  const row = await prisma.homeBannerSlide.update({
    where: { slide_id: slideId },
    data: {
      image_storage_key:    storageKey,
      image_original_name:  file.originalname,
      image_mime_type:      file.mimetype,
      image_file_size:      file.size,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return { imageUrl: resolveAssetUrl(storageKey), slide: resolveSlide(row) };
}

export async function deleteSlideImage(slideId, actor) {
  const existing = await prisma.homeBannerSlide.findUnique({
    where: { slide_id: slideId },
  });
  if (!existing) {
    const err = new Error("Slide not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await deleteS3Image(existing.image_storage_key);

  const row = await prisma.homeBannerSlide.update({
    where: { slide_id: slideId },
    data: {
      image_storage_key:    null,
      image_original_name:  null,
      image_mime_type:      null,
      image_file_size:      null,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return resolveSlide(row);
}

export async function deleteSlide(slideId, actor) {
  const existing = await prisma.homeBannerSlide.findUnique({
    where: { slide_id: slideId },
  });
  if (!existing) {
    const err = new Error("Slide not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await deleteS3Image(existing.image_storage_key);
  await prisma.homeBannerSlide.delete({ where: { slide_id: slideId } });
  await recompactSlidePositions();
}

export async function reorderSlides(orderedSlideIds, actor) {
  const rows = await prisma.homeBannerSlide.findMany({
    select: { slide_id: true },
  });
  const existingIds = new Set(rows.map((r) => r.slide_id));

  for (const id of orderedSlideIds) {
    if (!existingIds.has(id)) {
      const err = new Error(`Unknown slide id: ${id}`);
      err.code = "NOT_FOUND";
      throw err;
    }
  }

  await prisma.$transaction(
    orderedSlideIds.map((id, index) =>
      prisma.homeBannerSlide.update({
        where: { slide_id: id },
        data:  { position: index },
      }),
    ),
  );
}

async function recompactSlidePositions() {
  const rows = await prisma.homeBannerSlide.findMany({
    orderBy: { position: "asc" },
    select:  { slide_id: true },
  });
  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.homeBannerSlide.update({
        where: { slide_id: row.slide_id },
        data:  { position: index },
      }),
    ),
  );
}

// ── Strips ────────────────────────────────────────────────────────────────────

export async function listStrips() {
  const rows = await prisma.homeStripBanner.findMany({
    orderBy: { position: "asc" },
  });
  return rows.map(resolveStrip);
}

export async function createStrip(data, actor) {
  const count = await prisma.homeStripBanner.count();
  if (count >= MAX_STRIPS) {
    const err = new Error(`Maximum ${MAX_STRIPS} strip banners allowed`);
    err.code = "MAX_STRIPS_REACHED";
    throw err;
  }

  const last = await prisma.homeStripBanner.findFirst({
    orderBy: { position: "desc" },
    select:  { position: true },
  });
  const position = (last?.position ?? -1) + 1;

  const row = await prisma.homeStripBanner.create({
    data: {
      position,
      cta_action:           data.ctaAction ?? "NONE",
      cta_action_value:     data.ctaActionValue ?? null,
      is_active:            data.isActive ?? true,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return resolveStrip(row);
}

export async function updateStrip(stripId, data, actor) {
  const existing = await prisma.homeStripBanner.findUnique({
    where: { strip_id: stripId },
  });
  if (!existing) {
    const err = new Error("Strip not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const row = await prisma.homeStripBanner.update({
    where: { strip_id: stripId },
    data: {
      cta_action:           data.ctaAction ?? existing.cta_action,
      cta_action_value:     data.ctaActionValue ?? null,
      is_active:            data.isActive ?? existing.is_active,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return resolveStrip(row);
}

export async function uploadStripImage(stripId, file, actor) {
  const existing = await prisma.homeStripBanner.findUnique({
    where: { strip_id: stripId },
  });
  if (!existing) {
    const err = new Error("Strip not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await deleteS3Image(existing.image_storage_key);
  const storageKey = await uploadS3Image(file);

  const row = await prisma.homeStripBanner.update({
    where: { strip_id: stripId },
    data: {
      image_storage_key:    storageKey,
      image_original_name:  file.originalname,
      image_mime_type:      file.mimetype,
      image_file_size:      file.size,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return { imageUrl: resolveAssetUrl(storageKey), strip: resolveStrip(row) };
}

export async function deleteStripImage(stripId, actor) {
  const existing = await prisma.homeStripBanner.findUnique({
    where: { strip_id: stripId },
  });
  if (!existing) {
    const err = new Error("Strip not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await deleteS3Image(existing.image_storage_key);

  const row = await prisma.homeStripBanner.update({
    where: { strip_id: stripId },
    data: {
      image_storage_key:    null,
      image_original_name:  null,
      image_mime_type:      null,
      image_file_size:      null,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name:      actor.cadminName,
    },
  });

  return resolveStrip(row);
}

export async function deleteStrip(stripId, actor) {
  const existing = await prisma.homeStripBanner.findUnique({
    where: { strip_id: stripId },
  });
  if (!existing) {
    const err = new Error("Strip not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await deleteS3Image(existing.image_storage_key);
  await prisma.homeStripBanner.delete({ where: { strip_id: stripId } });
  await recompactStripPositions();
}

export async function reorderStrips(orderedStripIds, actor) {
  const rows = await prisma.homeStripBanner.findMany({
    select: { strip_id: true },
  });
  const existingIds = new Set(rows.map((r) => r.strip_id));

  for (const id of orderedStripIds) {
    if (!existingIds.has(id)) {
      const err = new Error(`Unknown strip id: ${id}`);
      err.code = "NOT_FOUND";
      throw err;
    }
  }

  await prisma.$transaction(
    orderedStripIds.map((id, index) =>
      prisma.homeStripBanner.update({
        where: { strip_id: id },
        data:  { position: index },
      }),
    ),
  );
}

async function recompactStripPositions() {
  const rows = await prisma.homeStripBanner.findMany({
    orderBy: { position: "asc" },
    select:  { strip_id: true },
  });
  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.homeStripBanner.update({
        where: { strip_id: row.strip_id },
        data:  { position: index },
      }),
    ),
  );
}

// ── Public mobile — combined fetch ────────────────────────────────────────────

export async function getPublicHomeBanners() {
  const [slides, strips] = await Promise.all([
    prisma.homeBannerSlide.findMany({
      where:   { is_active: true },
      orderBy: { position: "asc" },
    }),
    prisma.homeStripBanner.findMany({
      where:   { is_active: true },
      orderBy: { position: "asc" },
    }),
  ]);

  return {
    slides: slides.map(resolveSlide),
    strips: strips.map(resolveStrip),
  };
}