// cadmin-web/src/pages/Subscription-management/comps/risk/ExpiringTable.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/ExpiringTable.jsx

import { useEffect, useState, useCallback } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import Pagination from "../../../../components/common/Pagination";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../config/tableConfig";
import {
  formatDate,
  formatDaysLeft,
  getDaysLeftStyle,
  getPaymentStatusBadge,
} from "../../../../config/modules/subscriptionRiskConfig";

const COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  { key: "shop_name", label: "Shop Name", width: 220, sortable: true, align: "left" },
  { key: "plan_name", label: "Plan", width: 140, sortable: true, align: "left" },
  { key: "end_date", label: "Expires On", width: 130, sortable: true, align: "left" },
  { key: "days_left", label: "Days Left", width: 120, sortable: true, align: "center" },
  { key: "payment_status", label: "Payment", width: 120, sortable: false, align: "center" },
];

export default function ExpiringTable({
  data = [],
  loading = false,
  currentPage = 1,
  setCurrentPage,
  rowsPerPage = 10,
  totalItems = 0,
  emptyTitle,
  emptySubtitle,
  onViewDetails,
  sortConfig = { sortBy: null, order: null },
  onSortChange,
}) {
  const { styles, heights } = TABLE_CONFIG;

  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    COLUMNS.forEach((col) => {
      widths[col.key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = data.length > 0;
  const showTable = loading || hasData;
  const showEmpty = !loading && !hasData;
  const showPagination = !loading && totalItems > 0;

  const handleMouseDown = (columnKey, e) => {
    if (columnKey === "slNo") return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column: columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey],
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing]
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

  const handleRowClick = (subscription) => {
    onViewDetails?.(subscription);
  };

  const SortableHeader = ({ column }) => {
    const isActive = sortConfig.sortBy === column.key;
    const isAsc = isActive && sortConfig.order === "asc";
    const isDesc = isActive && sortConfig.order === "desc";

    return (
      <th
        style={{ width: columnWidths[column.key], minWidth: 50 }}
        className={`relative group ${column.align === "center" ? "text-center" : ""}`}
      >
        <div
          className={`flex items-center ${styles.header.cell} ${
            column.sortable ? "cursor-pointer select-none" : ""
          } ${column.align === "center" ? "justify-center" : "justify-between"}`}
          onClick={() => column.sortable && onSortChange?.(column.key)}
        >
          <span>{column.label}</span>
          {column.sortable && (
            <div className="flex flex-col gap-0.5 ml-1">
              <ChevronUp
                size={12}
                className={`transition-colors ${
                  isAsc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
              <ChevronDown
                size={12}
                className={`-mt-1 transition-colors ${
                  isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
            </div>
          )}
        </div>
        {column.key !== "slNo" && (
          <div
            onMouseDown={(e) => handleMouseDown(column.key, e)}
            className={styles.header.resizeHandle}
          />
        )}
      </th>
    );
  };

  return (
    <div className={styles.container.wrapper}>
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "700px" }}>
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                {COLUMNS.map((col) => (
                  <SortableHeader key={col.key} column={col} />
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={COLUMNS.map((c) => c.key).filter((k) => k !== "slNo")}
                />
              ) : (
                data.map((subscription, index) => {
                  const paymentBadge = getPaymentStatusBadge(subscription.payment_status);
                  const daysStyle = getDaysLeftStyle(subscription.days_left);

                  return (
                    <tr
                      key={subscription.subscription_id}
                      onClick={() => handleRowClick(subscription)}
                      className={getClickableRowClass(index, subscription.is_critical)}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                        {startIndex + index + 1}
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">
                            {subscription.shop_name}
                          </span>
                          <span className="text-xs text-gray-400 truncate">
                            {subscription.shop_city}, {subscription.shop_state}
                          </span>
                        </div>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                        <span className="truncate max-w-[130px] block">
                          {subscription.plan_name}
                        </span>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                        {formatDate(subscription.end_date)}
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${daysStyle}`}
                        >
                          {subscription.is_critical && <Clock size={12} />}
                          {formatDaysLeft(subscription.days_left)}
                        </span>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border min-w-[80px] ${paymentBadge.className}`}
                        >
                          {paymentBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmpty && (
        <TableEmptyState icon={Clock} title={emptyTitle} subtitle={emptySubtitle} />
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
}