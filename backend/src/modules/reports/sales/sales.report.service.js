// backend/src/modules/reports/sales/sales.report.service.js (do not remove this comment)
// backend/src/modules/reports/sales/sales.report.service.js

import prisma from "../../../config/prisma.js";
import { buildBranchFilter } from "../../sales/sales.helpers.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "REPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class SalesReportService {
  // ─────────────────────────────────────────────────────────────────
  // HELPER: build date filter (Timezone-safe UTC bounds)
  // ─────────────────────────────────────────────────────────────────
  _dateFilter(startDate, endDate) {
    if (!startDate || !endDate) return {};
    return {
      invoice_date: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A1 — SALES SUMMARY
  // ─────────────────────────────────────────────────────────────────
  async getSalesSummary(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, branchId: filterBranchId } = filters;
    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const baseWhere = {
      ...branchFilter,
      is_return: false,
      status: "CONFIRMED",
      ...this._dateFilter(startDate, endDate),
    };

    // Previous period for comparison
    let prevWhere = null;
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      const diffMs = end - start;
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffMs);
      prevWhere = {
        ...branchFilter,
        is_return: false,
        status: "CONFIRMED",
        invoice_date: { gte: prevStart, lte: prevEnd },
      };
    }

    const [
      current,
      previous,
      paymentStatusBreakdown,
      paymentModeBreakdown,
    ] = await Promise.all([
      // Current period aggregates
      prisma.salesInvoice.aggregate({
        where: baseWhere,
        _count: { invoice_id: true },
        _sum: {
          subtotal: true,
          total_discount: true,
          cgst_amount: true,
          sgst_amount: true,
          total_tax: true,
          net_amount: true,
          paid_amount: true,
          balance_amount: true,
        },
      }),

      // Previous period
      prevWhere
        ? prisma.salesInvoice.aggregate({
            where: prevWhere,
            _count: { invoice_id: true },
            _sum: { net_amount: true },
          })
        : Promise.resolve(null),

      // Payment status breakdown
      prisma.salesInvoice.groupBy({
        by: ["payment_status"],
        where: baseWhere,
        _count: { invoice_id: true },
        _sum: { net_amount: true },
      }),

      // Payment mode breakdown (from payments table)
      prisma.salesPayment.groupBy({
        by: ["payment_mode"],
        where: {
          ...branchFilter,
          status: "COMPLETED",
          ...(startDate && endDate
            ? {
                payment_date: {
                  gte: new Date(`${startDate}T00:00:00.000Z`),
                  lte: new Date(`${endDate}T23:59:59.999Z`),
                },
              }
            : {}),
        },
        _count: { payment_id: true },
        _sum: { amount: true },
      }),
    ]);

    // Returns summary
    const returnsAgg = await prisma.salesInvoice.aggregate({
      where: {
        ...branchFilter,
        is_return: true,
        status: "CONFIRMED",
        return_approval_status: "APPROVED",
        ...this._dateFilter(startDate, endDate),
      },
      _count: { invoice_id: true },
      _sum: { net_amount: true },
    });

    const grossSales = Number(current._sum.net_amount || 0);
    const returnsTotal = Number(returnsAgg._sum.net_amount || 0);
    const netSales = grossSales - returnsTotal;

    const prevNet = previous ? Number(previous._sum.net_amount || 0) : null;
    const growth =
      prevNet && prevNet > 0
        ? (((grossSales - prevNet) / prevNet) * 100).toFixed(1)
        : null;

    return {
      period: { startDate, endDate },
      summary: {
        total_invoices: current._count.invoice_id || 0,
        gross_sales: grossSales,
        total_discount: Number(current._sum.total_discount || 0),
        cgst_collected: Number(current._sum.cgst_amount || 0),
        sgst_collected: Number(current._sum.sgst_amount || 0),
        total_tax_collected: Number(current._sum.total_tax || 0),
        returns_count: returnsAgg._count.invoice_id || 0,
        returns_amount: returnsTotal,
        net_sales: netSales,
        total_collected: Number(current._sum.paid_amount || 0),
        total_outstanding: Number(current._sum.balance_amount || 0),
      },
      comparison: {
        previous_period_sales: prevNet,
        growth_percent: growth,
      },
      payment_status_breakdown: paymentStatusBreakdown.map((p) => ({
        status: p.payment_status,
        count: p._count.invoice_id,
        amount: Number(p._sum.net_amount || 0),
      })),
      payment_mode_breakdown: paymentModeBreakdown.map((p) => ({
        mode: p.payment_mode,
        count: p._count.payment_id,
        amount: Number(p._sum.amount || 0),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A2 — SALES REGISTER
  // ─────────────────────────────────────────────────────────────────
  async getSalesRegister(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      status,
      paymentStatus,
      search,
      staffId,
      branchId: filterBranchId,
      limit = 50,
      offset = 0,
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...branchFilter,
      is_return: false,
      ...(status ? { status } : { status: "CONFIRMED" }),
      ...this._dateFilter(startDate, endDate),
      ...(customerId && { customer_id: customerId }),
      ...(paymentStatus && { payment_status: paymentStatus }),
      ...(staffId && { created_by: staffId }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { walkin_name: { contains: search, mode: "insensitive" } },
          { walkin_phone: { contains: search, mode: "insensitive" } },
          {
            customer: { name: { contains: search, mode: "insensitive" } },
          },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        select: {
          invoice_id: true,
          invoice_number: true,
          invoice_date: true,
          customer_id: true,
          walkin_name: true,
          walkin_phone: true,
          status: true,
          payment_status: true,
          subtotal: true,
          total_discount: true,
          total_tax: true,
          net_amount: true,
          paid_amount: true,
          balance_amount: true,
          is_credit_sale: true,
          sale_channel: true,
          customer: {
            select: { name: true, phone: true },
          },
          creator: {
            select: { full_name: true },
          },
          branch: {
            select: { branch_name: true },
          },
          _count: { select: { lineItems: true } },
          payments: {
            select: { payment_mode: true, amount: true },
          },
        },
        orderBy: { invoice_date: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    // Totals for visible page
    const totals = await prisma.salesInvoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        total_discount: true,
        total_tax: true,
        net_amount: true,
        paid_amount: true,
        balance_amount: true,
      },
    });

    return {
      invoices: invoices.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal),
        total_discount: Number(inv.total_discount),
        total_tax: Number(inv.total_tax),
        net_amount: Number(inv.net_amount),
        paid_amount: Number(inv.paid_amount),
        balance_amount: Number(inv.balance_amount),
        customer_name: inv.customer?.name || inv.walkin_name || "Walk-in",
        customer_phone: inv.customer?.phone || inv.walkin_phone || "-",
        billed_by: inv.creator?.full_name || "-",
        branch_name: inv.branch?.branch_name || "-",
        item_count: inv._count.lineItems,
        payment_modes: [
          ...new Set(inv.payments.map((p) => p.payment_mode)),
        ].join(", "),
      })),
      total,
      totals: {
        subtotal: Number(totals._sum.subtotal || 0),
        total_discount: Number(totals._sum.total_discount || 0),
        total_tax: Number(totals._sum.total_tax || 0),
        net_amount: Number(totals._sum.net_amount || 0),
        paid_amount: Number(totals._sum.paid_amount || 0),
        balance_amount: Number(totals._sum.balance_amount || 0),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A3 — SALES PROFIT REPORT
  // ─────────────────────────────────────────────────────────────────
  async getSalesProfit(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      category,
      manufacturer,
      sortBy = "profit",
      branchId: filterBranchId,
      limit = 50,
      offset = 0,
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    // Fetch confirmed sales line items with purchase_rate
    const items = await prisma.salesInvoiceItem.findMany({
      where: {
        invoice: {
          ...branchFilter,
          status: "CONFIRMED",
          is_return: false,
          ...this._dateFilter(startDate, endDate),
        },
        ...(category || manufacturer
          ? {
              medicine: {
                ...(category && { category }),
                ...(manufacturer && {
                  manufacturer: {
                    contains: manufacturer,
                    mode: "insensitive",
                  },
                }),
              },
            }
          : {}),
      },
      select: {
        medicine_id: true,
        quantity: true,
        selling_rate: true,
        mrp: true,
        purchase_rate: true,
        line_total: true,
        discount_amount: true,
        medicine: {
          select: {
            name: true,
            manufacturer: true,
            category: true,
            generic_name: true,
          },
        },
      },
    });

    // Aggregate by medicine
    const medicineMap = new Map();

    for (const item of items) {
      const mid = item.medicine_id;
      const qty = Number(item.quantity);
      const sellingRate = Number(item.selling_rate || item.mrp);
      const purchaseRate = Number(item.purchase_rate || 0);
      const lineTotal = Number(item.line_total);
      const discountAmt = Number(item.discount_amount || 0);

      const revenue = lineTotal;
      const cost = purchaseRate * qty;
      const grossProfit = revenue - cost;

      if (!medicineMap.has(mid)) {
        medicineMap.set(mid, {
          medicine_id: mid,
          medicine_name: item.medicine?.name || "-",
          manufacturer: item.medicine?.manufacturer || "-",
          category: item.medicine?.category || "-",
          generic_name: item.medicine?.generic_name || "-",
          total_quantity: 0,
          total_revenue: 0,
          total_cost: 0,
          total_gross_profit: 0,
          total_discount: 0,
          avg_selling_rate: 0,
          avg_purchase_rate: 0,
          avg_margin_percent: 0,
          _rate_sum: 0,
          _purchase_sum: 0,
          _count: 0,
        });
      }

      const row = medicineMap.get(mid);
      row.total_quantity += qty;
      row.total_revenue += revenue;
      row.total_cost += cost;
      row.total_gross_profit += grossProfit;
      row.total_discount += discountAmt;
      row._rate_sum += sellingRate;
      row._purchase_sum += purchaseRate;
      row._count += 1;
    }

    // Finalize averages
    let result = Array.from(medicineMap.values()).map((row) => {
      row.avg_selling_rate =
        row._count > 0 ? row._rate_sum / row._count : 0;
      row.avg_purchase_rate =
        row._count > 0 ? row._purchase_sum / row._count : 0;
      row.avg_margin_percent =
        row.total_revenue > 0
          ? (row.total_gross_profit / row.total_revenue) * 100
          : 0;

      // Clean up internal fields
      delete row._rate_sum;
      delete row._purchase_sum;
      delete row._count;

      return {
        ...row,
        total_revenue: Number(row.total_revenue.toFixed(2)),
        total_cost: Number(row.total_cost.toFixed(2)),
        total_gross_profit: Number(row.total_gross_profit.toFixed(2)),
        total_discount: Number(row.total_discount.toFixed(2)),
        avg_selling_rate: Number(row.avg_selling_rate.toFixed(2)),
        avg_purchase_rate: Number(row.avg_purchase_rate.toFixed(2)),
        avg_margin_percent: Number(row.avg_margin_percent.toFixed(2)),
      };
    });

    // Sort
    if (sortBy === "profit") {
      result.sort((a, b) => b.total_gross_profit - a.total_gross_profit);
    } else if (sortBy === "margin") {
      result.sort((a, b) => b.avg_margin_percent - a.avg_margin_percent);
    } else if (sortBy === "revenue") {
      result.sort((a, b) => b.total_revenue - a.total_revenue);
    } else if (sortBy === "quantity") {
      result.sort((a, b) => b.total_quantity - a.total_quantity);
    }

    const total = result.length;
    const paginated = result.slice(Number(offset), Number(offset) + Number(limit));

    // Grand totals
    const grandTotals = result.reduce(
      (acc, row) => {
        acc.total_revenue += row.total_revenue;
        acc.total_cost += row.total_cost;
        acc.total_gross_profit += row.total_gross_profit;
        acc.total_quantity += row.total_quantity;
        return acc;
      },
      { total_revenue: 0, total_cost: 0, total_gross_profit: 0, total_quantity: 0 },
    );

    grandTotals.overall_margin_percent =
      grandTotals.total_revenue > 0
        ? Number(
            ((grandTotals.total_gross_profit / grandTotals.total_revenue) * 100).toFixed(2),
          )
        : 0;

    return {
      items: paginated,
      total,
      grand_totals: {
        total_revenue: Number(grandTotals.total_revenue.toFixed(2)),
        total_cost: Number(grandTotals.total_cost.toFixed(2)),
        total_gross_profit: Number(grandTotals.total_gross_profit.toFixed(2)),
        total_quantity: grandTotals.total_quantity,
        overall_margin_percent: grandTotals.overall_margin_percent,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A4 — SALES RETURNS REPORT
  // ─────────────────────────────────────────────────────────────────
  async getSalesReturnsReport(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      returnReason,
      approvalStatus,
      search,
      branchId: filterBranchId,
      limit = 50,
      offset = 0,
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...branchFilter,
      is_return: true,
      ...this._dateFilter(startDate, endDate),
      ...(customerId && { customer_id: customerId }),
      ...(returnReason && { return_reason: returnReason }),
      ...(approvalStatus && { return_approval_status: approvalStatus }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { walkin_name: { contains: search, mode: "insensitive" } },
          {
            customer: { name: { contains: search, mode: "insensitive" } },
          },
          {
            parentInvoice: {
              invoice_number: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const [returns, total, totals] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        select: {
          invoice_id: true,
          invoice_number: true,
          invoice_date: true,
          walkin_name: true,
          return_reason: true,
          return_approval_status: true,
          refund_mode: true,
          refund_amount: true,
          net_amount: true,
          status: true,
          customer: { select: { name: true, phone: true } },
          parentInvoice: {
            select: { invoice_id: true, invoice_number: true },
          },
          approver: { select: { full_name: true } },
          creator: { select: { full_name: true } },
          branch: { select: { branch_name: true } },
        },
        orderBy: { invoice_date: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.salesInvoice.count({ where }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: { net_amount: true, refund_amount: true },
        _count: { invoice_id: true },
      }),
    ]);

    return {
      returns: returns.map((r) => ({
        ...r,
        net_amount: Number(r.net_amount),
        refund_amount: Number(r.refund_amount || 0),
        customer_name: r.customer?.name || r.walkin_name || "Walk-in",
        customer_phone: r.customer?.phone || "-",
        parent_invoice_number: r.parentInvoice?.invoice_number || "-",
        approved_by: r.approver?.full_name || "-",
        created_by: r.creator?.full_name || "-",
        branch_name: r.branch?.branch_name || "-",
      })),
      total,
      summary: {
        total_returns: totals._count.invoice_id || 0,
        total_return_value: Number(totals._sum.net_amount || 0),
        total_refunded: Number(totals._sum.refund_amount || 0),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A5 — PAYMENT COLLECTION REPORT
  // ─────────────────────────────────────────────────────────────────
  async getPaymentCollection(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      paymentMode,
      search,
      branchId: filterBranchId,
      limit = 50,
      offset = 0,
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      shop_id: shopId,
      ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
      status: "COMPLETED",
      ...(paymentMode && { payment_mode: paymentMode }),
      ...(customerId && { customer_id: customerId }),
      ...(startDate && endDate
        ? {
            payment_date: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { reference_number: { contains: search, mode: "insensitive" } },
          {
            invoice: {
              invoice_number: { contains: search, mode: "insensitive" },
            },
          },
          {
            customer: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const [payments, total, modeBreakdown, totals] = await Promise.all([
      prisma.salesPayment.findMany({
        where,
        select: {
          payment_id: true,
          payment_date: true,
          amount: true,
          payment_mode: true,
          reference_number: true,
          status: true,
          remarks: true,
          invoice: {
            select: {
              invoice_id: true,
              invoice_number: true,
              net_amount: true,
            },
          },
          customer: { select: { name: true, phone: true } },
          creator: { select: { full_name: true } },
        },
        orderBy: { payment_date: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.salesPayment.count({ where }),
      prisma.salesPayment.groupBy({
        by: ["payment_mode"],
        where,
        _count: { payment_id: true },
        _sum: { amount: true },
      }),
      prisma.salesPayment.aggregate({
        where,
        _sum: { amount: true },
        _count: { payment_id: true },
      }),
    ]);

    return {
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        invoice_number: p.invoice?.invoice_number || "-",
        invoice_id: p.invoice?.invoice_id || null,
        customer_name: p.customer?.name || "Walk-in",
        customer_phone: p.customer?.phone || "-",
        collected_by: p.creator?.full_name || "-",
      })),
      total,
      summary: {
        total_payments: totals._count.payment_id || 0,
        total_collected: Number(totals._sum.amount || 0),
      },
      mode_breakdown: modeBreakdown.map((m) => ({
        mode: m.payment_mode,
        count: m._count.payment_id,
        amount: Number(m._sum.amount || 0),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A6 — OUTSTANDING & RECEIVABLES
  // ─────────────────────────────────────────────────────────────────
  async getOutstandingReceivables(shopId, branchId, role, branchMode, filters = {}) {
    const {
      customerId,
      agingBucket,
      search,
      branchId: filterBranchId,
      limit = 50,
      offset = 0,
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...branchFilter,
      is_return: false,
      status: "CONFIRMED",
      payment_status: { not: "PAID" },
      balance_amount: { gt: 0 },
      ...(customerId && { customer_id: customerId }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { walkin_name: { contains: search, mode: "insensitive" } },
          {
            customer: { name: { contains: search, mode: "insensitive" } },
          },
        ],
      }),
    };

    const [invoices, total, totalAgg] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        select: {
          invoice_id: true,
          invoice_number: true,
          invoice_date: true,
          due_date: true,
          walkin_name: true,
          net_amount: true,
          paid_amount: true,
          balance_amount: true,
          payment_status: true,
          is_credit_sale: true,
          customer: { select: { name: true, phone: true } },
          branch: { select: { branch_name: true } },
        },
        orderBy: { invoice_date: "asc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.salesInvoice.count({ where }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: { net_amount: true, paid_amount: true, balance_amount: true },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agingBuckets = {
      current: { count: 0, amount: 0 },
      "1_30": { count: 0, amount: 0 },
      "31_60": { count: 0, amount: 0 },
      "61_90": { count: 0, amount: 0 },
      "90_plus": { count: 0, amount: 0 },
    };

    const enriched = invoices.map((inv) => {
      const invDate = new Date(inv.invoice_date);
      const daysOverdue = Math.floor(
        (today - invDate) / (1000 * 60 * 60 * 24),
      );

      let bucket = "current";
      if (daysOverdue <= 0) bucket = "current";
      else if (daysOverdue <= 30) bucket = "1_30";
      else if (daysOverdue <= 60) bucket = "31_60";
      else if (daysOverdue <= 90) bucket = "61_90";
      else bucket = "90_plus";

      const balance = Number(inv.balance_amount);
      agingBuckets[bucket].count += 1;
      agingBuckets[bucket].amount += balance;

      return {
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        customer_name: inv.customer?.name || inv.walkin_name || "Walk-in",
        customer_phone: inv.customer?.phone || "-",
        branch_name: inv.branch?.branch_name || "-",
        net_amount: Number(inv.net_amount),
        paid_amount: Number(inv.paid_amount),
        balance_amount: balance,
        payment_status: inv.payment_status,
        is_credit_sale: inv.is_credit_sale,
        days_overdue: daysOverdue,
        aging_bucket: bucket,
      };
    });

    const filtered = agingBucket
      ? enriched.filter((inv) => inv.aging_bucket === agingBucket)
      : enriched;

    return {
      invoices: filtered,
      total,
      summary: {
        total_invoices: total,
        total_billed: Number(totalAgg._sum.net_amount || 0),
        total_collected: Number(totalAgg._sum.paid_amount || 0),
        total_outstanding: Number(totalAgg._sum.balance_amount || 0),
      },
      aging_buckets: {
        current: {
          label: "Current",
          ...agingBuckets.current,
          amount: Number(agingBuckets.current.amount.toFixed(2)),
        },
        "1_30": {
          label: "1–30 Days",
          ...agingBuckets["1_30"],
          amount: Number(agingBuckets["1_30"].amount.toFixed(2)),
        },
        "31_60": {
          label: "31–60 Days",
          ...agingBuckets["31_60"],
          amount: Number(agingBuckets["31_60"].amount.toFixed(2)),
        },
        "61_90": {
          label: "61–90 Days",
          ...agingBuckets["61_90"],
          amount: Number(agingBuckets["61_90"].amount.toFixed(2)),
        },
        "90_plus": {
          label: "90+ Days",
          ...agingBuckets["90_plus"],
          amount: Number(agingBuckets["90_plus"].amount.toFixed(2)),
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // A7 — DAY BOOK (FIXED: Timezone-Safe Date Matching)
  // ─────────────────────────────────────────────────────────────────
  async getDayBook(shopId, branchId, role, branchMode, filters = {}) {
    const { date, branchId: filterBranchId } = filters;

    if (!date) {
      throw new ApiError("Date is required for Day Book report", 400, "DATE_REQUIRED");
    }

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    // Forces date to evaluate exactly as strict UTC Midnight to prevent local timezone shifts
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const dayFilter = {
      invoice_date: { gte: startOfDay, lte: endOfDay },
    };

    const paymentDayFilter = {
      payment_date: { gte: startOfDay, lte: endOfDay },
    };

    const [
      invoicesAgg,
      cashSalesAgg,
      creditSalesAgg,
      returnsAgg,
      paymentsAgg,
      paymentModeBreakdown,
      invoicesList,
      returnsList,
      paymentsList,
    ] = await Promise.all([
      // All confirmed sales
      prisma.salesInvoice.aggregate({
        where: {
          ...branchFilter,
          is_return: false,
          status: "CONFIRMED",
          ...dayFilter,
        },
        _count: { invoice_id: true },
        _sum: {
          net_amount: true,
          total_discount: true,
          total_tax: true,
          paid_amount: true,
        },
      }),

      // Cash sales (non-credit)
      prisma.salesInvoice.aggregate({
        where: {
          ...branchFilter,
          is_return: false,
          status: "CONFIRMED",
          is_credit_sale: false,
          ...dayFilter,
        },
        _count: { invoice_id: true },
        _sum: { net_amount: true },
      }),

      // Credit sales
      prisma.salesInvoice.aggregate({
        where: {
          ...branchFilter,
          is_return: false,
          status: "CONFIRMED",
          is_credit_sale: true,
          ...dayFilter,
        },
        _count: { invoice_id: true },
        _sum: { net_amount: true },
      }),

      // Returns
      prisma.salesInvoice.aggregate({
        where: {
          ...branchFilter,
          is_return: true,
          status: "CONFIRMED",
          return_approval_status: "APPROVED",
          ...dayFilter,
        },
        _count: { invoice_id: true },
        _sum: { net_amount: true },
      }),

      // Payments received
      prisma.salesPayment.aggregate({
        where: {
          shop_id: shopId,
          ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
          status: "COMPLETED",
          ...paymentDayFilter,
        },
        _count: { payment_id: true },
        _sum: { amount: true },
      }),

      // Payment mode breakdown
      prisma.salesPayment.groupBy({
        by: ["payment_mode"],
        where: {
          shop_id: shopId,
          ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
          status: "COMPLETED",
          ...paymentDayFilter,
        },
        _count: { payment_id: true },
        _sum: { amount: true },
      }),

      // Invoice list for the day
      prisma.salesInvoice.findMany({
        where: {
          ...branchFilter,
          is_return: false,
          status: "CONFIRMED",
          ...dayFilter,
        },
        select: {
          invoice_id: true,
          invoice_number: true,
          invoice_date: true,
          net_amount: true,
          payment_status: true,
          is_credit_sale: true,
          walkin_name: true,
          customer: { select: { name: true } },
          creator: { select: { full_name: true } },
          payments: { select: { payment_mode: true, amount: true } },
        },
        orderBy: { created_at: "asc" },
      }),

      // Returns list
      prisma.salesInvoice.findMany({
        where: {
          ...branchFilter,
          is_return: true,
          status: "CONFIRMED",
          ...dayFilter,
        },
        select: {
          invoice_id: true,
          invoice_number: true,
          net_amount: true,
          return_reason: true,
          refund_mode: true,
          walkin_name: true,
          customer: { select: { name: true } },
          parentInvoice: { select: { invoice_number: true } },
        },
        orderBy: { created_at: "asc" },
      }),

      // Payments list
      prisma.salesPayment.findMany({
        where: {
          shop_id: shopId,
          ...(branchFilter.branch_id && { branch_id: branchFilter.branch_id }),
          status: "COMPLETED",
          ...paymentDayFilter,
        },
        select: {
          payment_id: true,
          payment_date: true,
          amount: true,
          payment_mode: true,
          reference_number: true,
          invoice: { select: { invoice_number: true } },
          customer: { select: { name: true } },
        },
        orderBy: { created_at: "asc" },
      }),
    ]);

    const grossSales = Number(invoicesAgg._sum.net_amount || 0);
    const returnsTotal = Number(returnsAgg._sum.net_amount || 0);
    const netCashCollected = Number(paymentsAgg._sum.amount || 0);

    return {
      date,
      summary: {
        total_invoices: invoicesAgg._count.invoice_id || 0,
        gross_sales: grossSales,
        total_discount: Number(invoicesAgg._sum.total_discount || 0),
        total_tax: Number(invoicesAgg._sum.total_tax || 0),
        cash_sales_count: cashSalesAgg._count.invoice_id || 0,
        cash_sales_amount: Number(cashSalesAgg._sum.net_amount || 0),
        credit_sales_count: creditSalesAgg._count.invoice_id || 0,
        credit_sales_amount: Number(creditSalesAgg._sum.net_amount || 0),
        returns_count: returnsAgg._count.invoice_id || 0,
        returns_amount: returnsTotal,
        net_sales: grossSales - returnsTotal,
        payments_received_count: paymentsAgg._count.payment_id || 0,
        net_cash_collected: netCashCollected,
      },
      payment_mode_breakdown: paymentModeBreakdown.map((m) => ({
        mode: m.payment_mode,
        count: m._count.payment_id,
        amount: Number(m._sum.amount || 0),
      })),
      invoices: invoicesList.map((inv) => ({
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer?.name || inv.walkin_name || "Walk-in",
        net_amount: Number(inv.net_amount),
        payment_status: inv.payment_status,
        is_credit_sale: inv.is_credit_sale,
        billed_by: inv.creator?.full_name || "-",
        payment_modes: [
          ...new Set(inv.payments.map((p) => p.payment_mode)),
        ].join(", "),
      })),
      returns: returnsList.map((r) => ({
        invoice_id: r.invoice_id,
        invoice_number: r.invoice_number,
        parent_invoice_number: r.parentInvoice?.invoice_number || "-",
        customer_name: r.customer?.name || r.walkin_name || "Walk-in",
        net_amount: Number(r.net_amount),
        return_reason: r.return_reason,
        refund_mode: r.refund_mode,
      })),
      payments: paymentsList.map((p) => ({
        payment_id: p.payment_id,
        invoice_number: p.invoice?.invoice_number || "-",
        customer_name: p.customer?.name || "Walk-in",
        amount: Number(p.amount),
        payment_mode: p.payment_mode,
        reference_number: p.reference_number,
      })),
    };
  }
}

export default new SalesReportService();