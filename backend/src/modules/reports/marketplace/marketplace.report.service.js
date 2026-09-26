// backend/src/modules/reports/marketplace/marketplace.report.service.js (do not remove this comment)
// backend/src/modules/reports/marketplace/marketplace.report.service.js

import prisma from "../../../config/prisma.js";
import { buildBranchFilter } from "../../sales/sales.helpers.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "REPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
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
  // F1 — MARKETPLACE SALES SUMMARY
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
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const baseWhere = {
      ...branchFilter,
      ...this._dateFilter(startDate, endDate),
      ...(status && { status }),
      ...(paymentMethod && { payment_method: paymentMethod }),
    };

    const [currentAgg, currentCount, branchBreakdown, statusBreakdown] =
      await Promise.all([
        prisma.marketplaceOrder.aggregate({
          where: baseWhere,
          _sum: {
            total_amount: true,
            subtotal: true,
            delivery_fee: true,
            service_charge: true,
            tip: true,
          },
          _avg: { total_amount: true },
        }),

        prisma.marketplaceOrder.count({ where: baseWhere }),

        prisma.marketplaceOrder.groupBy({
          by: ["branch_id"],
          where: baseWhere,
          _sum: { total_amount: true },
          _count: { order_id: true },
        }),

        prisma.marketplaceOrder.groupBy({
          by: ["status"],
          where: baseWhere,
          _sum: { total_amount: true },
          _count: { order_id: true },
        }),
      ]);

    // Previous period comparison
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
        },
        _sum: { total_amount: true },
        _count: { order_id: true },
      });
    }

    const currentRevenue = Number(currentAgg._sum.total_amount || 0);
    const prevRevenue = prevAgg ? Number(prevAgg._sum.total_amount || 0) : null;
    const growth =
      prevRevenue && prevRevenue > 0
        ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
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
      branches.map((b) => [b.branch_id, b.branch_name])
    );

    return {
      period: { startDate, endDate },
      summary: {
        total_orders: currentCount,
        total_revenue: currentRevenue,
        total_subtotal: Number(currentAgg._sum.subtotal || 0),
        total_delivery_fees: Number(currentAgg._sum.delivery_fee || 0),
        total_service_charges: Number(currentAgg._sum.service_charge || 0),
        total_tips: Number(currentAgg._sum.tip || 0),
        average_order_value: Number(currentAgg._avg.total_amount || 0),
      },
      comparison: {
        previous_period_orders: prevAgg?._count?.order_id || 0,
        previous_period_revenue: prevRevenue,
        growth_percent: growth,
      },
      branch_breakdown: branchBreakdown.map((b) => ({
        branch_id: b.branch_id,
        branch_name: branchNameMap.get(b.branch_id) || "Unknown",
        order_count: b._count.order_id,
        revenue: Number(b._sum.total_amount || 0),
      })),
      status_breakdown: statusBreakdown.map((s) => ({
        status: s.status,
        order_count: s._count.order_id,
        revenue: Number(s._sum.total_amount || 0),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // F2 — ORDER STATUS FUNNEL
  // ─────────────────────────────────────────────────────────────────
  async getOrderStatusFunnel(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

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
      0
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
      statusCounts.map((s) => [s.status, s._count.order_id])
    );

    const funnel = stageOrder.map((stage) => {
      const count = countMap.get(stage) || 0;
      return {
        status: stage,
        count,
        percentage:
          totalOrders > 0 ? Number(((count / totalOrders) * 100).toFixed(1)) : 0,
      };
    });

    const branchIds = [
      ...new Set(branchBreakdown.map((b) => b.branch_id)),
    ];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name])
    );

    const branchFunnel = branchIds.map((bid) => {
      const branchStages = branchBreakdown.filter((b) => b.branch_id === bid);
      const branchTotal = branchStages.reduce(
        (sum, s) => sum + s._count.order_id,
        0
      );
      const branchCountMap = new Map(
        branchStages.map((s) => [s.status, s._count.order_id])
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
                  ((branchCountMap.get(stage) || 0) / branchTotal) * 100
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
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

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
      statusCounts.map((s) => [s.status, s._count.order_id])
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

    const branchIds = [
      ...new Set(branchBreakdown.map((b) => b.branch_id)),
    ];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name])
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
  // F4 — PRESCRIPTION REQUEST SUMMARY (FIXED: uses sent_at)
  // ─────────────────────────────────────────────────────────────────
  async getPrescriptionSummary(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    // FIXED: Use sent_at instead of created_at
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

    const [
      totalRequests,
      statusBreakdown,
      branchBreakdown,
    ] = await Promise.all([
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
    ]);

    const statusMap = new Map(
      statusBreakdown.map((s) => [s.status, s._count.recipient_id])
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

    const branchIds = [
      ...new Set(branchBreakdown.map((b) => b.branch_id)),
    ];
    const branches =
      branchIds.length > 0
        ? await prisma.branch.findMany({
            where: { branch_id: { in: branchIds } },
            select: { branch_id: true, branch_name: true },
          })
        : [];
    const branchNameMap = new Map(
      branches.map((b) => [b.branch_id, b.branch_name])
    );

    const branchSummary = branchIds.map((bid) => {
      const bStages = branchBreakdown.filter((b) => b.branch_id === bid);
      const bMap = new Map(
        bStages.map((s) => [s.status, s._count.recipient_id])
      );
      const bTotal = bStages.reduce(
        (sum, s) => sum + s._count.recipient_id,
        0
      );
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
          bTotal > 0
            ? Number(((bConverted / bTotal) * 100).toFixed(1))
            : 0,
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
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

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

    // Safely load order item references with order date filter
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
      branches.map((b) => [b.branch_id, b.branch_name])
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
      }
    );

    return {
      period: { startDate, endDate },
      totals,
      branch_health: branchHealth,
    };
  }
}

export default new MarketplaceReportService();