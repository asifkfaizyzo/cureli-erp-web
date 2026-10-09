// backend/src/modules/cadmin/marketplace/cadmin.shopTags.controller.js (do not remove this comment)

import { success, fail } from "../../../utils/response.js";
import * as ShopTagsService from "./cadmin.shopTags.service.js";

// ── GET /cadmin/marketplace/shop-tags ────────────────────────
export async function listTags(req, res) {
  try {
    const tags = await ShopTagsService.listTags();
    return success(res, tags, "Shop tags fetched");
  } catch (err) {
    console.error("[cadmin.shopTags] list error:", err);
    return fail(res, err.message, 500);
  }
}

// ── POST /cadmin/marketplace/shop-tags ───────────────────────
export async function createTag(req, res) {
  try {
    const { slug, label, description, color_hex, sort_order, is_active } = req.body;

    if (!slug?.trim() || !label?.trim()) {
      return fail(res, "slug and label are required", 400);
    }

    const tag = await ShopTagsService.createTag({
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      label: label.trim(),
      description: description?.trim() || null,
      color_hex: color_hex?.trim() || "#6366F1",
      sort_order: sort_order ?? 0,
      is_active: is_active ?? true,
    });

    return success(res, tag, "Shop tag created", 201);
  } catch (err) {
    console.error("[cadmin.shopTags] create error:", err);
    const status = err.statusCode || 500;
    return fail(res, err.message, status);
  }
}

// ── PUT /cadmin/marketplace/shop-tags/:tag_id ────────────────
export async function updateTag(req, res) {
  try {
    const { tag_id } = req.params;
    const { slug, label, description, color_hex, sort_order, is_active } = req.body;

    const tag = await ShopTagsService.updateTag(tag_id, {
      ...(slug !== undefined && { slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") }),
      ...(label !== undefined && { label: label.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(color_hex !== undefined && { color_hex: color_hex.trim() }),
      ...(sort_order !== undefined && { sort_order }),
      ...(is_active !== undefined && { is_active }),
    });

    return success(res, tag, "Shop tag updated");
  } catch (err) {
    console.error("[cadmin.shopTags] update error:", err);
    const status = err.statusCode || 500;
    return fail(res, err.message, status);
  }
}

// ── DELETE /cadmin/marketplace/shop-tags/:tag_id ─────────────
export async function deleteTag(req, res) {
  try {
    const { tag_id } = req.params;
    const result = await ShopTagsService.deleteTag(tag_id);
    return success(res, result, "Shop tag removed");
  } catch (err) {
    console.error("[cadmin.shopTags] delete error:", err);
    const status = err.statusCode || 500;
    return fail(res, err.message, status);
  }
}

// ── PATCH /cadmin/marketplace/shop-tags/reorder ──────────────
export async function reorderTags(req, res) {
  try {
    const { ordered_ids } = req.body;

    if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
      return fail(res, "ordered_ids array is required", 400);
    }

    await ShopTagsService.reorderTags(ordered_ids);
    return success(res, null, "Tags reordered");
  } catch (err) {
    console.error("[cadmin.shopTags] reorder error:", err);
    return fail(res, err.message, 500);
  }
}