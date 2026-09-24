// pharmacy-web/src/pages/sales/returns/components/SalesReturnStatusBadge.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/returns/components/SalesReturnStatusBadge.jsx

import React from "react";
import { CheckCircle2, Clock, XCircle, Ban } from "lucide-react";

const STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: "Pending Approval",
    shortLabel: "Pending",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    shortLabel: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "Rejected",
    shortLabel: "Rejected",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    icon: Ban,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
    dot: "bg-gray-500",
  },
};

const SalesReturnStatusBadge = ({
  status,
  size = "md",
  showIcon = true,
  showLabel = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_APPROVAL;
  const Icon = config.icon;

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${config.bg} ${config.text} ${config.border}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {showLabel &&
        (size === "xs" || size === "sm" ? config.shortLabel : config.label)}
    </span>
  );
};

export default SalesReturnStatusBadge;
