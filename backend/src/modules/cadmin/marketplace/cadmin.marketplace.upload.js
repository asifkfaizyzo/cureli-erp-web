// backend/src/modules/cadmin/marketplace/cadmin.marketplace.upload.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace/cadmin.marketplace.upload.js

import multer from "multer";
import { uploadFile, getPublicUrl } from "../../../services/fileStorage.service.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ← Use "marketplace_assets" — the folder already in ALLOWED_FOLDERS
const CADMIN_MARKETPLACE_FOLDER = "marketplace_assets";

const cadminMarketplaceMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error("Only JPG, PNG, and WebP images are allowed");
      err.code = "INVALID_MIME_TYPE";
      cb(err, false);
    }
  },
}).single("file");

function getExt(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : "";
}

export const handleCAdminMarketplaceUpload = (req, res) => {
  const { type } = req.params;
  const VALID_TYPES = ["logo", "banner", "branch_image"];

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
    });
  }

  cadminMarketplaceMulter(req, res, async (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 5MB"
          : err.code === "INVALID_MIME_TYPE"
          ? "Invalid file type. Only JPG, PNG, and WebP are allowed"
          : err.message || "Upload failed";
      return res.status(400).json({ success: false, message: msg });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    try {
      const filename = `${type}-${req.cadmin.cadmin_id}-${Date.now()}${getExt(
        req.file.originalname
      )}`;

      const result = await uploadFile({
        buffer: req.file.buffer,
        folder: CADMIN_MARKETPLACE_FOLDER,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        customFilename: filename,
      });

      // Return the full backend URL so cadmin frontend can display it
      // getPublicUrl returns /api/files/... which is the ERP proxy path
      // We need the absolute URL for the cadmin frontend
      const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      const url = `${API_BASE}/api/files/${CADMIN_MARKETPLACE_FOLDER}/${result.storage_key}`;

      return res.json({
        success: true,
        data: {
          url,
          storage_key: result.storage_key,
          type,
          size: result.size,
        },
        message: `${type} uploaded successfully`,
      });
    } catch (uploadErr) {
      console.error("[cadmin.marketplace.upload] S3 error:", uploadErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file. Please try again.",
      });
    }
  });
};