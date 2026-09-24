// backend/src/modules/reports/purchase/purchase.report.service.js (do not remove this comment)
// backend/src/modules/reports/purchase/purchase.report.service.js

import prisma from "../../../config/prisma.js";
import { buildBranchFilter } from "../../sales/sales.helpers.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "REPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class PurchaseReportService {
  // ─────────────────────────────────────────────────────────────────
  // HELPER: build date filter
  // ─────────────────────────────────────────────────────────────────
  _dateFilter(startDate, endDate) {
    if (!startDate || !endDate) return {};
    return {
      invoice_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // B1 — PURCHASE REGISTER
  // ─────────────────────────────────────────────────────────────────
  async getPurchaseRegister(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      supplierId,
      paymentStatus,
      search,
      branchId: filterBranchId,
      limit = 50,
      offset = 0,
    } = filters;

    // Priority: dropdown branchId over header branchId
    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...branchFilter,
      is_return: false,
      status: "CONFIRMED",
      ...this._dateFilter(startDate, endDate),
      ...(supplierId && { supplier_id: supplierId }),
      ...(paymentStatus && { payment_status: paymentStatus }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { supplier_invoice_no: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
          { supplier: { office_phone: { contains: search, mode: "insensitive" } } },
          { supplier: { personal_phone: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        select: {
          invoice_id: true,
          invoice_number: true,
          supplier_invoice_no: true,
          invoice_date: true,
          supplier_id: true,
          status: true,
          payment_status: true,
          subtotal: true,
          discount_amount: true,
          cgst_amount: true,
          sgst_amount: true,
          total_tax: true,
          net_amount: true,
          paid_amount: true,
          balance_amount: true,
          supplier: {
            select: {
              name: true,
              office_phone: true,
              personal_phone: true,
              gst_number: true,
            },
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
        orderBy: [
          { invoice_date: "desc" },
          { invoice_number: "desc" },
        ],
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.purchaseInvoice.count({ where }),
    ]);

    const totals = await prisma.purchaseInvoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        discount_amount: true,
        cgst_amount: true,
        sgst_amount: true,
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
        total_discount: Number(inv.discount_amount),
        cgst_amount: Number(inv.cgst_amount),
        sgst_amount: Number(inv.sgst_amount),
        total_tax: Number(inv.total_tax),
        net_amount: Number(inv.net_amount),
        paid_amount: Number(inv.paid_amount),
        balance_amount: Number(inv.balance_amount),
        supplier_name: inv.supplier?.name || "-",
        supplier_phone: inv.supplier?.office_phone || inv.supplier?.personal_phone || "-",
        supplier_gst: inv.supplier?.gst_number || "-",
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
        total_discount: Number(totals._sum.discount_amount || 0),
        cgst_amount: Number(totals._sum.cgst_amount || 0),
        sgst_amount: Number(totals._sum.sgst_amount || 0),
        total_tax: Number(totals._sum.total_tax || 0),
        net_amount: Number(totals._sum.net_amount || 0),
        paid_amount: Number(totals._sum.paid_amount || 0),
        balance_amount: Number(totals._sum.balance_amount || 0),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // B2 — PURCHASE OUTSTANDING & PAYABLES
  // ─────────────────────────────────────────────────────────────────
  async getPurchaseOutstanding(shopId, branchId, role, branchMode, filters = {}) {
    const {
      supplierId,
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
      ...(supplierId && { supplier_id: supplierId }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { supplier_invoice_no: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [invoices, total, totalAgg] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        select: {
          invoice_id: true,
          invoice_number: true,
          supplier_invoice_no: true,
          invoice_date: true,
          due_date: true,
          net_amount: true,
          paid_amount: true,
          balance_amount: true,
          payment_status: true,
          supplier: {
            select: {
              name: true,
              office_phone: true,
              personal_phone: true,
            },
          },
          branch: { select: { branch_name: true } },
        },
        orderBy: [
          { invoice_date: "asc" },
          { invoice_number: "asc" },
        ],
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.purchaseInvoice.count({ where }),
      prisma.purchaseInvoice.aggregate({
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
        supplier_invoice_no: inv.supplier_invoice_no || "-",
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        supplier_name: inv.supplier?.name || "-",
        supplier_phone: inv.supplier?.office_phone || inv.supplier?.personal_phone || "-",
        branch_name: inv.branch?.branch_name || "-",
        net_amount: Number(inv.net_amount),
        paid_amount: Number(inv.paid_amount),
        balance_amount: balance,
        payment_status: inv.payment_status,
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
        total_paid: Number(totalAgg._sum.paid_amount || 0),
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
  // B3 — PURCHASE RETURNS REPORT
  // ─────────────────────────────────────────────────────────────────
  async getPurchaseReturnsReport(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      supplierId,
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
      ...(supplierId && { supplier_id: supplierId }),
      ...(returnReason && { return_reason: returnReason }),
      ...(approvalStatus && { return_approval_status: approvalStatus }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
          {
            parentInvoice: {
              invoice_number: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const [returns, total, totals] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        select: {
          invoice_id: true,
          invoice_number: true,
          invoice_date: true,
          return_reason: true,
          return_approval_status: true,
          adjustment_type: true,
          refund_amount: true,
          credit_note_number: true,
          net_amount: true,
          status: true,
          supplier: {
            select: {
              name: true,
              office_phone: true,
              personal_phone: true,
            },
          },
          parentInvoice: {
            select: { invoice_id: true, invoice_number: true },
          },
          approver: { select: { full_name: true } },
          creator: { select: { full_name: true } },
          branch: { select: { branch_name: true } },
        },
        orderBy: [
          { invoice_date: "desc" },
          { invoice_number: "desc" },
        ],
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.purchaseInvoice.count({ where }),
      prisma.purchaseInvoice.aggregate({
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
        supplier_name: r.supplier?.name || "-",
        supplier_phone: r.supplier?.office_phone || r.supplier?.personal_phone || "-",
        parent_invoice_number: r.parentInvoice?.invoice_number || "-",
        credit_note_number: r.credit_note_number || "-",
        approved_by: r.approver?.full_name || "-",
        created_by: r.creator?.full_name || "-",
        branch_name: r.branch?.branch_name || "-",
        refund_mode: r.adjustment_type || "-",
      })),
      total,
      summary: {
        total_returns: totals._count.invoice_id || 0,
        total_return_value: Number(totals._sum.net_amount || 0),
        total_refunded: Number(totals._sum.refund_amount || 0),
      },
    };
  }
}

export default new PurchaseReportService();