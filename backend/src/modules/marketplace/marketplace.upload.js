// backend/src/modules/marketplace/marketplace.upload.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.upload.js

import multer from "multer";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const MARKETPLACE_ASSET_FOLDER = "marketplace_assets";

export const marketplaceUpload = multer({
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