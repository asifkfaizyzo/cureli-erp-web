// backend/src/modules/cadmin/app-config/cadmin.appConfig.upload.js (do not remove this comment)
// backend/src/modules/cadmin/app-config/cadmin.appConfig.upload.js
//
// Multer configuration for category image uploads.
// Mirrors the pattern used by cadmin.marketplace.upload.js.
// Stores file in memory so fileStorage.service.js can stream it to S3.

import multer from "multer";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      ),
      false
    );
  }
};

export const uploadCategoryImage = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});