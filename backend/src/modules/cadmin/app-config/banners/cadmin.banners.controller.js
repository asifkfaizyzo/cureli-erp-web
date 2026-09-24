// backend/src/modules/cadmin/app-config/banners/cadmin.banners.controller.js (do not remove this comment)
// src/modules/cadmin/app-config/banners/cadmin.banners.controller.js

import { success, fail } from "../../../../utils/response.js";
import {
  listSlides,
  createSlide,
  updateSlide,
  uploadSlideImage,
  deleteSlideImage,
  deleteSlide,
  reorderSlides,
  // strips
  listStrips,
  createStrip,
  updateStrip,
  uploadStripImage,
  deleteStripImage,
  deleteStrip,
  reorderStrips,
} from "./cadmin.banners.service.js";

function getActor(req) {
  return {
    cadminId:   req.cadmin?.cadmin_id ?? null,
    cadminName: req.cadmin?.name ?? req.cadmin?.username ?? "Unknown",
  };
}

function handleServiceError(res, err) {
  console.error("[banners]", err);
  if (err.code === "NOT_FOUND")           return fail(res, err.message, 404);
  if (err.code === "MAX_SLIDES_REACHED")  return fail(res, err.message, 422);
  if (err.code === "MAX_STRIPS_REACHED")  return fail(res, err.message, 422);
  return fail(res, "Internal server error", 500);
}

// ── Slides ────────────────────────────────────────────────────────────────────

export async function handleListSlides(req, res) {
  try {
    const slides = await listSlides();
    return success(res, { slides }, "Slides fetched");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleCreateSlide(req, res) {
  try {
    const slide = await createSlide(req.body, getActor(req));
    return success(res, { slide }, "Slide created", 201);
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleUpdateSlide(req, res) {
  try {
    const slide = await updateSlide(req.params.slideId, req.body, getActor(req));
    return success(res, { slide }, "Slide updated");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleUploadSlideImage(req, res) {
  if (!req.file) return fail(res, "No file uploaded", 400);
  try {
    const result = await uploadSlideImage(req.params.slideId, req.file, getActor(req));
    return success(res, result, "Slide image uploaded");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleDeleteSlideImage(req, res) {
  try {
    const slide = await deleteSlideImage(req.params.slideId, getActor(req));
    return success(res, { slide }, "Slide image removed");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleDeleteSlide(req, res) {
  try {
    await deleteSlide(req.params.slideId, getActor(req));
    return success(res, null, "Slide deleted");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleReorderSlides(req, res) {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return fail(res, "orderedIds must be a non-empty array", 400);
  }
  try {
    await reorderSlides(orderedIds, getActor(req));
    return success(res, null, "Slides reordered");
  } catch (err) { return handleServiceError(res, err); }
}

// ── Strips ────────────────────────────────────────────────────────────────────

export async function handleListStrips(req, res) {
  try {
    const strips = await listStrips();
    return success(res, { strips }, "Strips fetched");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleCreateStrip(req, res) {
  try {
    const strip = await createStrip(req.body, getActor(req));
    return success(res, { strip }, "Strip created", 201);
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleUpdateStrip(req, res) {
  try {
    const strip = await updateStrip(req.params.stripId, req.body, getActor(req));
    return success(res, { strip }, "Strip updated");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleUploadStripImage(req, res) {
  if (!req.file) return fail(res, "No file uploaded", 400);
  try {
    const result = await uploadStripImage(req.params.stripId, req.file, getActor(req));
    return success(res, result, "Strip image uploaded");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleDeleteStripImage(req, res) {
  try {
    const strip = await deleteStripImage(req.params.stripId, getActor(req));
    return success(res, { strip }, "Strip image removed");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleDeleteStrip(req, res) {
  try {
    await deleteStrip(req.params.stripId, getActor(req));
    return success(res, null, "Strip deleted");
  } catch (err) { return handleServiceError(res, err); }
}

export async function handleReorderStrips(req, res) {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return fail(res, "orderedIds must be a non-empty array", 400);
  }
  try {
    await reorderStrips(orderedIds, getActor(req));
    return success(res, null, "Strips reordered");
  } catch (err) { return handleServiceError(res, err); }
}