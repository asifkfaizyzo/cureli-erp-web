// backend/src/services/metaOutbox.service.js

import prisma from "../config/prisma.js";
import { sendMetaCapiEvents } from "./metaCapi.service.js";
import { metaConfig, isMetaTrackingEnabled } from "../config/meta.config.js";

/**
 * Durable Outbox Queue Processor for Server-Authoritative Purchase & Auth Events.
 * Guarantees database-level idempotency using unique event_id.
 */

export async function queueMetaOutboxEvent({
  eventId,
  eventName,
  userId = null,
  eventData = {},
  userData = {},
  tx = prisma,
}) {
  if (!eventId || !eventName) {
    throw new Error("eventId and eventName are required for Meta outbox queue");
  }

  const eventTime = Math.floor(Date.now() / 1000);

  // Database-level idempotency via create / skipDuplicates
  try {
    const record = await tx.metaOutboxEvent.create({
      data: {
        event_id: eventId,
        event_name: eventName,
        event_time: eventTime,
        user_id: userId,
        event_data: eventData,
        user_data: userData,
        status: "PENDING",
        attempts: 0,
        next_retry_at: new Date(),
      },
    });

    return record;
  } catch (err) {
    if (err.code === "P2002") {
      // Duplicate event_id hit — idempotent bypass
      console.log(`[Meta Outbox] Duplicate event_id '${eventId}' skipped.`);
      return null;
    }
    throw err;
  }
}

/**
 * Process pending/failed events in the outbox queue with exponential backoff.
 */
export async function processMetaOutboxQueue(batchSize = 20) {
  if (!isMetaTrackingEnabled()) {
    return { processed: 0, skipped: true };
  }

  const now = new Date();

  // Pick up pending or retryable events
  const pendingEvents = await prisma.metaOutboxEvent.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      next_retry_at: { lte: now },
      attempts: { lt: metaConfig.maxRetries },
    },
    take: batchSize,
    orderBy: { created_at: "asc" },
  });

  if (pendingEvents.length === 0) {
    return { processed: 0 };
  }

  let successCount = 0;

  for (const item of pendingEvents) {
    // Mark as PROCESSING
    await prisma.metaOutboxEvent.update({
      where: { id: item.id },
      data: { status: "PROCESSING" },
    });

    const capiPayload = {
      event_name: item.event_name,
      event_time: item.event_time,
      event_id: item.event_id,
      event_source_url: "https://cureli.in",
      action_source: "system",
      user_data: item.user_data,
      custom_data: item.event_data,
    };

    try {
      await sendMetaCapiEvents([capiPayload]);

      await prisma.metaOutboxEvent.update({
        where: { id: item.id },
        data: {
          status: "SENT",
          processed_at: new Date(),
          last_error: null,
        },
      });
      successCount++;
    } catch (err) {
      const nextAttempt = item.attempts + 1;
      const isPermanent = nextAttempt >= metaConfig.maxRetries;
      const backoffMs = metaConfig.initialBackoffMs * Math.pow(2, item.attempts);
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await prisma.metaOutboxEvent.update({
        where: { id: item.id },
        data: {
          status: isPermanent ? "PERMANENT_FAILURE" : "FAILED",
          attempts: nextAttempt,
          last_error: err.message,
          next_retry_at: isPermanent ? null : nextRetryAt,
        },
      });
    }
  }

  return { processed: pendingEvents.length, succeeded: successCount };
}