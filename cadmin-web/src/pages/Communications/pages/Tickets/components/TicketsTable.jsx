// cadmin-web/src/pages/Communications/pages/Tickets/components/TicketsTable.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Tickets/components/TicketsTable.jsx

import { useEffect, useState, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  RotateCcw,
  FileText,
  Calendar,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../../config/tableConfig";
import TableSkeleton from "../../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../../components/common/TableEmptyState";
import Pagination from "../../../../../components/common/Pagination";
import {
  getStatusConfig,
  getCategoryConfig,
  getPriorityConfig,
} from "../../../../../config/ticketConfigs";

const COLUMNS = {
  slNo: { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  ticket: {
    key: "ticket_number",
    label: "Ticket",
    width: 130,
    sortable: true,
    align: "left",
  },
  shop: {
    key: "shop",
    label: "Shop",
    width: 150,
    sortable: false,
    align: "left",
  },
  subject: {
    key: "subject",
    label: "Subject",
    width: 200,
    sortable: false,
    align: "left",
  },
  category: {
    key: "category",
    label: "Category",
    width: 100,
    sortable: false,
    align: "center",
  },
  priority: {
    key: "priority",
    label: "Priority",
    width: 130,
    sortable: true,
    align: "left",
  },
  status: {
    key: "status",
    label: "Status",
    width: 110,
    sortable: true,
    align: "center",
  },
  createdAt: {
    key: "created_at",
    label: "Created",
    width: 120,
    sortable: true,
    align: "left",
  },
};

// Status Badge
const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap min-w-[80px] justify-center`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}
      />
      {config.label}
    </span>
  );
};

// Category Badge
const CategoryBadge = ({ category }) => {
  const config = getCategoryConfig(category);
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium text-center
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap min-w-[70px]`}
    >
      {config.label}
    </span>
  );
};

// Priority Cell
const PriorityCell = ({ priority, reopenCount = 0 }) => {
  const config = getPriorityConfig(priority);
  const hasReopens = reopenCount > 0;
  const isCritical = reopenCount >= 5;
  const isHigh = reopenCount >= 3;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold 
                    ${config.bg} ${config.text} border ${config.border}
                    ${config.pulse ? "animate-pulse" : ""}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      {hasReopens && (
        <span
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                      ${
                        isCritical
                          ? "bg-red-100 text-red-700"
                          : isHigh
                            ? "bg-orange-100 text-orange-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
          title={`Reopened ${reopenCount}x`}
        >
          <RotateCcw size={9} />
          {reopenCount}
        </span>
      )}
    </div>
  );
};

const TicketsTable = ({
  tickets = [],
  loading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortConfig,
  onSortChange,
  onViewTicket,
  hasActiveFilters = false,
  // Permission flag passed from parent
  canViewDetail = true,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.entries(COLUMNS).forEach(([key, col]) => {
      widths[key] = col.width;
    });
    return widths;
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    if (column === "slNo") return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing],
  );

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM, HH:mm");
    } catch {
      return "-";
    }
  };

  const handleRowClick = (ticket) => {
    // Only trigger if admin has canViewDetail — parent handler also guards this,
    // but the cursor style below gives the user a visual cue before clicking.
    if (!canViewDetail) return;
    onViewTicket(ticket);
  };

  const SortableHeader = ({ column }) => {
    const config = COLUMNS[column];
    const columnToBackendMap = {
      ticket: "ticket_number",
      createdAt: "created_at",
      priority: "reopen_count",
      status: "status",
    };
    const backendColumn = columnToBackendMap[column] || column;
    const isActive = sortConfig?.sortBy === backendColumn;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th
        style={{
          width: columnWidths[column],
          height: `${heights.headerRow}px`,
        }}
        className="relative group"
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} cursor-pointer select-none`}
          onClick={() => config.sortable && onSortChange?.(column)}
        >
          <span>{config.label}</span>
          {config.sortable && (
            <div className="flex flex-col gap-0.5">
              <ChevronUp
                size={12}
                className={
                  isAsc
                    ? styles.header.sortIcon.active
                    : styles.header.sortIcon.inactive
                }
              />
              <ChevronDown
                size={12}
                className={`-mt-1 ${isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive}`}
              />
            </div>
          )}
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];
    if (config.sortable) return <SortableHeader column={column} />;
    return (
      <th
        style={{
          width: columnWidths[column],
          height: `${heights.headerRow}px`,
        }}
        className={`relative group ${config.align === "center" ? "text-center" : ""}`}
      >
        <div className={styles.header.cell}>{config.label}</div>
        {column !== "slNo" && (
          <div
            onMouseDown={(e) => handleMouseDown(column, e)}
            className={styles.header.resizeHandle}
          />
        )}
      </th>
    );
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = tickets.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  return (
    <div className={styles.container.wrapper}>
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table
            className="w-full border-collapse text-sm"
            style={{ minWidth: "900px" }}
          >
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader column="slNo" />
                <SortableHeader column="ticket" />
                <TableHeader column="shop" />
                <TableHeader column="subject" />
                <TableHeader column="category" />
                <SortableHeader column="priority" />
                <SortableHeader column="status" />
                <SortableHeader column="createdAt" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton columns={8} rows={rowsPerPage} />
              ) : (
                tickets.map((ticket, index) => (
                  <tr
                    key={ticket.ticket_id}
                    onClick={() => handleRowClick(ticket)}
                    style={{ height: `${heights.bodyRow}px` }}
                    className={
                      canViewDetail
                        ? getClickableRowClass(index, false)
                        : // Non-clickable: same row styling but no pointer cursor
                          getClickableRowClass(index, false).replace(
                            "cursor-pointer",
                            "cursor-default",
                          )
                    }
                  >
                    {/* Serial Number */}
                    <td
                      className={`${styles.cell.base} ${styles.cell.muted} font-medium`}
                    >
                      {startIndex + index + 1}
                    </td>

                    {/* Ticket Number */}
                    <td className={styles.cell.base}>
                      <div className="flex items-center gap-1.5">
                        <FileText
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="font-semibold text-[#05015A] truncate max-w-[100px]">
                          {ticket.ticket_number}
                        </span>
                      </div>
                    </td>

                    {/* Shop Name */}
                    <td className={styles.cell.base}>
                      <span
                        className={`text-sm ${styles.cell.primary} truncate max-w-[130px] block`}
                        title={ticket.shop_name}
                      >
                        {ticket.shop_name || "-"}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className={styles.cell.base}>
                      <p
                        className={`text-sm ${styles.cell.secondary} truncate max-w-[180px]`}
                        title={ticket.subject}
                      >
                        {ticket.subject || "-"}
                      </p>
                    </td>

                    {/* Category */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <CategoryBadge category={ticket.category} />
                    </td>

                    {/* Priority + Reopen */}
                    <td className={styles.cell.base}>
                      <PriorityCell
                        priority={ticket.priority}
                        reopenCount={ticket.reopen_count}
                      />
                    </td>

                    {/* Status */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <StatusBadge status={ticket.status} />
                    </td>

                    {/* Created Date */}
                    <td className={styles.cell.base}>
                      <div className="flex items-center gap-1.5">
                        <Calendar
                          size={12}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className={`text-xs ${styles.cell.secondary}`}>
                          {formatDateTime(ticket.created_at)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmptyState && (
        <TableEmptyState
          icon={Ticket}
          title={hasActiveFilters ? "No matching tickets" : "No tickets yet"}
          subtitle={
            hasActiveFilters
              ? "Try adjusting your filters"
              : "Tickets will appear here when created"
          }
        />
      )}

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}
    </div>
  );
};

export default TicketsTable;
