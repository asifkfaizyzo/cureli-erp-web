// pharmacy-web/src/pages/sales/invoice/components/SalesTable.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/SalesTable.jsx

import React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Shield,
  Building2,
  Loader2,
  Layers,
  User,
  PauseCircle,
  UserCheck,
} from "lucide-react";
import {
  PAYMENT_BALANCE_THRESHOLD,
  getEffectivePaymentDisplay,
} from "./salesInvoiceModalHelpers";

// ════════════════════════════════════════════════════════════════════════════
// STATUS BADGES
// ════════════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || "DRAFT";

  const badges = {
    DRAFT: {
      bg: "bg-[#000060]/10",
      text: "text-[#000060]",
      border: "border-[#000060]/30",
      icon: Clock,
    },
    CONFIRMED: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-300",
      icon: CheckCircle2,
    },
    PARKED: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-300",
      icon: PauseCircle,
    },
    CANCELLED: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      icon: XCircle,
    },
  };

  const config = badges[normalizedStatus] || badges.DRAFT;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={10} />
      {normalizedStatus}
    </span>
  );
};

const PaymentStatusBadge = ({ invoice }) => {
  const { effectiveStatus, thresholdApplied } =
    getEffectivePaymentDisplay(invoice);

  const badges = {
    UNPAID: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
    },
    PARTIALLY_PAID: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-300",
    },
    PAID: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-300",
    },
  };

  const config = badges[effectiveStatus] || badges.UNPAID;
  const displayText = effectiveStatus.replace("_", " ");

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}
      title={
        thresholdApplied
          ? `Marked as PAID (balance ≤ ₹${PAYMENT_BALANCE_THRESHOLD})`
          : undefined
      }
    >
      {displayText}
      {thresholdApplied && (
        <span
          className="ml-0.5 text-[8px] opacity-70"
          title="Threshold applied"
        >
          ~
        </span>
      )}
    </span>
  );
};

const BranchBadge = ({ branchName }) => {
  if (!branchName) return <span className="text-gray-400 text-xs">-</span>;

  const colors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  ];

  const colorIndex = branchName.charCodeAt(0) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border ${colorClass}`}
    >
      <Building2 size={9} />
      {branchName}
    </span>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ROLE BADGE HELPER
// ════════════════════════════════════════════════════════════════════════════

const getRoleBadgeConfig = (role) => {
  const roleConfigs = {
    super_admin: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      label: "Super Admin",
    },
    branch_admin: { bg: "bg-blue-100", text: "text-blue-700", label: "Admin" },
    pharmacist: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Pharmacist",
    },
    staff: { bg: "bg-gray-100", text: "text-gray-700", label: "Staff" },
    owner: { bg: "bg-amber-100", text: "text-amber-700", label: "Owner" },
    cashier: { bg: "bg-teal-100", text: "text-teal-700", label: "Cashier" },
  };

  return (
    roleConfigs[role] || {
      bg: "bg-gray-100",
      text: "text-gray-600",
      label: role?.replace("_", " ") || "User",
    }
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SKELETON ROW
// ════════════════════════════════════════════════════════════════════════════

const SkeletonRow = ({ showBranchColumn, index }) => (
  <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
    {/* Serial # */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div
        className="w-6 h-4 bg-gray-200 rounded animate-pulse"
        style={{ animationDelay: `${index * 50}ms` }}
      />
    </td>

    {/* Invoice Number */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div className="space-y-1">
        <div
          className="w-24 h-4 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 20}ms` }}
        />
        <div
          className="w-16 h-3 bg-gray-100 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 40}ms` }}
        />
      </div>
    </td>

    {/* Customer */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div className="space-y-1">
        <div
          className="w-28 h-4 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 60}ms` }}
        />
        <div
          className="w-20 h-3 bg-gray-100 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 70}ms` }}
        />
      </div>
    </td>

    {/* Invoice Date */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div
        className="w-20 h-4 bg-gray-200 rounded animate-pulse"
        style={{ animationDelay: `${index * 50 + 80}ms` }}
      />
    </td>

    {/* Billed By */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div className="space-y-1">
        <div
          className="w-24 h-4 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 100}ms` }}
        />
        <div
          className="w-16 h-3 bg-gray-100 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 120}ms` }}
        />
      </div>
    </td>

    {/* Branch (conditional) */}
    {showBranchColumn && (
      <td className="py-3 px-4 border-b border-gray-100">
        <div
          className="w-20 h-5 bg-gray-200 rounded-full animate-pulse"
          style={{ animationDelay: `${index * 50 + 140}ms` }}
        />
      </td>
    )}

    {/* Items */}
    <td className="py-3 px-4 border-b border-gray-100 text-center">
      <div
        className="w-6 h-6 bg-gray-200 rounded-full animate-pulse mx-auto"
        style={{ animationDelay: `${index * 50 + 160}ms` }}
      />
    </td>

    {/* Net Amount */}
    <td className="py-3 px-4 border-b border-gray-100 text-right">
      <div className="space-y-1">
        <div
          className="w-16 h-4 bg-gray-200 rounded animate-pulse ml-auto"
          style={{ animationDelay: `${index * 50 + 180}ms` }}
        />
        <div
          className="w-12 h-3 bg-gray-100 rounded animate-pulse ml-auto"
          style={{ animationDelay: `${index * 50 + 190}ms` }}
        />
      </div>
    </td>

    {/* Payment Status */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div
        className="w-16 h-5 bg-gray-200 rounded-full animate-pulse"
        style={{ animationDelay: `${index * 50 + 200}ms` }}
      />
    </td>

    {/* Status */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div
        className="w-20 h-5 bg-gray-200 rounded-full animate-pulse"
        style={{ animationDelay: `${index * 50 + 220}ms` }}
      />
    </td>

    {/* Actions */}
    <td className="py-3 px-4 border-b border-gray-100">
      <div className="flex justify-center gap-1">
        <div
          className="w-6 h-6 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 240}ms` }}
        />
        <div
          className="w-6 h-6 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 260}ms` }}
        />
        <div
          className="w-6 h-6 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 50 + 280}ms` }}
        />
      </div>
    </td>
  </tr>
);

// ════════════════════════════════════════════════════════════════════════════
// MAIN TABLE COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const SalesTable = ({
  invoices = [],
  onRowClick,
  onView,
  onEdit,
  onDelete,
  children,
  rowsPerPage = 10,
  currentPage = 1,
  isLoading = false,
  isSearching = false,
  isSuperAdmin = false,
  showBranchColumn = false,
}) => {
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const startIndex = (currentPage - 1) * rowsPerPage;

  // Column count: base 10 + branch column if shown
  const columnCount = showBranchColumn ? 11 : 10;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isEditable = (invoice) => {
    const status = invoice?.status?.toUpperCase();
    if (status === "DRAFT" || status === "PARKED") return true;
    if (status === "CONFIRMED" && isSuperAdmin) return true;
    return false;
  };

  const isDeletable = (invoice) => {
    const status = invoice?.status?.toUpperCase();
    return status !== "CONFIRMED";
  };

  const getEditButtonConfig = (invoice) => {
    const status = invoice?.status?.toUpperCase();
    const canEdit = isEditable(invoice);

    if (!canEdit) {
      return {
        className: "text-gray-200 cursor-not-allowed",
        icon: Pencil,
        title: `Cannot edit - Status: ${status}`,
      };
    }

    if (status === "CONFIRMED") {
      return {
        className:
          "hover:bg-amber-50 hover:text-amber-600 text-amber-500 cursor-pointer",
        icon: Shield,
        title: "Edit as Super Admin (Stock will be adjusted)",
      };
    }

    return {
      className:
        "hover:bg-amber-50 hover:text-amber-600 text-gray-400 cursor-pointer",
      icon: Pencil,
      title: "Edit Invoice",
    };
  };

  const getPaymentDisplayInfo = (invoice) => {
    return getEffectivePaymentDisplay(invoice);
  };

  const uniqueBranches = showBranchColumn
    ? [
        ...new Set(
          safeInvoices.map((inv) => inv.branch?.branch_name).filter(Boolean),
        ),
      ]
    : [];

  return (
    <div className="h-full flex flex-col bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Fixed Header Stats Bar */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <FileText size={12} className="text-indigo-500" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
              Total:
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {safeInvoices.length}
            </span>
          </div>

          {isSearching && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded border border-indigo-200">
                <Loader2 size={10} className="animate-spin text-indigo-500" />
                <span className="text-[10px] text-indigo-600 font-medium">
                  Searching...
                </span>
              </div>
            </>
          )}

          {!isSearching && showBranchColumn && uniqueBranches.length > 0 && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200 text-[10px]">
                <Layers size={10} className="text-blue-500" />
                <span className="text-blue-700 font-medium">
                  {uniqueBranches.length} branches
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scrollable Table Wrapper */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                #
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <FileText size={12} />
                  Invoice Number
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  Customer
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                Invoice Date
              </th>
              {/*  NEW: Billed By Column Header */}
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <UserCheck size={12} />
                  Billed By
                </div>
              </th>
              {showBranchColumn && (
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} />
                    Branch
                  </div>
                </th>
              )}
              <th className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                Items
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                Net Amount
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] border-r border-[#000060]/30 whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider bg-[#000060] whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <SkeletonRow
                  key={`skeleton-${index}`}
                  showBranchColumn={showBranchColumn}
                  index={index}
                />
              ))
            ) : safeInvoices.length > 0 ? (
              safeInvoices.map((invoice, i) => {
                const serialNumber = startIndex + i + 1;
                const canEdit = isEditable(invoice);
                const canDelete = isDeletable(invoice);
                const status = invoice?.status?.toUpperCase();
                const editConfig = getEditButtonConfig(invoice);
                const EditIcon = editConfig.icon;
                const paymentDisplay = getPaymentDisplayInfo(invoice);

                // Get role badge config for creator
                const creatorRole = invoice.creator?.role;
                const roleBadgeConfig = getRoleBadgeConfig(creatorRole);

                return (
                  <tr
                    key={invoice.invoice_id}
                    onClick={() => onRowClick?.(invoice)}
                    className={`
                      hover:bg-[#000060]/5 cursor-pointer transition-colors
                      ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                    `}
                  >
                    {/* Serial Number */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs text-gray-400 font-medium">
                      {String(serialNumber).padStart(2, "0")}
                    </td>

                    {/* Invoice Number */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#000060] font-semibold">
                          {invoice.invoice_number}
                        </span>
                        {status === "CONFIRMED" && isSuperAdmin && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-medium">
                            <Shield size={8} />
                            Editable
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs">
                      <div className="flex flex-col">
                        <span
                          className="font-semibold text-gray-700 truncate max-w-[140px]"
                          title={
                            invoice.customer?.name ||
                            invoice.walkin_name ||
                            "Walk-in Customer"
                          }
                        >
                          {invoice.customer?.name ||
                            invoice.walkin_name ||
                            "Walk-in Customer"}
                        </span>
                        {(invoice.customer?.phone || invoice.walkin_phone) && (
                          <span className="text-[10px] text-gray-500">
                            {invoice.customer?.phone || invoice.walkin_phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Invoice Date */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs text-gray-600">
                      {formatDate(invoice.invoice_date)}
                    </td>

                    {/*  NEW: Billed By Column */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs">
                      {invoice.creator ? (
                        <div className="flex flex-col">
                          <span
                            className="font-medium text-gray-700 truncate max-w-[120px]"
                            title={invoice.creator.full_name}
                          >
                            {invoice.creator.full_name || "-"}
                          </span>
                          {creatorRole && (
                            <span
                              className={`
                                text-[9px] px-1.5 py-0.5 rounded mt-0.5 w-fit font-medium
                                ${roleBadgeConfig.bg} ${roleBadgeConfig.text}
                              `}
                            >
                              {roleBadgeConfig.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Branch Column */}
                    {showBranchColumn && (
                      <td className="py-3 px-4 border-b border-gray-100 text-xs">
                        <BranchBadge branchName={invoice.branch?.branch_name} />
                      </td>
                    )}

                    {/* Items Count */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#000060]/10 text-[#000060] text-[10px] font-bold">
                        {invoice._count?.lineItems ||
                          invoice.lineItems?.length ||
                          0}
                      </span>
                    </td>

                    {/* Net Amount */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs text-right">
                      <span className="font-bold text-gray-900">
                        {formatCurrency(invoice.net_amount)}
                      </span>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Tax: {formatCurrency(invoice.total_tax)}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs">
                      <PaymentStatusBadge invoice={invoice} />
                      {paymentDisplay.showBalance &&
                        paymentDisplay.balance > 0 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Due: {formatCurrency(paymentDisplay.balance)}
                          </div>
                        )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs">
                      <StatusBadge status={invoice.status} />
                      {invoice.confirmed_at && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {formatDate(invoice.confirmed_at)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 border-b border-gray-100 text-xs text-center">
                      <div className="flex justify-center gap-1">
                        {/* VIEW */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView?.(invoice, e);
                          }}
                          className="p-1.5 rounded hover:bg-[#000060]/10 hover:text-[#000060] text-gray-400 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canEdit) onEdit?.(invoice, e);
                          }}
                          disabled={!canEdit}
                          className={`p-1.5 rounded transition-colors ${editConfig.className}`}
                          title={editConfig.title}
                        >
                          <EditIcon size={14} />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canDelete) onDelete?.(invoice, e);
                          }}
                          disabled={!canDelete}
                          className={`p-1.5 rounded transition-colors ${
                            canDelete
                              ? "hover:bg-red-50 hover:text-red-600 text-gray-400 cursor-pointer"
                              : "text-gray-200 cursor-not-allowed"
                          }`}
                          title={
                            canDelete
                              ? "Delete Invoice"
                              : "Confirmed invoices cannot be deleted"
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Empty State
              <tr>
                <td colSpan={columnCount} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#000060]/5 flex items-center justify-center">
                      <Package size={24} className="text-[#000060]/40" />
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        No sales invoices found
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {showBranchColumn
                          ? "No invoices found across all branches"
                          : "Try adjusting your filters or create a new sale"}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed Pagination Footer */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50/80">
        {children}
      </div>
    </div>
  );
};

export default SalesTable;
