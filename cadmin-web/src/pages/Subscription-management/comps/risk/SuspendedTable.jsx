// cadmin-web/src/pages/Subscription-management/comps/risk/SuspendedTable.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/SuspendedTable.jsx

import { useState, useEffect, useCallback } from "react";
import { Ban, ChevronUp, ChevronDown } from "lucide-react";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import Pagination from "../../../../components/common/Pagination";
import {
  TABLE_CONFIG,
  getClickableRowClass,
} from "../../../../config/tableConfig";
import { formatDate } from "../../../../config/modules/subscriptionRiskConfig";

const COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  { key: "shop_name", label: "Shop Name", width: 220, sortable: true, align: "left" },
  { key: "plan_name", label: "Plan", width: 140, sortable: true, align: "left" },
  { key: "updated_at", label: "Suspended On", width: 130, sortable: true, align: "left" },
  { key: "owner", label: "Owner", width: 200, sortable: true, align: "left" },
];

export default function SuspendedTable({
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
          <table className="w-full border-collapse text-sm" style={{ minWidth: "650px" }}>
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
                data.map((subscription, index) => (
                  <tr
                    key={subscription.subscription_id}
                    onClick={() => handleRowClick(subscription)}
                    className={getClickableRowClass(index, true)}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                      {startIndex + index + 1}
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Ban size={14} className="text-red-500 flex-shrink-0" />
                          <span className="font-medium truncate max-w-[180px] text-gray-500">
                            {subscription.shop_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 truncate pl-5">
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
                      {formatDate(subscription.updated_at)}
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                      <div className="flex flex-col">
                        <span className="truncate max-w-[180px]">
                          {subscription.owner_name || "N/A"}
                        </span>
                        <span className="text-xs text-gray-400 truncate max-w-[180px]">
                          {subscription.owner_email || ""}
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

      {showEmpty && <TableEmptyState icon={Ban} title={emptyTitle} subtitle={emptySubtitle} />}

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