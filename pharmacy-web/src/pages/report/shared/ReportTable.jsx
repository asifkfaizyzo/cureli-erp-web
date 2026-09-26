// pharmacy-web/src/pages/report/shared/ReportTable.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/shared/ReportTable.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";

const ReportTable = ({
  columns = [],
  rows = [],
  footerRow = null,
  emptyMessage = "No data found",
  stickyHeader = true,
}) => {
  const topScrollRef = useRef(null);
  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);

  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  // Measure table width vs container width to determine if horizontal scroll is needed
  const checkOverflow = useCallback(() => {
    const tableContainer = tableContainerRef.current;
    const table = tableRef.current;

    if (!tableContainer || !table) {
      setHasHorizontalOverflow(false);
      return;
    }

    const scrollW = Math.max(table.scrollWidth, tableContainer.scrollWidth);
    const clientW = tableContainer.clientWidth;

    const overflows = scrollW > clientW;
    setHasHorizontalOverflow(overflows);
    setContentWidth(scrollW);
  }, []);

  // Set up ResizeObserver to recalculate on window resize or data updates
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const table = tableRef.current;
    if (!tableContainer || !table) return;

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(tableContainer);
    resizeObserver.observe(table);

    return () => resizeObserver.disconnect();
  }, [rows, columns, checkOverflow]);

  // Synchronize scrolling between top scrollbar and table container
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

  if (!rows.length) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">{emptyMessage}</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Top Horizontal Scrollbar (Visible only when table content overflows) */}
      {hasHorizontalOverflow && (
        <div
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden h-3.5 shrink-0 bg-gray-50/80 border-b border-gray-200 z-20 custom-scrollbar"
        >
          <div style={{ width: `${contentWidth}px`, height: "1px" }} />
        </div>
      )}

      {/* Main Table Container (with Bottom Horizontal & Vertical Scrollbar) */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto">
        <table ref={tableRef} className="w-full text-xs border-collapse">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-gray-600 whitespace-nowrap
                    ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                    ${col.width ? col.width : ""}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-gray-700 whitespace-nowrap
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                    `}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {footerRow && (
            <tfoot className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-300">
              <tr>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 font-bold text-gray-800 whitespace-nowrap
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                    `}
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

export default ReportTable;