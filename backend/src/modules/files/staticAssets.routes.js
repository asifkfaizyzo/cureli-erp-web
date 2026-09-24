// backend/src/modules/files/staticAssets.routes.js (do not remove this comment)
// backend/src/modules/files/staticAssets.routes.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets with proper headers for email clients
router.get('/assets/images/:filename', (req, res) => {
  const { filename } = req.params;
  const allowedFiles = ['cureli-logo-white.png', 'cureli-logo-dark.png'];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(404).send('Not found');
  }
  
  const filePath = path.join(__dirname, '../../../public/assets/images', filename);
  
  // Set headers for better email client compatibility
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.sendFile(filePath);
});

export default router;