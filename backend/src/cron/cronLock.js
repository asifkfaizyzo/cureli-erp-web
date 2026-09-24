// backend/src/cron/cronLock.js (do not remove this comment)
// backend/src/cron/cronLock.js

import { randomBytes } from "crypto";
import os from "os";
import prisma from "../config/prisma.js";

// ============================================
// INSTANCE IDENTITY (Phase 3)
// Unique per process — survives restarts with new ID
// Format: hostname-pid-randomhex
// ============================================

const INSTANCE_ID = `${os.hostname()}-${process.pid}-${randomBytes(4).toString("hex")}`;

export function getInstanceId() {
  return INSTANCE_ID;
}

// ============================================
// DISTRIBUTED CRON LOCK (Phase 1)
//
// Ensures only one application instance executes
// a given cron job at a time, even across multiple
// EC2 instances behind a load balancer.
//
// Uses PostgreSQL as the coordination layer.
// No Redis, no external queue, no new infrastructure.
//
// Lock lifecycle:
//   1. Acquire: atomic INSERT...ON CONFLICT
//   2. Execute: run the job function
//   3. Release: clear lock, record result
//   4. Crash safety: TTL auto-expires stale locks
// ============================================

/**
 * Execute a function under a distributed lock.
 *
 * @param {string} jobName   - Unique lock key (e.g., 'email-broadcast')
 * @param {number} ttlMinutes - Lock TTL for crash recovery
 * @param {Function} fn       - Async function to execute
 */
export async function withCronLock(jobName, ttlMinutes, fn) {
  let acquired = false;

  try {
    acquired = await acquireLock(jobName, ttlMinutes);

    if (!acquired) {
      // Another instance owns this lock — skip silently
      return;
    }

    await fn();

    await releaseLock(jobName, "success");
  } catch (err) {
    console.error(`[CronLock] Job "${jobName}" failed:`, err.message);

    if (acquired) {
      try {
        await releaseLock(jobName, "failed");
      } catch (releaseErr) {
        console.error(
          `[CronLock] Release failed for "${jobName}":`,
          releaseErr.message,
        );
        // TTL will auto-expire this lock
      }
    }
  }
}

// ============================================
// LOCK ACQUISITION
//
// Single atomic SQL statement:
// - INSERT if job_name doesn't exist (first run ever)
// - UPDATE if job_name exists AND lock is expired/released
// - NO-OP if job_name exists AND lock is still held
//
// Returns affected row count:
//   1 = lock acquired
//   0 = lock held by another instance
// ============================================

async function acquireLock(jobName, ttlMinutes) {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const result = await prisma.$executeRaw`
      INSERT INTO cron_locks (job_name, locked_by, locked_at, expires_at)
      VALUES (${jobName}, ${INSTANCE_ID}, NOW(), ${expiresAt})
      ON CONFLICT (job_name)
      DO UPDATE SET
        locked_by  = ${INSTANCE_ID},
        locked_at  = NOW(),
        expires_at = ${expiresAt}
      WHERE cron_locks.expires_at < NOW()
         OR cron_locks.expires_at IS NULL
    `;

    return result >= 1;
  } catch (err) {
    console.error(
      `[CronLock] Acquire failed for "${jobName}":`,
      err.message,
    );
    return false;
  }
}

// ============================================
// LOCK RELEASE
//
// Clears lock only if WE own it (locked_by check).
// Records last_result and last_run_at for observability.
// ============================================

async function releaseLock(jobName, resultStatus) {
  await prisma.$executeRaw`
    UPDATE cron_locks
    SET locked_by   = NULL,
        expires_at  = NULL,
        last_result = ${resultStatus},
        last_run_at = NOW()
    WHERE job_name  = ${jobName}
      AND locked_by = ${INSTANCE_ID}
  `;
}