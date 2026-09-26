// pharmacy-web/src/pages/sales/returns/components/SalesReturnsTable.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/returns/components/SalesReturnsTable.jsx

import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Package,
  Eye,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import Pagination from "../../../../components/common/Pagination";
import useDynamicRowCount from "../../../../hooks/useDynamicRowCount";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const RETURN_REASON_LABELS = {
  EXPIRED_PRODUCT: "Expired",
  DAMAGED_PRODUCT: "Damaged",
  WRONG_PRODUCT: "Wrong Item",
  CUSTOMER_REQUEST: "Customer Request",
  QUALITY_ISSUE: "Quality Issue",
  PRICE_DISPUTE: "Price Dispute",
  OTHER: "Other",
  // Legacy mappings
  CUSTOMER_CHANGED_MIND: "Changed Mind",
  WRONG_ITEM_SOLD: "Wrong Item",
  ALLERGIC_REACTION: "Allergic",
  DOCTOR_ADVISED: "Doctor Advised",
};

//  FIX: Map ALL possible refund_mode values from schema
const REFUND_MODE_CONFIG = {
  // Schema values (what backend sends)
  CASH: {
    label: "Cash Refund",
    color: "emerald",
    icon: "₹",
  },
  CREDIT: {
    label: "Credit Note",
    color: "blue",
    icon: "📄",
  },
  ADJUST_NEXT: {
    label: "Adjust Next",
    color: "purple",
    icon: "🔄",
  },
  // Legacy/alternate values (for backwards compatibility)
  CASH_REFUND: {
    label: "Cash Refund",
    color: "emerald",
    icon: "₹",
  },
  CREDIT_NOTE: {
    label: "Credit Note",
    color: "blue",
    icon: "📄",
  },
  EXCHANGE: {
    label: "Exchange",
    color: "purple",
    icon: "🔄",
  },
};

const STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
};

const formatCurrency = (value) => {
  const num = Math.abs(parseFloat(value) || 0);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_APPROVAL;
  const StatusIcon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <StatusIcon size={10} />
      {config.label}
    </span>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TABLE ROW COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const SalesReturnsTableRow = React.forwardRef(
  (
    { item, rowNumber, isEven, onViewReturn, actionLoading, rowHeight },
    ref,
  ) => {
    //  FIX: Use invoice_id and invoice_number (returns ARE invoices)
    const returnNumber = item.invoice_number || "N/A";

    //  FIX: Parent invoice is accessed via parentInvoice relation
    const originalInvoiceNumber = item.parentInvoice?.invoice_number || "N/A";

    //  FIX: Get refund_mode - check multiple possible fields
    const refundMode = item.refund_mode || item.adjustment_type;
    const refundConfig = REFUND_MODE_CONFIG[refundMode];

    //  FIX: Get customer info correctly
    const customerName =
      item.customer?.name || item.walkin_name || "Walk-in Customer";
    const customerPhone = item.customer?.phone || item.walkin_phone || "";

    //  FIX: Get item count correctly
    const itemCount = item._count?.lineItems ?? item.lineItems?.length ?? 0;

    // Debug log
    console.log(`Row ${rowNumber}:`, {
      refund_mode: item.refund_mode,
      adjustment_type: item.adjustment_type,
      refundMode,
      refundConfig,
    });

    return (
      <tr
        ref={ref}
        className={`group transition-colors ${isEven ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/50`}
        style={{ height: `${rowHeight}px` }}
      >
        {/* Row Number */}
        <td className="px-2 py-1 text-center border-r border-slate-100">
          <span className="text-[10px] font-mono text-slate-400">
            {String(rowNumber).padStart(2, "0")}
          </span>
        </td>

        {/* Return Number */}
        <td className="px-2 py-1 border-r border-slate-100">
          <p className="font-mono font-bold text-[11px] text-[#000060] truncate">
            {returnNumber}
          </p>
        </td>

        {/* Original Invoice */}
        <td className="px-2 py-1 border-r border-slate-100">
          <p className="font-mono text-[10px] text-slate-600 truncate">
            {originalInvoiceNumber}
          </p>
        </td>

        {/* Customer */}
        <td className="px-2 py-1 border-r border-slate-100">
          <p className="font-medium text-[11px] text-slate-900 truncate">
            {customerName}
          </p>
          {customerPhone && (
            <p className="text-[9px] text-slate-500 truncate">
              {customerPhone}
            </p>
          )}
        </td>

        {/* Items Count */}
        <td className="px-2 py-1 text-center border-r border-slate-100">
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
            {itemCount}
          </span>
        </td>

        {/* Return Reason */}
        <td className="px-2 py-1 border-r border-slate-100">
          <span className="inline-block text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded truncate max-w-full">
            {RETURN_REASON_LABELS[item.return_reason] ||
              item.return_reason ||
              "N/A"}
          </span>
        </td>

        {/* Adjustment Type / Refund Mode */}
        <td className="px-2 py-1 border-r border-slate-100">
          {refundConfig ? (
            <span
              className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded truncate ${
                refundConfig.color === "emerald"
                  ? "bg-emerald-100 text-emerald-700"
                  : refundConfig.color === "blue"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
              }`}
            >
              <span>{refundConfig.icon}</span>
              <span>{refundConfig.label}</span>
            </span>
          ) : (
            <span className="text-[9px] text-slate-400">
              {refundMode || "-"}
            </span>
          )}
        </td>

        {/* Amount */}
        <td className="px-2 py-1 text-right border-r border-slate-100">
          <p className="font-bold text-[11px] text-[#000060]">
            {formatCurrency(item.net_amount)}
          </p>
        </td>

        {/* Status */}
        <td className="px-2 py-1 text-center border-r border-slate-100">
          <StatusBadge status={item.return_approval_status} />
        </td>

        {/* Date */}
        <td className="px-2 py-1 text-center border-r border-slate-100">
          <span className="text-[10px] text-slate-600">
            {formatDate(item.invoice_date || item.created_at)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-2 py-1 text-center">
          <button
            onClick={() => onViewReturn(item)}
            disabled={actionLoading}
            className="p-1.5 rounded-lg bg-[#000060]/10 text-[#000060] hover:bg-[#000060]/20 transition-colors disabled:opacity-50"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </td>
      </tr>
    );
  },
);

SalesReturnsTableRow.displayName = "SalesReturnsTableRow";

// ════════════════════════════════════════════════════════════════════════════
// MAIN TABLE COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const SalesReturnsTable = ({
  data = [],
  loading = false,
  actionLoading = false,
  onViewReturn,
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const headerRef = useRef(null);
  const rowRefs = useRef([]);

  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollInfo, setScrollInfo] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  const visibleRows = useDynamicRowCount();
  const rowHeight = 42;
  const viewportHeight = visibleRows * rowHeight;

  const columnWidths = {
    rowNum: "4%",
    returnNum: "11%",
    originalInvoice: "10%",
    customer: "14%",
    items: "5%",
    reason: "11%",
    adjustment: "11%",
    amount: "10%",
    status: "9%",
    date: "8%",
    actions: "7%",
  };

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / visibleRows);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, currentPage, totalPages]);

  const startIndex = (currentPage - 1) * visibleRows;
  const paginatedItems = data.slice(startIndex, startIndex + visibleRows);

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, paginatedItems.length);
    while (rowRefs.current.length < paginatedItems.length) {
      rowRefs.current.push(null);
    }
  }, [paginatedItems.length]);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    const width = container.offsetWidth - container.clientWidth;
    setScrollbarWidth(width);
  }, [paginatedItems.length, visibleRows]);

  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setScrollInfo({
      canScrollUp: scrollTop > 0,
      canScrollDown: scrollTop + clientHeight < scrollHeight - 5,
    });
  }, []);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener("scroll", updateScrollInfo);
  }, [updateScrollInfo]);

  const scrollToTop = useCallback(() => {
    tableBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    tableBodyRef.current?.scrollTo({
      top: tableBodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const hasOverflow = paginatedItems.length > visibleRows;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#000060]/20 border-t-[#000060] rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading returns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
      ref={tableContainerRef}
    >
      {/* Header Stats Bar */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-[#000060]" />
            <span className="text-xs text-slate-500 font-medium">Total:</span>
            <span className="text-sm font-bold text-[#000060]">
              {totalItems}
            </span>
          </div>

          {totalPages > 1 && (
            <>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">Page</span>
                <span className="font-bold text-slate-700">
                  {currentPage}/{totalPages}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasOverflow && (
            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
              <button
                onClick={scrollToTop}
                disabled={!scrollInfo.canScrollUp}
                className="p-1 text-slate-400 hover:text-[#000060] hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Scroll to top"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={scrollToBottom}
                disabled={!scrollInfo.canScrollDown}
                className="p-1 text-slate-400 hover:text-[#000060] hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Scroll to bottom"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div
          ref={headerRef}
          className="shrink-0 overflow-hidden border-b-2 border-slate-300"
          style={{ paddingRight: `${scrollbarWidth}px` }}
        >
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: columnWidths.rowNum }} />
              <col style={{ width: columnWidths.returnNum }} />
              <col style={{ width: columnWidths.originalInvoice }} />
              <col style={{ width: columnWidths.customer }} />
              <col style={{ width: columnWidths.items }} />
              <col style={{ width: columnWidths.reason }} />
              <col style={{ width: columnWidths.adjustment }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.status }} />
              <col style={{ width: columnWidths.date }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-[#000060] to-[#000080] text-white h-9">
                <th className="px-2 py-2 text-[10px] font-bold text-center border-r border-white/10">
                  #
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-left border-r border-white/10">
                  Return #
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-left border-r border-white/10">
                  Original Inv.
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-left border-r border-white/10">
                  Customer
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-center border-r border-white/10">
                  Items
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-left border-r border-white/10">
                  Reason
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-left border-r border-white/10">
                  Refund Mode
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-right border-r border-white/10">
                  Amount
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-center border-r border-white/10">
                  Status
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-center border-r border-white/10">
                  Date
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-center">
                  Actions
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Body */}
        <div
          ref={tableBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            height: `${viewportHeight}px`,
            maxHeight: `${viewportHeight}px`,
          }}
        >
          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: columnWidths.rowNum }} />
              <col style={{ width: columnWidths.returnNum }} />
              <col style={{ width: columnWidths.originalInvoice }} />
              <col style={{ width: columnWidths.customer }} />
              <col style={{ width: columnWidths.items }} />
              <col style={{ width: columnWidths.reason }} />
              <col style={{ width: columnWidths.adjustment }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.status }} />
              <col style={{ width: columnWidths.date }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <tbody>
              {paginatedItems.map((item, index) => (
                <SalesReturnsTableRow
                  key={item.invoice_id || index}
                  ref={(el) => (rowRefs.current[index] = el)}
                  item={item}
                  rowNumber={startIndex + index + 1}
                  isEven={index % 2 === 0}
                  onViewReturn={onViewReturn}
                  actionLoading={actionLoading}
                  rowHeight={rowHeight}
                />
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {data.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Package size={28} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No returns found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="shrink-0 border-t border-slate-200 bg-slate-50">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={visibleRows}
          />
        </div>
      )}
    </div>
  );
};

export default SalesReturnsTable;
