// pharmacy-web/src/pages/inventory/components/InventoryTable.jsx (do not remove this comment)
// src/pages/inventory/components/InventoryTable.jsx

import React, { useRef, useCallback, useEffect, useState } from "react";
import InventoryRowFixed    from "./InventoryRowFixed";
import InventoryPagination  from "../../../components/common/Pagination";
import { PortalTooltip }    from "../../../components/common/Tooltip";
import {
  ChevronUp,
  ChevronDown,
  Package,
  Layers,
  Building2,
  Link2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// CATALOG STATUS BADGE
// ══════════════════════════════════════════════════════════════

const CatalogStatusBadge = ({ status, confidence, loading }) => {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Loading...
      </span>
    );
  }

  const config = {
    LINKED: {
      label: "Linked",
      icon: CheckCircle,
      bg: "bg-emerald-100",
      border: "border-emerald-200",
      text: "text-emerald-700",
      iconColor: "text-emerald-500",
    },
    PENDING: {
      label: "Pending",
      icon: Clock,
      bg: "bg-amber-100",
      border: "border-amber-200",
      text: "text-amber-700",
      iconColor: "text-amber-500",
    },
    NOT_LINKED: {
      label: "Not Linked",
      icon: AlertCircle,
      bg: "bg-gray-100",
      border: "border-gray-200",
      text: "text-gray-700",
      iconColor: "text-gray-400",
    },
  };

  const c    = config[status] || config.NOT_LINKED;
  const Icon = c.icon;

  const getTooltipContent = () => {
    switch (status) {
      case "LINKED":
        return "This product is available on the mobile app";
      case "PENDING":
        return (
          <span>
            Pending admin approval for mobile app
            {confidence > 0 && (
              <>
                <br />
                <span className="text-gray-400 text-[10px]">
                  Match confidence: {confidence}%
                </span>
              </>
            )}
          </span>
        );
      default:
        return "Not yet available on the mobile app";
    }
  };

  return (
    <PortalTooltip content={getTooltipContent()} position="top" delay={300}>
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border cursor-default ${c.bg} ${c.border} ${c.text}`}
      >
        <Icon size={12} className={c.iconColor} />
        {c.label}
      </span>
    </PortalTooltip>
  );
};

// ══════════════════════════════════════════════════════════════
// COLUMN CONFIG
// ══════════════════════════════════════════════════════════════

const COLUMNS = {
  rowNum:        { key: "rowNum",        label: "#",            sortable: false, align: "center" },
  name:          { key: "name",          label: "Item Name",    sortable: true,  align: "left"   },
  category:      { key: "category",      label: "Category",     sortable: true,  align: "center" },
  catalogStatus: { key: "catalogStatus", label: "Catalog",      sortable: false, align: "center", icon: Link2 },
  resubs:        { key: "resubs",        label: "Resub",        sortable: true,  align: "center" },
  manufacturer:  { key: "manufacturer",  label: "Manufacturer", sortable: true,  align: "center" },
  batch:         { key: "batch",         label: "Batch",        sortable: true,  align: "center" },
  expiry:        { key: "expiry",        label: "Expiry",       sortable: true,  align: "center" },
  branch:        { key: "branch",        label: "Branch",       sortable: true,  align: "center", icon: Building2 },
  supplier:      { key: "supplier",      label: "Supplier",     sortable: true,  align: "center" },
  qty:           { key: "qty",           label: "Qty",          sortable: true,  align: "center" },
  mrp:           { key: "mrp",           label: "MRP",          sortable: true,  align: "center" },
  rack:          { key: "rack",          label: "Rack",         sortable: true,  align: "center" },
  status:        { key: "status",        label: "Status",       sortable: true,  align: "center" },
  actions:       { key: "actions",       label: "Actions",      sortable: false, align: "center" },
};

// ══════════════════════════════════════════════════════════════
// SKELETON ROW
// ══════════════════════════════════════════════════════════════

const SkeletonRow = ({ rowHeight, isEven, index, showBranchColumn }) => (
  <tr
    style={{ height: `${rowHeight}px` }}
    className={isEven ? "bg-gray-50" : "bg-white"}
  >
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1.5">
      <div className="space-y-1">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse w-[85%]"
          style={{ animationDelay: `${index * 30 + 50}ms` }} />
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-[60%]"
          style={{ animationDelay: `${index * 30 + 80}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="h-3 bg-gray-200 rounded animate-pulse w-[70%]"
        style={{ animationDelay: `${index * 30 + 100}ms` }} />
    </td>
        <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16"
          style={{ animationDelay: `${index * 30 + 110}ms` }} />
      </div>
    </td>
    {/* ADD THIS EMPTY OR PULSING TD FOR SKELETON ROW */}
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-8"
          style={{ animationDelay: `${index * 30 + 115}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="h-3 bg-gray-200 rounded animate-pulse w-[75%]"
        style={{ animationDelay: `${index * 30 + 120}ms` }} />
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"
          style={{ animationDelay: `${index * 30 + 140}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"
          style={{ animationDelay: `${index * 30 + 160}ms` }} />
      </div>
    </td>
    {showBranchColumn && (
      <td className="border-b border-r border-gray-100 p-1">
        <div className="flex justify-center">
          <div className="h-5 bg-gray-200 rounded-full animate-pulse w-20"
            style={{ animationDelay: `${index * 30 + 170}ms` }} />
        </div>
      </td>
    )}
    <td className="border-b border-r border-gray-100 p-1">
      <div className="h-3 bg-gray-200 rounded animate-pulse w-[80%]"
        style={{ animationDelay: `${index * 30 + 180}ms` }} />
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-end pr-1">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-8"
          style={{ animationDelay: `${index * 30 + 200}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-end pr-1">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-14"
          style={{ animationDelay: `${index * 30 + 220}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-8"
          style={{ animationDelay: `${index * 30 + 240}ms` }} />
      </div>
    </td>
    <td className="border-b border-r border-gray-100 p-1">
      <div className="flex justify-center">
        <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16"
          style={{ animationDelay: `${index * 30 + 260}ms` }} />
      </div>
    </td>
    <td className="border-b border-gray-100 p-1">
      <div className="flex justify-center gap-1">
        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30 + 280}ms` }} />
        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30 + 300}ms` }} />
      </div>
    </td>
  </tr>
);

// ══════════════════════════════════════════════════════════════
// MAIN TABLE COMPONENT
// Pagination is fully controlled by the parent (InventoryPage).
// This component renders exactly what it receives — no slicing.
// ══════════════════════════════════════════════════════════════

const InventoryTable = ({
  items = [],
  totalItems = 0,
  currentPage = 1,
  onPageChange,
  rowsPerPage = 10,
  onView,
  onEdit,
  onDelete,
  onAdjust,
  isLoading = false,
  isSearching = false,
  showBranchColumn = false,
  canAdjustStock = true,
  catalogLinkStatus = {},
  catalogStatusLoading = false,
  sortConfig = { sortBy: null, order: null },
  onSortChange,
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef      = useRef(null);
  const headerRef         = useRef(null);
  const rowRefs           = useRef([]);

  const rowHeight     = 36;
  const viewportHeight = rowsPerPage * rowHeight;

  // Column widths — resizable
  const getDefaultWidths = useCallback(() => {
    if (showBranchColumn) {
      return {
        rowNum: 32, itemName: 150, category: 90, catalogStatus: 90, resubs: 55,
        manufacturer: 95, batch: 80, expiry: 90, branch: 80,
        supplier: 95, qty: 55, mrp: 70, rack: 55, status: 80, actions: 80,
      };
    }
    return {
      rowNum: 32, itemName: 175, category: 90, catalogStatus: 90, resubs: 55,
      manufacturer: 100, batch: 80, expiry: 90, supplier: 110,
      qty: 60, mrp: 80, rack: 55, status: 80, actions: 60,
    };
  }, [showBranchColumn]);

  const [colWidths, setColWidths] = useState(getDefaultWidths);
  const [resizing,  setResizing]  = useState(null);

  useEffect(() => {
    setColWidths(getDefaultWidths());
  }, [showBranchColumn, getDefaultWidths]);

  const handleResizeStart = useCallback((colKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ column: colKey, startX: e.clientX, startWidth: colWidths[colKey] });
  }, [colWidths]);

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e) => {
      const diff     = e.clientX - resizing.startX;
      const newWidth = Math.max(40, resizing.startWidth + diff);
      setColWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    };
    const handleMouseUp = () => setResizing(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   handleMouseUp);
    };
  }, [resizing]);

  // Row number offset — items[0] is row (currentPage-1)*rowsPerPage + 1
  const startIndex = (currentPage - 1) * rowsPerPage;

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, items.length);
    while (rowRefs.current.length < items.length) rowRefs.current.push(null);
  }, [items.length]);

  const columnKeys = showBranchColumn
    ? ["rowNum","itemName","category","catalogStatus","resubs","manufacturer","batch","expiry","branch","supplier","qty","mrp","rack","status","actions"]
    : ["rowNum","itemName","category","catalogStatus","resubs","manufacturer","batch","expiry","supplier","qty","mrp","rack","status","actions"];

  const colToSortKey = {
    itemName: "name", category: "category", manufacturer: "manufacturer",
    batch: "batch", expiry: "expiry", branch: "branch", supplier: "supplier",
    qty: "qty", mrp: "mrp", rack: "rack", status: "status",
    resubs: "resubmission_count", // <-- ADD THIS
  };

  const SortableHeader = ({ colKey }) => {
    const col     = COLUMNS[colKey === "itemName" ? "name" : colKey];
    if (!col) return null;
    const sortKey = colToSortKey[colKey];
    const isActive = sortConfig?.sortBy === sortKey;
    const isAsc    = isActive && sortConfig?.order === "asc";
    const isDesc   = isActive && sortConfig?.order === "desc";
    const Icon     = col.icon;

    return (
      <th
        style={{ width: colWidths[colKey], minWidth: 40 }}
        className="relative group px-0.5 py-1 text-[11px] font-semibold text-center border-r border-white/10"
      >
        <div
          className={`flex items-center justify-center gap-1 ${col.sortable ? "cursor-pointer select-none" : ""}`}
          onClick={() => col.sortable && sortKey && onSortChange?.(sortKey)}
        >
          {Icon && <Icon size={9} />}
          <span>{col.label}</span>
          {col.sortable && (
            <div className="flex flex-col -space-y-0.5 ml-0.5">
              <ChevronUp
                size={10}
                className={`transition-colors ${isAsc ? "text-yellow-300" : "text-white/30"}`}
              />
              <ChevronDown
                size={10}
                className={`transition-colors ${isDesc ? "text-yellow-300" : "text-white/30"}`}
              />
            </div>
          )}
        </div>
        <div
          onMouseDown={(e) => handleResizeStart(colKey, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30 transition-colors"
        />
      </th>
    );
  };

  const renderColgroup = () => (
    <colgroup>
      {columnKeys.map((key) => (
        <col key={key} style={{ width: colWidths[key] }} />
      ))}
    </colgroup>
  );

  return (
    <div
      className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden"
      ref={tableContainerRef}
    >
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div ref={headerRef} className="shrink-0 overflow-hidden border-b-2 border-gray-200">
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            {renderColgroup()}
            <thead>
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-7">
                {columnKeys.map((colKey) => (
                  <SortableHeader key={colKey} colKey={colKey} />
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Body */}
        <div
          ref={tableBodyRef}
          className="flex-1 inventory-scroll-overlay relative"
          style={{ height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }}
        >
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            {renderColgroup()}
            <tbody>
              {isLoading
                ? Array.from({ length: rowsPerPage }).map((_, index) => (
                    <SkeletonRow
                      key={`skeleton-${index}`}
                      rowHeight={rowHeight}
                      isEven={index % 2 === 0}
                      index={index}
                      showBranchColumn={showBranchColumn}
                    />
                  ))
                : items.map((item, index) => (
                    <InventoryRowFixed
                      key={item.id || item.inventory_id || index}
                      ref={(el) => (rowRefs.current[index] = el)}
                      index={index}
                      item={item}
                      rowNumber={startIndex + index + 1}
                      isEven={index % 2 === 0}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAdjust={onAdjust}
                      rowHeight={rowHeight}
                      showBranchColumn={showBranchColumn}
                      canAdjustStock={canAdjustStock}
                      catalogStatus={
                        catalogLinkStatus[item.medicine_id]?.status || "NOT_LINKED"
                      }
                      catalogConfidence={
                        catalogLinkStatus[item.medicine_id]?.confidence || 0
                      }
                      catalogStatusLoading={catalogStatusLoading}
                      resubmissionCount={item.resubmission_count || 0}
                    />
                  ))
              }
            </tbody>
          </table>

          {!isLoading && items.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-gray-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Package size={28} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500 mb-1">
                No inventory items found
              </p>
              <p className="text-sm text-gray-400">
                {showBranchColumn
                  ? "No items found across all branches"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination — driven by server total, not items.length */}
      {!isLoading && totalPages > 0 && (
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/50">
          <InventoryPagination
            currentPage={currentPage}
            setCurrentPage={onPageChange}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default InventoryTable;