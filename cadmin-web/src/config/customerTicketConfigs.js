// cadmin-web/src/config/customerTicketConfigs.js (do not remove this comment)
export const CUSTOMER_STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    darkBg: "bg-yellow-500/20",
    darkText: "text-yellow-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    darkBg: "bg-blue-500/20",
    darkText: "text-blue-300",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    darkBg: "bg-emerald-500/20",
    darkText: "text-emerald-300",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
    darkBg: "bg-gray-500/20",
    darkText: "text-gray-300",
  },
};

export const CUSTOMER_CATEGORY_CONFIG = {
  WRONG_ITEM: {
    label: "Wrong Item",
    fullLabel: "Wrong Item Received",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  DAMAGED_PRODUCT: {
    label: "Damaged",
    fullLabel: "Damaged / Broken Product",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  DELIVERY_ISSUE: {
    label: "Delivery",
    fullLabel: "Delivery Problem",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  QUALITY_ISSUE: {
    label: "Quality",
    fullLabel: "Quality / Expiry Issue",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  MISSING_ITEM: {
    label: "Missing Item",
    fullLabel: "Missing Item(s)",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  REFUND_REQUEST: {
    label: "Refund",
    fullLabel: "Billing / Refund Request",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  OTHER: {
    label: "Other",
    fullLabel: "Other Issue",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

export const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Wrong Item", value: "WRONG_ITEM" },
  { label: "Damaged Product", value: "DAMAGED_PRODUCT" },
  { label: "Delivery Problem", value: "DELIVERY_ISSUE" },
  { label: "Quality / Expiry", value: "QUALITY_ISSUE" },
  { label: "Missing Item", value: "MISSING_ITEM" },
  { label: "Refund Request", value: "REFUND_REQUEST" },
  { label: "Other", value: "OTHER" },
];

export const UPDATABLE_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function getCustomerStatusConfig(status) {
  return CUSTOMER_STATUS_CONFIG[status] || CUSTOMER_STATUS_CONFIG.OPEN;
}

export function getCustomerCategoryConfig(category) {
  return CUSTOMER_CATEGORY_CONFIG[category] || CUSTOMER_CATEGORY_CONFIG.OTHER;
}