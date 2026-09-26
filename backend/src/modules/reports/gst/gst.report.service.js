// backend/src/modules/reports/gst/gst.report.service.js (do not remove this comment)
// backend/src/modules/reports/gst/gst.report.service.js

import prisma from "../../../config/prisma.js";
import { buildBranchFilter } from "../../sales/sales.helpers.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "REPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class GstReportService {
  // ─────────────────────────────────────────────────────────────────
  // HELPER: Resolve Start/End dates from Month or Quarter strings
  // ─────────────────────────────────────────────────────────────────
  _resolveDates(month, quarter) {
    let startDate = null;
    let endDate = null;

    if (month) {
      // Input shape: "YYYY-MM" (e.g. "2026-08")
      const [year, m] = month.split("-");
      startDate = new Date(Date.UTC(parseInt(year), parseInt(m) - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(parseInt(year), parseInt(m), 0, 23, 59, 59, 999));
    } else if (quarter) {
      // Input shape: "YYYY-Q1", "YYYY-Q2", etc.
      const [year, q] = quarter.split("-Q");
      const qNum = parseInt(q);
      const startMonth = (qNum - 1) * 3;
      startDate = new Date(Date.UTC(parseInt(year), startMonth, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(parseInt(year), startMonth + 3, 0, 23, 59, 59, 999));
    } else {
      // Default to current month
      const today = new Date();
      startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));
    }

    return { startDate, endDate };
  }

  // ─────────────────────────────────────────────────────────────────
  // D1 — GSTR-1 REPORT
  // ─────────────────────────────────────────────────────────────────
  async getGstr1Report(shopId, branchId, role, branchMode, filters = {}) {
    const { month, quarter, branchId: filterBranchId } = filters;
    const { startDate, endDate } = this._resolveDates(month, quarter);

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const baseWhere = {
      ...branchFilter,
      is_return: false,
      status: "CONFIRMED",
      invoice_date: { gte: startDate, lte: endDate },
    };

    // Load matching invoices with customer and lines details
    const invoices = await prisma.salesInvoice.findMany({
      where: baseWhere,
      include: {
        customer: {
          select: {
            name: true,
            gst_number: true,
          },
        },
        lineItems: {
          include: {
            medicine: { select: { hsn_code: true, unit_of_measure: true } },
          },
        },
      },
      orderBy: { invoice_number: "asc" },
    });

    const b2b = [];
    const b2c = [];
    const hsnSummaryMap = new Map();

    invoices.forEach((inv) => {
      const isB2B = inv.customer && inv.customer.gst_number && inv.customer.gst_number.trim().length > 0;

      const record = {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_name: inv.customer?.name || inv.walkin_name || "Consumer",
        customer_gstin: isB2B ? inv.customer.gst_number : "-",
        taxable_amount: Number(inv.taxable_amount),
        cgst_amount: Number(inv.cgst_amount),
        sgst_amount: Number(inv.sgst_amount),
        total_tax: Number(inv.total_tax),
        net_amount: Number(inv.net_amount),
      };

      if (isB2B) {
        b2b.push(record);
      } else {
        b2c.push(record);
      }

      // Aggregate HSN summary
      inv.lineItems.forEach((item) => {
        const hsn = item.medicine?.hsn_code || "UNKNOWN";
        const qty = Number(item.quantity);
        const taxable = Number(item.taxable_amount);
        const cgst = Number(item.cgst_amount);
        const sgst = Number(item.sgst_amount);
        const totalTax = cgst + sgst;
        const uom = item.unit_of_measure || item.medicine?.unit_of_measure || "UNIT";

        if (!hsnSummaryMap.has(hsn)) {
          hsnSummaryMap.set(hsn, {
            hsn_code: hsn,
            unit_of_measure: uom,
            total_quantity: 0,
            taxable_value: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            total_tax: 0,
          });
        }

        const hsnRow = hsnSummaryMap.get(hsn);
        hsnRow.total_quantity += qty;
        hsnRow.taxable_value += taxable;
        hsnRow.cgst_amount += cgst;
        hsnRow.sgst_amount += sgst;
        hsnRow.total_tax += totalTax;
      });
    });

    const hsnSummary = Array.from(hsnSummaryMap.values()).map((row) => ({
      ...row,
      taxable_value: Number(row.taxable_value.toFixed(2)),
      cgst_amount: Number(row.cgst_amount.toFixed(2)),
      sgst_amount: Number(row.sgst_amount.toFixed(2)),
      total_tax: Number(row.total_tax.toFixed(2)),
    }));

    return {
      period: { startDate, endDate },
      b2b,
      b2c,
      hsnSummary,
      summary: {
        b2b_count: b2b.length,
        b2b_taxable: b2b.reduce((a, b) => a + b.taxable_amount, 0),
        b2c_count: b2c.length,
        b2c_taxable: b2c.reduce((a, b) => a + b.taxable_amount, 0),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // D2 — GSTR-2 REPORT
  // ─────────────────────────────────────────────────────────────────
  async getGstr2Report(shopId, branchId, role, branchMode, filters = {}) {
    const { month, quarter, supplierId, branchId: filterBranchId, limit = 50, offset = 0 } = filters;
    const { startDate, endDate } = this._resolveDates(month, quarter);

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...branchFilter,
      is_return: false,
      status: "CONFIRMED",
      invoice_date: { gte: startDate, lte: endDate },
      ...(supplierId && { supplier_id: supplierId }),
    };

    const [purchases, total] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        include: {
          supplier: { select: { name: true, gst_number: true } },
        },
        orderBy: { invoice_date: "asc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.purchaseInvoice.count({ where }),
    ]);

    const records = purchases.map((inv) => {
      const cgst = Number(inv.cgst_amount);
      const sgst = Number(inv.sgst_amount);
      const igst = Number(inv.igst_amount || 0);
      const totalItc = cgst + sgst + igst;

      return {
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        supplier_invoice_no: inv.supplier_invoice_no || "-",
        invoice_date: inv.invoice_date,
        supplier_name: inv.supplier?.name || "-",
        supplier_gstin: inv.supplier?.gst_number || "URP (Unregistered)",
        taxable_amount: Number(inv.taxable_amount),
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_itc_eligible: totalItc,
        net_amount: Number(inv.net_amount),
      };
    });

    const aggregate = await prisma.purchaseInvoice.aggregate({
      where,
      _sum: {
        taxable_amount: true,
        cgst_amount: true,
        sgst_amount: true,
        igst_amount: true,
        net_amount: true,
      },
    });

    const sumCgst = Number(aggregate._sum.cgst_amount || 0);
    const sumSgst = Number(aggregate._sum.sgst_amount || 0);
    const sumIgst = Number(aggregate._sum.igst_amount || 0);

    return {
      period: { startDate, endDate },
      records,
      total,
      summary: {
        total_invoices: total,
        total_taxable: Number(aggregate._sum.taxable_amount || 0),
        total_itc_eligible: sumCgst + sumSgst + sumIgst,
        net_purchase_amount: Number(aggregate._sum.net_amount || 0),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // D3 — GSTR-3B MONTHLY SUMMARY
  // ─────────────────────────────────────────────────────────────────
  async getGstr3bSummary(shopId, branchId, role, branchMode, filters = {}) {
    const { month, branchId: filterBranchId } = filters;
    const { startDate, endDate } = this._resolveDates(month, null);

    const queryBranchId = filterBranchId || branchId;
    const branchFilter = buildBranchFilter(shopId, queryBranchId, role, branchMode);

    // 1. Output tax liability from confirmed sales
    const salesAgg = await prisma.salesInvoice.aggregate({
      where: {
        ...branchFilter,
        is_return: false,
        status: "CONFIRMED",
        invoice_date: { gte: startDate, lte: endDate },
      },
      _sum: {
        taxable_amount: true,
        cgst_amount: true,
        sgst_amount: true,
        total_tax: true,
      },
    });

    // 2. Input tax credit from confirmed purchases
    const purchaseAgg = await prisma.purchaseInvoice.aggregate({
      where: {
        ...branchFilter,
        is_return: false,
        status: "CONFIRMED",
        invoice_date: { gte: startDate, lte: endDate },
      },
      _sum: {
        taxable_amount: true,
        cgst_amount: true,
        sgst_amount: true,
        igst_amount: true,
        total_tax: true,
      },
    });

    const outputCgst = Number(salesAgg._sum.cgst_amount || 0);
    const outputSgst = Number(salesAgg._sum.sgst_amount || 0);
    const outputTotal = outputCgst + outputSgst;

    const inputCgst = Number(purchaseAgg._sum.cgst_amount || 0);
    const inputSgst = Number(purchaseAgg._sum.sgst_amount || 0);
    const inputIgst = Number(purchaseAgg._sum.igst_amount || 0);
    const inputTotal = inputCgst + inputSgst + inputIgst;

    const netCgstPayable = Math.max(0, outputCgst - inputCgst);
    const netSgstPayable = Math.max(0, outputSgst - inputSgst);

    return {
      period: { startDate, endDate, monthLabel: month },
      outward_supplies: {
        taxable_value: Number(salesAgg._sum.taxable_amount || 0),
        cgst: outputCgst,
        sgst: outputSgst,
        total_tax: outputTotal,
      },
      inward_supplies_itc: {
        taxable_value: Number(purchaseAgg._sum.taxable_amount || 0),
        cgst: inputCgst,
        sgst: inputSgst,
        igst: inputIgst,
        total_itc_available: inputTotal,
      },
      net_tax_payable: {
        cgst: netCgstPayable,
        sgst: netSgstPayable,
        total_payable: netCgstPayable + netSgstPayable,
      },
    };
  }
}

export default new GstReportService();