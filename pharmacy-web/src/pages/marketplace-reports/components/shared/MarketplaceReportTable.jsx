// pharmacy-web/src/pages/marketplace-reports/components/shared/MarketplaceReportTable.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/shared/MarketplaceReportTable.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Layers, Loader2 } from "lucide-react";

const MarketplaceReportTable = ({
  columns = [],
  rows = [],
  footerRow = null,
  emptyMessage = "No analytics data recorded for this selection",
  stickyHeader = true,
  isLoading = false,
  maxHeight = null,
}) => {
  const topScrollRef = useRef(null);
  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);

  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  const checkOverflow = useCallback(() => {
    const tableContainer = tableContainerRef.current;
    const table = tableRef.current;
    if (!tableContainer || !table) {
      setHasHorizontalOverflow(false);
      return;
    }
    const scrollW = Math.max(table.scrollWidth, tableContainer.scrollWidth);
    const clientW = tableContainer.clientWidth;
    setHasHorizontalOverflow(scrollW > clientW);
    setContentWidth(scrollW);
  }, []);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const table = tableRef.current;
    if (!tableContainer || !table) return;

    checkOverflow();
    const resizeObserver = new ResizeObserver(() => checkOverflow());
    resizeObserver.observe(tableContainer);
    resizeObserver.observe(table);
    return () => resizeObserver.disconnect();
  }, [rows, columns, checkOverflow]);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const tableEl = tableContainerRef.current;
    if (!topEl || !tableEl || !hasHorizontalOverflow) return;

    let isSyncingTop = false;
    let isSyncingTable = false;

    const handleTopScroll = () => {
      if (!isSyncingTop) {
        isSyncingTable = true;
        tableEl.scrollLeft = topEl.scrollLeft;
      }
      isSyncingTop = false;
    };

    const handleTableScroll = () => {
      if (!isSyncingTable) {
        isSyncingTop = true;
        topEl.scrollLeft = tableEl.scrollLeft;
      }
      isSyncingTable = false;
    };

    topEl.addEventListener("scroll", handleTopScroll, { passive: true });
    tableEl.addEventListener("scroll", handleTableScroll, { passive: true });

    return () => {
      topEl.removeEventListener("scroll", handleTopScroll);
      tableEl.removeEventListener("scroll", handleTableScroll);
    };
  }, [hasHorizontalOverflow]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
        <p className="text-xs text-white/50 font-medium">Aggregating telemetry...</p>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
          <Layers size={20} className="text-white/30" />
        </div>
        <p className="text-sm font-semibold text-white/70">{emptyMessage}</p>
        <p className="text-xs text-white/40 mt-1 max-w-xs">
          Try expanding your date range or adjusting branch filters to view data.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Top Scrollbar for ultra-wide reports */}
      {hasHorizontalOverflow && (
        <div
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden h-2.5 shrink-0 bg-white/[0.02] border-b border-white/[0.06] z-20 scrollbar-thin scrollbar-thumb-white/10"
        >
          <div style={{ width: `${contentWidth}px`, height: "1px" }} />
        </div>
      )}

      {/* Main Table Container */}
      <div
        ref={tableContainerRef}
        style={maxHeight ? { maxHeight } : undefined}
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <table ref={tableRef} className="w-full text-left border-collapse">
          <thead
            className={
              stickyHeader
                ? "sticky top-0 z-10 bg-[#090726] border-b border-white/[0.08]"
                : "border-b border-white/[0.08] bg-white/[0.03]"
            }
          >
            <tr className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 whitespace-nowrap ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${col.width || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.04] text-xs">
            {rows.map((row, idx) => (
              <tr
                key={row.id || row.branch_id || row.key || idx}
                className="hover:bg-white/[0.02] transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-3.5 text-white/80 whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {footerRow && (
            <tfoot className="sticky bottom-0 bg-[#090726] border-t-2 border-white/[0.12] text-xs">
              <tr>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-3.5 font-bold text-white whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {footerRow[col.key] !== undefined
                      ? footerRow[col.key]
                      : col.footerLabel || ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default MarketplaceReportTable;