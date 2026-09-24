// pharmacy-web/src/pages/tickets/components/TicketListTable.jsx (do not remove this comment)
// pharmacy-web/src/pages/tickets/components/TicketListTable.jsx

import { useState } from "react";
import {
  Eye,
  XCircle,
  ChevronUp,
  ChevronDown,
  Loader2,
  FileText,
  Inbox,
  Plus,
  Search,
  FilterX,
  Paperclip,
} from "lucide-react";
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  EMPTY_STATE_MESSAGES,
} from "../../../constant/tickets";
import { format, formatDistanceToNow } from "date-fns";
import Pagination from "../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../config/tableConfig";

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    IN_PROGRESS: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
    },
    RESOLVED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    CANCELLED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
    },
    CLOSED: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-500",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const label = TICKET_STATUSES[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold ${config.bg} ${config.text} border ${config.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === "IN_PROGRESS" ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  );
};

// ============================================
// CATEGORY BADGE COMPONENT
// ============================================
const CategoryBadge = ({ category }) => {
  const categoryConfig = {
    TECHNICAL_ISSUE: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
    },
    BILLING_ISSUE: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    FEATURE_REQUEST: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
    },
    ACCOUNT_ISSUE: {
      bg: "bg-pink-50",
      text: "text-pink-700",
      border: "border-pink-200",
    },
    OTHER: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    },
  };

  const config = categoryConfig[category] || categoryConfig.OTHER;
  const label = TICKET_CATEGORIES[category] || category;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
    >
      {label}
    </span>
  );
};

// ============================================
// SORT INDICATOR COMPONENT
// ============================================
const SortIndicator = ({ column, sortConfig }) => {
  const isActive = sortConfig.sortBy === column;

  if (!isActive) {
    return (
      <div className="opacity-0 group-hover:opacity-50 transition-opacity">
        <ChevronUp size={14} className="text-white" />
      </div>
    );
  }

  return (
    <div className="text-white">
      {sortConfig.order === "asc" ? (
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      )}
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyState = ({ hasActiveFilters, onCreateTicket }) => {
  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <FilterX size={32} className="text-amber-500" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-lg font-semibold text-gray-900">
            {EMPTY_STATE_MESSAGES.NO_RESULTS}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search or filter criteria
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
          <Search size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">
            Tip: Clear filters to see all tickets
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#05015A]/10 to-[#0a0280]/20 flex items-center justify-center">
        <Inbox size={32} className="text-[#05015A]" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-lg font-semibold text-gray-900">
          {EMPTY_STATE_MESSAGES.NO_TICKETS}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Create your first support ticket
        </p>
      </div>
      {onCreateTicket && (
        <button
          onClick={onCreateTicket}
          className="mt-2 px-5 py-2.5 bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white rounded-xl text-sm font-semibold 
                     flex items-center gap-2 hover:shadow-lg hover:shadow-[#05015A]/25 hover:-translate-y-0.5
                     transition-all duration-200"
        >
          <Plus size={16} />
          <span>Create Your First Ticket</span>
        </button>
      )}
    </div>
  );
};

// ============================================
// LOADING STATE - SKELETON ROWS
// ============================================
const LoadingState = ({ rowCount = 5 }) => {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index} className="border-b border-gray-100 animate-pulse">
          <td className="px-4 py-3.5">
            <div className="h-4 w-6 bg-gray-200 rounded" />
          </td>
          <td className="px-4 py-3.5">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          </td>
          <td className="px-4 py-3.5">
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </td>
          <td className="px-4 py-3.5">
            <div className="space-y-1.5">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div className="space-y-1.5">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div className="flex justify-center gap-1">
              <div className="h-8 w-8 bg-gray-200 rounded-lg" />
              <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

// ============================================
// TICKET ROW COMPONENT
// ============================================
const TicketRow = ({
  ticket,
  index,
  currentPage,
  rowsPerPage,
  onViewTicket,
  onCancelTicket,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "-";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const canCancel =
    ticket.status === "PENDING" || ticket.status === "IN_PROGRESS";
  const hasAttachments = ticket.attachment_count > 0;

  // Get row styling from config
  const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50/50";

  return (
    <tr
      className={`group border-b border-gray-100 transition-all duration-150 ${rowBg} ${isHovered ? "bg-indigo-50/50" : "hover:bg-gray-50"}`}
      style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Number */}
      <td className="px-4 py-3 align-middle">
        <span className="text-sm text-gray-400 font-medium tabular-nums">
          {String((currentPage - 1) * rowsPerPage + index + 1).padStart(2, "0")}
        </span>
      </td>

      {/* Ticket Number & Subject */}
      <td className="px-4 py-3 align-middle">
        <button
          onClick={() => onViewTicket(ticket)}
          className="text-left group/ticket"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#05015A] group-hover/ticket:text-[#0a0280] transition-colors">
              {ticket.ticket_number}
            </span>
            {hasAttachments && (
              <span className="flex items-center gap-0.5 text-gray-400">
                <Paperclip size={12} />
                <span className="text-[10px]">{ticket.attachment_count}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-1 max-w-[280px] group-hover/ticket:text-gray-900 transition-colors">
            {ticket.subject}
          </p>
        </button>
      </td>

      {/* Category */}
      <td className="px-4 py-3 align-middle">
        <CategoryBadge category={ticket.category} />
      </td>

      {/* Status */}
      <td className="px-4 py-3 align-middle">
        <StatusBadge status={ticket.status} />
      </td>

      {/* Created By */}
      <td className="px-4 py-3 align-middle">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {ticket.created_by_name || "Unknown"}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {ticket.created_by_role?.replace("_", " ") || "-"}
          </p>
        </div>
      </td>

      {/* Created Date */}
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {formatDate(ticket.created_at)}
          </span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(ticket.created_at)}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 align-middle">
        <div
          className={`flex items-center justify-center gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-60"}`}
        >
          <button
            onClick={() => onViewTicket(ticket)}
            className="p-2 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-[#05015A]/10 transition-all"
            title="View Details"
          >
            <Eye size={18} />
          </button>

          {canCancel ? (
            <button
              onClick={() => onCancelTicket(ticket)}
              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Cancel Ticket"
            >
              <XCircle size={18} />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================
// MAIN TABLE COMPONENT
// ============================================
const TicketListTable = ({
  tickets,
  loading,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortConfig,
  onSortChange,
  onViewTicket,
  onCancelTicket,
  onCreateTicket,
  hasActiveFilters = false,
}) => {
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[900px]">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr
              className="bg-gradient-to-r from-[#05015A] to-[#0a0280]"
              style={{ height: `${TABLE_CONFIG.heights.headerRow}px` }}
            >
              <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider align-middle">
                #
              </th>
              <th
                onClick={() => onSortChange("ticket_number")}
                className="min-w-[280px] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none group align-middle"
              >
                <div className="flex items-center gap-2">
                  <span>Ticket</span>
                  <SortIndicator
                    column="ticket_number"
                    sortConfig={sortConfig}
                  />
                </div>
              </th>
              <th className="min-w-[130px] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle">
                Category
              </th>
              <th
                onClick={() => onSortChange("status")}
                className="min-w-[120px] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none group align-middle"
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  <SortIndicator column="status" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="min-w-[140px] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle">
                Created By
              </th>
              <th
                onClick={() => onSortChange("created_at")}
                className="min-w-[130px] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none group align-middle"
              >
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  <SortIndicator column="created_at" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider align-middle">
                Actions
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {/* Loading State */}
            {loading && <LoadingState rowCount={rowsPerPage} />}

            {/* Empty State */}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan="7">
                  <EmptyState
                    hasActiveFilters={hasActiveFilters}
                    onCreateTicket={onCreateTicket}
                  />
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading &&
              tickets.map((ticket, index) => (
                <TicketRow
                  key={ticket.ticket_id}
                  ticket={ticket}
                  index={index}
                  currentPage={currentPage}
                  rowsPerPage={rowsPerPage}
                  onViewTicket={onViewTicket}
                  onCancelTicket={onCancelTicket}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && tickets.length > 0 && totalPages > 0 && (
        <div
          className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50"
          style={{ height: `${TABLE_CONFIG.heights.pagination}px` }}
        >
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default TicketListTable;
