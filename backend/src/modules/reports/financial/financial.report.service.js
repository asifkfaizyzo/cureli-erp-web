// backend/src/modules/reports/financial/financial.report.service.js (do not remove this comment)
// backend/src/modules/reports/financial/financial.report.service.js

import prisma from "../../../config/prisma.js";
import { buildBranchFilter } from "../../sales/sales.helpers.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "REPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class FinancialReportService {
  _resolveDates(startDate, endDate) {
    const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;
    return { start, end };
  }

  // ─────────────────────────────────────────────────────────────────
  // E1 — MEDICINE-WISE PROFIT & LOSS REPORT
  // ─────────────────────────────────────────────────────────────────
  async getMedicinePLReport(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, category, manufacturer, sortBy = "profit", limit = 50, offset = 0 } = filters;
    const { start, end } = this._resolveDates(startDate, endDate);
    
    const branchFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      invoice: {
        ...branchFilter,
        status: "CONFIRMED",
        is_return: false,
        ...(start && end && { invoice_date: { gte: start, lte: end } }),
      },
      ...(category || manufacturer
        ? {
            medicine: {
              ...(category && { category }),
              ...(manufacturer && { manufacturer: { contains: manufacturer, mode: "insensitive" } }),
            },
          }
        : {}),
    };

    const items = await prisma.salesInvoiceItem.findMany({
      where,
      select: {
        medicine_id: true,
        quantity: true,
        selling_rate: true,
        mrp: true,
        purchase_rate: true,
        line_total: true,
        discount_amount: true,
        medicine: {
          select: { name: true, manufacturer: true, category: true },
        },
      },
    });

    const plMap = new Map();

    for (const item of items) {
      const mid = item.medicine_id;
      const qty = Number(item.quantity);
      const revenue = Number(item.line_total);
      const purchaseRate = Number(item.purchase_rate || 0);
      const costOfGoodsSold = purchaseRate * qty;
      const grossProfit = revenue - costOfGoodsSold;

      if (!plMap.has(mid)) {
        plMap.set(mid, {
          medicine_name: item.medicine?.name || "-",
          manufacturer: item.medicine?.manufacturer || "-",
          category: item.medicine?.category || "Uncategorized",
          quantity_sold: 0,
          total_revenue: 0,
          total_cost: 0,
          gross_profit: 0,
          gross_margin_percent: 0,
        });
      }

      const row = plMap.get(mid);
      row.quantity_sold += qty;
      row.total_revenue += revenue;
      row.total_cost += costOfGoodsSold;
      row.gross_profit += grossProfit;
    }

    let plList = Array.from(plMap.values()).map((row) => {
      row.gross_margin_percent = row.total_revenue > 0 ? (row.gross_profit / row.total_revenue) * 100 : 0;
      return {
        ...row,
        total_revenue: Number(row.total_revenue.toFixed(2)),
        total_cost: Number(row.total_cost.toFixed(2)),
        gross_profit: Number(row.gross_profit.toFixed(2)),
        gross_margin_percent: Number(row.gross_margin_percent.toFixed(2)),
      };
    });

    // Sort order mapping
    if (sortBy === "profit") {
      plList.sort((a, b) => b.gross_profit - a.gross_profit);
    } else if (sortBy === "margin") {
      plList.sort((a, b) => b.gross_margin_percent - a.gross_margin_percent);
    } else if (sortBy === "revenue") {
      plList.sort((a, b) => b.total_revenue - a.total_revenue);
    } else if (sortBy === "quantity") {
      plList.sort((a, b) => b.quantity_sold - a.quantity_sold);
    }

    const total = plList.length;
    const paginated = plList.slice(Number(offset), Number(offset) + Number(limit));

    const totalRevenueSum = plList.reduce((sum, item) => sum + item.total_revenue, 0);
    const totalCostSum = plList.reduce((sum, item) => sum + item.total_cost, 0);
    const totalProfitSum = totalRevenueSum - totalCostSum;

    return {
      records: paginated,
      total,
      summary: {
        total_revenue: totalRevenueSum,
        total_cost_of_goods: totalCostSum,
        total_gross_profit: totalProfitSum,
        overall_margin: totalRevenueSum > 0 ? (totalProfitSum / totalRevenueSum) * 100 : 0,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // E2 — PERIOD-WISE PROFIT & LOSS REPORT
  // ─────────────────────────────────────────────────────────────────
  async getPeriodPLReport(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate } = filters;
    const { start, end } = this._resolveDates(startDate, endDate);

    const branchFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const baseWhere = {
      ...branchFilter,
      status: "CONFIRMED",
      is_return: false,
      ...(start && end && { invoice_date: { gte: start, lte: end } }),
    };

    // Load matching invoices with lines cost parameters
    const invoices = await prisma.salesInvoice.findMany({
      where: baseWhere,
      include: {
        lineItems: { select: { quantity: true, purchase_rate: true, line_total: true } },
      },
      orderBy: { invoice_date: "asc" },
    });

    const trendMap = new Map();

    let totalRevenue = 0;
    let totalCogs = 0;

    invoices.forEach((inv) => {
      // Group trend points by year-month label (e.g., "Aug 2026")
      const dateObj = new Date(inv.invoice_date);
      const periodLabel = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      let revenue = 0;
      let cogs = 0;

      inv.lineItems.forEach((item) => {
        const lineTotal = Number(item.line_total);
        const itemCost = Number(item.quantity) * Number(item.purchase_rate || 0);
        revenue += lineTotal;
        cogs += itemCost;
      });

      totalRevenue += revenue;
      totalCogs += cogs;

      if (!trendMap.has(periodLabel)) {
        trendMap.set(periodLabel, {
          period: periodLabel,
          revenue: 0,
          cost_of_goods_sold: 0,
          gross_profit: 0,
          gross_margin_percent: 0,
        });
      }

      const trendRow = trendMap.get(periodLabel);
      trendRow.revenue += revenue;
      trendRow.cost_of_goods_sold += cogs;
      trendRow.gross_profit += (revenue - cogs);
    });

    const trend = Array.from(trendMap.values()).map((row) => ({
      ...row,
      revenue: Number(row.revenue.toFixed(2)),
      cost_of_goods_sold: Number(row.cost_of_goods_sold.toFixed(2)),
      gross_profit: Number(row.gross_profit.toFixed(2)),
      gross_margin_percent: row.revenue > 0 ? Number(((row.gross_profit / row.revenue) * 100).toFixed(2)) : 0,
    }));

    const grossProfit = totalRevenue - totalCogs;

    return {
      period: { startDate, endDate },
      summary: {
        total_revenue: totalRevenue,
        cost_of_goods_sold: totalCogs,
        gross_profit: grossProfit,
        gross_margin_percent: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      },
      trend,
    };
  }
}

export default new FinancialReportService();