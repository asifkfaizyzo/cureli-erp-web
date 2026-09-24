// backend/src/utils/cleanup.js (do not remove this comment)
// backend/src/utils/cleanup.js

import prisma from "../config/prisma.js";
import * as fileStorage from "../services/fileStorage.service.js";

// ============================================
// MIGRATION NOTES:
// - Removed fs import
// - Removed path import
// - deleteUserAndRelatedData: replaced fs.existsSync + fs.unlinkSync
//   with fileStorage.deleteFile()
// - All other functions: UNCHANGED
// ============================================

export async function cleanupOldPendingUsers() {
  try {
    // Delete pending users older than 24 hours (optional safety cleanup)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await prisma.pendingUser.deleteMany({
      where: {
        created_at: { lt: cutoff },
      },
    });

    
    return deleted;
  } catch (err) {
    console.error("Cleanup error:", err);
    return null;
  }
}

export async function cleanupIncompleteUsers() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find users to delete
    const usersToDelete = await prisma.user.findMany({
      where: {
        status: "pending_setup",
        onboarding_step: {
          gte: 4,
          lt: 12,
        },
        OR: [
          {
            last_login_at: {
              lt: thirtyDaysAgo,
            },
          },
          {
            last_login_at: null,
            created_at: {
              lt: thirtyDaysAgo,
            },
          },
        ],
      },
      include: {
        shop: {
          include: {
            shopFiles: true,
          },
        },
      },
    });

    if (usersToDelete.length === 0) {

      return { deleted: 0, errors: [] };
    }



    let deleted = 0;
    const errors = [];

    for (const user of usersToDelete) {
      try {
        await deleteUserAndRelatedData(user);
        deleted++;
      } catch (err) {
        console.error(` Failed to delete user ${user.user_id}:`, err);
        errors.push({
          user_id: user.user_id,
          email: user.email,
          error: err.message,
        });
      }
    }

  
    if (errors.length > 0) {
  
    }

    return { deleted, errors };
  } catch (err) {
    console.error(" Cleanup job failed:", err);
    throw err;
  }
}

/**
 * Delete a single user and all related data
 *
 * CHANGED: File deletion now uses fileStorage.deleteFile() instead of raw fs
 */
async function deleteUserAndRelatedData(user) {
  const filesDeleted = [];

  // 1. Delete shop files from S3
  if (user.shop?.shopFiles) {
    for (const file of user.shop.shopFiles) {
      try {
        const deleted = await fileStorage.deleteFile({
          folder: "shop_files",
          filename: file.storage_key,
        });

        if (deleted) {
          filesDeleted.push(file.storage_key);
        }
      } catch (err) {
        console.error(`⚠️  Failed to delete file ${file.storage_key}:`, err);
        // Continue anyway - don't block user deletion
      }
    }
  }

  // 2. Calculate inactivity days
  const inactiveDate = user.last_login_at || user.created_at;
  const daysInactive = Math.floor(
    (Date.now() - new Date(inactiveDate).getTime()) / (1000 * 60 * 60 * 24),
  );

  // 3. Create deletion log
  await prisma.deletionLog.create({
    data: {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      reason: "incomplete_onboarding_30_days",
      onboarding_step: user.onboarding_step,
      days_inactive: daysInactive,
      files_deleted: filesDeleted.length,
    },
  });

  // 4. Delete from database (cascade will handle ShopFiles records)
  if (user.shop_id) {
    // Delete shop files from DB
    await prisma.shopFile.deleteMany({
      where: { shop_id: user.shop_id },
    });

    // Delete shop
    await prisma.shop.delete({
      where: { shop_id: user.shop_id },
    });
  }

  // 5. Delete user
  await prisma.user.delete({
    where: { user_id: user.user_id },
  });


}

/**
 * Delete old deletion logs (older than 90 days) — UNCHANGED
 */
export async function cleanupOldDeletionLogs() {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.deletionLog.deleteMany({
      where: {
        deleted_at: {
          lt: ninetyDaysAgo,
        },
      },
    });

    if (result.count > 0) {
   
    }

    return result.count;
  } catch (err) {
    console.error(" Failed to cleanup deletion logs:", err);
    return 0;
  }
}
