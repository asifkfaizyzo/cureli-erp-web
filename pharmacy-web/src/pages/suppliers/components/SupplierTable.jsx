// pharmacy-web/src/pages/suppliers/components/SupplierTable.jsx (do not remove this comment)
// src/pages/suppliers/components/SupplierTable.jsx
import React, { useRef, useCallback, useEffect, useState } from "react";
import SupplierRow from "./SupplierRow";
import SupplierPagination from "../../../components/common/Pagination";
import { ChevronUp, ChevronDown, Users, Layers, Building2 } from "lucide-react";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";

const SupplierTable = ({
  data = [],
  loading,
  onRowClick,
  isGlobalMode = false,
  isSuperAdmin = false,
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
  const rowHeight = 36;
  const viewportHeight = visibleRows * rowHeight;

  //  Adjust column widths based on mode
  const columnWidths = isGlobalMode
    ? {
        rowNum: "3%",
        supplierId: "10%",
        name: "18%",
        branches: "15%", // NEW: Branches column
        contact: "12%",
        email: "18%",
        gst: "14%",
        actions: "10%",
      }
    : {
        rowNum: "4%",
        supplierId: "12%",
        name: "20%",
        contact: "15%",
        email: "22%",
        gst: "17%",
        actions: "10%",
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

  return (
    <div
      className="h-full w-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden"
      ref={tableContainerRef}
    >
      {/* Header Stats */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isGlobalMode ? (
              <Layers size={12} className="text-blue-500" />
            ) : (
              <Users size={12} className="text-indigo-500" />
            )}
            <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">
              Total:
            </span>
            <span className="text-[10px] font-bold text-indigo-600">
              {totalItems}
            </span>
          </div>

          {isGlobalMode && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <span className="text-[8px] text-blue-600 font-medium uppercase">
                All Branches
              </span>
            </>
          )}

          {totalPages > 1 && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px]">
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
            <div className="flex items-center gap-0.5">
              <button
                onClick={scrollToTop}
                disabled={!scrollInfo.canScrollUp}
                className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp size={10} />
              </button>
              <button
                onClick={scrollToBottom}
                disabled={!scrollInfo.canScrollDown}
                className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown size={10} />
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
              <col style={{ width: columnWidths.supplierId }} />
              <col style={{ width: columnWidths.name }} />
              {isGlobalMode && <col style={{ width: columnWidths.branches }} />}
              <col style={{ width: columnWidths.contact }} />
              <col style={{ width: columnWidths.email }} />
              <col style={{ width: columnWidths.gst }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-6">
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  #
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left pl-1 border-r border-slate-600/30">
                  Supplier ID
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">
                  Name
                </th>
                {isGlobalMode && (
                  <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">
                    <div className="flex items-center gap-1">
                      <Building2 size={10} />
                      Branches
                    </div>
                  </th>
                )}
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Contact
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">
                  Email
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  GST
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center">
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
              <col style={{ width: columnWidths.supplierId }} />
              <col style={{ width: columnWidths.name }} />
              {isGlobalMode && <col style={{ width: columnWidths.branches }} />}
              <col style={{ width: columnWidths.contact }} />
              <col style={{ width: columnWidths.email }} />
              <col style={{ width: columnWidths.gst }} />
              <col style={{ width: columnWidths.actions }} />
            </colgroup>
            <tbody>
              {paginatedItems.map((item, index) => (
                <SupplierRow
                  key={item.supplier_id || item.supplierId || index}
                  ref={(el) => (rowRefs.current[index] = el)}
                  item={item}
                  rowNumber={startIndex + index + 1}
                  isEven={index % 2 === 0}
                  onRowClick={onRowClick}
                  loading={loading}
                  rowHeight={rowHeight}
                  isGlobalMode={isGlobalMode}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Users size={16} className="text-slate-400" />
              </div>
              <p className="text-xs font-medium">No suppliers found</p>
              <p className="text-[9px]">
                {isGlobalMode
                  ? "Select a branch to add suppliers"
                  : "Try adjusting your filters"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="shrink-0 border-t border-slate-200">
          <SupplierPagination
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

export default SupplierTable;
