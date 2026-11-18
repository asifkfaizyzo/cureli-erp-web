// backend/src/services/metaOutbox.service.js

import crypto from "crypto";
import prisma from "../config/prisma.js";
import {
  getMetaConfig,
  isMetaTrackingEnabled,
  isMetaTransmissionEnabled,
} from "../config/meta.config.js";
import { validateMetaEventPayload } from "./metaPrivacyPolicy.js";
import { sendMetaCapiEvents, sanitizeTransmissionError } from "./metaCapi.service.js";

/**
 * Durable, Concurrency-Safe Outbox Service for Meta Conversions API.
 */

export async function queueMetaOutboxEvent({
  eventId,
  eventName,
  eventData = {},
  userData = {},
  tx = prisma,
  configOverride,
}) {
  const cfg = getMetaConfig(configOverride);

  // 1. Feature flag gates event collection before validation or storage
  if (!isMetaTrackingEnabled(cfg)) {
    return {
      queued: false,
      skipped: true,
      reason: "TRACKING_DISABLED",
    };
  }

  // 2. Strict pre-storage privacy and format validation
  const validated = validateMetaEventPayload(
    { eventId, eventName, userData, eventData },
    cfg,
  );

  const eventTime = Math.floor(Date.now() / 1000);

  // 3. Persist only validated fields (no user_id stored)
  try {
    const record = await tx.metaOutboxEvent.create({
      data: {
        event_id: validated.eventId,
        event_name: validated.eventName,
        event_time: eventTime,
        event_data: validated.eventData,
        user_data: validated.userData,
        status: "PENDING",
        attempts: 0,
        next_retry_at: new Date(),
      },
    });

    return {
      queued: true,
      skipped: false,
      record,
    };
  } catch (err) {
    if (err?.code === "P2002") {
      return {
        queued: false,
        skipped: true,
        duplicate: true,
        reason: "DUPLICATE_EVENT_ID",
      };
    }
    throw err;
  }
}

/**
 * Atomically claims up to `batchSize` eligible PENDING/FAILED events using
 * PostgreSQL `FOR UPDATE SKIP LOCKED`.
 *
 * GATED: Returns [] immediately if tracking is disabled OR access token is missing.
 */
export async function claimPendingOutboxEvents({
  batchSize = 20,
  workerId = `worker-${crypto.randomUUID()}`,
  now = new Date(),
  db = prisma,
  configOverride,
} = {}) {
  const cfg = getMetaConfig(configOverride);

  // GATING: Require both tracking enabled AND non-empty access token
  if (!isMetaTransmissionEnabled(cfg)) {
    return [];
  }

  const boundedBatchSize = Math.max(1, Math.min(Number(batchSize) || 20, cfg.maxBatchSize));
  const leaseExpiresAt = new Date(now.getTime() + cfg.processingLeaseMs);

  if (typeof db.$queryRaw === "function") {
    const claimedRows = await db.$queryRaw`
      WITH claimed AS (
        SELECT id
        FROM meta_outbox_events
        WHERE status IN ('PENDING'::"MetaOutboxStatus", 'FAILED'::"MetaOutboxStatus")
          AND (next_retry_at IS NULL OR next_retry_at <= ${now})
          AND attempts < ${cfg.maxRetries}
        ORDER BY created_at ASC
        LIMIT ${boundedBatchSize}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE meta_outbox_events AS target
      SET status = 'PROCESSING'::"MetaOutboxStatus",
          claimed_at = ${now},
          processing_expires_at = ${leaseExpiresAt},
          claimed_by = ${workerId},
          updated_at = ${now}
      FROM claimed
      WHERE target.id = claimed.id
      RETURNING
        target.id,
        target.event_id,
        target.event_name,
        target.event_time,
        target.event_data,
        target.user_data,
        target.status,
        target.attempts,
        target.claimed_at,
        target.processing_expires_at,
        target.claimed_by;
    `;
    return Array.isArray(claimedRows) ? claimedRows : [];
  }

  if (typeof db._atomicClaim === "function") {
    return db._atomicClaim({
      batchSize: boundedBatchSize,
      workerId,
      now,
      leaseExpiresAt,
      maxRetries: cfg.maxRetries,
    });
  }

  return [];
}

/**
 * Reclaims events stuck in PROCESSING whose lease (`processing_expires_at`) has expired.
 */
export async function recoverStaleProcessingEvents({
  now = new Date(),
  db = prisma,
  configOverride,
} = {}) {
  const cfg = getMetaConfig(configOverride);
  if (!isMetaTransmissionEnabled(cfg)) {
    return { recovered: 0, permanentlyFailed: 0 };
  }

  if (typeof db.$queryRaw === "function") {
    const expiredRows = await db.$queryRaw`
      WITH stale AS (
        SELECT id, attempts
        FROM meta_outbox_events
        WHERE status = 'PROCESSING'::"MetaOutboxStatus"
          AND processing_expires_at IS NOT NULL
          AND processing_expires_at <= ${now}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE meta_outbox_events AS target
      SET attempts = stale.attempts + 1,
          status = CASE
            WHEN stale.attempts + 1 >= ${cfg.maxRetries}
              THEN 'PERMANENT_FAILURE'::"MetaOutboxStatus"
            ELSE 'FAILED'::"MetaOutboxStatus"
          END,
          next_retry_at = CASE
            WHEN stale.attempts + 1 >= ${cfg.maxRetries}
              THEN NULL
            ELSE ${now}::timestamp + ((${cfg.initialBackoffMs} * POWER(2, stale.attempts)) || ' milliseconds')::interval
          END,
          claimed_at = NULL,
          processing_expires_at = NULL,
          claimed_by = NULL,
          last_error = CASE
            WHEN stale.attempts + 1 >= ${cfg.maxRetries}
              THEN 'PROCESSING_LEASE_EXPIRED_MAX_RETRIES'
            ELSE 'PROCESSING_LEASE_EXPIRED'
          END,
          updated_at = ${now}
      FROM stale
      WHERE target.id = stale.id
      RETURNING target.id, target.status;
    `;

    const rows = Array.isArray(expiredRows) ? expiredRows : [];
    const permanentlyFailed = rows.filter((r) => r.status === "PERMANENT_FAILURE").length;
    return {
      recovered: rows.length - permanentlyFailed,
      permanentlyFailed,
    };
  }

  if (typeof db._recoverStale === "function") {
    return db._recoverStale({
      now,
      maxRetries: cfg.maxRetries,
      initialBackoffMs: cfg.initialBackoffMs,
    });
  }

  return { recovered: 0, permanentlyFailed: 0 };
}

/**
 * Processes a batch of outbox events safely.
 */
export async function processMetaOutboxQueue({
  batchSize = 20,
  workerId = `worker-${crypto.randomUUID()}`,
  now = new Date(),
  db = prisma,
  sendFn = sendMetaCapiEvents,
  configOverride,
} = {}) {
  const cfg = getMetaConfig(configOverride);

  // Require transmission readiness (both tracking enabled + access token)
  if (!isMetaTransmissionEnabled(cfg)) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: true,
      reason: "TRANSMISSION_DISABLED_OR_TOKEN_MISSING",
    };
  }

  const recovery = await recoverStaleProcessingEvents({
    now,
    db,
    configOverride: cfg,
  });

  const claimedEvents = await claimPendingOutboxEvents({
    batchSize,
    workerId,
    now,
    db,
    configOverride: cfg,
  });

  if (claimedEvents.length === 0) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      recovered: recovery.recovered,
      permanentlyFailed: recovery.permanentlyFailed,
    };
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of claimedEvents) {
    const capiPayload = {
      event_name: item.event_name,
      event_time: item.event_time,
      event_id: item.event_id,
      action_source: "system_generated",
      user_data: item.user_data || {},
      custom_data: item.event_data || {},
    };

    try {
      const sendResult = await sendFn([capiPayload], { configOverride: cfg });

      // If skipped or unsuccessful, NEVER mark as SENT
      if (!sendResult || sendResult.skipped || !sendResult.success) {
        await db.metaOutboxEvent.updateMany({
          where: {
            id: item.id,
            status: "PROCESSING",
            claimed_by: workerId,
          },
          data: {
            status: "FAILED",
            last_error: sendResult?.reason || "TRANSMISSION_SKIPPED",
            next_retry_at: new Date(now.getTime() + cfg.initialBackoffMs),
            claimed_at: null,
            processing_expires_at: null,
            claimed_by: null,
          },
        });
        failed++;
        continue;
      }

      // Successful transmission -> Mark SENT & clear claim metadata
      const updateRes = await db.metaOutboxEvent.updateMany({
        where: {
          id: item.id,
          status: "PROCESSING",
          claimed_by: workerId,
        },
        data: {
          status: "SENT",
          processed_at: new Date(),
          claimed_at: null,
          processing_expires_at: null,
          claimed_by: null,
          last_error: null,
        },
      });

      if (updateRes.count > 0) {
        succeeded++;
      } else {
        // Lease was reclaimed by another worker while this request was in-flight
        failed++;
      }
    } catch (err) {
      failed++;
      const nextAttempt = (item.attempts || 0) + 1;
      const isPermanent =
        nextAttempt >= cfg.maxRetries || err?.name === "MetaPrivacyPolicyError";
      const backoffMs = cfg.initialBackoffMs * Math.pow(2, item.attempts || 0);
      const nextRetryAt = isPermanent ? null : new Date(now.getTime() + backoffMs);
      const safeError = sanitizeTransmissionError(err);

      await db.metaOutboxEvent.updateMany({
        where: {
          id: item.id,
          status: "PROCESSING",
          claimed_by: workerId,
        },
        data: {
          status: isPermanent ? "PERMANENT_FAILURE" : "FAILED",
          attempts: nextAttempt,
          last_error: safeError,
          next_retry_at: nextRetryAt,
          claimed_at: null,
          processing_expires_at: null,
          claimed_by: null,
        },
      });
    }
  }

  return {
    processed: claimedEvents.length,
    succeeded,
    failed,
    recovered: recovery.recovered,
    permanentlyFailed: recovery.permanentlyFailed,
  };
}