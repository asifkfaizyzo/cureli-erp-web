// backend/src/modules/reports/marketplace/marketplace.report.service.js

import prisma from "../../../config/prisma.js";
import { buildBranchFilter } from "../../sales/sales.helpers.js";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

class MarketplaceReportService {
  // ─────────────────────────────────────────────────────────────────
  // HELPER: Timezone-safe UTC date boundaries
  // ─────────────────────────────────────────────────────────────────
  _dateFilter(startDate, endDate) {
    if (!startDate || !endDate) return {};
    return {
      placed_at: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F1 — MARKETPLACE SALES SUMMARY (Isolates Realized Sales)
  // ─────────────────────────────────────────────────────────────────
  async getSalesSummary(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      status,
      paymentMethod,
      branchId: filterBranchId,
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    // 1. Base filter for general metadata queries (respects dates, branch, payment method)
    const baseWhere = {
      ...branchFilter,
      ...this._dateFilter(startDate, endDate),
      ...(paymentMethod && { payment_method: paymentMethod }),
    };

    // 2. Strict status isolation for actual financial figures (Gross, Net, AOV)
    // If user explicitly selects a status, we filter by it.
    // If "All Status" (falsy) is selected, we isolate to "COMPLETED" so rejected/cancelled orders never inflate figures.
    const financialWhere = {
      ...baseWhere,
      status: status ? status : "COMPLETED",
    };

    const [currentAgg, currentCount, branchBreakdown, statusBreakdown] =
      await Promise.all([
        prisma.marketplaceOrder.aggregate({
          where: financialWhere,
          _sum: {
            subtotal: true,
            commission_amount_snapshot: true,
          },
          _avg: { subtotal: true },
        }),

        prisma.marketplaceOrder.count({ where: financialWhere }),

        // Branch breakdown must represent contribution of realized/selected sales
        prisma.marketplaceOrder.groupBy({
          by: ["branch_id"],
          where: financialWhere,
          _sum: {
            subtotal: true,
            commission_amount_snapshot: true,
          },
          _count: { order_id: true },
        }),

        // Status breakdown must remain unfiltered so admins see all states (including rejections)
        prisma.marketplaceOrder.groupBy({
          by: ["status"],
          where: baseWhere,
          _sum: { subtotal: true },
          _count: { order_id: true },
        }),
      ]);

    // 3. Like-for-Like Previous period comparison
    let prevAgg = null;
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      const diffMs = end - start;
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffMs);

      prevAgg = await prisma.marketplaceOrder.aggregate({
        where: {
          ...branchFilter,
          placed_at: { gte: prevStart, lte: prevEnd },
          status: status ? status : "COMPLETED",
        },
        _sum: { subtotal: true },
        _count: { order_id: true },
      });
    }

    const currentGross = Number(currentAgg._sum.subtotal || 0);
    const totalCommission = Number(
      currentAgg._sum.commission_amount_snapshot || 0,
    );
    const netEarnings = round2(currentGross - totalCommission);

    const prevGross = prevAgg ? Number(prevAgg._sum.subtotal || 0) : null;
    const growth =
      prevGross && prevGross > 0
        ? (((currentGross - prevGross) / prevGross) * 100).toFixed(1)
        : null;

    const branchIds = branchBreakdown.map((b) => b.branch_id);
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    return {
      period: { startDate, endDate },
      summary: {
        total_orders: currentCount,
        total_gross_revenue: currentGross,
        total_commission: totalCommission,
        net_earnings: netEarnings,
        average_order_value: round2(currentAgg._avg.subtotal || 0),
        effective_commission_rate:
          currentGross > 0 ? round1((totalCommission / currentGross) * 100) : 0,
      },
      comparison: {
        previous_period_orders: prevAgg?._count?.order_id || 0,
        previous_period_revenue: prevGross,
        growth_percent: growth,
      },
      branch_breakdown: branchBreakdown.map((b) => {
        const branchSubtotal = Number(b._sum.subtotal || 0);
        const branchCommission = Number(b._sum.commission_amount_snapshot || 0);
        return {
          branch_id: b.branch_id,
          branch_name: branchNameMap.get(b.branch_id) || "Unknown",
          order_count: b._count.order_id,
          gross_revenue: branchSubtotal,
          commission_amount: branchCommission,
          net_earnings: round2(branchSubtotal - branchCommission),
        };
      }),
      status_breakdown: statusBreakdown.map((s) => ({
        status: s.status,
        order_count: s._count.order_id,
        revenue: Number(s._sum.subtotal || 0),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F2 — ORDER STATUS FUNNEL
  // ─────────────────────────────────────────────────────────────────
  async getOrderStatusFunnel(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    const baseWhere = {
      ...branchFilter,
      ...this._dateFilter(startDate, endDate),
    };

    const [statusCounts, branchBreakdown] = await Promise.all([
      prisma.marketplaceOrder.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { order_id: true },
      }),

      prisma.marketplaceOrder.groupBy({
        by: ["branch_id", "status"],
        where: baseWhere,
        _count: { order_id: true },
      }),
    ]);

    const totalOrders = statusCounts.reduce(
      (sum, s) => sum + s._count.order_id,
      0,
    );

    const stageOrder = [
      "PLACED",
      "ACCEPTED",
      "READY_FOR_PICKUP",
      "COMPLETED",
      "REJECTED",
      "CANCELLED",
    ];

    const countMap = new Map(
      statusCounts.map((s) => [s.status, s._count.order_id]),
    );

    const funnel = stageOrder.map((stage) => {
      const count = countMap.get(stage) || 0;
      return {
        status: stage,
        count,
        percentage:
          totalOrders > 0
            ? Number(((count / totalOrders) * 100).toFixed(1))
            : 0,
      };
    });

    const branchIds = [...new Set(branchBreakdown.map((b) => b.branch_id))];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    const branchFunnel = branchIds.map((bid) => {
      const branchStages = branchBreakdown.filter((b) => b.branch_id === bid);
      const branchTotal = branchStages.reduce(
        (sum, s) => sum + s._count.order_id,
        0,
      );
      const branchCountMap = new Map(
        branchStages.map((s) => [s.status, s._count.order_id]),
      );

      return {
        branch_id: bid,
        branch_name: branchNameMap.get(bid) || "Unknown",
        total_orders: branchTotal,
        stages: stageOrder.map((stage) => ({
          status: stage,
          count: branchCountMap.get(stage) || 0,
          percentage:
            branchTotal > 0
              ? Number(
                  ((branchCountMap.get(stage) || 0) / branchTotal) * 100,
                ).toFixed(1)
              : 0,
        })),
      };
    });

    return {
      period: { startDate, endDate },
      total_orders: totalOrders,
      funnel,
      branch_breakdown: branchFunnel,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F3 — ACCEPTANCE RATE
  // ─────────────────────────────────────────────────────────────────
  async getAcceptanceRate(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    const baseWhere = {
      ...branchFilter,
      ...this._dateFilter(startDate, endDate),
    };

    const [statusCounts, branchBreakdown] = await Promise.all([
      prisma.marketplaceOrder.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { order_id: true },
      }),

      prisma.marketplaceOrder.groupBy({
        by: ["branch_id", "status"],
        where: baseWhere,
        _count: { order_id: true },
      }),
    ]);

    const countMap = new Map(
      statusCounts.map((s) => [s.status, s._count.order_id]),
    );

    const placed = countMap.get("PLACED") || 0;
    const accepted = countMap.get("ACCEPTED") || 0;
    const ready = countMap.get("READY_FOR_PICKUP") || 0;
    const completed = countMap.get("COMPLETED") || 0;
    const rejected = countMap.get("REJECTED") || 0;
    const cancelled = countMap.get("CANCELLED") || 0;
    const total = placed + accepted + ready + completed + rejected + cancelled;

    const acceptedCount = accepted + ready + completed;
    const acceptanceRate =
      total > 0 ? Number(((acceptedCount / total) * 100).toFixed(1)) : 0;
    const rejectionRate =
      total > 0 ? Number(((rejected / total) * 100).toFixed(1)) : 0;
    const cancellationRate =
      total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0;

    const branchIds = [...new Set(branchBreakdown.map((b) => b.branch_id))];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    const branchRates = branchIds.map((bid) => {
      const bStages = branchBreakdown.filter((b) => b.branch_id === bid);
      const bMap = new Map(bStages.map((s) => [s.status, s._count.order_id]));
      const bTotal = bStages.reduce((sum, s) => sum + s._count.order_id, 0);
      const bAccepted =
        (bMap.get("ACCEPTED") || 0) +
        (bMap.get("READY_FOR_PICKUP") || 0) +
        (bMap.get("COMPLETED") || 0);

      return {
        branch_id: bid,
        branch_name: branchNameMap.get(bid) || "Unknown",
        total_orders: bTotal,
        accepted_count: bAccepted,
        rejected_count: bMap.get("REJECTED") || 0,
        cancelled_count: bMap.get("CANCELLED") || 0,
        acceptance_rate:
          bTotal > 0 ? Number(((bAccepted / bTotal) * 100).toFixed(1)) : 0,
      };
    });

    return {
      period: { startDate, endDate },
      summary: {
        total_orders: total,
        accepted_count: acceptedCount,
        rejected_count: rejected,
        cancelled_count: cancelled,
        acceptance_rate: acceptanceRate,
        rejection_rate: rejectionRate,
        cancellation_rate: cancellationRate,
      },
      branch_breakdown: branchRates,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F4 — PRESCRIPTION REQUEST SUMMARY
  // ─────────────────────────────────────────────────────────────────
  async getPrescriptionSummary(
    shopId,
    branchId,
    role,
    branchMode,
    filters = {},
  ) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    const dateWhere =
      startDate && endDate
        ? {
            sent_at: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          }
        : {};

    const recipientWhere = {
      shop_id: shopId,
      ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
      ...dateWhere,
    };

    const [totalRequests, statusBreakdown, branchBreakdown] = await Promise.all(
      [
        prisma.prescriptionRequestRecipient.count({
          where: recipientWhere,
        }),

        prisma.prescriptionRequestRecipient.groupBy({
          by: ["status"],
          where: recipientWhere,
          _count: { recipient_id: true },
        }),

        prisma.prescriptionRequestRecipient.groupBy({
          by: ["branch_id", "status"],
          where: recipientWhere,
          _count: { recipient_id: true },
        }),
      ],
    );

    const statusMap = new Map(
      statusBreakdown.map((s) => [s.status, s._count.recipient_id]),
    );

    const sent = statusMap.get("SENT") || 0;
    const quoteSent = statusMap.get("QUOTE_SENT") || 0;
    const accepted = statusMap.get("ACCEPTED") || 0;
    const converted = statusMap.get("CONVERTED") || 0;
    const declined = statusMap.get("DECLINED") || 0;
    const expired = statusMap.get("EXPIRED") || 0;

    const conversionRate =
      totalRequests > 0
        ? Number(((converted / totalRequests) * 100).toFixed(1))
        : 0;

    const responded = quoteSent + accepted + converted + declined;
    const responseRate =
      totalRequests > 0
        ? Number(((responded / totalRequests) * 100).toFixed(1))
        : 0;

    const branchIds = [...new Set(branchBreakdown.map((b) => b.branch_id))];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    const branchSummary = branchIds.map((bid) => {
      const bStages = branchBreakdown.filter((b) => b.branch_id === bid);
      const bMap = new Map(
        bStages.map((s) => [s.status, s._count.recipient_id]),
      );
      const bTotal = bStages.reduce((sum, s) => sum + s._count.recipient_id, 0);
      const bConverted = bMap.get("CONVERTED") || 0;

      return {
        branch_id: bid,
        branch_name: branchNameMap.get(bid) || "Unknown",
        total_requests: bTotal,
        quotes_sent: bMap.get("QUOTE_SENT") || 0,
        accepted: bMap.get("ACCEPTED") || 0,
        converted: bConverted,
        declined: bMap.get("DECLINED") || 0,
        expired: bMap.get("EXPIRED") || 0,
        conversion_rate:
          bTotal > 0 ? Number(((bConverted / bTotal) * 100).toFixed(1)) : 0,
      };
    });

    return {
      period: { startDate, endDate },
      summary: {
        total_requests: totalRequests,
        pending: sent,
        quotes_sent: quoteSent,
        accepted,
        converted,
        declined,
        expired,
        conversion_rate: conversionRate,
        response_rate: responseRate,
      },
      branch_breakdown: branchSummary,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F5 — LISTING HEALTH
  // ─────────────────────────────────────────────────────────────────
  async getListingHealth(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    const listingWhere = {
      shop_id: shopId,
      ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
    };

    const listings = await prisma.marketplaceListing.findMany({
      where: listingWhere,
      select: {
        listing_id: true,
        branch_id: true,
        medicine_id: true,
        is_visible: true,
        stock_status: true,
        requires_prescription: true,
      },
    });

    const orderItems = await prisma.marketplaceOrderItem.findMany({
      where: {
        order: {
          shop_id: shopId,
          ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
          ...(startDate && endDate
            ? {
                placed_at: {
                  gte: new Date(`${startDate}T00:00:00.000Z`),
                  lte: new Date(`${endDate}T23:59:59.999Z`),
                },
              }
            : {}),
        },
      },
      select: {
        listing_id: true,
      },
    });

    const orderedListingIds = new Set(orderItems.map((oi) => oi.listing_id));

    const branchMap = new Map();

    for (const listing of listings) {
      const bid = listing.branch_id;
      if (!branchMap.has(bid)) {
        branchMap.set(bid, {
          branch_id: bid,
          total_linked: 0,
          total_listed: 0,
          total_visible: 0,
          total_out_of_stock: 0,
          total_prescription_required: 0,
          total_zero_orders: 0,
        });
      }

      const branch = branchMap.get(bid);
      branch.total_linked += 1;

      if (listing.is_visible) {
        branch.total_visible += 1;
      }

      if (listing.is_visible && listing.stock_status === "IN_STOCK") {
        branch.total_listed += 1;
      }

      if (listing.stock_status === "OUT_OF_STOCK") {
        branch.total_out_of_stock += 1;
      }

      if (listing.requires_prescription) {
        branch.total_prescription_required += 1;
      }

      if (!orderedListingIds.has(listing.listing_id)) {
        branch.total_zero_orders += 1;
      }
    }

    const branchIds = [...branchMap.keys()];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    const branchHealth = Array.from(branchMap.values()).map((b) => ({
      ...b,
      branch_name: branchNameMap.get(b.branch_id) || "Unknown",
      visibility_rate:
        b.total_linked > 0
          ? Number(((b.total_visible / b.total_linked) * 100).toFixed(1))
          : 0,
      zero_order_rate:
        b.total_linked > 0
          ? Number(((b.total_zero_orders / b.total_linked) * 100).toFixed(1))
          : 0,
    }));

    const totals = branchHealth.reduce(
      (acc, b) => {
        acc.total_linked += b.total_linked;
        acc.total_listed += b.total_listed;
        acc.total_visible += b.total_visible;
        acc.total_out_of_stock += b.total_out_of_stock;
        acc.total_prescription_required += b.total_prescription_required;
        acc.total_zero_orders += b.total_zero_orders;
        return acc;
      },
      {
        total_linked: 0,
        total_listed: 0,
        total_visible: 0,
        total_out_of_stock: 0,
        total_prescription_required: 0,
        total_zero_orders: 0,
      },
    );

    return {
      period: { startDate, endDate },
      totals,
      branch_health: branchHealth,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F6 — REVENUE LEAKAGE (Rejections & Cancellations Audit)
  // ─────────────────────────────────────────────────────────────────
  async getRevenueLeakage(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    const baseWhere = {
      ...branchFilter,
      status: { in: ["REJECTED", "CANCELLED"] },
      ...this._dateFilter(startDate, endDate),
    };

    const [lostOrders, branchGroups] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        where: baseWhere,
        select: {
          order_id: true,
          order_number: true,
          branch_id: true,
          status: true,
          subtotal: true,
          rejection_reason: true,
          rejection_reason_other: true,
          cancelled_by: true,
          placed_at: true,
        },
      }),

      prisma.marketplaceOrder.groupBy({
        by: ["branch_id", "status"],
        where: baseWhere,
        _sum: { subtotal: true },
        _count: { order_id: true },
      }),
    ]);

    let rejectedCount = 0;
    let rejectedRevenue = 0;
    let cancelledCount = 0;
    let cancelledRevenue = 0;

    const rejectionReasonMap = new Map();
    const cancellationSourceMap = new Map();
    const dailyTrendMap = new Map();

    for (const order of lostOrders) {
      const sub = Number(order.subtotal || 0);
      const dateStr = order.placed_at
        ? order.placed_at.toISOString().split("T")[0]
        : "Unknown";

      // Daily trend
      if (!dailyTrendMap.has(dateStr)) {
        dailyTrendMap.set(dateStr, {
          date: dateStr,
          rejected_amount: 0,
          cancelled_amount: 0,
          total_amount: 0,
          count: 0,
        });
      }
      const dayItem = dailyTrendMap.get(dateStr);
      dayItem.count += 1;
      dayItem.total_amount = round2(dayItem.total_amount + sub);

      if (order.status === "REJECTED") {
        rejectedCount += 1;
        rejectedRevenue = round2(rejectedRevenue + sub);
        dayItem.rejected_amount = round2(dayItem.rejected_amount + sub);

        const reasonKey =
          order.rejection_reason ||
          (order.rejection_reason_other ? "OTHER" : "UNSPECIFIED");
        if (!rejectionReasonMap.has(reasonKey)) {
          rejectionReasonMap.set(reasonKey, {
            reason: reasonKey,
            count: 0,
            revenue: 0,
          });
        }
        const reasonObj = rejectionReasonMap.get(reasonKey);
        reasonObj.count += 1;
        reasonObj.revenue = round2(reasonObj.revenue + sub);
      } else if (order.status === "CANCELLED") {
        cancelledCount += 1;
        cancelledRevenue = round2(cancelledRevenue + sub);
        dayItem.cancelled_amount = round2(dayItem.cancelled_amount + sub);

        const sourceKey = order.cancelled_by || "customer";
        if (!cancellationSourceMap.has(sourceKey)) {
          cancellationSourceMap.set(sourceKey, {
            source: sourceKey,
            count: 0,
            revenue: 0,
          });
        }
        const sourceObj = cancellationSourceMap.get(sourceKey);
        sourceObj.count += 1;
        sourceObj.revenue = round2(sourceObj.revenue + sub);
      }
    }

    // Branch Breakdown Resolution
    const branchIds = [...new Set(branchGroups.map((b) => b.branch_id))];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    const branchBreakdown = branchIds.map((bid) => {
      const bItems = branchGroups.filter((g) => g.branch_id === bid);
      let bRejCount = 0;
      let bRejRev = 0;
      let bCanCount = 0;
      let bCanRev = 0;

      for (const item of bItems) {
        if (item.status === "REJECTED") {
          bRejCount += item._count.order_id;
          bRejRev = round2(bRejRev + Number(item._sum.subtotal || 0));
        } else if (item.status === "CANCELLED") {
          bCanCount += item._count.order_id;
          bCanRev = round2(bCanRev + Number(item._sum.subtotal || 0));
        }
      }

      return {
        branch_id: bid,
        branch_name: branchNameMap.get(bid) || "Unknown",
        total_lost_orders: bRejCount + bCanCount,
        total_lost_revenue: round2(bRejRev + bCanRev),
        rejected_count: bRejCount,
        rejected_revenue: bRejRev,
        cancelled_count: bCanCount,
        cancelled_revenue: bCanRev,
      };
    });

    const totalLostRevenue = round2(rejectedRevenue + cancelledRevenue);
    const totalLostOrders = rejectedCount + cancelledCount;

    return {
      period: { startDate, endDate },
      summary: {
        total_lost_orders: totalLostOrders,
        total_lost_revenue: totalLostRevenue,
        rejected_count: rejectedCount,
        rejected_revenue: rejectedRevenue,
        cancelled_count: cancelledCount,
        cancelled_revenue: cancelledRevenue,
      },
      by_rejection_reason: Array.from(rejectionReasonMap.values()).sort(
        (a, b) => b.revenue - a.revenue,
      ),
      by_cancellation_source: Array.from(cancellationSourceMap.values()).sort(
        (a, b) => b.revenue - a.revenue,
      ),
      branch_breakdown: branchBreakdown.sort(
        (a, b) => b.total_lost_revenue - a.total_lost_revenue,
      ),
      daily_trend: Array.from(dailyTrendMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F7 — FULFILLMENT SPEED & SLAs (Pharmacy Action Speeds)
  // ─────────────────────────────────────────────────────────────────
  async getFulfillmentSpeed(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    // Safeguard: Filter baseWhere to active/completed pipeline orders only.
    // Excludes orders cancelled or rejected before reaching pharmacy milestones.
    const baseWhere = {
      ...branchFilter,
      status: { in: ["READY_FOR_PICKUP", "COMPLETED"] },
      ...this._dateFilter(startDate, endDate),
    };

    const eligibleOrders = await prisma.marketplaceOrder.findMany({
      where: baseWhere,
      select: {
        order_id: true,
        branch_id: true,
        placed_at: true,
        accepted_at: true,
        ready_at: true,
        status: true,
      },
    });

    const branchIds = [...new Set(eligibleOrders.map((o) => o.branch_id))];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name]),
    );

    let acceptanceMinutesSum = 0;
    let acceptanceCount = 0;
    let acceptanceUnder5m = 0;

    let prepMinutesSum = 0;
    let prepCount = 0;
    let prepUnder15m = 0;

    let tatMinutesSum = 0;
    let tatCount = 0;
    let tatUnder20m = 0;

    const branchStatsMap = new Map();
    const hourlyMap = new Map();
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { hour: h, count: 0, tat_sum: 0 });
    }

    for (const order of eligibleOrders) {
      const bid = order.branch_id;
      if (!branchStatsMap.has(bid)) {
        branchStatsMap.set(bid, {
          branch_id: bid,
          branch_name: branchNameMap.get(bid) || "Unknown",
          total_measured: 0,
          acceptance_sum: 0,
          acceptance_count: 0,
          prep_sum: 0,
          prep_count: 0,
          tat_sum: 0,
          tat_count: 0,
        });
      }
      const bStat = branchStatsMap.get(bid);

      const placedMs = order.placed_at
        ? new Date(order.placed_at).getTime()
        : null;
      const acceptedMs = order.accepted_at
        ? new Date(order.accepted_at).getTime()
        : null;
      const readyMs = order.ready_at
        ? new Date(order.ready_at).getTime()
        : null;

      // 1. Acceptance Speed
      if (placedMs && acceptedMs && acceptedMs >= placedMs) {
        const acceptMins = (acceptedMs - placedMs) / 60000;
        acceptanceMinutesSum += acceptMins;
        acceptanceCount += 1;
        if (acceptMins <= 5) acceptanceUnder5m += 1;

        bStat.acceptance_sum += acceptMins;
        bStat.acceptance_count += 1;
      }

      // 2. Prep Speed (packing)
      if (acceptedMs && readyMs && readyMs >= acceptedMs) {
        const prepMins = (readyMs - acceptedMs) / 60000;
        prepMinutesSum += prepMins;
        prepCount += 1;
        if (prepMins <= 15) prepUnder15m += 1;

        bStat.prep_sum += prepMins;
        bStat.prep_count += 1;
      }

      // 3. Pharmacy Turnaround Time (TAT)
      if (placedMs && readyMs && readyMs >= placedMs) {
        const tatMins = (readyMs - placedMs) / 60000;
        tatMinutesSum += tatMins;
        tatCount += 1;
        if (tatMins <= 20) tatUnder20m += 1;

        bStat.tat_sum += tatMins;
        bStat.tat_count += 1;
        bStat.total_measured += 1;

        const hour = new Date(order.placed_at).getHours();
        const hEntry = hourlyMap.get(hour);
        if (hEntry) {
          hEntry.count += 1;
          hEntry.tat_sum += tatMins;
        }
      }
    }

    const branchBreakdown = Array.from(branchStatsMap.values()).map((b) => ({
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      total_measured: b.total_measured,
      avg_acceptance_minutes:
        b.acceptance_count > 0
          ? round1(b.acceptance_sum / b.acceptance_count)
          : 0,
      avg_prep_minutes:
        b.prep_count > 0 ? round1(b.prep_sum / b.prep_count) : 0,
      avg_tat_minutes: b.tat_count > 0 ? round1(b.tat_sum / b.tat_count) : 0,
    }));

    const hourlyDistribution = Array.from(hourlyMap.values())
      .filter((h) => h.count > 0)
      .map((h) => ({
        hour: h.hour,
        order_count: h.count,
        avg_tat_minutes: h.count > 0 ? round1(h.tat_sum / h.count) : 0,
      }));

    return {
      period: { startDate, endDate },
      summary: {
        total_orders_measured: tatCount,
        avg_acceptance_minutes:
          acceptanceCount > 0
            ? round1(acceptanceMinutesSum / acceptanceCount)
            : 0,
        avg_prep_minutes:
          prepCount > 0 ? round1(prepMinutesSum / prepCount) : 0,
        avg_pharmacy_tat_minutes:
          tatCount > 0 ? round1(tatMinutesSum / tatCount) : 0,
        sla_acceptance_compliance_pct:
          acceptanceCount > 0
            ? round1((acceptanceUnder5m / acceptanceCount) * 100)
            : 0,
        sla_prep_compliance_pct:
          prepCount > 0 ? round1((prepUnder15m / prepCount) * 100) : 0,
        sla_tat_compliance_pct:
          tatCount > 0 ? round1((tatUnder20m / tatCount) * 100) : 0,
      },
      branch_breakdown: branchBreakdown.sort(
        (a, b) => a.avg_tat_minutes - b.avg_tat_minutes,
      ),
      hourly_distribution: hourlyDistribution,
    };
  }
}

export default new MarketplaceReportService();
