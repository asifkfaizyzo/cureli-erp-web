import React, { useState, useEffect } from "react";
import {
  Link2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Building2,
  RefreshCw,
  Clock,
  CheckCircle,
  Users,
  Unlink,
  RotateCcw,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import StyledSelect from "../../../components/common/StyledSelect";
import ShopMultiSelect from "./ShopMultiSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const HistoryTable = ({
  data = [],
  meta = {},
  filters = {},
  onFiltersChange,
  onRelink,
  onUnlink,
  onUnignore,
  onOpenAdminActivity,
  loading = false,
}) => {
  const defaultWidths = {
    index: 48,
    shopMed: 210,
    action: 155,
    status: 95,
    match: 210,
    actionBy: 120,
    actionDate: 120,
    actions: 100,
  };
  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (col, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ col, startX: e.clientX, startWidth: columnWidths[col] });
  };

  const [localSearch, setLocalSearch] = useState(filters.search || "");

  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filters.search || "")) {
        onFiltersChange({ search: localSearch, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleMouseMove = (e) => {
    if (!resizing) return;
    setColumnWidths((p) => ({
      ...p,
      [resizing.col]: Math.max(
        50,
        resizing.startWidth + (e.clientX - resizing.startX),
      ),
    }));
  };

  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  const handleSort = (key) => {
    const isAsc = filters.sort === key && filters.order === "asc";
    onFiltersChange({ sort: key, order: isAsc ? "desc" : "asc", page: 1 });
  };

  const SortIcon = ({ sortKey }) => {
    if (!sortKey) return null;
    const isActive = filters.sort === sortKey;
    if (isActive) {
      return filters.order === "asc" ? (
        <ChevronUp size={14} className={`${styles.header.sortIcon.active} flex-shrink-0`} />
      ) : (
        <ChevronDown size={14} className={`${styles.header.sortIcon.active} flex-shrink-0`} />
      );
    }
    return (
      <ChevronsUpDown size={14} className={`${styles.header.sortIcon.inactive} flex-shrink-0`} />
    );
  };

  const ResizableTh = ({ col, children, align = "left", sortKey }) => (
    <th
      style={{ width: columnWidths[col], minWidth: 50, height: `${heights.headerRow}px` }}
      className="relative group"
    >
      <div
        className={`flex items-center gap-1 h-full ${styles.header.cell}
          ${align === "center" ? "justify-center" : "justify-start"}
          ${sortKey ? "cursor-pointer select-none" : ""}`}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <span className="text-sm font-semibold text-white whitespace-nowrap">{children}</span>
        <SortIcon sortKey={sortKey} />
      </div>
      <div
        onMouseDown={(e) => handleMouseDown(col, e)}
        className={styles.header.resizeHandle}
      />
    </th>
  );

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  // ── 4-state badges matching new backend statuses ──
  const getStatusBadge = (status) => {
    switch (status) {
      case "LINKED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
            Linked
          </span>
        );
      case "UNLINKED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-50 text-orange-700 border-orange-200">
            Unlinked
          </span>
        );
      case "IGNORED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200">
            Ignored
          </span>
        );
      case "RESTORED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
            Restored
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-gray-50 text-gray-500 border-gray-200">
            {status}
          </span>
        );
    }
  };

  const tableHeader = (
    <thead className="sticky top-0 z-10">
      <tr className={styles.header.row}>
        <ResizableTh col="index">#</ResizableTh>
        <ResizableTh col="shopMed" sortKey="rawName">Shop Medicine</ResizableTh>
        <ResizableTh col="action">Action</ResizableTh>
        <ResizableTh col="status" align="center" sortKey="status">Result</ResizableTh>
        <ResizableTh col="match">Variant</ResizableTh>
        <ResizableTh col="actionBy">By</ResizableTh>
        <ResizableTh col="actionDate" sortKey="actionDate">Date & Time</ResizableTh>
        <ResizableTh col="actions" align="center">Actions</ResizableTh>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Filters ── */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-2 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="col-span-1 md:col-span-2 relative">
            <label className="text-xs text-gray-500 font-medium mb-1 block">Search Medicine</label>
            <input
              type="text"
              placeholder="Search by medicine name, manufacturer..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <StyledSelect
              label="Event Type"
              value={filters.status || ""}
              onChange={(v) => onFiltersChange({ status: v, page: 1 })}
              options={[
                { value: "", label: "All Events" },
                { value: "linked", label: "Linked" },
                { value: "unlinked", label: "Unlinked" },
                { value: "ignored", label: "Ignored" },
                { value: "restored", label: "Restored / Rejected" },
              ]}
            />
          </div>

          <div>
            <ShopMultiSelect
              label="Filter by Shop"
              context="unmapped"
              value={filters.selectedShops || []}
              onChange={(selected) =>
                onFiltersChange({
                  selectedShops: selected,
                  shopIds: selected.map((s) => s.id).join(","),
                  page: 1,
                })
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-48">
            <StyledDateFilter
              label="From Date"
              date={filters.dateFrom || ""}
              setDate={(date) => onFiltersChange({ dateFrom: date, page: 1 })}
            />
          </div>
          <div className="w-48">
            <StyledDateFilter
              label="To Date"
              date={filters.dateTo || ""}
              setDate={(date) => onFiltersChange({ dateTo: date, page: 1 })}
            />
          </div>

          <div className="flex-1" />

          {onOpenAdminActivity && (
            <button
              onClick={onOpenAdminActivity}
              className="h-10 px-3.5 bg-[#000060] text-white rounded-lg text-xs font-semibold
                         hover:bg-[#000080] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Users size={14} />
              Admin Activity
            </button>
          )}

          <span className="text-xs text-gray-400">
            {meta.total || 0} event{meta.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.container.wrapper}>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <table className="w-full border-collapse text-sm" style={{ minWidth: 1000 }}>
              {tableHeader}
              <tbody><TableSkeleton rows={filters.limit || 10} columns={8} /></tbody>
            </table>
          ) : data.length === 0 ? (
            <TableEmptyState
              icon={Clock}
              title="No mapping history found"
              subtitle={
                filters.search || filters.shopIds || filters.dateFrom
                  ? "Adjust search filters to view older events"
                  : "Link, unlink, and ignore actions will appear here as a timeline"
              }
            />
          ) : (
            <table className="w-full border-collapse text-sm" style={{ minWidth: 1000 }}>
              {tableHeader}
              <tbody>
                {data.map((item, index) => {
                  const isLinked = item.status === "LINKED";
                  const isUnlinked = item.status === "UNLINKED";
                  const isIgnored = item.status === "IGNORED";
                  const isRestored = item.status === "RESTORED";
                  const isSystem = item.actionBy?.toLowerCase() === "system";

                  // Build a medicine-shaped object for the parent callbacks
                  const medItem = { ...item, id: item.medicineId || item.id };

                  return (
                    <tr key={item.id} className={`${getRowBgClass(index)} h-[56px]`}>
                      {/* # */}
                      <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                        {((meta.page || 1) - 1) * (meta.limit || 10) + index + 1}
                      </td>

                      {/* Shop Medicine */}
                      <td className={styles.cell.base}>
                        <div>
                          <p className={`${styles.cell.primary} truncate max-w-[190px]`}>
                            {item.rawName}
                          </p>
                          {item.manufacturer && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Building2 size={10} />
                              <span className="truncate max-w-[170px]">{item.manufacturer}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action (what happened) */}
                      <td className={styles.cell.base}>
                        <span className="text-xs font-medium text-gray-700">
                          {item.actionLabel || "—"}
                        </span>
                        {item.bulkCount && (
                          <span className="ml-1 text-[10px] text-gray-400">
                            (×{item.bulkCount})
                          </span>
                        )}
                      </td>

                      {/* Result badge */}
                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Variant */}
                      <td className={styles.cell.base}>
                        {isLinked && item.linkedVariant ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Link2 size={12} className="text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate max-w-[160px]">
                                {item.linkedVariant.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono truncate">
                                SKU: {item.linkedVariant.skuId}
                              </p>
                            </div>
                          </div>
                        ) : isUnlinked && item.previouslyLinkedVariant ? (
                          <div className="flex items-center gap-2 opacity-60">
                            <div className="w-7 h-7 rounded bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                              <Unlink size={12} className="text-orange-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-500 truncate max-w-[160px] line-through">
                                {item.previouslyLinkedVariant.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono truncate">
                                SKU: {item.previouslyLinkedVariant.skuId}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400">—</span>
                        )}
                      </td>

                      {/* By */}
                      <td className={styles.cell.base}>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSystem
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.actionBy}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className={styles.cell.base}>
                        {item.actionDate ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">
                              {formatDate(item.actionDate)}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {formatTime(item.actionDate)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400">—</span>
                        )}
                      </td>

                      {/* Actions — only on latest event per medicine */}
                      <td className={styles.cell.base}>
                        {item.isLatest && item.medicineId ? (
                          <div className={styles.actions.container}>
                            {isLinked && (
                              <button
                                onClick={() => onUnlink(medItem)}
                                className={`${styles.actions.button.base} ${styles.actions.button.suspend}`}
                                title="Unlink"
                              >
                                <XCircle size={13} />
                              </button>
                            )}
                            {(isUnlinked || isIgnored || isRestored) && (
                              <>
                                <button
                                  onClick={() => onRelink(medItem)}
                                  className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                                  title="Link to Variant"
                                >
                                  <Link2 size={13} />
                                </button>
                                <button
                                  onClick={() => onUnignore(medItem)}
                                  className={`${styles.actions.button.base} ${styles.actions.button.activate}`}
                                  title="Send to Unmapped"
                                >
                                  <RotateCcw size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">historical</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {meta.total > 0 && !loading && (
          <div className={styles.pagination.wrapper}>
            <Pagination
              currentPage={filters.page || 1}
              setCurrentPage={(page) => onFiltersChange({ page })}
              totalItems={meta.total}
              rowsPerPage={filters.limit || 10}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;