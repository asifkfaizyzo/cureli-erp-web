// pharmacy-web/src/pages/sales/invoice/components/salesInvoiceModalHelpers.js (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/salesInvoiceModalHelpers.js
// Helper functions and constants for Sales Invoice Modal

import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Wallet,
  PauseCircle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const NAVY = "#000060";

// Payment balance threshold - amounts <= this are considered "PAID"
export const PAYMENT_BALANCE_THRESHOLD = 10;

// ════════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATIONS
// ════════════════════════════════════════════════════════════════════════════

export const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: Clock,
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    hoverBg: "hover:bg-yellow-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    hoverBg: "hover:bg-green-200",
  },
  PARKED: {
    label: "Parked",
    icon: PauseCircle,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    hoverBg: "hover:bg-blue-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    hoverBg: "hover:bg-red-200",
  },
};

export const PAYMENT_STATUS_CONFIG = {
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    hoverBg: "hover:bg-emerald-200",
  },
  PARTIALLY_PAID: {
    label: "Partial",
    icon: Wallet,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    hoverBg: "hover:bg-amber-200",
  },
  UNPAID: {
    label: "Unpaid",
    icon: AlertCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    hoverBg: "hover:bg-red-200",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ════════════════════════════════════════════════════════════════════════════

export const ANIMATION_VARIANTS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  },
  panel: {
    hidden: { opacity: 0, scale: 0.96, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: 20,
      transition: { duration: 0.15 },
    },
  },
  dropdown: {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// FORMATTING FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT CALCULATION HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate effective payment status based on amounts and threshold
 * @param {Object} invoice - Invoice object with net_amount, paid_amount, payment_status
 * @returns {Object} - { effectiveStatus, thresholdApplied, balance, paidAmount }
 */
export const calculatePaymentStatus = (invoice) => {
  const netAmount = parseFloat(invoice?.net_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const rawBalance = netAmount - paidAmount;
  const dbStatus = invoice?.payment_status || "UNPAID";

  // If balance is within threshold and there's been some payment, treat as PAID
  if (rawBalance <= PAYMENT_BALANCE_THRESHOLD && paidAmount > 0) {
    return {
      effectiveStatus: "PAID",
      thresholdApplied: rawBalance > 0,
      balance: 0,
      paidAmount,
      rawBalance,
    };
  }

  // If balance is 0 or negative, it's paid
  if (rawBalance <= 0) {
    return {
      effectiveStatus: "PAID",
      thresholdApplied: false,
      balance: 0,
      paidAmount,
      rawBalance,
    };
  }

  // If no payment made, it's unpaid
  if (paidAmount === 0) {
    return {
      effectiveStatus: "UNPAID",
      thresholdApplied: false,
      balance: rawBalance,
      paidAmount,
      rawBalance,
    };
  }

  // Otherwise, partially paid
  return {
    effectiveStatus: "PARTIALLY_PAID",
    thresholdApplied: false,
    balance: rawBalance,
    paidAmount,
    rawBalance,
  };
};

/**
 * Calculate payment details for display
 * @param {Object} invoice
 * @returns {Object}
 */
export const calculatePaymentDetails = (invoice) => {
  const netAmount = parseFloat(invoice?.net_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const balance = netAmount - paidAmount;

  return {
    netAmount,
    paidAmount,
    balance,
    percentPaid: netAmount > 0 ? (paidAmount / netAmount) * 100 : 0,
  };
};

/**
 * Get effective payment display with config for UI rendering
 * @param {Object} invoice
 * @returns {Object}
 */
export const getEffectivePaymentDisplay = (invoice) => {
  const paymentCalc = calculatePaymentStatus(invoice);
  const config =
    PAYMENT_STATUS_CONFIG[paymentCalc.effectiveStatus] ||
    PAYMENT_STATUS_CONFIG.UNPAID;

  return {
    ...paymentCalc,
    config,
    showBalance: paymentCalc.balance > PAYMENT_BALANCE_THRESHOLD,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// ROW CALCULATION HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate totals for a single edit row
 * @param {Object} row
 * @returns {Object}
 */
export const calculateEditRow = (row) => {
  const qty = parseFloat(row.qty) || 0;
  const price = parseFloat(row.price) || 0;
  const discountPercent = parseFloat(row.discountPercent) || 0;
  const cgstPercent = parseFloat(row.cgstPercent) || 0;
  const sgstPercent = parseFloat(row.sgstPercent) || 0;

  const grossAmount = qty * price;
  const discountAmount = (grossAmount * discountPercent) / 100;
  const taxableValue = grossAmount - discountAmount;
  const cgstAmount = (taxableValue * cgstPercent) / 100;
  const sgstAmount = (taxableValue * sgstPercent) / 100;
  const totalAmount = taxableValue + cgstAmount + sgstAmount;

  return {
    ...row,
    grossAmount: +grossAmount.toFixed(2),
    discountAmount: +discountAmount.toFixed(2),
    taxableValue: +taxableValue.toFixed(2),
    cgstAmount: +cgstAmount.toFixed(2),
    sgstAmount: +sgstAmount.toFixed(2),
    amount: +totalAmount.toFixed(2),
  };
};

/**
 * Create an empty row for the edit table
 * @returns {Object}
 */
export const makeEmptyRow = () => ({
  item_id: null,
  medicine_id: null,
  batch_id: null, //  This maps to inventory_id
  name: "",
  batch: "", // This is the batch_number string for display
  exp: "",
  pack: "",
  qty: "",
  price: "",
  mrp: "",
  discountPercent: "",
  cgstPercent: "6",
  sgstPercent: "6",
  amount: 0,
  availableQty: 0,
  taxableValue: 0,
  cgstAmount: 0,
  sgstAmount: 0,
});

/**
 * Transform invoice line items to editable rows
 * @param {Object} invoice
 * @returns {Array}
 */
export const transformInvoiceToRows = (invoice) => {
  if (!invoice?.lineItems?.length) return [makeEmptyRow()];

  return invoice.lineItems.map((item) => {
    const cgst = parseFloat(item.cgst_percent) || 0;
    const sgst = parseFloat(item.sgst_percent) || 0;

    let expStr = "";
    const expiryDate = item.expiry_date || item.inventory?.expiry_date;
    if (expiryDate) {
      const d = new Date(expiryDate);
      if (!isNaN(d.getTime())) {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        expStr = `${mm}/${yy}`;
      }
    }

    const row = {
      // IDs
      item_id: item.item_id,
      medicine_id: item.medicine_id,
      batch_id: item.inventory_id, //  KEY FIX: inventory_id IS the batch_id

      // Display fields
      name: item.medicine?.name || item.product_name || "Unknown",
      batch: item.batch_number || item.inventory?.batch_number || "",
      exp: expStr,
      pack: item.pack_size || item.medicine?.pack_size || "",

      // Quantities
      qty: String(parseFloat(item.quantity) || 0),
      availableQty: parseFloat(item.inventory?.available_stock) || 0,

      // Pricing - use selling_rate
      price: String(parseFloat(item.selling_rate) || parseFloat(item.mrp) || 0),
      mrp: String(parseFloat(item.mrp) || 0),

      // Discounts & Tax
      discountPercent: String(parseFloat(item.discount_percent) || 0),
      cgstPercent: String(cgst),
      sgstPercent: String(sgst),
    };

    return calculateEditRow(row);
  });
};
// ════════════════════════════════════════════════════════════════════════════
// DATE HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Parse expiry string (MM/YY) to ISO date
 * @param {string} expString
 * @returns {string}
 */
export const parseExpiryDate = (expString) => {
  if (!expString || !/^\d{2}\/\d{2}$/.test(expString)) {
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    return defaultDate.toISOString();
  }
  const [month, year] = expString.split("/");
  const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
  const date = new Date(`${fullYear}-${month}-01`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return date.toISOString();
};

/**
 * Convert date string to ISO datetime
 * @param {string|Date} dateStr
 * @returns {string|null}
 */
export const toISODateTime = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "string" && dateStr.includes("T")) return dateStr;
  if (dateStr instanceof Date) return dateStr.toISOString();
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T00:00:00.000Z`;
  }
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
};
