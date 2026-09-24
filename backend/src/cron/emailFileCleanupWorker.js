// backend/src/cron/emailFileCleanupWorker.js (do not remove this comment)
// backend/src/cron/emailFileCleanupWorker.js
// ============================================
// EMAIL ATTACHMENT CLEANUP WORKER — S3 VERSION
// ============================================
//
// MIGRATION NOTES:
// - Removed all fs.readdirSync, fs.statSync, fs.existsSync
// - Removed EMAIL_ATTACHMENTS_DIR constant
// - Removed path import
// - Orphan detection now uses S3 ListObjectsV2 via getFolderFileList()
// - File age check uses S3 object LastModified instead of fs stat
// - deleteFile / deleteFiles still go through fileStorage service
// - Cron schedule and lock mechanism: UNCHANGED
// ============================================

import cron from "node-cron";
import prisma from "../config/prisma.js";
import { withCronLock } from "./cronLock.js";
import * as fileStorage from "../services/fileStorage.service.js";
import s3Client, { S3_BUCKET } from "../config/s3.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import cronLogger from "../utils/cronLogger.js";

// ============================================
// CONFIGURATION
// ============================================

const FOLDER = "email_attachments";
const ORPHAN_FILE_AGE_HOURS = 24;

// ============================================
// S3 HELPER: List all objects in folder
// ============================================

/**
 * List all objects in the email_attachments folder in S3
 * Returns array of { filename, lastModified, size }
 */
async function listFolderObjects(folder) {
  const prefix = `${folder}/`;
  const objects = [];
  let continuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const obj of response.Contents) {
        const filename = obj.Key.substring(prefix.length);
        if (!filename) continue;

        objects.push({
          filename,
          lastModified: obj.LastModified,
          size: obj.Size,
        });
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return objects;
}

// ============================================
// FILE CLEANUP FUNCTIONS
// ============================================

/**
 * Find and delete orphaned files in S3
 * An orphaned file exists in S3 but has no corresponding
 * EmailBroadcastAttachment record in DB, and is older than threshold.
 */
async function cleanupOrphanedFiles() {
  try {
    const s3Objects = await listFolderObjects(FOLDER);

    if (s3Objects.length === 0) {
      return { cleaned: 0, message: "No files in S3 folder" };
    }

    const referencedAttachments = await prisma.emailBroadcastAttachment.findMany({
      select: { storage_key: true },
    });

    const referencedFiles = new Set(
      referencedAttachments.map((att) => att.storage_key)
    );

    const orphanThreshold = Date.now() - ORPHAN_FILE_AGE_HOURS * 60 * 60 * 1000;
    let cleaned = 0;

    for (const obj of s3Objects) {
      if (referencedFiles.has(obj.filename)) continue;

      const fileAge = obj.lastModified ? obj.lastModified.getTime() : Date.now();
      if (fileAge >= orphanThreshold) continue;

      try {
        const deleted = await fileStorage.deleteFile({
          folder: FOLDER,
          filename: obj.filename,
        });

        if (deleted) {
          cleaned++;
          cronLogger.info(`[File Cleanup] Deleted orphaned file: ${obj.filename}`);
        }
      } catch (err) {
        cronLogger.error(`[File Cleanup] Failed to delete orphaned file ${obj.filename}`, err);
      }
    }

    if (cleaned > 0) {
      cronLogger.info(`[File Cleanup] Cleaned ${cleaned} orphaned file(s)`);
    }

    return { cleaned, message: `Cleaned ${cleaned} orphaned files` };
  } catch (err) {
    cronLogger.error("[File Cleanup] Orphan cleanup failed", err);
    return { cleaned: 0, error: err.message };
  }
}

/**
 * Delete files from cancelled campaigns
 */
async function cleanupCancelledCampaignFiles() {
  try {
    const cancelledCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: { status: "CANCELLED" },
      include: { attachmentFiles: true },
    });

    let cleaned = 0;

    for (const campaign of cancelledCampaigns) {
      if (campaign.attachmentFiles.length === 0) continue;

      const filesToDelete = campaign.attachmentFiles.map((att) => ({
        folder: FOLDER,
        filename: att.storage_key,
      }));

      const result = await fileStorage.deleteFiles(filesToDelete);
      cleaned += result.deleted;

      if (result.deleted > 0) {
        await prisma.emailBroadcastAttachment.deleteMany({
          where: { campaign_id: campaign.campaign_id },
        });
      }
    }

    if (cleaned > 0) {
      cronLogger.info(`[File Cleanup] Cleaned ${cleaned} file(s) from cancelled campaigns`);
    }

    return { cleaned };
  } catch (err) {
    cronLogger.error("[File Cleanup] Cancelled campaign cleanup failed", err);
    return { cleaned: 0, error: err.message };
  }
}

/**
 * Get storage stats for email attachments folder
 */
async function getStorageStats() {
  try {
    return await fileStorage.getFolderStats(FOLDER);
  } catch (err) {
    cronLogger.error("[File Cleanup] Get storage stats failed", err);
    return { error: err.message };
  }
}

// ============================================
// MAIN CLEANUP FUNCTION
// ============================================

async function runFileCleanup() {
  cronLogger.info("[File Cleanup] Starting email attachment cleanup...");

  try {
    const cancelledResult = await cleanupCancelledCampaignFiles();
    const orphanedResult = await cleanupOrphanedFiles();

    const totalCleaned =
      (cancelledResult.cleaned || 0) + (orphanedResult.cleaned || 0);

    if (totalCleaned > 0) {
      cronLogger.success(`[File Cleanup] Completed - cleaned ${totalCleaned} total file(s)`);
    }

    return {
      cancelled_files: cancelledResult.cleaned || 0,
      orphaned_files: orphanedResult.cleaned || 0,
      total_cleaned: totalCleaned,
    };
  } catch (err) {
    cronLogger.error("[File Cleanup] Cleanup failed", err);
    return { error: err.message };
  }
}

// ============================================
// INITIALIZE CRON JOB
// ============================================

export function initializeFileCleanupWorker() {
  cron.schedule("0 4 * * *", () =>
    withCronLock("file-cleanup", 30, runFileCleanup)
  );
  cronLogger.info("[File Cleanup] Email attachment cleanup worker initialized (daily at 4:00 AM)");
}

export {
  runFileCleanup,
  cleanupOrphanedFiles,
  cleanupCancelledCampaignFiles,
  getStorageStats,
};

export default {
  initializeFileCleanupWorker,
  runFileCleanup,
  cleanupOrphanedFiles,
  cleanupCancelledCampaignFiles,
  getStorageStats,
};