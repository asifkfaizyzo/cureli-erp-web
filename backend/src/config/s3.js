// backend/src/config/s3.js (do not remove this comment)
// backend/src/config/s3.js
// ============================================
// AWS S3 CLIENT CONFIGURATION
// ============================================

import { S3Client } from '@aws-sdk/client-s3';

// ============================================
// VALIDATE REQUIRED ENV VARS AT STARTUP
// ============================================

const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[S3] Missing required environment variables: ${missing.join(', ')}. ` +
    `S3 is the sole storage provider — these must be set.`
  );
}

// ============================================
// S3 CLIENT
// ============================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET;
export const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

console.log(`[S3] Client initialized — bucket: ${S3_BUCKET}, region: ${AWS_REGION}`);

export default s3Client;