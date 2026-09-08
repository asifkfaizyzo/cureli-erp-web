// backend/src/config/multer.js
// ============================================
// UNIVERSAL MULTER CONFIGURATION
// Uses fileStorage.service.js for all validation
// ============================================

import multer from "multer";
import path from "path";
import fs from "fs";
import * as fileStorage from "../services/fileStorage.service.js";

// ============================================
// INVENTORY IMPORT — DISK STORAGE
// ============================================

const IMPORT_UPLOAD_DIR = "uploads/inventory-import";
if (!fs.existsSync(IMPORT_UPLOAD_DIR)) {
  fs.mkdirSync(IMPORT_UPLOAD_DIR, { recursive: true });
}

const inventoryImportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMPORT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();
    cb(null, `${timestamp}-${safeName}`);
  },
});

function inventoryImportFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([".xls", ".xlsx", ".csv"].includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${ext}". Only .xls, .xlsx, and .csv files are accepted.`
      ),
      false
    );
  }
}

export const inventoryImportUpload = multer({
  storage: inventoryImportStorage,
  fileFilter: inventoryImportFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ============================================
// UNIVERSAL STORAGE (MEMORY)
// ============================================

/**
 * All files go to memory first, then fileStorage handles actual storage
 */
const storage = multer.memoryStorage();

// ============================================
// FILE FILTER FACTORY
// ============================================

/**
 * Create a file filter for a specific folder
 * @param {string} folder - Folder name (e.g., 'tickets', 'shop_files')
 */
function createFileFilter(folder) {
  return (req, file, cb) => {
    try {
      fileStorage.validateFolder(folder);
      fileStorage.validateExtension(file.originalname);
      fileStorage.validateMimeType(folder, file.mimetype);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  };
}

// ============================================
// MULTER INSTANCE FACTORY
// ============================================

/**
 * Create a multer instance for a specific folder
 * @param {string} folder - Folder name
 * @param {object} options - Additional multer options
 */
export function createUploader(folder, options = {}) {
  const {
    maxFileSize = null,
    maxFiles = 1,
    fieldName = "file",
  } = options;

  const limits = {
    fileSize: maxFileSize || getMaxFileSize(folder),
  };

  const upload = multer({
    storage,
    fileFilter: createFileFilter(folder),
    limits,
  });

  if (maxFiles === 1) {
    return upload.single(fieldName);
  } else {
    return upload.array(fieldName, maxFiles);
  }
}

// ============================================
// HELPER: Get max file size from fileStorage
// ============================================

function getMaxFileSize(folder) {
  const MAX_FILE_SIZES = {
    shop_files: 5 * 1024 * 1024,
    broadcast_attachments: 50 * 1024 * 1024,
    email_attachments: 10 * 1024 * 1024,
    tickets: 5 * 1024 * 1024,
    rider_documents: 5 * 1024 * 1024,   // ← ADDED
  };

  return MAX_FILE_SIZES[folder] || 10 * 1024 * 1024;
}

// ============================================
// PRE-CONFIGURED UPLOADERS (for convenience)
// ============================================

export const shopFilesUpload = createUploader("shop_files", {
  fieldName: "file",
  maxFiles: 1,
});

export const ticketsUpload = createUploader("tickets", {
  fieldName: "files",
  maxFiles: 5,
});

export const broadcastUpload = createUploader("broadcast_attachments", {
  fieldName: "file",
  maxFiles: 1,
});

export const emailAttachmentUpload = createUploader("email_attachments", {
  fieldName: "file",
  maxFiles: 1,
});

export const prescriptionUpload = createUploader("order_prescriptions", {
  fieldName: "files",
  maxFiles: 5,
  maxFileSize: 10 * 1024 * 1024,
});

export const prescriptionRequestUpload = createUploader('prescription_requests', {
  fieldName:   'files',
  maxFiles:    5,
  maxFileSize: 10 * 1024 * 1024,
});

// ============================================
// GENERIC MULTER INSTANCE (for backwards compatibility)
// ============================================

/**
 * Generic multer instance with memory storage
 * Use this when you need custom field names or no folder validation
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default
  },
});

// ============================================
// MULTER ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Universal error handler for all multer uploads
 */
export function handleMulterError(err, req, res, next) {
  if (!err) {
    return next();
  }

  console.error("[Multer] Upload error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
      error: `Maximum file size exceeded. ${err.message}`,
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files",
      error: err.message,
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected field",
      error: "Invalid file field name",
    });
  }

  if (err.code === "BLOCKED_EXTENSION") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type",
      error: err.message,
    });
  }

  if (err.code === "INVALID_MIME_TYPE") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type",
      error: err.message,
    });
  }

  if (err.code === "FILE_TOO_LARGE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "File upload failed",
    error: err.message,
  });
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  createUploader,
  upload,
  inventoryImportUpload,
  shopFilesUpload,
  ticketsUpload,
  broadcastUpload,
  emailAttachmentUpload,
  prescriptionUpload,
  prescriptionRequestUpload,
  handleMulterError,
};