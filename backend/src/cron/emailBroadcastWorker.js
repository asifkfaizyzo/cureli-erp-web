// backend/src/cron/emailBroadcastWorker.js (do not remove this comment)
// backend/src/cron/emailBroadcastWorker.js

import cron from "node-cron";
import prisma from "../config/prisma.js";
import { withCronLock } from "./cronLock.js";
import {
  shouldPauseSending,
  getRemainingCapacity,
} from "../modules/cadmin/broadcast/email/emailBroadcast.quota.js";
import cronLogger from "../utils/cronLogger.js";

// ============================================
// CONFIGURATION
// ============================================

const STUCK_THRESHOLD_MINUTES = 10;
const MAX_CAMPAIGNS_PER_CYCLE = 3;

const CAMPAIGN_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  SENDING: "SENDING",
  PAUSED: "PAUSED",
  SENT: "SENT",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

// ============================================
// ATOMIC CAMPAIGN CLAIMS
// ============================================

async function claimScheduledCampaign(beforeDate) {
  try {
    const results = await prisma.$queryRaw`
      UPDATE email_broadcast_campaigns
      SET processing = true,
          status = 'SENDING'::"EmailCampaignStatus",
          processing_started_at = NOW(),
          updated_at = NOW()
      WHERE campaign_id = (
        SELECT campaign_id
        FROM email_broadcast_campaigns
        WHERE status = 'SCHEDULED'::"EmailCampaignStatus"
          AND processing = false
          AND scheduled_for <= ${beforeDate}
        ORDER BY scheduled_for ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING campaign_id, subject
    `;

    return results.length > 0 ? results[0] : null;
  } catch (err) {
    cronLogger.error("[Email Cron] Atomic claim (scheduled) failed", err);
    return null;
  }
}

async function claimPausedCampaign() {
  try {
    const results = await prisma.$queryRaw`
      UPDATE email_broadcast_campaigns
      SET processing = true,
          status = 'SENDING'::"EmailCampaignStatus",
          processing_started_at = NOW(),
          updated_at = NOW()
      WHERE campaign_id = (
        SELECT campaign_id
        FROM email_broadcast_campaigns
        WHERE status = 'PAUSED'::"EmailCampaignStatus"
          AND processing = false
        ORDER BY updated_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING campaign_id, subject
    `;

    return results.length > 0 ? results[0] : null;
  } catch (err) {
    cronLogger.error("[Email Cron] Atomic claim (paused) failed", err);
    return null;
  }
}

// ============================================
// MAIN WORKER FUNCTION
// ============================================

async function processEmailBroadcasts() {
  const startTime = Date.now();

  try {
    await resetStuckProcessing();

    const quotaExhausted = await shouldPauseSending();

    if (quotaExhausted) {
      await checkAndResumePausedCampaigns();
      return;
    }

    await resumePausedCampaigns();
    await processScheduledCampaigns();

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      cronLogger.info(`[Email Cron] Cycle completed in ${duration}ms`);
    }
  } catch (err) {
    cronLogger.error("[Email Cron] Worker cycle failed", err);
  }
}

// ============================================
// RESET STUCK PROCESSING
// ============================================

async function resetStuckProcessing() {
  try {
    const threshold = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);

    const stuckCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        processing: true,
        processing_started_at: { lt: threshold },
        status: { in: [CAMPAIGN_STATUS.SENDING] },
      },
      select: {
        campaign_id: true,
        subject: true,
        delivered_count: true,
        failed_count: true,
        last_processed_index: true,
      },
    });

    if (stuckCampaigns.length === 0) return;

    cronLogger.warn(`[Email Cron] Found ${stuckCampaigns.length} stuck campaign(s)`);

    for (const campaign of stuckCampaigns) {
      let newStatus = CAMPAIGN_STATUS.PAUSED;

      if (campaign.delivered_count === 0 && campaign.last_processed_index === 0) {
        newStatus = CAMPAIGN_STATUS.FAILED;
      }

      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaign.campaign_id },
        data: {
          processing: false,
          status: newStatus,
          last_error: `Processing stuck for more than ${STUCK_THRESHOLD_MINUTES} minutes - reset to ${newStatus}`,
        },
      });

      cronLogger.warn(`[Email Cron] Reset stuck campaign ${campaign.campaign_id} ("${campaign.subject}") to ${newStatus}`);
    }
  } catch (err) {
    cronLogger.error("[Email Cron] Reset stuck processing failed", err);
  }
}

// ============================================
// RESUME PAUSED CAMPAIGNS
// ============================================

async function resumePausedCampaigns() {
  try {
    let processed = 0;

    while (processed < MAX_CAMPAIGNS_PER_CYCLE) {
      const capacity = await getRemainingCapacity();
      if (capacity.remaining <= 0) {
        cronLogger.info("[Email Cron] Quota exhausted, stopping resume cycle");
        break;
      }

      const claimed = await claimPausedCampaign();
      if (!claimed) break;

      try {
        cronLogger.info(`[Email Cron] Resuming paused campaign: ${claimed.campaign_id} - "${claimed.subject}"`);

        const { processCampaignSending } = await import(
          "../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js"
        );

        await processCampaignSending(claimed.campaign_id);

        cronLogger.success(`[Email Cron] Resumed campaign ${claimed.campaign_id} completed`);
      } catch (err) {
        cronLogger.error(`[Email Cron] Failed to resume campaign ${claimed.campaign_id}`, err);

        try {
          await prisma.emailBroadcastCampaign.update({
            where: { campaign_id: claimed.campaign_id },
            data: {
              processing: false,
              status: CAMPAIGN_STATUS.PAUSED,
              last_error: `Resume failed: ${err.message}`,
            },
          });
        } catch (_) {
          // resetStuckProcessing will catch it
        }
      }

      processed++;
    }
  } catch (err) {
    cronLogger.error("[Email Cron] Resume paused campaigns failed", err);
  }
}

async function checkAndResumePausedCampaigns() {
  try {
    const capacity = await getRemainingCapacity();

    if (capacity.remaining > 0) {
      cronLogger.info(`[Email Cron] New day detected (IST: ${capacity.date}), quota available: ${capacity.remaining}`);
      await resumePausedCampaigns();
    }
  } catch (err) {
    cronLogger.error("[Email Cron] Check and resume failed", err);
  }
}

// ============================================
// PROCESS SCHEDULED CAMPAIGNS
// ============================================

async function processScheduledCampaigns() {
  try {
    const now = new Date();
    let processed = 0;

    while (processed < MAX_CAMPAIGNS_PER_CYCLE) {
      const capacity = await getRemainingCapacity();
      if (capacity.remaining <= 0) {
        cronLogger.info("[Email Cron] Quota exhausted, remaining campaigns will be processed tomorrow");
        break;
      }

      const claimed = await claimScheduledCampaign(now);
      if (!claimed) break;

      try {
        cronLogger.info(`[Email Cron] Processing scheduled campaign: ${claimed.campaign_id} - "${claimed.subject}"`);

        const { processCampaignSending } = await import(
          "../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js"
        );

        const result = await processCampaignSending(claimed.campaign_id);

        if (result?.paused) {
          cronLogger.warn(`[Email Cron] Campaign ${claimed.campaign_id} paused (quota exhausted)`);
        } else {
          cronLogger.success(`[Email Cron] Campaign ${claimed.campaign_id} completed - ${result?.delivered || 0} delivered, ${result?.failed || 0} failed`);
        }
      } catch (err) {
        cronLogger.error(`[Email Cron] Failed to process campaign ${claimed.campaign_id}`, err);

        try {
          await prisma.emailBroadcastCampaign.update({
            where: { campaign_id: claimed.campaign_id },
            data: {
              processing: false,
              status: CAMPAIGN_STATUS.PAUSED,
              last_error: `Processing failed: ${err.message}`,
            },
          });
        } catch (_) {
          // resetStuckProcessing will catch it
        }
      }

      processed++;
    }
  } catch (err) {
    cronLogger.error("[Email Cron] Process scheduled campaigns failed", err);
  }
}

// ============================================
// INITIALIZE CRON JOB
// ============================================

export function initializeEmailBroadcastWorker() {
  cron.schedule("* * * * *", () =>
    withCronLock("email-broadcast", 5, processEmailBroadcasts),
  );

  cronLogger.info("[Email Cron] Email broadcast worker initialized (every 1 minute)");
}

// ============================================
// MANUAL TRIGGERS
// ============================================

export async function manuallyProcessCampaign(campaignId) {
  try {
    const campaign = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (![CAMPAIGN_STATUS.PAUSED, CAMPAIGN_STATUS.FAILED].includes(campaign.status)) {
      throw new Error(`Cannot manually process campaign with status: ${campaign.status}`);
    }

    const capacity = await getRemainingCapacity();
    if (capacity.remaining <= 0) {
      throw new Error("Daily quota exhausted. Try again tomorrow.");
    }

    cronLogger.info(`[Email Cron] Manual processing triggered for campaign ${campaignId}`);

    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.SENDING,
        processing: true,
        processing_started_at: new Date(),
        last_error: null,
      },
    });

    const { processCampaignSending } = await import(
      "../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js"
    );

    const result = await processCampaignSending(campaignId);
    return result;
  } catch (err) {
    cronLogger.error(`[Email Cron] Manual processing failed for ${campaignId}`, err);
    throw err;
  }
}

export async function getWorkerStatus() {
  const [scheduledCount, pausedCount, sendingCount, capacity] = await Promise.all([
    prisma.emailBroadcastCampaign.count({ where: { status: CAMPAIGN_STATUS.SCHEDULED } }),
    prisma.emailBroadcastCampaign.count({ where: { status: CAMPAIGN_STATUS.PAUSED } }),
    prisma.emailBroadcastCampaign.count({ where: { status: CAMPAIGN_STATUS.SENDING, processing: true } }),
    getRemainingCapacity(),
  ]);

  return {
    scheduled_campaigns: scheduledCount,
    paused_campaigns: pausedCount,
    currently_sending: sendingCount,
    quota: {
      date: capacity.date,
      used: capacity.used,
      remaining: capacity.remaining,
      limit: capacity.limit,
    },
    worker_active: true,
  };
}

export default {
  initializeEmailBroadcastWorker,
  processEmailBroadcasts,
  manuallyProcessCampaign,
  getWorkerStatus,
};