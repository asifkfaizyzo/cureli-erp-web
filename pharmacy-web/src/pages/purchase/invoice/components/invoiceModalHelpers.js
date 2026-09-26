// pharmacy-web/src/pages/purchase/invoice/components/invoiceModalHelpers.js (do not remove this comment)
// pharmacy-web/src/pages/purchase/invoice/components/invoiceModalHelpers.js
// Shared utilities and constants for Invoice Modal components
//  UPDATED: Added print helpers, formatExpiry, numberToWords, and enhanced payment helpers

import {
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  AlertCircle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const NAVY = "#000060";

/**
 * Minimum balance amount to be considered as PARTIALLY_PAID
 * If balance <= this threshold, treat as PAID (handles rounding)
 */
export const PAYMENT_BALANCE_THRESHOLD = 10;

export const ANIMATION_VARIANTS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  },
  panel: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
  },
  dropdown: {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    },
    exit: { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.15 } },
  },
  slideIn: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  },
};

export const STATUS_CONFIG = {
  DRAFT: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    icon: Clock,
    label: "Draft",
    hoverBg: "hover:bg-yellow-200",
    printBg: "#fef3c7",
    printText: "#92400e",
    printBorder: "#fcd34d",
  },
  CONFIRMED: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    icon: CheckCircle2,
    label: "Confirmed",
    hoverBg: "hover:bg-green-200",
    printBg: "#dcfce7",
    printText: "#166534",
    printBorder: "#86efac",
  },
  CANCELLED: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    icon: XCircle,
    label: "Cancelled",
    hoverBg: "",
    printBg: "#fee2e2",
    printText: "#991b1b",
    printBorder: "#fca5a5",
  },
};

export const PAYMENT_STATUS_CONFIG = {
  PAID: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    icon: CheckCircle2,
    label: "Paid",
    hoverBg: "hover:bg-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
    printBg: "#dcfce7",
    printText: "#166534",
    printBorder: "#86efac",
  },
  PARTIALLY_PAID: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    icon: Wallet,
    label: "Partial",
    hoverBg: "hover:bg-amber-200",
    gradient: "from-amber-500 to-amber-600",
    printBg: "#fef3c7",
    printText: "#92400e",
    printBorder: "#fcd34d",
  },
  UNPAID: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    icon: AlertCircle,
    label: "Unpaid",
    hoverBg: "hover:bg-red-200",
    gradient: "from-red-500 to-red-600",
    printBg: "#fee2e2",
    printText: "#991b1b",
    printBorder: "#fca5a5",
  },
};

export const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit" },
];

// ════════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Format amount as Indian Rupee currency
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted currency string (e.g., "₹1,234.56")
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format amount as currency without symbol (for print layouts)
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted number string (e.g., "1,234.56")
 */
export const formatCurrencyValue = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format date in Indian locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date (e.g., "25 Dec 2024")
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Format date in short format
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date (e.g., "25/12/2024")
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Format date in long format
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date (e.g., "25 December 2024")
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Format expiry date to MM/YY format
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted expiry (e.g., "12/25")
 */
export const formatExpiry = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  } catch {
    return "-";
  }
};

/**
 * Format date and time
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted datetime (e.g., "25 Dec 2024, 10:30 AM")
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

/**
 * Check if date is expired (past today)
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} - True if expired
 */
export const isExpired = (dateString) => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
};

/**
 * Check if date is expiring soon (within days)
 * @param {string|Date} dateString - Date to check
 * @param {number} days - Days threshold (default: 90)
 * @returns {boolean} - True if expiring within threshold
 */
export const isExpiringSoon = (dateString, days = 90) => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + days);
    return date >= today && date <= threshold;
  } catch {
    return false;
  }
};

// ════════════════════════════════════════════════════════════════════════════
// NUMBER TO WORDS (Indian Number System)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Convert number to words in Indian format (Lakhs, Crores)
 * @param {number} num - Number to convert
 * @returns {string} - Number in words (e.g., "One Thousand Two Hundred Thirty Four Rupees Only")
 */
export const numberToWords = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "";

  const ones = [
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

  const tens = [
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

  if (num === 0) return "Zero Rupees Only";

  const convertLessThanThousand = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) {
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
      );
    }
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
    );
  };

  const convert = (n) => {
    if (n === 0) return "";

    // Handle negative numbers
    if (n < 0) return "Minus " + convert(Math.abs(n));

    // Less than 1000
    if (n < 1000) return convertLessThanThousand(n);

    // Thousand (1,000 - 99,999)
    if (n < 100000) {
      return (
        convertLessThanThousand(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convertLessThanThousand(n % 1000) : "")
      );
    }

    // Lakh (1,00,000 - 99,99,999)
    if (n < 10000000) {
      return (
        convertLessThanThousand(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    }

    // Crore (1,00,00,000+)
    return (
      convertLessThanThousand(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  };

  const absNum = Math.abs(num);
  const rupees = Math.floor(absNum);
  const paise = Math.round((absNum - rupees) * 100);

  let result = "";

  if (num < 0) {
    result = "Minus ";
  }

  if (rupees > 0) {
    result += convert(rupees) + " Rupees";
  }

  if (paise > 0) {
    if (rupees > 0) result += " and ";
    result += convert(paise) + " Paise";
  }

  if (rupees === 0 && paise === 0) {
    result = "Zero Rupees";
  }

  return result + " Only";
};

/**
 * Convert number to words (simple version without currency)
 * @param {number} num - Number to convert
 * @returns {string} - Number in words
 */
export const numberToWordsSimple = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "";

  const ones = [
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

  const tens = [
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

  if (num === 0) return "Zero";

  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  };

  return convert(Math.floor(Math.abs(num)));
};

// ════════════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate values for an editable row
 * @param {Object} row - Row data
 * @returns {Object} - Row with calculated values
 */
export const calculateEditRow = (row) => {
  const qty = Number(row.qty) || 0;
  const price = Number(row.price) || 0;
  const gross = qty * price;

  const schPct = Number(row.schemePercent) || 0;
  const schemeAmount = +((gross * schPct) / 100).toFixed(2);
  const afterScheme = gross - schemeAmount;

  const discPct = Number(row.discountPercent) || 0;
  const discountAmount = +((afterScheme * discPct) / 100).toFixed(2);
  const taxableValue = +(afterScheme - discountAmount).toFixed(2);

  const cgstPct = Number(row.cgstPercent) || 0;
  const sgstPct = Number(row.sgstPercent) || 0;
  const cgstAmount = +((taxableValue * cgstPct) / 100).toFixed(2);
  const sgstAmount = +((taxableValue * sgstPct) / 100).toFixed(2);
  const amount = +(taxableValue + cgstAmount + sgstAmount).toFixed(2);

  const netRate = qty > 0 ? +(taxableValue / qty).toFixed(2) : 0;

  return {
    ...row,
    grossAmount: gross.toFixed(2),
    schemeAmount,
    discountAmount,
    taxableValue,
    cgstAmount,
    sgstAmount,
    amount,
    netRate: netRate.toString(),
  };
};

/**
 * Create an empty row for editing
 * @returns {Object} - Empty row object
 */
export const makeEmptyRow = () => ({
  medicine_id: null,
  name: "",
  mfac: "",
  batch: "",
  hsn: "",
  exp: "",
  pack: "",
  pQty: "",
  qty: "",
  price: "",
  schemePercent: "",
  discountPercent: "",
  cgstPercent: "6",
  sgstPercent: "6",
  mrp: "",
  rack: "",
  sRate: "",
  sch: "",
  netRate: "",
  amount: "0",
  grossAmount: "0",
  taxableValue: "0",
  cgstAmount: "0",
  sgstAmount: "0",
});

/**
 * Transform invoice line items to editable rows
 * @param {Object} inv - Invoice object
 * @returns {Array} - Array of editable rows
 */
export const transformInvoiceToRows = (inv) => {
  if (!inv?.lineItems || !Array.isArray(inv.lineItems)) return [];

  return inv.lineItems.map((item) => {
    const expiry = formatExpiry(item.expiry_date);

    const row = {
      medicine_id: item.medicine_id,
      item_id: item.item_id,
      name: item.medicine?.name || item.product_name || "Unknown Product",
      mfac: item.medicine?.manufacturer || "",
      batch: item.batch_number || "",
      hsn: item.medicine?.hsn_code || "",
      exp: expiry !== "-" ? expiry : "",
      pack: item.pack_size || item.medicine?.pack_size || "",
      pQty: (item.free_quantity || 0).toString(),
      qty: (item.quantity || 0).toString(),
      price: (item.purchase_rate || 0).toString(),
      schemePercent: (item.scheme_discount || 0).toString(),
      discountPercent: (item.trade_discount || 0).toString(),
      cgstPercent: (item.cgst_percent || 0).toString(),
      sgstPercent: (item.sgst_percent || 0).toString(),
      mrp: (item.mrp || 0).toString(),
      rack: item.rack_no || item.medicine?.rack_no || "",
      sRate: item.selling_rate?.toString() || "",
      sch: (item.free_quantity || 0).toString(),
      netRate: "",
      amount: "",
    };

    return calculateEditRow(row);
  });
};

/**
 * Calculate invoice totals from line items
 * @param {Array} lineItems - Array of line items
 * @returns {Object} - Totals object
 */
export const calculateInvoiceTotals = (lineItems) => {
  if (!lineItems || !Array.isArray(lineItems)) {
    return {
      subtotal: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTax: 0,
      totalDiscount: 0,
      netAmount: 0,
      totalQty: 0,
      totalFreeQty: 0,
      itemCount: lineItems?.length || 0,
    };
  }

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalDiscount = 0;
  let totalQty = 0;
  let totalFreeQty = 0;

  lineItems.forEach((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.purchase_rate) || 0;
    const discount = parseFloat(item.trade_discount) || 0;
    const cgstPercent = parseFloat(item.cgst_percent) || 0;
    const sgstPercent = parseFloat(item.sgst_percent) || 0;
    const igstPercent = parseFloat(item.igst_percent) || 0;
    const freeQty = parseFloat(item.free_quantity) || 0;

    const baseAmount = qty * rate;
    const discountAmount = baseAmount * (discount / 100);
    const taxableAmount = baseAmount - discountAmount;
    const cgstAmount = taxableAmount * (cgstPercent / 100);
    const sgstAmount = taxableAmount * (sgstPercent / 100);
    const igstAmount = taxableAmount * (igstPercent / 100);

    subtotal += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
    totalDiscount += discountAmount;
    totalQty += qty;
    totalFreeQty += freeQty;
  });

  const totalTax = totalCgst + totalSgst + totalIgst;
  const netAmount = subtotal + totalTax;

  return {
    subtotal: +subtotal.toFixed(2),
    totalCgst: +totalCgst.toFixed(2),
    totalSgst: +totalSgst.toFixed(2),
    totalIgst: +totalIgst.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    totalDiscount: +totalDiscount.toFixed(2),
    netAmount: +netAmount.toFixed(2),
    totalQty: +totalQty.toFixed(2),
    totalFreeQty: +totalFreeQty.toFixed(2),
    itemCount: lineItems.length,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT STATUS HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate payment status from amounts with threshold
 * - If balance <= threshold (default 10), treat as PAID (handles small rounding differences)
 * - If paid amount is 0, treat as UNPAID
 * - Otherwise, PARTIALLY_PAID
 *
 * @param {number|string} paidAmount - Amount paid
 * @param {number|string} netAmount - Total invoice amount
 * @param {number} threshold - Minimum balance to be partially paid (default: PAYMENT_BALANCE_THRESHOLD)
 * @returns {string} - "PAID" | "PARTIALLY_PAID" | "UNPAID"
 */
export const calculatePaymentStatus = (
  paidAmount,
  netAmount,
  threshold = PAYMENT_BALANCE_THRESHOLD,
) => {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const balance = net - paid;

  // If nothing paid
  if (paid <= 0) return "UNPAID";

  // If balance is within threshold, treat as fully paid
  if (balance <= threshold) return "PAID";

  // Otherwise, partially paid
  return "PARTIALLY_PAID";
};

/**
 * Calculate payment details with threshold handling
 * Returns normalized values for display
 *
 * @param {number|string} paidAmount - Amount paid
 * @param {number|string} netAmount - Total invoice amount
 * @param {number} threshold - Minimum balance to be partially paid (default: PAYMENT_BALANCE_THRESHOLD)
 * @returns {Object} - { status, paidAmount, balanceAmount, effectiveStatus }
 */
export const calculatePaymentDetails = (
  paidAmount,
  netAmount,
  threshold = PAYMENT_BALANCE_THRESHOLD,
) => {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const rawBalance = net - paid;

  // If nothing paid
  if (paid <= 0) {
    return {
      status: "UNPAID",
      paidAmount: 0,
      balanceAmount: net,
      rawBalance: net,
      thresholdApplied: false,
      paymentPercentage: 0,
    };
  }

  // If balance is within threshold, treat as fully paid
  if (rawBalance <= threshold) {
    return {
      status: "PAID",
      paidAmount: net, // Normalize to full amount for display
      balanceAmount: 0,
      rawBalance: rawBalance,
      thresholdApplied: rawBalance > 0, // True if threshold was applied
      paymentPercentage: 100,
    };
  }

  // Otherwise, partially paid
  const paymentPercentage = net > 0 ? Math.round((paid / net) * 100) : 0;

  return {
    status: "PARTIALLY_PAID",
    paidAmount: paid,
    balanceAmount: rawBalance,
    rawBalance: rawBalance,
    thresholdApplied: false,
    paymentPercentage,
  };
};

/**
 * Get effective payment status config based on actual amounts
 * This handles the threshold logic for UI display
 *
 * @param {Object} invoice - Invoice object with payment_status, paid_amount, net_amount
 * @returns {Object} - { effectiveStatus, config, balance, showBalance, thresholdApplied, paymentPercentage }
 */
export const getEffectivePaymentDisplay = (invoice) => {
  if (!invoice) {
    return {
      effectiveStatus: "UNPAID",
      config: PAYMENT_STATUS_CONFIG.UNPAID,
      balance: 0,
      rawBalance: 0,
      showBalance: false,
      thresholdApplied: false,
      paymentPercentage: 0,
    };
  }

  const paid = parseFloat(invoice.paid_amount) || 0;
  const net = parseFloat(invoice.net_amount) || 0;
  const rawBalance = net - paid;

  // Calculate effective status with threshold
  let effectiveStatus = invoice.payment_status || "UNPAID";

  // Override based on actual amounts
  if (paid <= 0) {
    effectiveStatus = "UNPAID";
  } else if (rawBalance <= PAYMENT_BALANCE_THRESHOLD) {
    effectiveStatus = "PAID";
  } else {
    effectiveStatus = "PARTIALLY_PAID";
  }

  const config =
    PAYMENT_STATUS_CONFIG[effectiveStatus] || PAYMENT_STATUS_CONFIG.UNPAID;

  // Only show balance if > threshold
  const showBalance = rawBalance > PAYMENT_BALANCE_THRESHOLD;
  const displayBalance = showBalance ? rawBalance : 0;
  const paymentPercentage = net > 0 ? Math.round((paid / net) * 100) : 0;

  return {
    effectiveStatus,
    config,
    balance: displayBalance,
    rawBalance,
    showBalance,
    thresholdApplied:
      effectiveStatus === "PAID" &&
      rawBalance > 0 &&
      rawBalance <= PAYMENT_BALANCE_THRESHOLD,
    paymentPercentage: effectiveStatus === "PAID" ? 100 : paymentPercentage,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validate expiry date format (MM/YY)
 * @param {string} expiry - Expiry string
 * @returns {boolean} - True if valid
 */
export const isValidExpiryFormat = (expiry) => {
  if (!expiry) return false;
  return /^\d{2}\/\d{2}$/.test(expiry);
};

/**
 * Parse expiry string to Date
 * @param {string} expiry - Expiry string (MM/YY)
 * @returns {Date|null} - Date object or null
 */
export const parseExpiryToDate = (expiry) => {
  if (!isValidExpiryFormat(expiry)) return null;

  const [month, year] = expiry.split("/");
  const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
  const date = new Date(`${fullYear}-${month}-01`);

  // Set to last day of month
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);

  return date;
};

/**
 * Validate batch number
 * @param {string} batch - Batch number
 * @returns {boolean} - True if valid
 */
export const isValidBatchNumber = (batch) => {
  if (!batch) return false;
  // At least 1 character, alphanumeric with some special chars allowed
  return /^[A-Za-z0-9\-_/]+$/.test(batch);
};

// ════════════════════════════════════════════════════════════════════════════
// PRINT HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get print-ready status style
 * @param {string} status - Status value
 * @returns {Object} - Print styles
 */
export const getPrintStatusStyle = (status) => {
  const config = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG.DRAFT;
  return {
    backgroundColor: config.printBg,
    color: config.printText,
    border: `1px solid ${config.printBorder}`,
  };
};

/**
 * Get print-ready payment status style
 * @param {string} status - Payment status value
 * @returns {Object} - Print styles
 */
export const getPrintPaymentStatusStyle = (status) => {
  const config =
    PAYMENT_STATUS_CONFIG[status?.toUpperCase()] ||
    PAYMENT_STATUS_CONFIG.UNPAID;
  return {
    backgroundColor: config.printBg,
    color: config.printText,
    border: `1px solid ${config.printBorder}`,
  };
};

/**
 * Generate print-ready timestamp
 * @returns {string} - Formatted timestamp
 */
export const getPrintTimestamp = () => {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

// ════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 30) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
export const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Sort array by key
 * @param {Array} arr - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} - Sorted array
 */
export const sortByKey = (arr, key, direction = "asc") => {
  if (!Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

// ════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ════════════════════════════════════════════════════════════════════════════

export default {
  // Constants
  NAVY,
  PAYMENT_BALANCE_THRESHOLD,
  ANIMATION_VARIANTS,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_MODES,

  // Format helpers
  formatCurrency,
  formatCurrencyValue,
  formatDate,
  formatDateShort,
  formatDateLong,
  formatExpiry,
  formatDateTime,
  isExpired,
  isExpiringSoon,

  // Number to words
  numberToWords,
  numberToWordsSimple,

  // Calculation helpers
  calculateEditRow,
  makeEmptyRow,
  transformInvoiceToRows,
  calculateInvoiceTotals,

  // Payment helpers
  calculatePaymentStatus,
  calculatePaymentDetails,
  getEffectivePaymentDisplay,

  // Validation helpers
  isValidExpiryFormat,
  parseExpiryToDate,
  isValidBatchNumber,

  // Print helpers
  getPrintStatusStyle,
  getPrintPaymentStatusStyle,
  getPrintTimestamp,

  // Utilities
  deepClone,
  debounce,
  truncateText,
  generateUniqueId,
  sortByKey,
};
