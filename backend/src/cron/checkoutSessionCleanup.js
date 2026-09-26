// backend/src/cron/checkoutSessionCleanup.js (do not remove this comment)
import prisma from '../config/prisma.js';
import cronLogger from '../utils/cronLogger.js';

export async function expireStaleCheckoutSessions() {
  cronLogger.info('Checking for stale checkout sessions...');

  try {
    const result = await prisma.checkoutSession.updateMany({
      where: {
        status:     'created',
        expires_at: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    cronLogger.success(`Expired ${result.count} stale checkout sessions`);
    return result.count;
  } catch (err) {
    cronLogger.error('Checkout session cleanup failed', err);
    throw err;
  }
}