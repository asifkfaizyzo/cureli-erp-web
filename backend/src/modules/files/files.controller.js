// backend/src/modules/files/files.controller.js (do not remove this comment)
// backend/src/modules/files/files.controller.js
// ============================================
// FILE SERVING CONTROLLER — S3 STREAMING
// ============================================
//
// MIGRATION NOTES:
// - All fs.createReadStream replaced with fileStorage.getFileStream()
// - All fs.statSync replaced with S3 metadata from stream response
// - All res.sendFile replaced with S3 stream piping
// - CORS headers: UNCHANGED
// - Security headers: UNCHANGED
// - Content-Disposition logic: UNCHANGED
// - Route contract: UNCHANGED (/api/files/:folder/:filename)
// ============================================

import path from 'path';
import { success, fail } from '../../utils/response.js';
import * as fileStorage from '../../services/fileStorage.service.js';

// ============================================
// ALLOWED ORIGINS (for CORS) — UNCHANGED
// ============================================
const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || 'http://localhost:5173',
  process.env.ADMIN_FRONTEND_ORIGIN || 'http://localhost:5174',
].filter(Boolean);

// ============================================
// MIME TYPE MAP — UNCHANGED
// ============================================
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
};

// Extensions that should display inline (not download)
const INLINE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf',
];

// ============================================
// HELPER: Set common response headers
// ============================================

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Security headers
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');
}

// ============================================
// SERVE FILE
// ============================================

/**
 * GET /api/files/:folder/:filename
 * Stream file from S3 with proper headers
 */
export async function serveFile(req, res) {
  try {
    const { folder, filename } = req.params;

    // Validate folder (throws on invalid)
    const validatedFolder = fileStorage.validateFolder(folder);

    // Get file stream from S3
    // This does HeadObject + GetObject in one call
    let fileData;
    try {
      fileData = await fileStorage.getFileStream({
        folder: validatedFolder,
        filename,
      });
    } catch (error) {
      if (error.code === 'FILE_NOT_FOUND') {
        return fail(res, 'File not found', 404);
      }
      throw error;
    }

    const { stream, contentType, contentLength } = fileData;

    // Set CORS headers
    setCorsHeaders(req, res);

    // Determine content type
    // Prefer our known mapping, fall back to S3's stored content type
    const ext = path.extname(filename).toLowerCase();
    const resolvedContentType = MIME_TYPES[ext] || contentType || 'application/octet-stream';

    // Set response headers
    res.setHeader('Content-Type', resolvedContentType);

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Inline vs attachment disposition
    if (INLINE_EXTENSIONS.includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    }

    // PDF-specific: enable byte-range display hint
    if (ext === '.pdf') {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    // Cache headers — files are immutable (unique filenames)
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    // Stream S3 response directly to HTTP response
    stream.pipe(res);

    // Handle stream errors after headers are sent
    stream.on('error', (err) => {
      console.error('[Files] S3 stream error:', err);
      if (!res.headersSent) {
        return fail(res, 'Error reading file', 500);
      }
      // If headers already sent, we can only destroy the response
      res.destroy();
    });
  } catch (error) {
    console.error('[Files] Serve file error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    if (error.code === 'FILE_NOT_FOUND') {
      return fail(res, 'File not found', 404);
    }

    return fail(res, 'Failed to serve file', 500);
  }
}

// ============================================
// DOWNLOAD FILE
// ============================================

/**
 * GET /api/files/:folder/:filename/download
 * Force file download with custom filename
 */
export async function downloadFile(req, res) {
  try {
    const { folder, filename } = req.params;
    const customName = req.query.name || filename;

    // Validate folder
    const validatedFolder = fileStorage.validateFolder(folder);

    // Get file stream from S3
    let fileData;
    try {
      fileData = await fileStorage.getFileStream({
        folder: validatedFolder,
        filename,
      });
    } catch (error) {
      if (error.code === 'FILE_NOT_FOUND') {
        return fail(res, 'File not found', 404);
      }
      throw error;
    }

    const { stream, contentType, contentLength } = fileData;

    // Set CORS headers
    setCorsHeaders(req, res);

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const resolvedContentType = MIME_TYPES[ext] || contentType || 'application/octet-stream';

    // Set download headers
    res.setHeader('Content-Type', resolvedContentType);

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(customName)}"`
    );

    // Stream S3 response directly to HTTP response
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('[Files] S3 download stream error:', err);
      if (!res.headersSent) {
        return fail(res, 'Failed to download file', 500);
      }
      res.destroy();
    });
  } catch (error) {
    console.error('[Files] Download file error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    if (error.code === 'FILE_NOT_FOUND') {
      return fail(res, 'File not found', 404);
    }

    return fail(res, 'Failed to download file', 500);
  }
}

// ============================================
// GET FILE METADATA
// ============================================

/**
 * GET /api/files/:folder/:filename/metadata
 * Get file metadata without downloading
 */
export async function getFileMetadata(req, res) {
  try {
    const { folder, filename } = req.params;

    // Validate folder
    const validatedFolder = fileStorage.validateFolder(folder);

    // Get metadata from S3
    let metadata;
    try {
      metadata = await fileStorage.getFileMetadata({
        folder: validatedFolder,
        filename,
      });
    } catch (error) {
      if (error.code === 'FILE_NOT_FOUND') {
        return fail(res, 'File not found', 404);
      }
      throw error;
    }

    return success(res, {
      folder: validatedFolder,
      filename,
      ...metadata,
      url: fileStorage.getPublicUrl({ folder: validatedFolder, filename }),
    });
  } catch (error) {
    console.error('[Files] Get metadata error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    if (error.code === 'FILE_NOT_FOUND') {
      return fail(res, 'File not found', 404);
    }

    return fail(res, 'Failed to get file metadata', 500);
  }
}

// ============================================
// GET FOLDER STATS (ADMIN ONLY)
// ============================================

/**
 * GET /api/files/stats/:folder
 * Get storage statistics for a folder
 */
export async function getFolderStats(req, res) {
  try {
    const { folder } = req.params;

    // Validate folder
    const validatedFolder = fileStorage.validateFolder(folder);

    // Get stats from S3
    const stats = await fileStorage.getFolderStats(validatedFolder);

    return success(res, {
      folder: validatedFolder,
      ...stats,
    });
  } catch (error) {
    console.error('[Files] Get folder stats error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    return fail(res, 'Failed to get folder stats', 500);
  }
}