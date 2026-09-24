// backend/src/modules/cadmin/broadcast/email/emailBroadcast.quota.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/emailBroadcast.quota.js

import prisma from '../../../../config/prisma.js';

/**
 * Daily Email Send Quota Manager — AWS SES edition
 *
 * SES limits (ap-south-1, your account):
 *   Daily quota  : 50,000 emails / 24-hour period
 *   Max send rate: 14 emails / second
 *
 * We set DAILY_LIMIT to 50,000 (from env so it's easy to change after
 * requesting a limit increase from AWS).
 *
 * The per-second rate is enforced in the service layer (batch size + delay).
 * This module only tracks the daily counter.
 */

// ── Configuration ────────────────────────────────────────────────────────────

// Default: 50,000 (your current SES daily quota)
// Set DAILY_EMAIL_LIMIT in env to override after a quota increase
const DAILY_LIMIT = parseInt(process.env.DAILY_EMAIL_LIMIT || '50000', 10);

// IST = UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// ── IST Helpers ───────────────────────────────────────────────────────────────

export function getCurrentISTDate() {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().split('T')[0];
}

export function toISTDate(date) {
  const d = new Date(date);
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  return istTime.toISOString().split('T')[0];
}

export function getMsUntilISTMidnight() {
  const now     = new Date();
  const istNow  = new Date(now.getTime() + IST_OFFSET_MS);
  const nextMid = new Date(istNow);
  nextMid.setUTCHours(24, 0, 0, 0);
  return nextMid.getTime() - IST_OFFSET_MS - now.getTime();
}

// ── Quota DB Operations ───────────────────────────────────────────────────────

export async function getTodayQuota() {
  const today = getCurrentISTDate();

  let quota = await prisma.dailySendQuota.findUnique({
    where: { date: today },
  });

  if (!quota) {
    quota = await prisma.dailySendQuota.create({
      data: { date: today, sent_count: 0 },
    });
  }

  return quota;
}

export async function getRemainingCapacity() {
  const quota     = await getTodayQuota();
  const remaining = DAILY_LIMIT - quota.sent_count;

  return {
    remaining: Math.max(0, remaining),
    used:      quota.sent_count,
    limit:     DAILY_LIMIT,
    canSend:   remaining > 0,
    date:      quota.date,
  };
}

export async function canSendEmails(count) {
  const { remaining, used, limit } = await getRemainingCapacity();

  return {
    canSend:   remaining >= count,
    available: remaining,
    needed:    count,
    shortfall: Math.max(0, count - remaining),
    used,
    limit,
  };
}

export async function reserveCapacity(requested) {
  const { remaining } = await getRemainingCapacity();
  return Math.min(requested, remaining);
}

export async function incrementSentCount(count) {
  if (count <= 0) return getTodayQuota();

  const today = getCurrentISTDate();

  const quota = await prisma.dailySendQuota.upsert({
    where:  { date: today },
    create: { date: today, sent_count: count },
    update: { sent_count: { increment: count } },
  });

  

  return quota;
}

export async function getQuotaHistory(days = 7) {
  const history = await prisma.dailySendQuota.findMany({
    orderBy: { date: 'desc' },
    take:    days,
  });

  return history.map((q) => ({
    ...q,
    limit:         DAILY_LIMIT,
    usage_percent: Math.round((q.sent_count / DAILY_LIMIT) * 100),
  }));
}

export async function shouldPauseSending() {
  const { remaining } = await getRemainingCapacity();
  return remaining <= 0;
}

export function getNextAvailableTime() {
  const msUntilMidnight = getMsUntilISTMidnight();
  return new Date(Date.now() + msUntilMidnight);
}

export async function resetTodayQuota() {
  const today = getCurrentISTDate();

  await prisma.dailySendQuota.upsert({
    where:  { date: today },
    create: { date: today, sent_count: 0 },
    update: { sent_count: 0 },
  });
}

export function getDailyLimit() {
  return DAILY_LIMIT;
}

export default {
  getCurrentISTDate,
  toISTDate,
  getMsUntilISTMidnight,
  getTodayQuota,
  getRemainingCapacity,
  canSendEmails,
  reserveCapacity,
  incrementSentCount,
  getQuotaHistory,
  shouldPauseSending,
  getNextAvailableTime,
  resetTodayQuota,
  getDailyLimit,
};