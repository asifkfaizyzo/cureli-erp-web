// pharmacy-web/src/pages/sales/billing/components/SalesTable.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/billing/components/SalesTable.jsx

import React, { useRef, useCallback, useEffect, useState } from "react";
import SalesRowFixed from "./SalesRowFixed";
import { Plus, ChevronUp, ChevronDown, Lock } from "lucide-react";

const SkeletonRow = ({ rowHeight, isEven, index }) => (
  <tr
    style={{ height: `${rowHeight}px` }}
    className={`${isEven ? "bg-white" : "bg-slate-50/50"}`}
  >
    <td className="border-b border-r border-slate-200 p-1">
      <div className="flex justify-center">
        <div
          className="w-4 h-4 bg-slate-200 rounded animate-pulse"
          style={{ animationDelay: `${index * 30}ms` }}
        />
      </div>
    </td>
    {Array.from({ length: 13 }).map((_, idx) => (
      <td
        key={idx}
        className="border-b border-r border-slate-200 last:border-r-0 p-1"
      >
        <div
          className="h-4 bg-slate-200 rounded animate-pulse"
          style={{
            animationDelay: `${index * 30 + idx * 20}ms`,
            width: `${60 + Math.random() * 30}%`,
          }}
        />
      </td>
    ))}
  </tr>
);

const SalesTable = ({
  rows,
  setRows,
  productMaster = [],
  calculateRow,
  visibleRows = 8,
  rowHeight = 36,
  onProductSelect,
  onBatchSelect,
  isLoading = false,
  getAvailableBatches,
  marketplaceLocked = false,
}) => {
  const tableBodyRef = useRef(null);
  const headerRef = useRef(null);
  const rowRefs = useRef([]);
  const [focusQueue, setFocusQueue] = useState(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [scrollInfo, setScrollInfo] = useState({
    canScrollUp: false,
    canScrollDown: false,
    currentTopRow: 1,
    currentBottomRow: visibleRows,
  });

  const viewportHeight = visibleRows * rowHeight;

  const columnWidths = {
    rowNum: "3%",
    itemDesc: "16%",
    mfac: "8%",
    batch: "7%",
    exp: "5%",
    qty: "5%",
    mrp: "6%",
    rate: "6%",
    disc: "5%",
    cgst: "4%",
    sgst: "4%",
    rack: "4%",
    stock: "5%",
    amount: "7%",
  };

  const scrollToRow = useCallback(
    (rowIndex) => {
      const container = tableBodyRef.current;
      if (!container) return;
      const rowTop = rowIndex * rowHeight;
      const rowBottom = rowTop + rowHeight;
      const viewportTop = container.scrollTop;
      const viewportBottom = viewportTop + viewportHeight;
      if (rowBottom > viewportBottom) {
        container.scrollTo({
          top: rowBottom - viewportHeight,
          behavior: "smooth",
        });
      } else if (rowTop < viewportTop) {
        container.scrollTo({ top: rowTop, behavior: "smooth" });
      }
    },
    [rowHeight, viewportHeight],
  );

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, rows.length);
    while (rowRefs.current.length < rows.length) rowRefs.current.push(null);
  }, [rows.length]);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    setScrollbarWidth(container.offsetWidth - container.clientWidth);
  }, [rows.length, visibleRows]);

  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5;
    const topRowIndex = Math.floor(scrollTop / rowHeight);
    const bottomRowIndex = Math.min(
      topRowIndex + visibleRows - 1,
      rows.length - 1,
    );
    setScrollInfo({
      canScrollUp,
      canScrollDown,
      currentTopRow: topRowIndex + 1,
      currentBottomRow: bottomRowIndex + 1,
    });
  }, [rowHeight, visibleRows, rows.length]);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener("scroll", updateScrollInfo);
  }, [updateScrollInfo]);

  useEffect(() => {
    if (focusQueue !== null) {
      const timer = setTimeout(() => {
        const targetRow = rowRefs.current[focusQueue.rowIndex];
        if (targetRow) {
          scrollToRow(focusQueue.rowIndex);
          setTimeout(() => {
            focusQueue.fieldKey
              ? targetRow.focusField(focusQueue.fieldKey)
              : targetRow.focusFirstField();
          }, 100);
        }
        setFocusQueue(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [focusQueue, scrollToRow]);

  const handleNavigateToNextRow = useCallback(
    (currentIndex, fieldKey = null) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < rows.length) {
        scrollToRow(nextIndex);
        setTimeout(() => {
          const nextRow = rowRefs.current[nextIndex];
          if (nextRow)
            fieldKey ? nextRow.focusField(fieldKey) : nextRow.focusFirstField();
        }, 100);
      }
    },
    [rows.length, scrollToRow],
  );

  const handleNavigateToPrevRow = useCallback(
    (currentIndex, fieldKey = null) => {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        scrollToRow(prevIndex);
        setTimeout(() => {
          const prevRow = rowRefs.current[prevIndex];
          if (prevRow)
            fieldKey ? prevRow.focusField(fieldKey) : prevRow.focusLastField();
        }, 100);
      }
    },
    [scrollToRow],
  );

  const handleCreateNewRow = useCallback(() => {
    if (marketplaceLocked) return;
    const newRow = {
      medicine_id: null,
      inventory_id: null,
      name: "",
      manufacturer: "",
      batch: "",
      exp: "",
      qty: "",
      mrp: "",
      rate: "",
      rack: "",
      stock: "",
      discountPercent: "0",
      cgstPercent: "6",
      sgstPercent: "6",
      amount: "",
      availableBatches: [],
    };
    setRows((prev) => [...prev, newRow]);
    setFocusQueue({ rowIndex: rows.length, fieldKey: null });
  }, [rows.length, setRows, marketplaceLocked]);

  const handleRemoveRow = useCallback(
    (index) => {
      if (marketplaceLocked) return;
      if (rows.length <= 1) return;
      setRows((prev) => {
        const newRows = [...prev];
        newRows.splice(index, 1);
        return newRows;
      });
      const focusIndex = Math.max(0, index - 1);
      setTimeout(() => {
        const targetRow = rowRefs.current[focusIndex];
        if (targetRow) targetRow.focusFirstField();
      }, 50);
    },
    [rows.length, setRows, marketplaceLocked],
  );

  const handleRowChange = useCallback(
    (idx, key, value) => {
      setRows((prev) => {
        const newRows = [...prev];
        let row = { ...newRows[idx], [key]: value };

        const mrp = parseFloat(row.mrp) || 0;

        //  DUAL BINDING LOGIC: Sync MRP, discountPercent, and Rate
        if (key === "discountPercent") {
          const disc = parseFloat(value) || 0;
          const newRate = mrp * (1 - disc / 100);
          row.rate = newRate.toFixed(2);
        } else if (key === "rate") {
          const rateVal = parseFloat(value) || 0;
          if (mrp > 0) {
            const disc = ((mrp - rateVal) / mrp) * 100;
            row.discountPercent = Math.max(0, disc).toFixed(2);
          } else {
            row.discountPercent = "0";
          }
        } else if (key === "mrp") {
          const disc = parseFloat(row.discountPercent) || 0;
          const newRate = parseFloat(value || 0) * (1 - disc / 100);
          row.rate = newRate.toFixed(2);
        }

        newRows[idx] = calculateRow(row);
        return newRows;
      });
    },
    [setRows, calculateRow],
  );

  const filledRows = rows.filter((r) => r.name).length;
  const totalRows = rows.length;
  const hasOverflow = totalRows > visibleRows;

  const needsBatchCount = marketplaceLocked
    ? rows.filter((r) => r.medicine_id && !r.inventory_id).length
    : 0;

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header Stats */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">
              Items:
            </span>
            <span className="text-[10px] font-bold text-indigo-600">
              {filledRows}
            </span>
            <span className="text-[8px] text-slate-400">/ {totalRows}</span>
          </div>

          {marketplaceLocked && needsBatchCount > 0 && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 rounded border border-amber-300 text-[8px]">
                <span className="text-amber-700 font-semibold">
                  {needsBatchCount} batch{needsBatchCount > 1 ? "es" : ""}{" "}
                  needed
                </span>
              </div>
            </>
          )}

          {hasOverflow && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px]">
                <span className="text-slate-500">Showing</span>
                <span className="font-bold text-slate-700">
                  {scrollInfo.currentTopRow}-{scrollInfo.currentBottomRow}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasOverflow && (
            <div className="flex items-center gap-0.5 mr-1">
              <button
                onClick={() =>
                  tableBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" })
                }
                disabled={!scrollInfo.canScrollUp}
                className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30"
              >
                <ChevronUp size={10} />
              </button>
              <button
                onClick={() =>
                  tableBodyRef.current?.scrollTo({
                    top: tableBodyRef.current.scrollHeight,
                    behavior: "smooth",
                  })
                }
                disabled={!scrollInfo.canScrollDown}
                className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30"
              >
                <ChevronDown size={10} />
              </button>
            </div>
          )}

          {!marketplaceLocked ? (
            <button
              onClick={handleCreateNewRow}
              className="px-1.5 py-0.5 text-[8px] bg-indigo-500 text-white hover:bg-indigo-600 rounded flex items-center gap-0.5 font-medium shadow-sm"
            >
              <Plus size={8} />
              Add Row
            </button>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] text-indigo-600 bg-indigo-50 border border-indigo-200 rounded">
              <Lock size={8} />
              <span>Items locked</span>
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
              <col style={{ width: columnWidths.itemDesc }} />
              <col style={{ width: columnWidths.mfac }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.exp }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rate }} />
              <col style={{ width: columnWidths.disc }} />
              <col style={{ width: columnWidths.cgst }} />
              <col style={{ width: columnWidths.sgst }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.stock }} />
              <col style={{ width: columnWidths.amount }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-8">
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  SI
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-left border-r border-slate-600/30">
                  Item Name
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-left border-r border-slate-600/30">
                  Mfac
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  Batch{" "}
                  {marketplaceLocked && (
                    <Lock size={7} className="inline ml-0.5 opacity-70" />
                  )}
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  Exp
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  Qty{" "}
                  {marketplaceLocked && (
                    <Lock size={7} className="inline ml-0.5 opacity-70" />
                  )}
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-right border-r border-slate-600/30">
                  MRP
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-right border-r border-slate-600/30">
                  Rate
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  Disc%
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  CGST%
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  SGST%
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  Rack
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-center border-r border-slate-600/30">
                  Stock
                </th>
                <th className="px-1 py-1 text-[8px] font-bold text-right">
                  Amount
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
              <col style={{ width: columnWidths.itemDesc }} />
              <col style={{ width: columnWidths.mfac }} />
              <col style={{ width: columnWidths.batch }} />
              <col style={{ width: columnWidths.exp }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rate }} />
              <col style={{ width: columnWidths.disc }} />
              <col style={{ width: columnWidths.cgst }} />
              <col style={{ width: columnWidths.sgst }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.stock }} />
              <col style={{ width: columnWidths.amount }} />
            </colgroup>
            <tbody>
              {isLoading
                ? Array.from({ length: visibleRows }).map((_, index) => (
                    <SkeletonRow
                      key={`skeleton-${index}`}
                      rowHeight={rowHeight}
                      isEven={index % 2 === 0}
                      index={index}
                    />
                  ))
                : rows.map((item, index) => (
                    <SalesRowFixed
                      key={`row-${index}`}
                      ref={(el) => (rowRefs.current[index] = el)}
                      index={index}
                      item={item}
                      onChange={handleRowChange}
                      onProductSelect={onProductSelect}
                      onBatchSelect={onBatchSelect}
                      productMaster={productMaster}
                      rowNumber={index + 1}
                      isEven={index % 2 === 0}
                      isLast={index === rows.length - 1}
                      onRemoveRow={handleRemoveRow}
                      onNavigateToNextRow={handleNavigateToNextRow}
                      onNavigateToPrevRow={handleNavigateToPrevRow}
                      onCreateNewRow={handleCreateNewRow}
                      rowHeight={rowHeight}
                      getAvailableBatches={getAvailableBatches}
                      allRows={rows}
                      marketplaceLocked={marketplaceLocked}
                    />
                  ))}
            </tbody>
          </table>

          {!isLoading && rows.length === 0 && (
            <div
              className="flex flex-col items-center justify-center text-slate-400"
              style={{ height: `${viewportHeight}px` }}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Plus size={16} className="text-slate-400" />
              </div>
              <p className="text-xs font-medium">No items added</p>
              <p className="text-[9px]">Search product to start billing</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-3 py-0.5 flex items-center justify-between text-[8px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>{totalRows} rows</span>
          {filledRows > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-medium">
                {filledRows} items
              </span>
            </>
          )}
          {marketplaceLocked && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-medium flex items-center gap-0.5">
                <Lock size={7} />
                Marketplace order
              </span>
            </>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[7px]">
          {marketplaceLocked ? (
            <span className="text-indigo-500">
              Click the Batch cell to select a batch for each item
            </span>
          ) : (
            <>
              <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                Enter
              </kbd>
              <span>Next</span>
              <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                Tab
              </kbd>
              <span>Navigate</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTable;