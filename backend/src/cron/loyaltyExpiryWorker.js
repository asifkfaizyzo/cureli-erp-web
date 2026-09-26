// backend/src/cron/loyaltyExpiryWorker.js (do not remove this comment)
import prisma from "../config/prisma.js";

export async function processExpiredLoyaltyPoints() {
  const now = new Date();

  try {
    const expiredTxns = await prisma.loyaltyTransaction.findMany({
      where: {
        type: "EARNED",
        is_expired: false,
        expires_at: {
          lte: now,
          not: null,
        },
      },
      orderBy: { expires_at: "asc" },
      take: 500,
    });

    if (expiredTxns.length === 0) {
      return { processed: 0 };
    }

    console.log(`[LoyaltyExpiryCron] Found ${expiredTxns.length} expired loyalty batches to process.`);

    let processedCount = 0;

    for (const txn of expiredTxns) {
      await prisma.$transaction(async (tx) => {
        await tx.loyaltyTransaction.update({
          where: { transaction_id: txn.transaction_id },
          data: { is_expired: true },
        });

        const [user] = await tx.$queryRaw`
          SELECT id, loyalty_points_balance 
          FROM cureli_mobile_users 
          WHERE id = ${txn.customer_id}::uuid FOR UPDATE
        `;

        if (!user) return;

        const pointsToDeduct = Math.min(user.loyalty_points_balance, txn.points);

        if (pointsToDeduct > 0) {
          const newBalance = user.loyalty_points_balance - pointsToDeduct;

          await tx.cureliMobileUser.update({
            where: { id: txn.customer_id },
            data: { loyalty_points_balance: newBalance },
          });

          await tx.loyaltyTransaction.create({
            data: {
              customer_id: txn.customer_id,
              type: "EXPIRED",
              points: pointsToDeduct,
              balance_after: newBalance,
              description: `Expired ${pointsToDeduct} unused points from order award`,
            },
          });
        }
      });

      processedCount++;
    }

    console.log(`[LoyaltyExpiryCron] Successfully processed ${processedCount} expired point records.`);
    return { processed: processedCount };
  } catch (err) {
    console.error("[LoyaltyExpiryCron] Error processing expired loyalty points:", err);
    throw err;
  }
}