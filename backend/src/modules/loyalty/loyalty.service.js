// backend/src/modules/loyalty/loyalty.service.js (do not remove this comment)
// backend/src/modules/loyalty/loyalty.service.js
import prisma from "../../config/prisma.js";
import { getLoyaltyConfig } from "./loyalty.config.service.js";
import { validateRedemption, calculatePointsEarned } from "./loyalty.engine.js";

// ─────────────────────────────────────────────────────────────────────────────
// CORE LOYALTY BUSINESS LOGIC
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerLoyaltyBalance(customer_id) {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: customer_id },
    select: { loyalty_points_balance: true },
  });

  if (!user) throw new Error("User not found");

  const config = await getLoyaltyConfig();

  return {
    balance: user.loyalty_points_balance,
    config: {
      isEnabled: config.is_enabled,
      earnRateAmount: config.earn_rate_amount,
      earnBasis: config.earn_basis, // ◄ Added
      redemptionValue: config.redemption_value,
      minRedeemPoints: config.min_redeem_points,
      minOrderAmount: config.min_order_amount,
      maxRedeemPoints: config.max_redeem_points,
      maxRedeemPercent: config.max_redeem_percent,
    },
  };
}

export async function redeemPoints({ customer_id, points_requested, effective_subtotal }, tx) {
  if (!tx) {
    throw new Error("RedeemPoints requires an active database transaction wrapper ($transaction)");
  }

  const config = await getLoyaltyConfig();

  const [user] = await tx.$queryRaw`
    SELECT id, loyalty_points_balance 
    FROM cureli_mobile_users 
    WHERE id = ${customer_id}::uuid FOR UPDATE
  `;

  if (!user) throw new Error("Customer not found during transaction validation");

  const validation = validateRedemption({
    config,
    userBalance: user.loyalty_points_balance,
    pointsRequested: points_requested,
    effectiveSubtotal: effective_subtotal,
  });

  if (!validation.valid) {
    throw new Error(validation.reason || "Invalid points redemption request");
  }

  const pointsToDeduct = validation.allowedPoints;
  const finalDiscount = validation.discount;

  await tx.cureliMobileUser.update({
    where: { id: customer_id },
    data: {
      loyalty_points_balance: { decrement: pointsToDeduct },
    },
  });

  await tx.loyaltyTransaction.create({
    data: {
      customer_id,
      type: "REDEEMED",
      points: pointsToDeduct,
      balance_after: user.loyalty_points_balance - pointsToDeduct,
      description: `Redeemed points on checkout`,
    },
  });

  return {
    points_redeemed: pointsToDeduct,
    discount_amount: finalDiscount,
  };
}

export async function earnLoyaltyPoints(order_id) {
  const config = await getLoyaltyConfig();
  if (!config.is_enabled) return;

  await prisma.$transaction(async (tx) => {
    // 1. Fetch order details inside transaction
    const order = await tx.marketplaceOrder.findUnique({
      where: { order_id },
      select: {
        order_id: true,
        order_number: true,
        customer_id: true,
        subtotal: true,
        coupon_discount_amount: true,
        total_amount: true, // ◄ Query total_amount
        loyalty_points_earned: true,
      },
    });

    if (!order) throw new Error("Order not found");
    
    // Guard: point earning is strictly idempotent (only earn once)
    if (order.loyalty_points_earned !== null) {
      console.log(`[LoyaltyService] Order ${order.order_number} already earned loyalty points. Skipping.`);
      return;
    }

    // Determine earning base amount
    let earningAmount = 0;
    if (config.earn_basis === "TOTAL_PAYABLE") {
      // Calculates points from the exact out-of-pocket amount paid by the customer
      earningAmount = Math.max(0, Number(order.total_amount));
    } else {
      // Fallback: post-coupon subtotal
      const couponDiscount = Number(order.coupon_discount_amount ?? 0);
      earningAmount = Math.max(0, Number(order.subtotal) - couponDiscount);
    }

    // Calculate points
    const pointsEarned = calculatePointsEarned(earningAmount, config.earn_rate_amount);
    if (pointsEarned <= 0) {
      await tx.marketplaceOrder.update({
        where: { order_id },
        data: { loyalty_points_earned: 0 },
      });
      return;
    }

    // 2. Lock customer row
    const [user] = await tx.$queryRaw`
      SELECT id, loyalty_points_balance 
      FROM cureli_mobile_users 
      WHERE id = ${order.customer_id}::uuid FOR UPDATE
    `;

    if (!user) throw new Error("Customer user record missing");

    // 3. Calculate Expiry Date if configured
    let expiresAt = null;
    if (config.points_expiry_days !== null) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + config.points_expiry_days);
    }

    // 4. Update customer point balance
    await tx.cureliMobileUser.update({
      where: { id: order.customer_id },
      data: {
        loyalty_points_balance: { increment: pointsEarned },
      },
    });

    // 5. Create transaction ledger entry
    await tx.loyaltyTransaction.create({
      data: {
        customer_id: order.customer_id,
        type: "EARNED",
        points: pointsEarned,
        order_id: order.order_id,
        balance_after: user.loyalty_points_balance + pointsEarned,
        description: `Earned on order ${order.order_number}`,
        expires_at: expiresAt,
      },
    });

    // 6. Complete order state snapshot
    await tx.marketplaceOrder.update({
      where: { order_id },
      data: {
        loyalty_points_earned: pointsEarned,
      },
    });

    console.log(`[LoyaltyService] Credited ${pointsEarned} loyalty points to customer ${order.customer_id} for order ${order.order_number} (Basis: ${config.earn_basis}, Amount: ₹${earningAmount})`);
  });
}

export async function getCustomerLoyaltyHistory(customer_id, { page = 1, limit = 20 }) {
  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { customer_id },
      orderBy: { created_at: "desc" },
      skip,
      take: Number(limit),
      select: {
        transaction_id: true,
        type: true,
        points: true,
        description: true,
        balance_after: true,
        created_at: true,
        expires_at: true,
        is_expired: true,
        order: {
          select: {
            order_number: true,
          },
        },
      },
    }),
    prisma.loyaltyTransaction.count({ where: { customer_id } }),
  ]);

  return {
    transactions,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}