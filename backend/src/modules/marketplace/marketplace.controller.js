// backend/src/modules/marketplace/marketplace.controller.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.controller.js

import * as MarketplaceService from "./marketplace.service.js";
import * as PlacesService from "./places.service.js";
import { success, fail } from "../../utils/response.js";
import { marketplaceUpload, MARKETPLACE_ASSET_FOLDER } from "./marketplace.upload.js";
import { uploadFile, getPublicUrl } from "../../services/fileStorage.service.js";

function getExt(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : "";
}

// GET /api/marketplace/status
export const getStatus = async (req, res) => {
  try {
    const data = await MarketplaceService.getMarketplaceStatus(req.user.shop_id);
    return success(res, data, "Marketplace status retrieved");
  } catch (error) {
    console.error("[marketplace] getStatus error:", error);
    return fail(res, error.message, 500);
  }
};

// POST /api/marketplace/onboarding/draft
export const postDraft = async (req, res) => {
  try {
    const data = await MarketplaceService.saveDraft(req.user.shop_id, req.body);
    return success(res, data, "Draft saved");
  } catch (error) {
    console.error("[marketplace] postDraft error:", error);
    return fail(res, error.message, 500);
  }
};

// POST /api/marketplace/onboarding/storefront
export const postStorefront = async (req, res) => {
  try {
    const data = await MarketplaceService.saveStorefront(req.user.shop_id, req.body);
    return success(res, data, "Storefront saved");
  } catch (error) {
    console.error("[marketplace] postStorefront error:", error);
    return fail(res, error.message, 500);
  }
};

// POST /api/marketplace/onboarding/branches
export const postBranchSelections = async (req, res) => {
  try {
    const data = await MarketplaceService.saveBranchSelections(
      req.user.shop_id,
      req.body.branch_ids
    );
    return success(res, data, "Branch selections saved");
  } catch (error) {
    console.error("[marketplace] postBranchSelections error:", error);
    return fail(res, error.message, 400);
  }
};

// POST /api/marketplace/onboarding/branch-config/:branch_id
export const postBranchConfig = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const data = await MarketplaceService.saveBranchConfig(
      req.user.shop_id,
      branch_id,
      req.body,
      req.user
    );
    return success(res, data, "Branch configuration saved");
  } catch (error) {
    console.error("[marketplace] postBranchConfig error:", error);
    const status = error.message.includes("only configure") ? 403 : 400;
    return fail(res, error.message, status);
  }
};

// GET /api/marketplace/storefront
export const getStorefront = async (req, res) => {
  try {
    const data = await MarketplaceService.getStorefront(req.user.shop_id);
    return success(res, data, "Storefront retrieved");
  } catch (error) {
    console.error("[marketplace] getStorefront error:", error);
    return fail(res, error.message, 500);
  }
};

// PATCH /api/marketplace/storefront
export const patchStorefront = async (req, res) => {
  try {
    const data = await MarketplaceService.saveStorefront(req.user.shop_id, req.body);
    return success(res, data, "Storefront updated");
  } catch (error) {
    console.error("[marketplace] patchStorefront error:", error);
    return fail(res, error.message, 500);
  }
};

// GET /api/marketplace/branches
export const getBranches = async (req, res) => {
  try {
    const data = await MarketplaceService.getBranchSettings(req.user.shop_id, req.user);
    return success(res, data, "Branch settings retrieved");
  } catch (error) {
    console.error("[marketplace] getBranches error:", error);
    return fail(res, error.message, 500);
  }
};

// PATCH /api/marketplace/branches/:branch_id
export const patchBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const data = await MarketplaceService.saveBranchConfig(
      req.user.shop_id,
      branch_id,
      req.body,
      req.user
    );
    return success(res, data, "Branch updated");
  } catch (error) {
    console.error("[marketplace] patchBranch error:", error);
    const status = error.message.includes("only configure") ? 403 : 400;
    return fail(res, error.message, status);
  }
};

// POST /api/marketplace/onboarding/go-live
export const postGoLive = async (req, res) => {
  try {
    const data = await MarketplaceService.goLive(req.user.shop_id);
    return success(res, data, "Your marketplace is now LIVE!");
  } catch (error) {
    console.error("[marketplace] postGoLive error:", error);
    if (error.validationErrors) {
      return res.status(422).json({
        success: false,
        message: error.message,
        errors: error.validationErrors,
      });
    }
    return fail(res, error.message, 400);
  }
};

// POST /api/marketplace/suspend
export const postSuspend = async (req, res) => {
  try {
    const data = await MarketplaceService.suspendMarketplace(req.user.shop_id);
    return success(res, data, "Marketplace suspended");
  } catch (error) {
    console.error("[marketplace] postSuspend error:", error);
    return fail(res, error.message, 400);
  }
};

// POST /api/marketplace/resume
export const postResume = async (req, res) => {
  try {
    const data = await MarketplaceService.resumeMarketplace(req.user.shop_id);
    return success(res, data, "Marketplace resumed");
  } catch (error) {
    console.error("[marketplace] postResume error:", error);
    return fail(res, error.message, 400);
  }
};

// GET /api/marketplace/places/search?query=...
export const getPlacesSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return fail(res, "Query must be at least 2 characters", 400);
    }
    const results = await PlacesService.searchPlaces(query.trim());
    return success(res, results, "Places results");
  } catch (error) {
    console.error("[marketplace] getPlacesSearch error:", error);
    return fail(res, "Failed to search places", 500);
  }
};

// GET /api/marketplace/places/details?place_id=...
export const getPlaceDetails = async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) {
      return fail(res, "place_id is required", 400);
    }
    const result = await PlacesService.getPlaceDetails(place_id);
    return success(res, result, "Place details");
  } catch (error) {
    console.error("[marketplace] getPlaceDetails error:", error);
    return fail(res, "Failed to get place details", 500);
  }
};

// POST /api/marketplace/onboarding/banking
export const postBanking = async (req, res) => {
  try {
    const data = await MarketplaceService.saveBanking(req.user.shop_id, req.body);
    return success(res, data, "Banking details saved successfully");
  } catch (error) {
    console.error("[marketplace] postBanking error:", error);
    return fail(res, error.message, 500);
  }
};

// PATCH /api/marketplace/banking
export const patchBanking = async (req, res) => {
  try {
    const data = await MarketplaceService.saveBanking(req.user.shop_id, req.body);
    return success(res, data, "Banking details updated successfully");
  } catch (error) {
    console.error("[marketplace] patchBanking error:", error);
    return fail(res, error.message, 500);
  }
};

// POST /api/marketplace/upload/:type
export const postUpload = (req, res) => {
  const { type } = req.params;

  if (!["logo", "banner", "branch_image"].includes(type)) {   
  return fail(res, "Invalid upload type. Must be logo, banner, or branch_image", 400);
}

  marketplaceUpload(req, res, async (err) => {
    if (err) {
      console.error("[marketplace] multer error:", err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return fail(res, "File too large. Maximum size is 5MB", 400);
      }
      if (err.code === "INVALID_MIME_TYPE") {
        return fail(res, "Invalid file type. Only JPG, PNG, and WebP are allowed", 400);
      }
      return fail(res, err.message || "Upload failed", 400);
    }

    if (!req.file) {
      return fail(res, "No file uploaded", 400);
    }

    try {
      const result = await uploadFile({
        buffer: req.file.buffer,
        folder: MARKETPLACE_ASSET_FOLDER,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        customFilename: `${type}-${req.user.shop_id}-${Date.now()}${getExt(req.file.originalname)}`,
      });

      const url = getPublicUrl({
        folder: MARKETPLACE_ASSET_FOLDER,
        filename: result.storage_key,
      });

      return success(
        res,
        { url, storage_key: result.storage_key, type, size: result.size },
        `${type} uploaded successfully`
      );
    } catch (uploadError) {
      console.error("[marketplace] S3 upload error:", uploadError.message);
      return fail(res, "Failed to upload file. Please try again.", 500);
    }
  });
};