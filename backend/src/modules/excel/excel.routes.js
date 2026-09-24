// backend/src/modules/excel/excel.routes.js (do not remove this comment)
import express from 'express';
import multer from 'multer';
import * as excelController from './excel.controller.js';
import { requireAuth } from '../../middleware/auth.js';  

const router = express.Router();

// Configure multer for Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
    }
  }
});

/**
 * @route   POST /api/excel/convert
 * @desc    Convert .xls to .xlsx format
 * @access  Private (requires authentication)
 */
router.post(
  '/convert',
  requireAuth,  
  upload.single('file'),
  excelController.convertExcel
);

/**
 * @route   GET /api/excel/health
 * @desc    Check conversion service health
 * @access  Private
 */
router.get(
  '/health',
  requireAuth,  
  excelController.healthCheck
);

export default router;