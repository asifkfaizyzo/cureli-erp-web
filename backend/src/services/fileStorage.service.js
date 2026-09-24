// backend/src/services/fileStorage.service.js (do not remove this comment)
// backend/src/services/fileStorage.service.js
// ============================================
// FILE STORAGE SERVICE — S3 PROVIDER
// ============================================
//
// MIGRATION NOTES:
// - All local fs operations replaced with S3 SDK equivalents
// - storage_key remains FILENAME ONLY (e.g., "17000000-abc123.pdf")
// - S3 key is constructed internally as folder/filename
// - Validation logic is 100% unchanged
// - API contract (return shapes) is 100% unchanged
// - New function: getFileStream() — for Phase 3 file serving
// ============================================

import path from "path";
import crypto from "crypto";
import s3Client, { S3_BUCKET } from "../config/s3.js";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl as generatePresignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================
// CONSTANTS (UNCHANGED)
// ============================================

// Whitelisted folders (prevent directory traversal)
const ALLOWED_FOLDERS = [
  "shop_files",
  "broadcast_attachments",
  "email_attachments",
  "tickets",
  "marketplace_assets",
   "customer_tickets",
  "order_prescriptions",
  "prescription_requests",
  "order_invoices",
  "category_images",
  "rider_documents",
  "banner_images",
];

// File size limits (bytes)
const MAX_FILE_SIZES = {
  shop_files: 5 * 1024 * 1024, // 5MB
  broadcast_attachments: 50 * 1024 * 1024, // 50MB
  email_attachments: 10 * 1024 * 1024, // 10MB
  tickets: 5 * 1024 * 1024, // 5MB
  marketplace_assets: 5 * 1024 * 1024,
   customer_tickets: 5 * 1024 * 1024,
  order_prescriptions: 10 * 1024 * 1024,
  prescription_requests: 10 * 1024 * 1024,
  order_invoices: 10 * 1024 * 1024,
  category_images: 5 * 1024 * 1024,
  rider_documents: 5 * 1024 * 1024,
  banner_images: 5 * 1024 * 1024,
};

// Allowed MIME types per folder
const ALLOWED_MIME_TYPES = {
  shop_files: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
  customer_tickets: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  broadcast_attachments: [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    // Videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/3gpp",
    "video/3gpp2",
  ],
  email_attachments: [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
  rider_documents: [
    // ← ADD THIS
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ],
  tickets: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  marketplace_assets: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  order_prescriptions: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ],
  prescription_requests: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ],
  order_invoices: ["application/pdf"],
  category_images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  banner_images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

// Blocked extensions (security)
const BLOCKED_EXTENSIONS = [
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".msi",
  ".dll",
  ".scr",
  ".js",
  ".vbs",
  ".ps1",
  ".app",
  ".deb",
  ".rpm",
];

// ============================================
// VALIDATION HELPERS (100% UNCHANGED)
// ============================================

/**
 * Validate folder name against whitelist
 */
export function validateFolder(folder) {
  if (!folder || typeof folder !== "string") {
    const err = new Error("Folder name is required");
    err.code = "INVALID_FOLDER";
    throw err;
  }

  // Remove any path traversal attempts
  const sanitized = folder
    .replace(/\.\./g, "")
    .replace(/\//g, "")
    .replace(/\\/g, "");

  if (!ALLOWED_FOLDERS.includes(sanitized)) {
    const err = new Error(
      `Invalid folder: ${folder}. Allowed: ${ALLOWED_FOLDERS.join(", ")}`,
    );
    err.code = "FOLDER_NOT_ALLOWED";
    throw err;
  }

  return sanitized;
}

/**
 * Validate file extension
 */
export function validateExtension(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (BLOCKED_EXTENSIONS.includes(ext)) {
    const err = new Error(`Blocked file extension: ${ext}`);
    err.code = "BLOCKED_EXTENSION";
    throw err;
  }

  return ext;
}

/**
 * Validate MIME type for folder
 */
export function validateMimeType(folder, mimetype) {
  const allowed = ALLOWED_MIME_TYPES[folder];

  if (!allowed) {
    // If folder has no MIME restrictions, allow all (except blocked extensions)
    return true;
  }

  if (!allowed.includes(mimetype)) {
    const err = new Error(
      `Invalid file type for ${folder}. Allowed: ${allowed.join(", ")}`,
    );
    err.code = "INVALID_MIME_TYPE";
    throw err;
  }

  return true;
}

/**
 * Validate file size
 */
export function validateFileSize(folder, size) {
  const maxSize = MAX_FILE_SIZES[folder];

  if (!maxSize) {
    // No size limit for this folder
    return true;
  }

  if (size > maxSize) {
    const err = new Error(
      `File too large for ${folder}. Max: ${formatFileSize(maxSize)}, Got: ${formatFileSize(size)}`,
    );
    err.code = "FILE_TOO_LARGE";
    throw err;
  }

  return true;
}

/**
 * Format file size for human readability
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Generate unique filename (UNCHANGED)
 */
function generateUniqueFilename(originalName, folder) {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString("hex");

  // Different naming patterns for different folders
  if (folder === "email_attachments") {
    return `email-${timestamp}-${randomHash}${ext}`;
  } else if (folder === "broadcast_attachments") {
    return `broadcast-${timestamp}-${randomHash}${ext}`;
  } else {
    return `${timestamp}-${randomHash}${ext}`;
  }
}

/**
 * Build S3 object key from folder + filename
 * This is the ONLY place where the full S3 path is constructed.
 * Callers never see this — they work with folder + filename separately.
 *
 * @param {string} folder - Validated folder name
 * @param {string} filename - Filename (storage_key from DB)
 * @returns {string} S3 key like "tickets/17000000-abc123.pdf"
 */
function buildS3Key(folder, filename) {
  return `${folder}/${filename}`;
}

/**
 * Check if an S3 error is a "not found" error
 */
function isNotFoundError(error) {
  return (
    error.name === "NotFound" ||
    error.name === "NoSuchKey" ||
    error.$metadata?.httpStatusCode === 404
  );
}

// ============================================
// CORE S3 OPERATIONS
// ============================================

/**
 * Upload file to S3
 *
 * @returns {{ filename, folder, size, mimetype, storage_key, uploaded_at }}
 *   storage_key = filename only (NOT the full S3 key)
 */
export async function uploadFile({
  buffer,
  folder,
  originalName,
  mimetype,
  size,
  customFilename = null,
}) {
  try {
    // 1. Validate inputs
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("File buffer is required");
    }

    if (!originalName) {
      throw new Error("Original filename is required");
    }

    const validatedFolder = validateFolder(folder);
    validateExtension(originalName);
    validateMimeType(validatedFolder, mimetype);
    validateFileSize(validatedFolder, size);

    // 2. Generate filename
    const filename =
      customFilename || generateUniqueFilename(originalName, validatedFolder);

    // Validate custom filename extension if provided
    if (customFilename) {
      validateExtension(customFilename);
    }

    // 3. Build S3 key
    const key = buildS3Key(validatedFolder, filename);

    // 4. Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    // 5. Return metadata (storage_key = filename only, NOT the full S3 key)
    return {
      filename,
      folder: validatedFolder,
      size,
      mimetype,
      storage_key: filename,
      uploaded_at: new Date(),
    };
  } catch (error) {
    console.error("[FileStorage] Upload failed:", error.message);
    throw error;
  }
}

/**
 * Delete file from S3
 *
 * @param {{ folder: string, filename: string }}
 * @returns {boolean} true if deleted, false if not found
 */
export async function deleteFile({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const key = buildS3Key(validatedFolder, filename);

    // Check existence first to maintain return contract
    // (S3 DeleteObject is idempotent — doesn't error on missing objects)
    const exists = await fileExists({ folder: validatedFolder, filename });
    if (!exists) {
      console.warn(`[FileStorage] File not found for deletion: ${key}`);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);

    return true;
  } catch (error) {
    console.error("[FileStorage] Delete failed:", error.message);
    throw error;
  }
}

/**
 * Check if file exists in S3
 */
export async function fileExists({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const key = buildS3Key(validatedFolder, filename);

    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }
    console.error("[FileStorage] Existence check failed:", error.message);
    return false;
  }
}

/**
 * Get file metadata from S3
 *
 * Return shape matches original contract.
 * Note: S3 only has one timestamp (LastModified), so both
 * created_at and modified_at return the same value.
 */
export async function getFileMetadata({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const key = buildS3Key(validatedFolder, filename);

    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      size: response.ContentLength,
      size_formatted: formatFileSize(response.ContentLength),
      content_type: response.ContentType,
      created_at: response.LastModified,
      modified_at: response.LastModified,
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      const err = new Error("File not found");
      err.code = "FILE_NOT_FOUND";
      throw err;
    }
    console.error("[FileStorage] Get metadata failed:", error.message);
    throw error;
  }
}

/**
 * Get readable stream from S3
 *
 * NEW FUNCTION — used by files.controller.js (Phase 3) to stream
 * files directly from S3 to HTTP response.
 *
 * @param {{ folder: string, filename: string }}
 * @returns {{ stream, contentType, contentLength, lastModified }}
 */
export async function getFileStream({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const key = buildS3Key(validatedFolder, filename);

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      stream: response.Body,
      contentType: response.ContentType || "application/octet-stream",
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      const err = new Error("File not found");
      err.code = "FILE_NOT_FOUND";
      throw err;
    }
    console.error("[FileStorage] Get file stream failed:", error.message);
    throw error;
  }
}

// ============================================
// URL GENERATION
// ============================================

/**
 * Get public URL for file
 *
 * Returns the backend proxy path — NOT a direct S3 URL.
 * All access goes through /api/files/* which streams from S3.
 */
export function getPublicUrl({ folder, filename }) {
  const validatedFolder = validateFolder(folder);
  return `/api/files/${validatedFolder}/${filename}`;
}

/**
 * Get presigned URL for private/temporary file access
 *
 * Returns a time-limited direct S3 URL.
 * Use for cases where backend proxy isn't suitable
 * (e.g., large file downloads, email attachment references).
 */
export async function getSignedUrl({ folder, filename, expiresIn = 3600 }) {
  try {
    const validatedFolder = validateFolder(folder);
    const key = buildS3Key(validatedFolder, filename);

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const url = await generatePresignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("[FileStorage] Get signed URL failed:", error.message);
    throw error;
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Delete multiple files
 */
export async function deleteFiles(files) {
  const results = {
    deleted: 0,
    failed: 0,
    errors: [],
  };

  for (const file of files) {
    try {
      const deleted = await deleteFile(file);
      if (deleted) {
        results.deleted++;
      } else {
        results.failed++;
        results.errors.push({
          folder: file.folder,
          filename: file.filename,
          error: "File not found",
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        folder: file.folder,
        filename: file.filename,
        error: error.message,
      });
    }
  }

  return results;
}

// ============================================
// STORAGE STATISTICS
// ============================================

/**
 * Get storage statistics for a folder
 *
 * Uses S3 ListObjectsV2 with pagination to count all objects
 * under the folder prefix.
 */
export async function getFolderStats(folder) {
  try {
    const validatedFolder = validateFolder(folder);
    const prefix = `${validatedFolder}/`;

    let totalFiles = 0;
    let totalSize = 0;
    let continuationToken;

    do {
      const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        totalFiles += response.Contents.length;
        for (const obj of response.Contents) {
          totalSize += obj.Size || 0;
        }
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return {
      total_files: totalFiles,
      total_size: totalSize,
      total_size_formatted: formatFileSize(totalSize),
    };
  } catch (error) {
    console.error("[FileStorage] Get folder stats failed:", error.message);
    throw error;
  }
}

// ============================================
// DEPRECATED — REMOVED FOR S3
// ============================================

/**
 * @deprecated REMOVED — S3 has no local file paths.
 *
 * Callers must migrate:
 * - files.controller.js → use getFileStream() instead (Phase 3)
 * - cadminEmailBroadcast.service.js → use getSignedUrl() instead (Phase 6)
 */
export function getAbsolutePath() {
  throw new Error(
    "[FileStorage] getAbsolutePath() is removed — storage is S3. " +
      "Use getFileStream() to stream files or getSignedUrl() for direct access.",
  );
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Core operations
  uploadFile,
  deleteFile,
  deleteFiles,
  fileExists,
  getFileMetadata,
  getFileStream,
  // URL generation
  getPublicUrl,
  getSignedUrl,
  // Statistics
  getFolderStats,
  // Validation (unchanged)
  validateFolder,
  validateExtension,
  validateMimeType,
  validateFileSize,
  formatFileSize,
  // Deprecated
  getAbsolutePath,
};
