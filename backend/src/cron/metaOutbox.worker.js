// backend/src/cron/metaOutbox.worker.js

import crypto from "crypto";
import { getMetaConfig, isMetaTrackingEnabled } from "../config/meta.config.js";
import { processMetaOutboxQueue } from "../services/metaOutbox.service.js";

/**
 * Intentional Background Scheduler for Meta CAPI Outbox
 *
 * SAFETY & OPERATIONAL GUARANTEES:
 * - Does NOT start if `META_TRACKING_ENABLED` is `false`.
 * - Prevents overlapping in-process ticks (`isTickRunning` lock).
 * - Uses unique `workerId` + PostgreSQL `FOR UPDATE SKIP LOCKED` across processes.
 * - Supports clean, graceful shutdown (`stopMetaOutboxWorker()`).
 */

const WORKER_ID = `meta-outbox-${process.pid}-${crypto.randomUUID().slice(0, 8)}`;

let intervalHandle = null;
let isTickRunning = false;
let currentTickPromise = null;

export async function runMetaOutboxWorkerTick(options = {}) {
  if (!isMetaTrackingEnabled(options.configOverride)) {
    return { skipped: true, reason: "TRACKING_DISABLED" };
  }

  if (isTickRunning) {
    return { skipped: true, reason: "TICK_ALREADY_IN_PROGRESS" };
  }

  isTickRunning = true;
  currentTickPromise = (async () => {
    try {
      return await processMetaOutboxQueue({
        workerId: WORKER_ID,
        ...options,
      });
    } catch (err) {
      console.error("[Meta Outbox Worker] Tick failed:", err?.code || "INTERNAL_ERROR");
      return { processed: 0, error: true };
    } finally {
      isTickRunning = false;
      currentTickPromise = null;
    }
  })();

  return currentTickPromise;
}

export function startMetaOutboxWorker(configOverride) {
  const cfg = getMetaConfig(configOverride);

  if (!isMetaTrackingEnabled(cfg)) {
    return { started: false, reason: "TRACKING_DISABLED" };
  }

  if (intervalHandle) {
    return { started: false, reason: "ALREADY_RUNNING", workerId: WORKER_ID };
  }

  intervalHandle = setInterval(() => {
    runMetaOutboxWorkerTick({ configOverride: cfg });
  }, cfg.pollIntervalMs);

  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }

  return { started: true, workerId: WORKER_ID };
}

export async function stopMetaOutboxWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  if (currentTickPromise) {
    await currentTickPromise;
  }
  return { stopped: true, workerId: WORKER_ID };
}