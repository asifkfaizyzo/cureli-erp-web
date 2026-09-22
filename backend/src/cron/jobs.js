//backend\src\cron\jobs.js
import cron from "node-cron";
import prisma from "../config/prisma.js";
import { withCronLock, getInstanceId } from "./cronLock.js";
import { transitionDeprecatedPlans } from "../modules/cadmin/plans/cadminPlans.service.js";
import { cleanupExpiredSessions } from "../utils/session.js";
import { deleteFile } from "../services/fileStorage.service.js";
import { processExpiredLoyaltyPoints } from "./loyaltyExpiryWorker.js";
import { runBirthdayPushJob } from "./birthdayPushWorker.js";

import {
  cleanupOldPendingUsers,
  cleanupIncompleteUsers,
  cleanupOldDeletionLogs,
} from "../utils/cleanup.js";
import { initializeEmailBroadcastWorker } from "./emailBroadcastWorker.js";
import { initializeFileCleanupWorker } from "./emailFileCleanupWorker.js";
import cronLogger from "../utils/cronLogger.js";

import {
  transitionExpiredToGrace,
  suspendExpiredGrace,
  transitionPendingToOverdue,
  getSubscriptionsDueForReminders,
} from "../modules/subscription/subscription.service.js";

import inventoryService from "../modules/inventory/inventory.service.js";

import {
  notifyAsync,
  NOTIFICATION_EVENTS,
} from "../modules/notifications/index.js";

import { expireStaleCheckoutSessions } from "./checkoutSessionCleanup.js";
import { runMarketplaceScheduler } from "./marketplaceScheduler.js";

import {
  expireStaleQuotes,
  expireStaleRequests,
  cleanupExpiredRequestFiles,
} from "../modules/prescription-requests/prescription.requests.service.js";

// Import Fleet Incentives and Pricing services for daily evaluations
import { evaluateDailyIncentivesForShift } from "../modules/cadmin/fleet-incentives/incentiveEngine.service.js";
import { checkAndActivateScheduledConfigs } from "../modules/cadmin/fleet-pricing/fleetPricing.service.js";

async function processScheduledBroadcasts() {
  cronLogger.info("Checking for scheduled broadcasts...");

  try {
    const now = new Date();

    const dueBroadcasts = await prisma.broadcastCampaign.findMany({
      where: {
        status: "scheduled",
        scheduled_for: { lte: now },
      },
      orderBy: { scheduled_for: "asc" },
    });

    if (dueBroadcasts.length === 0) {
      cronLogger.info("No scheduled broadcasts due for sending");
      return;
    }

    cronLogger.info(`Found ${dueBroadcasts.length} broadcast(s) to send`);

    let sent = 0;
    let failed = 0;

    for (const campaign of dueBroadcasts) {
      try {
        cronLogger.info(
          `Sending broadcast: ${campaign.campaign_id} - "${campaign.title}"`,
        );

        const { sendScheduled } =
          await import("../modules/cadmin/broadcast/inapp/cadminInAppBroadcast.service.js");

        const result = await sendScheduled(campaign.campaign_id);

        cronLogger.success(
          `Broadcast ${campaign.campaign_id} sent to ${result.sent} recipients`,
        );
        sent++;
      } catch (err) {
        cronLogger.error(
          `Failed to send broadcast ${campaign.campaign_id}`,
          err,
        );
        failed++;
      }
    }

    cronLogger.info(
      `Scheduled broadcasts complete: ${sent} sent, ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Scheduled broadcasts job failed", err);
  }
}

function initializeScheduledBroadcastsJob() {
  cron.schedule("*/5 * * * *", () =>
    withCronLock("scheduled-broadcasts", 10, processScheduledBroadcasts),
  );
  cronLogger.info("Scheduled broadcasts job initialized (every 5 minutes)");
}

async function runSessionCleanup() {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      cronLogger.info(`Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    cronLogger.error("Session cleanup failed", err);
  }
}

function initializePlanTransitionJob() {
  cron.schedule("0 2 * * *", () =>
    withCronLock("plan-transition", 30, async () => {
      cronLogger.info("Starting plan status transition check...");

      try {
        const result = await transitionDeprecatedPlans();

        cronLogger.info(
          `Plan transition complete: checked=${result.checked} deprecated plans, transitioned=${result.transitioned} plans to SUSPENDED`,
        );

        if (result.transitioned > 0) {
          cronLogger.info(
            `Transitioned plans: ${result.plans.map((p) => p.name).join(", ")}`,
          );
        }
      } catch (err) {
        cronLogger.error("Plan transition job failed", err);
      }
    }),
  );

  cronLogger.info("Plan transition job scheduled (daily at 2:00 AM)");
}

function initializeSubscriptionLifecycleJob() {
  cron.schedule("0 * * * *", () =>
    withCronLock("subscription-lifecycle", 30, async () => {
      cronLogger.info("Starting subscription lifecycle check...");

      try {
        const graceResult = await transitionExpiredToGrace();
        if (graceResult.transitioned > 0) {
          cronLogger.info(
            `Expired → Grace: ${graceResult.transitioned} subscriptions`,
          );

          for (const r of graceResult.results) {
            cronLogger.info(
              `  - ${r.shop_name}: grace until ${r.grace_period_until.toISOString().split("T")[0]}`,
            );

            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED,
              context: {
                shop_id: r.shop_id,
                shop_name: r.shop_name,
                end_date: r.end_date,
                grace_period_until: r.grace_period_until,
              },
            });
          }
        }

        const suspendResult = await suspendExpiredGrace();
        if (suspendResult.suspended > 0) {
          cronLogger.info(
            `Grace → Suspended: ${suspendResult.suspended} subscriptions`,
          );

          for (const r of suspendResult.results) {
            cronLogger.info(`  - ${r.shop_name} (${r.shop_id}): SUSPENDED`);

            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
              context: {
                shop_id: r.shop_id,
                shop_name: r.shop_name,
              },
            });
          }
        }

        cronLogger.info(
          `Subscription lifecycle complete | Grace: ${graceResult.transitioned} | Suspended: ${suspendResult.suspended}`,
        );
      } catch (err) {
        cronLogger.error("Subscription lifecycle job failed", err);
      }
    }),
  );

  cronLogger.info("Subscription lifecycle job scheduled (every hour)");
}

function initializePaymentStatusSyncJob() {
  cron.schedule("0 1 * * *", () =>
    withCronLock("payment-sync", 30, async () => {
      cronLogger.info("Starting payment status sync...");

      try {
        const result = await transitionPendingToOverdue();

        if (result.updated > 0) {
          cronLogger.info(`Pending → Overdue: ${result.updated} subscriptions`);
        }

        cronLogger.info("Payment status sync complete");
      } catch (err) {
        cronLogger.error("Payment status sync failed", err);
      }
    }),
  );

  cronLogger.info("Payment status sync job scheduled (daily at 1:00 AM)");
}

function initializeReminderJob() {
  cron.schedule("0 9 * * *", () =>
    withCronLock("reminder-emails", 60, async () => {
      cronLogger.info("Starting reminder emails...");

      try {
        const reminders = await getSubscriptionsDueForReminders();

        if (reminders.expiring7Days.length > 0) {
          cronLogger.info(
            `Expiring in 7 days: ${reminders.expiring7Days.length} shops`,
          );
          for (const sub of reminders.expiring7Days) {
            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS,
              context: {
                shop_id: sub.shop_id,
                shop_name: sub.shop.business_name,
                end_date: sub.end_date,
                plan_name: sub.plan?.name || "Standard",
                daysLeft: 7,
              },
            });
          }
        }

        if (reminders.expiring3Days.length > 0) {
          cronLogger.info(
            `Expiring in 3 days: ${reminders.expiring3Days.length} shops`,
          );
          for (const sub of reminders.expiring3Days) {
            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS,
              context: {
                shop_id: sub.shop_id,
                shop_name: sub.shop.business_name,
                end_date: sub.end_date,
                plan_name: sub.plan?.name || "Standard",
                daysLeft: 3,
              },
            });
          }
        }

        if (reminders.graceEndingSoon.length > 0) {
          cronLogger.info(
            `Grace ending tomorrow: ${reminders.graceEndingSoon.length} shops`,
          );
          for (const sub of reminders.graceEndingSoon) {
            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING,
              context: {
                shop_id: sub.shop_id,
                shop_name: sub.shop.business_name,
                grace_period_until: sub.grace_period_until,
              },
            });
          }
        }

        cronLogger.info("All reminder emails dispatched");
      } catch (err) {
        cronLogger.error("Reminder job failed", err);
      }
    }),
  );

  cronLogger.info("Reminder job scheduled (daily at 9:00 AM)");
}

function initializeInventoryExpiryJob() {
  cron.schedule("0 6 * * *", () =>
    withCronLock("inventory-expiry", 60, async () => {
      cronLogger.info("Starting inventory expiry checks...");

      try {
        const shops = await prisma.shop.findMany({
          where: { is_active: true },
          select: { shop_id: true, business_name: true },
        });

        let totalExpired = 0;
        let totalNearExpiry = 0;

        for (const shop of shops) {
          try {
            const expiredResult = await inventoryService.markExpiredItems(
              shop.shop_id,
            );
            totalExpired += expiredResult.count || 0;

            if (expiredResult.count > 0) {
              cronLogger.info(
                `  - ${shop.business_name}: ${expiredResult.count} items expired`,
              );
            }

            const nearExpiryResult =
              await inventoryService.sendNearExpiryAlerts(shop.shop_id, 30);
            totalNearExpiry += nearExpiryResult.sent || 0;

            if (nearExpiryResult.sent > 0) {
              cronLogger.info(
                `  - ${shop.business_name}: ${nearExpiryResult.sent} near-expiry alerts sent`,
              );
            }
          } catch (shopErr) {
            cronLogger.error(`  - ${shop.business_name} failed`, shopErr);
          }
        }

        cronLogger.info(
          `Inventory expiry checks complete | Expired: ${totalExpired} | Near-expiry alerts: ${totalNearExpiry}`,
        );
      } catch (err) {
        cronLogger.error("Inventory expiry job failed", err);
      }
    }),
  );

  cronLogger.info("Inventory expiry job scheduled (daily at 6:00 AM)");
}

async function cleanupExpiredPrescriptions() {
  cronLogger.info("Checking for expired prescriptions to purge...");

  try {
    const now = new Date();

    const expired = await prisma.marketplaceOrderPrescription.findMany({
      where: {
        expires_at: { lt: now },
        deleted_at: null,
      },
      select: {
        prescription_id: true,
        storage_key: true,
        original_name: true,
      },
    });

    if (expired.length === 0) {
      cronLogger.info("No expired prescriptions to purge");
      return;
    }

    cronLogger.info(`Found ${expired.length} expired prescription(s) to purge`);

    let purged = 0;
    let failed = 0;

    for (const prescription of expired) {
      try {
        await deleteFile({
          folder: "order_prescriptions",
          filename: prescription.storage_key,
        });

        await prisma.marketplaceOrderPrescription.update({
          where: { prescription_id: prescription.prescription_id },
          data: { deleted_at: now },
        });

        cronLogger.info(
          `  - Purged: ${prescription.original_name} (${prescription.prescription_id})`,
        );
        purged++;
      } catch (err) {
        cronLogger.error(
          `  - Failed to purge ${prescription.prescription_id}: ${err.message}`,
        );
        failed++;
      }
    }

    cronLogger.info(
      `Prescription purge complete: ${purged} purged, ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Prescription cleanup job failed", err);
  }
}

function initializePrescriptionCleanupJob() {
  cron.schedule("30 2 * * *", () =>
    withCronLock("prescription-cleanup", 15, cleanupExpiredPrescriptions),
  );
  cronLogger.info("Prescription cleanup job scheduled (daily at 2:30 AM)");
}

async function autoCompleteStaleOrders() {
  cronLogger.info("Checking for stale READY_FOR_PICKUP orders...");

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const staleOrders = await prisma.marketplaceOrder.findMany({
      where: {
        status: "READY_FOR_PICKUP",
        ready_at: { lt: cutoff },
        auto_completed: false,
      },
      select: {
        order_id: true,
        order_number: true,
      },
    });

    if (staleOrders.length === 0) {
      cronLogger.info("No stale orders found");
      return;
    }

    cronLogger.info(
      `Found ${staleOrders.length} stale order(s) to auto-complete`,
    );

    const { transitionOrderStatus } =
      await import("../modules/marketplace-orders/marketplace.orders.service.js");

    let completed = 0;
    let failed = 0;

    for (const order of staleOrders) {
      try {
        await transitionOrderStatus({
          order_id: order.order_id,
          target_status: "COMPLETED",
          actor_type: "system",
          actor_id: null,
        });

        cronLogger.info(`  - Auto-completed order ${order.order_number}`);
        completed++;
      } catch (err) {
        cronLogger.error(
          `  - Failed to auto-complete ${order.order_number}: ${err.message}`,
        );
        failed++;
      }
    }

    cronLogger.info(
      `Marketplace auto-complete done: ${completed} completed, ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Marketplace order auto-complete job failed", err);
  }
}

function initializeMarketplaceOrderAutoComplete() {
  cron.schedule("0 * * * *", () =>
    withCronLock("marketplace-order-autocomplete", 10, autoCompleteStaleOrders),
  );
  cronLogger.info("Marketplace order auto-complete scheduled (every hour)");
}

function initializeCheckoutSessionCleanupJob() {
  cron.schedule("*/5 * * * *", () =>
    withCronLock("checkout-session-cleanup", 4, async () => {
      await expireStaleCheckoutSessions();
    }),
  );
  cronLogger.info("Checkout session cleanup scheduled (every 5 minutes)");
}

function initializeMarketplaceSchedulerJob() {
  cron.schedule("* * * * *", () =>
    withCronLock("marketplace-scheduler", 1, runMarketplaceScheduler),
  );
  cronLogger.info("Marketplace scheduler job initialized (every minute)");
}

async function runQuoteExpiryJob() {
  try {
    const result = await expireStaleQuotes();
    if (result.expired > 0) {
      cronLogger.info(
        `[PRx] Expired ${result.expired} stale quote recipient(s)`,
      );
    }
  } catch (err) {
    cronLogger.error("Prescription quote expiry job failed", err);
  }
}

function initializePrescriptionQuoteExpiryJob() {
  cron.schedule("*/5 * * * *", () =>
    withCronLock("prescription-quote-expiry", 4, runQuoteExpiryJob),
  );
  cronLogger.info(
    "Prescription quote expiry job scheduled (every 5 minutes)",
  );
}

async function runPrescriptionRequestCleanupJob() {
  try {
    cronLogger.info("[PRx] Starting prescription request cleanup run");

    const requestResult = await expireStaleRequests();
    cronLogger.info(
      `[PRx] Expired ${requestResult.expired} stale prescription request(s)`,
    );

    const fileResult = await cleanupExpiredRequestFiles();
    cronLogger.info(
      `[PRx] File cleanup: ${fileResult.deleted} deleted, ${fileResult.failed} failed`,
    );
  } catch (err) {
    cronLogger.error("Prescription request cleanup job failed", err);
  }
}

function initializePrescriptionRequestCleanupJob() {
  cron.schedule("30 20 * * *", () =>
    withCronLock("prescription-request-cleanup", 30, runPrescriptionRequestCleanupJob),
  );
  cronLogger.info(
    "Prescription request cleanup job scheduled (daily at 02:00 IST / 20:30 UTC)",
  );
}

function initializeLoyaltyPointsExpiryJob() {
  cron.schedule("0 2 * * *", () =>
    withCronLock("loyalty-points-expiry", 30, async () => {
      cronLogger.info("Starting loyalty points expiry check...");
      try {
        const result = await processExpiredLoyaltyPoints();
        cronLogger.info(`Loyalty points expiry complete | Processed: ${result.processed}`);
      } catch (err) {
        cronLogger.error("Loyalty points expiry job failed", err);
      }
    }),
  );
  cronLogger.info("Loyalty points expiry job scheduled (daily at 2:00 AM IST)");
}

async function runShiftEvaluation() {
  cronLogger.info("Starting daily rider incentive shift evaluation...");
  try {
    // Yesterday's date (whose shift closed at 06:00 AM today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await evaluateDailyIncentivesForShift(yesterday);
    await checkAndActivateScheduledConfigs();

    cronLogger.success("Daily rider incentive shift evaluation and configuration activation completed.");
  } catch (err) {
    cronLogger.error("Daily rider incentive evaluation failed", err);
  }
}

function initializeShiftEvaluationJob() {
  cron.schedule("5 6 * * *", () =>
    withCronLock("shift-evaluation", 60, runShiftEvaluation),
  );
  cronLogger.info("Shift evaluation job scheduled (daily at 6:05 AM)");
}
function initializeBirthdayPushJob() {
  // 11:00 AM IST = 05:30 UTC
  cron.schedule("30 5 * * *", () =>
    withCronLock("birthday-push", 30, runBirthdayPushJob),
  );
  cronLogger.info("Birthday push job scheduled (daily at 11:00 AM IST)");
}

export function initializeCronJobs() {
  cronLogger.info("Initializing cron jobs...");
  cronLogger.info(`Instance ID: ${getInstanceId()}`);
  cronLogger.info("Distributed locking: ENABLED");

  initializeEmailBroadcastWorker();
  initializeFileCleanupWorker();
  cronLogger.info("Email broadcast worker: Every 1 minute");
  cronLogger.info("Email file cleanup: Daily at 4:00 AM");

  setInterval(
    () => withCronLock("session-cleanup", 10, runSessionCleanup),
    60 * 60 * 1000,
  );
  withCronLock("session-cleanup", 10, runSessionCleanup);

  initializePlanTransitionJob();
  initializeSubscriptionLifecycleJob();
  initializePaymentStatusSyncJob();
  initializeReminderJob();
  initializeInventoryExpiryJob();
  initializeScheduledBroadcastsJob();
  initializeMarketplaceOrderAutoComplete();
  initializePrescriptionCleanupJob();
  initializeCheckoutSessionCleanupJob();
  initializeMarketplaceSchedulerJob();

  initializePrescriptionQuoteExpiryJob();
  initializePrescriptionRequestCleanupJob();
  initializeLoyaltyPointsExpiryJob();
  initializeShiftEvaluationJob();
  initializeBirthdayPushJob();

  cron.schedule("0 3 * * *", () =>
    withCronLock("cleanup-pending-users", 15, async () => {
      cronLogger.info("Running pending users cleanup...");
      try {
        await cleanupOldPendingUsers();
        cronLogger.success("Pending users cleanup completed");
      } catch (err) {
        cronLogger.error("Pending users cleanup failed", err);
      }
    }),
  );

  cron.schedule("15 3 * * *", () =>
    withCronLock("cleanup-incomplete-users", 15, async () => {
      cronLogger.info("Running incomplete users cleanup...");
      try {
        const result = await cleanupIncompleteUsers();
        cronLogger.success(
          `Incomplete users cleanup completed: ${result.deleted} deleted`,
        );
      } catch (err) {
        cronLogger.error("Incomplete users cleanup failed", err);
      }
    }),
  );

  cron.schedule("30 3 * * *", () =>
    withCronLock("cleanup-deletion-logs", 15, async () => {
      cronLogger.info("Running deletion logs cleanup...");
      try {
        const count = await cleanupOldDeletionLogs();
        cronLogger.success(
          `Deletion logs cleanup completed: ${count} old logs removed`,
        );
      } catch (err) {
        cronLogger.error("Deletion logs cleanup failed", err);
      }
    }),
  );

  cron.schedule("45 3 * * *", () =>
    withCronLock("cleanup-otp-limits", 10, async () => {
      cronLogger.info("Cleaning up old OTP daily limits...");
      try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await prisma.otpDailyLimit.deleteMany({
          where: { date: { lt: cutoff } },
        });
        cronLogger.success(`Removed ${result.count} old OTP limit records`);
      } catch (err) {
        cronLogger.error("OTP limits cleanup failed", err);
      }
    }),
  );

  
  cronLogger.info("All cron jobs initialized:");
  cronLogger.info("  - Session cleanup: Every hour");
  cronLogger.info("  - Plan transition: Daily at 2:00 AM");
  cronLogger.info("  - Subscription lifecycle + emails: Every hour");
  cronLogger.info("  - Payment status sync: Daily at 1:00 AM");
  cronLogger.info("  - Inventory expiry checks + alerts: Daily at 6:00 AM");
  cronLogger.info("  - Reminder emails (7d/3d/final): Daily at 9:00 AM");
  cronLogger.info("  - Pending users cleanup: Daily at 3:00 AM");
  cronLogger.info("  - Incomplete users cleanup: Daily at 3:15 AM");
  cronLogger.info("  - Deletion logs cleanup: Daily at 3:30 AM");
  cronLogger.info("  - Scheduled broadcasts: Every 5 minutes");
  cronLogger.info("  - OTP daily limits cleanup: Daily at 3:45 AM");
  cronLogger.info("  - Marketplace order auto-complete: Every hour");
  cronLogger.info("  - Prescription cleanup: Daily at 2:30 AM");
  cronLogger.info("  - Checkout session cleanup: Every 5 minutes");
  cronLogger.info("  - Marketplace auto open/close scheduler: Every minute");
  cronLogger.info("  - Prescription quote expiry: Every 5 minutes");
  cronLogger.info("  - Prescription request cleanup: Daily at 02:00 IST");
  cronLogger.info("  - Loyalty points expiry: Daily at 2:00 AM IST");
  cronLogger.info("  - Shift evaluation: Daily at 6:05 AM");
  cronLogger.info("  - Birthday push notifications: Daily at 11:00 AM IST");
}