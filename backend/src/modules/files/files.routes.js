// backend/src/modules/files/files.routes.js (do not remove this comment)
// backend/src/modules/files/files.routes.js

import express from 'express';
import * as fileController from './files.controller.js';

const router = express.Router();

// ============================================
// PUBLIC FILE ACCESS ROUTES
// ============================================

/**
 * GET /api/files/:folder/:filename
 * Serve file with proper headers (replaces express.static)
 * 
 * Examples:
 * - /api/files/shop_files/123.pdf
 * - /api/files/tickets/456.jpg
 */
router.get('/:folder/:filename', fileController.serveFile);

/**
 * GET /api/files/:folder/:filename/download
 * Force download with custom filename
 * 
 * Query params:
 * - name: Custom download filename (optional)
 */
router.get('/:folder/:filename/download', fileController.downloadFile);

/**
 * GET /api/files/:folder/:filename/metadata
 * Get file metadata without downloading
 */
router.get('/:folder/:filename/metadata', fileController.getFileMetadata);

// ============================================
// ADMIN ROUTES (Future use)
// ============================================

/**
 * GET /api/files/stats/:folder
 * Get storage statistics for a folder (admin only)
 */
// router.get('/stats/:folder', requireAuth, requireCAdmin, fileController.getFolderStats);

export default router;