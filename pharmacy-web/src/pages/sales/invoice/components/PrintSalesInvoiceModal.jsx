// pharmacy-web/src/pages/sales/invoice/components/PrintSalesInvoiceModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/PrintSalesInvoiceModal.jsx
//  Sales Invoice Print Modal with Preview + Options tabs
//  Customizable print options for all sections

import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Printer,
  Loader2,
  FileText,
  Download,
  Eye,
  Settings,
  Check,
  RotateCcw,
  Building2,
  Phone,
  MapPin,
  Layers,
  Receipt,
  FileSignature,
  Gift,
  User,
  CreditCard,
  Package,
} from "lucide-react";
import { useShopInfo } from "../../../../hooks/useShopInfo";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_PRINT_OPTIONS = {
  // Header section
  showCompanyName: true,
  showBranchName: true,
  showCompanyAddress: true,
  showCompanyPhone: true,
  showCompanyGSTIN: true,

  // Invoice details section
  showInvoiceDetails: true,
  showCustomerDetails: true,
  showDueDate: false,
  showPaymentMode: true,
  showPaymentStatus: true,

  // Table columns
  showHSN: true,
  showBatch: true,
  showExpiry: true,
  showPack: false,
  showMRP: true,
  showDiscount: true,
  showTaxable: true,
  showCGST: true,
  showSGST: true,
  showManufacturer: false,

  // Summary section
  showAmountInWords: true,
  showSubtotal: true,
  showGSTBreakdown: true,
  showDiscountTotal: true,
  showPaidAmount: true,
  showBalanceAmount: true,

  // Footer section
  showRemarks: true,
  showSignatures: true,
  showTerms: true,
  showPrintTimestamp: true,

  // Styling
  showItemSummary: true,
  compactMode: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Number to Words (Indian Numbering System)
// ═══════════════════════════════════════════════════════════════════════════

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertChunk(n) {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100)
    return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return (
    ONES[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 ? " and " + convertChunk(n % 100) : "")
  );
}

function numberToWords(amount) {
  if (!amount || isNaN(amount)) return "Zero Rupees Only";
  const num = Math.abs(parseFloat(amount));
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let words = "";
  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;

    if (crore) words += convertChunk(crore) + " Crore ";
    if (lakh) words += convertChunk(lakh) + " Lakh ";
    if (thousand) words += convertChunk(thousand) + " Thousand ";
    if (remainder) words += convertChunk(remainder);
    words = words.trim() + " Rupees";
  }

  if (paise > 0) {
    words += (rupees > 0 ? " and " : "") + convertChunk(paise) + " Paise";
  }

  return words.trim() + " Only";
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Date & Address Formatters
// ═══════════════════════════════════════════════════════════════════════════

function formatPrintDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatExpiry(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { month: "2-digit", year: "2-digit" });
}

function buildAddress(entity) {
  if (!entity) return "";
  return [
    entity.address_line_1,
    entity.address_line_2,
    entity.city,
    entity.state,
    entity.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Compute Item Amounts for Sales
// ═══════════════════════════════════════════════════════════════════════════

function computeSalesItemAmounts(item) {
  const qty = parseFloat(item.quantity) || 0;
  const sellingRate =
    parseFloat(item.selling_rate) || parseFloat(item.unit_price) || 0;
  const mrp = parseFloat(item.mrp) || 0;
  const discountPercent = parseFloat(item.discount_percent) || 0;
  const cgstP = parseFloat(item.cgst_percent) || 0;
  const sgstP = parseFloat(item.sgst_percent) || 0;

  const gross = qty * sellingRate;
  const discountAmount = gross * (discountPercent / 100);
  const taxable = parseFloat(item.taxable_amount) ?? gross - discountAmount;
  const cgstAmt = parseFloat(item.cgst_amount) ?? taxable * (cgstP / 100);
  const sgstAmt = parseFloat(item.sgst_amount) ?? taxable * (sgstP / 100);
  const total = parseFloat(item.line_total) ?? taxable + cgstAmt + sgstAmt;

  return {
    qty,
    rate: sellingRate,
    mrp,
    discountPercent,
    discountAmount,
    cgstP,
    sgstP,
    taxable,
    cgstAmt,
    sgstAmt,
    total,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE PRINT HTML FOR SALES INVOICE
// ═══════════════════════════════════════════════════════════════════════════

function generateSalesPrintHTML(invoice, company, totals, options) {
  const shopName = company?.businessName || "Your Business";
  const shopLegal = company?.legalName || "";
  const shopGSTIN = company?.gstin || "";
  const shopPhone = company?.phone || "";
  const shopEmail = company?.email || "";

  const branch = invoice?.branch;
  const branchName = branch?.branch_name || company?.branchName || "";
  const branchAddr = buildAddress(branch) || company?.address || "";
  const branchPhone = branch?.contact_number || "";

  const customer = invoice?.customer;
  const lineItems = invoice?.lineItems || [];
  const netAmount = parseFloat(invoice?.net_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const balance = netAmount - paidAmount;

  const statusClass =
    invoice?.status === "CONFIRMED"
      ? "confirmed"
      : invoice?.status === "CANCELLED"
        ? "cancelled"
        : invoice?.status === "PARKED"
          ? "parked"
          : "draft";

  const paymentStatusClass =
    invoice?.payment_status === "PAID"
      ? "paid"
      : invoice?.payment_status === "PARTIALLY_PAID"
        ? "partial"
        : "unpaid";

  // Build dynamic table headers
  const headers = [];
  headers.push('<th style="width:25px">#</th>');
  headers.push('<th style="text-align:left;min-width:160px">Product</th>');
  if (options.showHSN) headers.push('<th style="width:60px">HSN</th>');
  if (options.showBatch) headers.push('<th style="width:70px">Batch</th>');
  if (options.showExpiry) headers.push('<th style="width:50px">Exp</th>');
  if (options.showPack) headers.push('<th style="width:40px">Pack</th>');
  headers.push('<th style="width:35px">Qty</th>');
  if (options.showMRP) headers.push('<th style="width:60px">MRP</th>');
  headers.push('<th style="width:60px">Rate</th>');
  if (options.showDiscount) headers.push('<th style="width:45px">Disc%</th>');
  if (options.showTaxable) headers.push('<th style="width:70px">Taxable</th>');
  if (options.showCGST) headers.push('<th style="width:60px">CGST</th>');
  if (options.showSGST) headers.push('<th style="width:60px">SGST</th>');
  headers.push('<th style="width:75px">Amount</th>');

  // Build rows
  const rows = lineItems
    .map((item, i) => {
      const a = computeSalesItemAmounts(item);

      const cells = [];
      cells.push(`<td class="c">${i + 1}</td>`);
      cells.push(
        `<td class="l"><strong>${item.medicine?.name || item.product_name || "—"}</strong>${options.showManufacturer && item.medicine?.manufacturer ? `<br/><span class="mfr">${item.medicine.manufacturer}</span>` : ""}</td>`,
      );
      if (options.showHSN)
        cells.push(
          `<td class="c sm">${item.medicine?.hsn_code || item.hsn_code || "—"}</td>`,
        );
      if (options.showBatch)
        cells.push(`<td class="c">${item.batch_number || "—"}</td>`);
      if (options.showExpiry)
        cells.push(`<td class="c">${formatExpiry(item.expiry_date)}</td>`);
      if (options.showPack)
        cells.push(
          `<td class="c">${item.medicine?.pack_size || item.pack_size || "—"}</td>`,
        );
      cells.push(`<td class="c b">${a.qty}</td>`);
      if (options.showMRP) cells.push(`<td class="r">${a.mrp.toFixed(2)}</td>`);
      cells.push(`<td class="r">${a.rate.toFixed(2)}</td>`);
      if (options.showDiscount)
        cells.push(
          `<td class="c">${a.discountPercent > 0 ? a.discountPercent.toFixed(1) + "%" : "—"}</td>`,
        );
      if (options.showTaxable)
        cells.push(`<td class="r">${a.taxable.toFixed(2)}</td>`);
      if (options.showCGST)
        cells.push(
          `<td class="c sm">${a.cgstP}%<br/>₹${a.cgstAmt.toFixed(2)}</td>`,
        );
      if (options.showSGST)
        cells.push(
          `<td class="c sm">${a.sgstP}%<br/>₹${a.sgstAmt.toFixed(2)}</td>`,
        );
      cells.push(`<td class="r b">₹${a.total.toFixed(2)}</td>`);

      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Sales Invoice ${invoice?.invoice_number || ""}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 ${options.compactMode ? "portrait" : "landscape"};margin:8mm}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#1a1a2e;line-height:1.35;background:#fff}
.wrap{max-width:100%;padding:0}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #000060;padding-bottom:10px;margin-bottom:10px}
.co{flex:1}
.co-name{font-size:22px;font-weight:800;color:#000060;letter-spacing:-.5px}
.co-legal{font-size:10px;color:#666;margin-top:1px}
.co-branch{font-size:11px;color:#000060;font-weight:700;margin-top:3px}
.co-addr,.co-contact{font-size:10px;color:#444;margin-top:2px;max-width:380px}
.co-gst{font-size:10px;font-weight:700;color:#000060;margin-top:3px}
.inv-rt{text-align:right}
.inv-title{font-size:16px;font-weight:800;color:#000060;text-transform:uppercase;letter-spacing:2px}
.inv-no{font-size:13px;font-weight:700;color:#333;margin-top:3px;font-family:'Courier New',monospace}
.badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:5px;margin-right:5px}
.confirmed{background:#dcfce7;color:#166534;border:1px solid #86efac}
.draft{background:#fef9c3;color:#854d0e;border:1px solid #fde047}
.parked{background:#dbeafe;color:#1e40af;border:1px solid #93c5fd}
.cancelled{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}
.paid{background:#dcfce7;color:#166534;border:1px solid #86efac}
.partial{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}
.unpaid{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.dbox{border:1px solid #e5e7eb;border-radius:5px;padding:8px 12px;background:#fafafa}
.dbox-t{font-size:9px;font-weight:700;color:#000060;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #e5e7eb}
.dr{display:flex;justify-content:space-between;padding:1.5px 0}
.dl{font-size:10px;color:#666}
.dv{font-size:10px;font-weight:600;color:#1a1a2e}
table.items{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10px}
table.items thead th{background:#000060;color:#fff;padding:5px 3px;text-align:center;font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}
table.items tbody td{padding:4px 3px;border-bottom:1px solid #e5e7eb;vertical-align:top}
table.items tbody tr:nth-child(even){background:#f9fafb}
.c{text-align:center}.l{text-align:left}.r{text-align:right}.b{font-weight:700}
.sm{font-size:9px}
.mfr{font-size:9px;color:#666}
.summ{display:flex;justify-content:space-between;gap:16px;margin-bottom:10px}
.words-box{flex:1;padding:8px 12px;background:#f0f4ff;border:1px solid #c7d2fe;border-radius:5px}
.words-lbl{font-size:9px;font-weight:700;color:#000060;text-transform:uppercase;letter-spacing:1px}
.words-txt{font-size:11px;font-weight:600;color:#1a1a2e;margin-top:3px;font-style:italic}
table.tots{width:260px;border-collapse:collapse}
table.tots td{padding:3px 6px;font-size:10px}
table.tots .tl{text-align:right;color:#666;font-weight:500}
table.tots .tv{text-align:right;font-weight:600;color:#1a1a2e;min-width:90px}
table.tots .grand td{border-top:2px solid #000060;padding-top:5px;font-size:12px;font-weight:800;color:#000060}
table.tots .bal td{color:${balance > 0 ? "#dc2626" : "#059669"}}
.rem{padding:6px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:5px;margin-bottom:10px}
.rem-lbl{font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase}
.rem-txt{font-size:10px;color:#78350f;margin-top:2px}
.ftr{display:flex;justify-content:space-between;margin-top:28px;padding-top:10px;border-top:1px solid #e5e7eb}
.sig{text-align:center;min-width:160px}
.sig-line{border-top:1px solid #333;margin-top:50px;padding-top:4px}
.sig-lbl{font-size:10px;color:#666;font-weight:600}
.pnote{text-align:center;font-size:8px;color:#aaa;margin-top:12px;padding-top:6px;border-top:1px dashed #ddd}
.item-summary{font-size:10px;color:#666;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:#f8fafc;border-radius:4px}
.terms{padding:6px 12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:5px;margin-bottom:10px;font-size:9px;color:#666}
.cust-card{background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.cust-name{font-size:13px;font-weight:700;color:#1e293b}
.cust-detail{font-size:10px;color:#64748b;margin-top:2px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}
</style>
</head>
<body>
<div class="wrap">
  <!-- HEADER -->
  <div class="hdr">
    <div class="co">
      ${options.showCompanyName ? `<div class="co-name">${shopName}</div>` : ""}
      ${options.showCompanyName && shopLegal && shopLegal !== shopName ? `<div class="co-legal">${shopLegal}</div>` : ""}
      ${options.showBranchName && branchName ? `<div class="co-branch">Branch: ${branchName}</div>` : ""}
      ${options.showCompanyAddress ? `<div class="co-addr">${branchAddr}</div>` : ""}
      ${options.showCompanyPhone ? `<div class="co-contact">${[branchPhone || shopPhone ? "Ph: " + (branchPhone || shopPhone) : "", shopEmail ? "Email: " + shopEmail : ""].filter(Boolean).join("  |  ")}</div>` : ""}
      ${options.showCompanyGSTIN && shopGSTIN ? `<div class="co-gst">GSTIN: ${shopGSTIN}</div>` : ""}
    </div>
    <div class="inv-rt">
      <div class="inv-title">Sales Invoice</div>
      <div class="inv-no">${invoice?.invoice_number || "—"}</div>
      <div>
        <span class="badge ${statusClass}">${invoice?.status || "DRAFT"}</span>
        ${options.showPaymentStatus ? `<span class="badge ${paymentStatusClass}">${invoice?.payment_status || "UNPAID"}</span>` : ""}
      </div>
    </div>
  </div>

  <!-- DETAILS GRID -->
  ${
    options.showInvoiceDetails || options.showCustomerDetails
      ? `
  <div class="dgrid">
    ${
      options.showInvoiceDetails
        ? `
    <div class="dbox">
      <div class="dbox-t">Invoice Details</div>
      <div class="dr"><span class="dl">Invoice Date:</span><span class="dv">${formatPrintDate(invoice?.invoice_date)}</span></div>
      <div class="dr"><span class="dl">Invoice #:</span><span class="dv">${invoice?.invoice_number || "—"}</span></div>
      ${options.showDueDate && invoice?.due_date ? `<div class="dr"><span class="dl">Due Date:</span><span class="dv">${formatPrintDate(invoice?.due_date)}</span></div>` : ""}
      ${options.showPaymentMode ? `<div class="dr"><span class="dl">Payment Mode:</span><span class="dv">${invoice?.payment_mode || "—"}</span></div>` : ""}
    </div>
    `
        : ""
    }
    ${
      options.showCustomerDetails
        ? `
    <div class="dbox">
      <div class="dbox-t">Customer Details</div>
      ${
        customer
          ? `
        <div class="dr"><span class="dl">Name:</span><span class="dv">${customer.name || "—"}</span></div>
        ${customer.phone ? `<div class="dr"><span class="dl">Phone:</span><span class="dv">${customer.phone}</span></div>` : ""}
        ${customer.email ? `<div class="dr"><span class="dl">Email:</span><span class="dv">${customer.email}</span></div>` : ""}
        ${customer.gstin ? `<div class="dr"><span class="dl">GSTIN:</span><span class="dv">${customer.gstin}</span></div>` : ""}
        ${customer.address ? `<div class="dr"><span class="dl">Address:</span><span class="dv">${customer.address}</span></div>` : ""}
      `
          : `
        <div class="dr"><span class="dl">Name:</span><span class="dv">${invoice?.customer_name || "Walk-in Customer"}</span></div>
      `
      }
    </div>
    `
        : ""
    }
  </div>
  `
      : ""
  }

  <!-- ITEM SUMMARY -->
  ${
    options.showItemSummary
      ? `
  <div class="item-summary">
    <span>Total Items: <strong>${lineItems.length}</strong></span>
    <span>Total Quantity: <strong>${lineItems.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0)}</strong></span>
  </div>
  `
      : ""
  }

  <!-- ITEMS TABLE -->
  <table class="items">
    <thead><tr>${headers.join("")}</tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summ">
    ${
      options.showAmountInWords
        ? `
    <div class="words-box">
      <div class="words-lbl">Amount in Words</div>
      <div class="words-txt">${numberToWords(netAmount)}</div>
    </div>
    `
        : '<div style="flex:1"></div>'
    }
    <table class="tots">
      ${options.showSubtotal ? `<tr><td class="tl">Subtotal:</td><td class="tv">₹${totals.subtotal.toFixed(2)}</td></tr>` : ""}
      ${options.showDiscountTotal && totals.discount > 0 ? `<tr><td class="tl">Discount:</td><td class="tv" style="color:#059669">- ₹${totals.discount.toFixed(2)}</td></tr>` : ""}
      ${
        options.showGSTBreakdown
          ? `
        <tr><td class="tl">CGST:</td><td class="tv">₹${totals.cgst.toFixed(2)}</td></tr>
        <tr><td class="tl">SGST:</td><td class="tv">₹${totals.sgst.toFixed(2)}</td></tr>
      `
          : ""
      }
      ${totals.roundOff !== 0 ? `<tr><td class="tl">Round Off:</td><td class="tv">₹${totals.roundOff.toFixed(2)}</td></tr>` : ""}
      <tr class="grand"><td class="tl">Net Amount:</td><td class="tv">₹${netAmount.toFixed(2)}</td></tr>
      ${options.showPaidAmount && paidAmount > 0 ? `<tr><td class="tl">Paid:</td><td class="tv" style="color:#059669">₹${paidAmount.toFixed(2)}</td></tr>` : ""}
      ${options.showBalanceAmount && balance > 0 ? `<tr class="bal"><td class="tl">Balance Due:</td><td class="tv">₹${balance.toFixed(2)}</td></tr>` : ""}
    </table>
  </div>

  ${options.showRemarks && invoice?.remarks ? `<div class="rem"><div class="rem-lbl">Remarks</div><div class="rem-txt">${invoice.remarks}</div></div>` : ""}

  ${
    options.showTerms
      ? `
  <div class="terms">
    <strong>Terms & Conditions:</strong> 1. Goods once sold will not be taken back. 2. Subject to local jurisdiction. 3. E&OE (Errors & Omissions Excepted). 4. Please check the goods before leaving the counter.
  </div>
  `
      : ""
  }

  ${
    options.showSignatures
      ? `
  <div class="ftr">
    <div class="sig"><div class="sig-line"><div class="sig-lbl">Customer Signature</div></div></div>
    <div class="sig"><div class="sig-line"><div class="sig-lbl">For ${shopName}</div></div></div>
  </div>
  `
      : ""
  }

  ${
    options.showPrintTimestamp
      ? `
  <div class="pnote">Computer-generated invoice &bull; Printed on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
  `
      : ""
  }
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}};</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIONS TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const OptionGroup = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-2">
      <Icon size={14} className="text-[#000060]" />
      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
        {title}
      </span>
    </div>
    <div className="p-3 space-y-1">{children}</div>
  </div>
);

const OptionToggle = ({ label, checked, onChange, description }) => (
  <button
    type="button"
    onClick={onChange}
    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group text-left"
  >
    <div
      className={`w-9 h-5 rounded-full relative transition-all duration-200 shrink-0 ${
        checked ? "bg-[#000060]" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all duration-200 shadow-sm ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </div>
    <div className="flex-1 min-w-0">
      <span
        className={`text-sm font-medium transition-colors ${checked ? "text-gray-900" : "text-gray-600"}`}
      >
        {label}
      </span>
      {description && (
        <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    {checked && <Check size={14} className="text-[#000060] shrink-0" />}
  </button>
);

const OptionsTab = ({ options, setOptions, company }) => {
  const handleToggle = useCallback(
    (key) => {
      setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [setOptions],
  );

  const resetToDefaults = useCallback(() => {
    setOptions(DEFAULT_PRINT_OPTIONS);
  }, [setOptions]);

  const selectAll = useCallback(() => {
    const allTrue = {};
    Object.keys(DEFAULT_PRINT_OPTIONS).forEach((key) => {
      allTrue[key] = true;
    });
    setOptions(allTrue);
  }, [setOptions]);

  const selectMinimal = useCallback(() => {
    setOptions({
      ...DEFAULT_PRINT_OPTIONS,
      showHSN: false,
      showManufacturer: false,
      showCGST: false,
      showSGST: false,
      showTaxable: false,
      showDiscount: false,
      showTerms: false,
      showSignatures: false,
      showAmountInWords: false,
      showGSTBreakdown: false,
      showItemSummary: false,
      showCompanyGSTIN: false,
      showDueDate: false,
      showPaymentMode: false,
      showPaymentStatus: false,
      compactMode: true,
    });
  }, [setOptions]);

  const enabledCount = Object.values(options).filter(Boolean).length;
  const totalCount = Object.keys(options).length;

  return (
    <div className="h-full flex flex-col">
      {/* Options Header */}
      <div className="shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Customize Print Layout
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {enabledCount}/{totalCount} options enabled
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={selectAll}
              className="px-2.5 py-1.5 text-[10px] font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors"
            >
              All
            </button>
            <button
              onClick={selectMinimal}
              className="px-2.5 py-1.5 text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Minimal
            </button>
            <button
              onClick={resetToDefaults}
              className="px-2.5 py-1.5 text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Options Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Company Info Card */}
        {company && (
          <div className="bg-gradient-to-br from-[#000060]/5 to-indigo-50 rounded-xl border border-[#000060]/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-[#000060]" />
              <span className="text-xs font-bold text-[#000060] uppercase tracking-wide">
                Shop Info
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-bold text-gray-900">
                {company.businessName}
              </div>
              {company.branchName && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin size={10} className="text-gray-400" />
                  {company.branchName}
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone size={10} className="text-gray-400" />
                  {company.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header Options */}
        <OptionGroup title="Header Section" icon={Building2}>
          <OptionToggle
            label="Company Name"
            checked={options.showCompanyName}
            onChange={() => handleToggle("showCompanyName")}
          />
          <OptionToggle
            label="Branch Name"
            checked={options.showBranchName}
            onChange={() => handleToggle("showBranchName")}
          />
          <OptionToggle
            label="Address"
            checked={options.showCompanyAddress}
            onChange={() => handleToggle("showCompanyAddress")}
          />
          <OptionToggle
            label="Phone/Email"
            checked={options.showCompanyPhone}
            onChange={() => handleToggle("showCompanyPhone")}
          />
          <OptionToggle
            label="GSTIN"
            checked={options.showCompanyGSTIN}
            onChange={() => handleToggle("showCompanyGSTIN")}
          />
        </OptionGroup>

        {/* Details Section */}
        <OptionGroup title="Invoice Details" icon={FileText}>
          <OptionToggle
            label="Invoice Details Box"
            checked={options.showInvoiceDetails}
            onChange={() => handleToggle("showInvoiceDetails")}
          />
          <OptionToggle
            label="Customer Details Box"
            checked={options.showCustomerDetails}
            onChange={() => handleToggle("showCustomerDetails")}
          />
          <OptionToggle
            label="Due Date"
            checked={options.showDueDate}
            onChange={() => handleToggle("showDueDate")}
          />
          <OptionToggle
            label="Payment Mode"
            checked={options.showPaymentMode}
            onChange={() => handleToggle("showPaymentMode")}
          />
          <OptionToggle
            label="Payment Status Badge"
            checked={options.showPaymentStatus}
            onChange={() => handleToggle("showPaymentStatus")}
          />
        </OptionGroup>

        {/* Table Columns */}
        <OptionGroup title="Table Columns" icon={Layers}>
          <OptionToggle
            label="HSN Code"
            checked={options.showHSN}
            onChange={() => handleToggle("showHSN")}
          />
          <OptionToggle
            label="Batch Number"
            checked={options.showBatch}
            onChange={() => handleToggle("showBatch")}
          />
          <OptionToggle
            label="Expiry Date"
            checked={options.showExpiry}
            onChange={() => handleToggle("showExpiry")}
          />
          <OptionToggle
            label="Pack Size"
            checked={options.showPack}
            onChange={() => handleToggle("showPack")}
          />
          <OptionToggle
            label="MRP"
            checked={options.showMRP}
            onChange={() => handleToggle("showMRP")}
          />
          <OptionToggle
            label="Discount %"
            checked={options.showDiscount}
            onChange={() => handleToggle("showDiscount")}
          />
          <OptionToggle
            label="Taxable Amount"
            checked={options.showTaxable}
            onChange={() => handleToggle("showTaxable")}
          />
          <OptionToggle
            label="CGST Column"
            checked={options.showCGST}
            onChange={() => handleToggle("showCGST")}
          />
          <OptionToggle
            label="SGST Column"
            checked={options.showSGST}
            onChange={() => handleToggle("showSGST")}
          />
          <OptionToggle
            label="Manufacturer"
            checked={options.showManufacturer}
            onChange={() => handleToggle("showManufacturer")}
            description="Below product name"
          />
        </OptionGroup>

        {/* Summary Section */}
        <OptionGroup title="Summary Section" icon={Receipt}>
          <OptionToggle
            label="Amount in Words"
            checked={options.showAmountInWords}
            onChange={() => handleToggle("showAmountInWords")}
          />
          <OptionToggle
            label="Subtotal"
            checked={options.showSubtotal}
            onChange={() => handleToggle("showSubtotal")}
          />
          <OptionToggle
            label="Discount Total"
            checked={options.showDiscountTotal}
            onChange={() => handleToggle("showDiscountTotal")}
          />
          <OptionToggle
            label="GST Breakdown"
            checked={options.showGSTBreakdown}
            onChange={() => handleToggle("showGSTBreakdown")}
            description="CGST & SGST totals"
          />
          <OptionToggle
            label="Paid Amount"
            checked={options.showPaidAmount}
            onChange={() => handleToggle("showPaidAmount")}
          />
          <OptionToggle
            label="Balance Amount"
            checked={options.showBalanceAmount}
            onChange={() => handleToggle("showBalanceAmount")}
          />
        </OptionGroup>

        {/* Footer Section */}
        <OptionGroup title="Footer Section" icon={FileSignature}>
          <OptionToggle
            label="Remarks"
            checked={options.showRemarks}
            onChange={() => handleToggle("showRemarks")}
          />
          <OptionToggle
            label="Signature Lines"
            checked={options.showSignatures}
            onChange={() => handleToggle("showSignatures")}
          />
          <OptionToggle
            label="Terms & Conditions"
            checked={options.showTerms}
            onChange={() => handleToggle("showTerms")}
          />
          <OptionToggle
            label="Print Timestamp"
            checked={options.showPrintTimestamp}
            onChange={() => handleToggle("showPrintTimestamp")}
          />
        </OptionGroup>

        {/* Styling Options */}
        <OptionGroup title="Layout" icon={Package}>
          <OptionToggle
            label="Item Summary Bar"
            checked={options.showItemSummary}
            onChange={() => handleToggle("showItemSummary")}
            description="Shows total items & quantity"
          />
          <OptionToggle
            label="Compact Mode"
            checked={options.compactMode}
            onChange={() => handleToggle("compactMode")}
            description="Portrait orientation for fewer items"
          />
        </OptionGroup>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW TAB COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PreviewTab = ({ invoice, company, totals, options, shopLoading }) => {
  const branch = invoice?.branch;
  const customer = invoice?.customer;
  const lineItems = invoice?.lineItems || [];

  const branchName = branch?.branch_name || company?.branchName || "";
  const branchAddr = buildAddress(branch) || company?.address || "";
  const branchPhone = branch?.contact_number || "";
  const shopPhone = company?.phone || "";
  const shopEmail = company?.email || "";

  const netAmount = parseFloat(invoice?.net_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const balance = netAmount - paidAmount;

  const totalQty = lineItems.reduce(
    (s, i) => s + (parseFloat(i.quantity) || 0),
    0,
  );

  const statusStyles = {
    CONFIRMED: "bg-green-100 text-green-700 border-green-300",
    DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-300",
    PARKED: "bg-blue-100 text-blue-700 border-blue-300",
    CANCELLED: "bg-red-100 text-red-700 border-red-300",
  };

  const paymentStatusStyles = {
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-300",
    PARTIALLY_PAID: "bg-amber-100 text-amber-700 border-amber-300",
    UNPAID: "bg-red-100 text-red-700 border-red-300",
  };

  if (shopLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={32} className="text-[#000060] animate-spin" />
        <p className="text-sm text-gray-500">Loading shop & branch details…</p>
      </div>
    );
  }

  // Build visible headers
  const visibleHeaders = [];
  visibleHeaders.push("#");
  visibleHeaders.push("Product");
  if (options.showHSN) visibleHeaders.push("HSN");
  if (options.showBatch) visibleHeaders.push("Batch");
  if (options.showExpiry) visibleHeaders.push("Exp");
  if (options.showPack) visibleHeaders.push("Pack");
  visibleHeaders.push("Qty");
  if (options.showMRP) visibleHeaders.push("MRP");
  visibleHeaders.push("Rate");
  if (options.showDiscount) visibleHeaders.push("Disc%");
  if (options.showTaxable) visibleHeaders.push("Taxable");
  if (options.showCGST) visibleHeaders.push("CGST");
  if (options.showSGST) visibleHeaders.push("SGST");
  visibleHeaders.push("Amount");

  return (
    <div className="text-[11px] leading-snug text-gray-900 select-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b-[3px] border-[#000060] pb-3 mb-3">
        <div className="flex-1">
          {options.showCompanyName && (
            <h1 className="text-[22px] font-extrabold text-[#000060] tracking-tight leading-tight">
              {company?.businessName || "Your Business"}
            </h1>
          )}
          {options.showCompanyName &&
            company?.legalName &&
            company.legalName !== company.businessName && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {company.legalName}
              </p>
            )}
          {options.showBranchName && branchName && (
            <p className="text-[11px] font-bold text-[#000060] mt-1">
              Branch: {branchName}
            </p>
          )}
          {options.showCompanyAddress && (
            <p className="text-[10px] text-gray-600 mt-1 max-w-[380px]">
              {branchAddr}
            </p>
          )}
          {options.showCompanyPhone && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              {[
                branchPhone || shopPhone
                  ? `Ph: ${branchPhone || shopPhone}`
                  : "",
                shopEmail ? `Email: ${shopEmail}` : "",
              ]
                .filter(Boolean)
                .join("  |  ")}
            </p>
          )}
          {options.showCompanyGSTIN && company?.gstin && (
            <p className="text-[10px] font-bold text-[#000060] mt-1">
              GSTIN: {company.gstin}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[16px] font-extrabold text-[#000060] uppercase tracking-[2px]">
            Sales Invoice
          </p>
          <p className="text-[13px] font-bold text-gray-700 font-mono mt-1">
            {invoice?.invoice_number}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                statusStyles[invoice?.status] || statusStyles.DRAFT
              }`}
            >
              {invoice?.status || "DRAFT"}
            </span>
            {options.showPaymentStatus && (
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                  paymentStatusStyles[invoice?.payment_status] ||
                  paymentStatusStyles.UNPAID
                }`}
              >
                {invoice?.payment_status || "UNPAID"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      {(options.showInvoiceDetails || options.showCustomerDetails) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {options.showInvoiceDetails && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50/60">
              <p className="text-[9px] font-bold text-[#000060] uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                Invoice Details
              </p>
              <div className="flex justify-between py-[1.5px]">
                <span className="text-[10px] text-gray-500">Invoice Date:</span>
                <span className="text-[10px] font-semibold">
                  {formatPrintDate(invoice?.invoice_date)}
                </span>
              </div>
              <div className="flex justify-between py-[1.5px]">
                <span className="text-[10px] text-gray-500">Invoice #:</span>
                <span className="text-[10px] font-semibold">
                  {invoice?.invoice_number || "—"}
                </span>
              </div>
              {options.showDueDate && invoice?.due_date && (
                <div className="flex justify-between py-[1.5px]">
                  <span className="text-[10px] text-gray-500">Due Date:</span>
                  <span className="text-[10px] font-semibold">
                    {formatPrintDate(invoice?.due_date)}
                  </span>
                </div>
              )}
              {options.showPaymentMode && (
                <div className="flex justify-between py-[1.5px]">
                  <span className="text-[10px] text-gray-500">
                    Payment Mode:
                  </span>
                  <span className="text-[10px] font-semibold">
                    {invoice?.payment_mode || "—"}
                  </span>
                </div>
              )}
            </div>
          )}

          {options.showCustomerDetails && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50/60">
              <p className="text-[9px] font-bold text-[#000060] uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                Customer Details
              </p>
              {customer ? (
                <>
                  <div className="flex justify-between py-[1.5px]">
                    <span className="text-[10px] text-gray-500">Name:</span>
                    <span className="text-[10px] font-semibold">
                      {customer.name || "—"}
                    </span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between py-[1.5px]">
                      <span className="text-[10px] text-gray-500">Phone:</span>
                      <span className="text-[10px] font-semibold">
                        {customer.phone}
                      </span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex justify-between py-[1.5px]">
                      <span className="text-[10px] text-gray-500">Email:</span>
                      <span className="text-[10px] font-semibold">
                        {customer.email}
                      </span>
                    </div>
                  )}
                  {customer.gstin && (
                    <div className="flex justify-between py-[1.5px]">
                      <span className="text-[10px] text-gray-500">GSTIN:</span>
                      <span className="text-[10px] font-semibold">
                        {customer.gstin}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between py-[1.5px]">
                  <span className="text-[10px] text-gray-500">Name:</span>
                  <span className="text-[10px] font-semibold">
                    {invoice?.customer_name || "Walk-in Customer"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Item Summary */}
      {options.showItemSummary && (
        <div className="flex justify-between items-center px-2 py-1.5 bg-gray-50 rounded mb-2 text-[10px]">
          <span className="text-gray-600">
            Total Items:{" "}
            <strong className="text-gray-900">{lineItems.length}</strong>
          </span>
          <span className="text-gray-600">
            Total Quantity:{" "}
            <strong className="text-gray-900">{totalQty}</strong>
          </span>
        </div>
      )}

      {/* Items Table */}
      <table className="w-full border-collapse mb-3 text-[10px]">
        <thead>
          <tr className="bg-[#000060] text-white">
            {visibleHeaders.map((h) => (
              <th
                key={h}
                className={`py-[5px] px-1 font-semibold text-[9px] uppercase tracking-wide whitespace-nowrap ${
                  h === "Product" ? "text-left" : "text-center"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => {
            const a = computeSalesItemAmounts(item);
            return (
              <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                <td className="text-center py-1 px-1 border-b border-gray-200">
                  {i + 1}
                </td>
                <td className="text-left py-1 px-1 border-b border-gray-200">
                  <span className="font-semibold">
                    {item.medicine?.name || item.product_name || "—"}
                  </span>
                  {options.showManufacturer && item.medicine?.manufacturer && (
                    <span className="block text-[9px] text-gray-500">
                      {item.medicine.manufacturer}
                    </span>
                  )}
                </td>
                {options.showHSN && (
                  <td className="text-center py-1 px-1 border-b border-gray-200 text-[9px]">
                    {item.medicine?.hsn_code || item.hsn_code || "—"}
                  </td>
                )}
                {options.showBatch && (
                  <td className="text-center py-1 px-1 border-b border-gray-200">
                    {item.batch_number || "—"}
                  </td>
                )}
                {options.showExpiry && (
                  <td className="text-center py-1 px-1 border-b border-gray-200">
                    {formatExpiry(item.expiry_date)}
                  </td>
                )}
                {options.showPack && (
                  <td className="text-center py-1 px-1 border-b border-gray-200">
                    {item.medicine?.pack_size || item.pack_size || "—"}
                  </td>
                )}
                <td className="text-center py-1 px-1 border-b border-gray-200 font-bold">
                  {a.qty}
                </td>
                {options.showMRP && (
                  <td className="text-right py-1 px-1 border-b border-gray-200">
                    {a.mrp.toFixed(2)}
                  </td>
                )}
                <td className="text-right py-1 px-1 border-b border-gray-200">
                  {a.rate.toFixed(2)}
                </td>
                {options.showDiscount && (
                  <td className="text-center py-1 px-1 border-b border-gray-200">
                    {a.discountPercent > 0
                      ? `${a.discountPercent.toFixed(1)}%`
                      : "—"}
                  </td>
                )}
                {options.showTaxable && (
                  <td className="text-right py-1 px-1 border-b border-gray-200">
                    {a.taxable.toFixed(2)}
                  </td>
                )}
                {options.showCGST && (
                  <td className="text-center py-1 px-1 border-b border-gray-200 text-[9px]">
                    {a.cgstP}%<br />₹{a.cgstAmt.toFixed(2)}
                  </td>
                )}
                {options.showSGST && (
                  <td className="text-center py-1 px-1 border-b border-gray-200 text-[9px]">
                    {a.sgstP}%<br />₹{a.sgstAmt.toFixed(2)}
                  </td>
                )}
                <td className="text-right py-1 px-1 border-b border-gray-200 font-bold">
                  ₹{a.total.toFixed(2)}
                </td>
              </tr>
            );
          })}
          {lineItems.length === 0 && (
            <tr>
              <td
                colSpan={visibleHeaders.length}
                className="text-center py-6 text-gray-400 italic"
              >
                No line items
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-between gap-4 mb-3">
        {options.showAmountInWords && (
          <div className="flex-1 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
            <p className="text-[9px] font-bold text-[#000060] uppercase tracking-wider">
              Amount in Words
            </p>
            <p className="text-[11px] font-semibold text-gray-900 mt-1 italic">
              {numberToWords(netAmount)}
            </p>
          </div>
        )}

        <div
          className={
            options.showAmountInWords ? "w-[260px] shrink-0" : "flex-1"
          }
        >
          <table className="w-full border-collapse text-[10px]">
            <tbody>
              {options.showSubtotal && (
                <tr>
                  <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                    Subtotal:
                  </td>
                  <td className="text-right font-semibold py-[3px] px-2 min-w-[90px]">
                    ₹{totals.subtotal.toFixed(2)}
                  </td>
                </tr>
              )}
              {options.showDiscountTotal && totals.discount > 0 && (
                <tr>
                  <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                    Discount:
                  </td>
                  <td className="text-right font-semibold py-[3px] px-2 text-green-600">
                    - ₹{totals.discount.toFixed(2)}
                  </td>
                </tr>
              )}
              {options.showGSTBreakdown && (
                <>
                  <tr>
                    <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                      CGST:
                    </td>
                    <td className="text-right font-semibold py-[3px] px-2">
                      ₹{totals.cgst.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                      SGST:
                    </td>
                    <td className="text-right font-semibold py-[3px] px-2">
                      ₹{totals.sgst.toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
              {totals.roundOff !== 0 && (
                <tr>
                  <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                    Round Off:
                  </td>
                  <td className="text-right font-semibold py-[3px] px-2">
                    ₹{totals.roundOff.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-right font-extrabold text-[#000060] py-[5px] px-2 border-t-2 border-[#000060] text-[12px]">
                  Net Amount:
                </td>
                <td className="text-right font-extrabold text-[#000060] py-[5px] px-2 border-t-2 border-[#000060] text-[12px] min-w-[90px]">
                  ₹{netAmount.toFixed(2)}
                </td>
              </tr>
              {options.showPaidAmount && paidAmount > 0 && (
                <tr>
                  <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                    Paid:
                  </td>
                  <td className="text-right font-semibold py-[3px] px-2 text-emerald-600">
                    ₹{paidAmount.toFixed(2)}
                  </td>
                </tr>
              )}
              {options.showBalanceAmount && balance > 0 && (
                <tr>
                  <td className="text-right text-gray-500 font-medium py-[3px] px-2">
                    Balance Due:
                  </td>
                  <td className="text-right font-bold py-[3px] px-2 text-red-600">
                    ₹{balance.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks */}
      {options.showRemarks && invoice?.remarks && (
        <div className="p-2 px-3 bg-amber-50 border border-amber-200 rounded-md mb-3">
          <p className="text-[9px] font-bold text-amber-800 uppercase">
            Remarks
          </p>
          <p className="text-[10px] text-amber-900 mt-0.5">{invoice.remarks}</p>
        </div>
      )}

      {/* Terms */}
      {options.showTerms && (
        <div className="p-2 px-3 bg-gray-50 border border-gray-200 rounded-md mb-3">
          <p className="text-[9px] text-gray-600">
            <strong>Terms & Conditions:</strong> 1. Goods once sold will not be
            taken back. 2. Subject to local jurisdiction. 3. E&OE. 4. Please
            check goods before leaving.
          </p>
        </div>
      )}

      {/* Signatures */}
      {options.showSignatures && (
        <div className="flex justify-between mt-8 pt-3 border-t border-gray-200">
          <div className="text-center min-w-[150px]">
            <div className="border-t border-gray-800 mt-12 pt-1">
              <p className="text-[10px] text-gray-500 font-semibold">
                Customer Signature
              </p>
            </div>
          </div>
          <div className="text-center min-w-[150px]">
            <div className="border-t border-gray-800 mt-12 pt-1">
              <p className="text-[10px] text-gray-500 font-semibold">
                For {company?.businessName || "Business"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print Timestamp */}
      {options.showPrintTimestamp && (
        <p className="text-center text-[8px] text-gray-400 mt-4 pt-2 border-t border-dashed border-gray-300">
          Computer-generated invoice
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PrintSalesInvoiceModal = ({ open, onClose, invoice, companyInfo }) => {
  const { shopInfo, loading: shopLoading } = useShopInfo();
  const [activeTab, setActiveTab] = useState("preview");
  const [printOptions, setPrintOptions] = useState(DEFAULT_PRINT_OPTIONS);

  const company = useMemo(() => {
    if (companyInfo) return companyInfo;
    if (!shopInfo) return null;
    return {
      businessName: shopInfo.businessName,
      legalName: shopInfo.legalName,
      address: shopInfo.address,
      phone: shopInfo.phone,
      email: shopInfo.email,
      gstin: shopInfo.gstin,
      branchName: shopInfo.branchName,
      shop: shopInfo.shop,
      branch: shopInfo.branch,
    };
  }, [companyInfo, shopInfo]);

  const totals = useMemo(() => {
    if (!invoice?.lineItems)
      return {
        subtotal: 0,
        discount: 0,
        cgst: 0,
        sgst: 0,
        total: 0,
        roundOff: 0,
      };

    let subtotal = 0;
    let discount = 0;
    let cgst = 0;
    let sgst = 0;

    invoice.lineItems.forEach((item) => {
      const a = computeSalesItemAmounts(item);
      subtotal += a.qty * a.rate;
      discount += a.discountAmount;
      cgst += a.cgstAmt;
      sgst += a.sgstAmt;
    });

    const taxable = subtotal - discount;
    const calculatedTotal = taxable + cgst + sgst;
    const netAmount = parseFloat(invoice.net_amount) || calculatedTotal;
    const roundOff =
      parseFloat(invoice.round_off) || netAmount - calculatedTotal;

    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      taxable: +taxable.toFixed(2),
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      total: +calculatedTotal.toFixed(2),
      roundOff: +roundOff.toFixed(2),
    };
  }, [invoice?.lineItems, invoice?.net_amount, invoice?.round_off]);

  const handlePrint = useCallback(() => {
    if (!invoice) return;
    const html = generateSalesPrintHTML(invoice, company, totals, printOptions);
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }, [invoice, company, totals, printOptions]);

  const handleDownloadHTML = useCallback(() => {
    if (!invoice) return;
    const html = generateSalesPrintHTML(invoice, company, totals, printOptions);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SalesInvoice-${invoice.invoice_number || "draft"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [invoice, company, totals, printOptions]);

  if (!open || !invoice) return null;

  const tabs = [
    { id: "preview", label: "Preview", icon: Eye },
    { id: "options", label: "Options", icon: Settings },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative w-full max-w-6xl h-[92vh] bg-gray-100 rounded-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow:
                "0 25px 80px rgba(0,0,96,0.25), 0 0 0 1px rgba(0,0,96,0.1)",
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Toolbar */}
            <div className="shrink-0 px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: "#000060" }}
                >
                  <Receipt size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Print Sales Invoice
                  </h2>
                  <p className="text-xs text-gray-500">
                    {invoice.invoice_number}
                    {invoice.customer?.name && (
                      <span className="ml-2 text-gray-400">
                        • {invoice.customer.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-[#000060] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {shopLoading && (
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 mr-2">
                    <Loader2 size={12} className="animate-spin" />
                    Loading…
                  </span>
                )}

                <button
                  onClick={handleDownloadHTML}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm font-medium border border-gray-200"
                  title="Download as HTML"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={shopLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000060]/90 transition-all text-sm font-medium shadow-md disabled:opacity-50"
                >
                  <Printer size={16} />
                  Print
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all ml-1"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {activeTab === "preview" ? (
                <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-200/60">
                  <div
                    className="max-w-4xl mx-auto bg-white rounded-lg p-6 sm:p-8 min-h-[800px]"
                    style={{
                      boxShadow:
                        "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <PreviewTab
                      invoice={invoice}
                      company={company}
                      totals={totals}
                      options={printOptions}
                      shopLoading={shopLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex">
                  {/* Options Panel */}
                  <div className="w-[400px] border-r border-gray-200 bg-gray-50">
                    <OptionsTab
                      options={printOptions}
                      setOptions={setPrintOptions}
                      company={company}
                    />
                  </div>

                  {/* Live Preview */}
                  <div className="flex-1 overflow-auto p-4 bg-gray-200/60">
                    <div className="text-center mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
                        <Eye size={12} />
                        Live Preview
                      </span>
                    </div>
                    <div
                      className="max-w-3xl mx-auto bg-white rounded-lg p-4 sm:p-6 min-h-[600px] transform scale-[0.85] origin-top"
                      style={{
                        boxShadow:
                          "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      <PreviewTab
                        invoice={invoice}
                        company={company}
                        totals={totals}
                        options={printOptions}
                        shopLoading={shopLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default PrintSalesInvoiceModal;
