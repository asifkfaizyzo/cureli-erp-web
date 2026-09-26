// pharmacy-web/src/pages/purchase/billing/components/PurchaseTable.jsx (do not remove this comment)
// src/pages/purchase/billing/components/PurchaseTable.jsx

import React, { useRef, useCallback, useEffect, useState } from "react";
import PurchaseRowFixed from "./PurchaseRowFixed";
import { Plus, ChevronUp, ChevronDown, Gift } from "lucide-react";

// Skeleton Row Component
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
    <td className="border-b border-r border-slate-200 p-1">
      <div
        className="h-4 bg-slate-200 rounded animate-pulse w-[85%]"
        style={{ animationDelay: `${index * 30 + 50}ms` }}
      />
    </td>
    {Array.from({ length: 16 }).map((_, idx) => (
      <td
        key={idx}
        className="border-b border-r border-slate-200 last:border-r-0 p-1"
      >
        <div
          className="h-4 bg-slate-200 rounded animate-pulse"
          style={{
            animationDelay: `${index * 30 + (idx + 2) * 20}ms`,
            width: `${60 + Math.random() * 30}%`,
          }}
        />
      </td>
    ))}
  </tr>
);

// Skeleton Header Stats
const SkeletonHeaderStats = () => (
  <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-16 h-4 bg-slate-200 rounded animate-pulse" />
      <div
        className="w-12 h-4 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: "50ms" }}
      />
    </div>
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-5 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: "100ms" }}
      />
      <div
        className="w-14 h-5 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: "150ms" }}
      />
    </div>
  </div>
);

const PurchaseTable = ({
  rows,
  setRows,
  productMaster = [],
  calculateRow,
  importVersion,
  visibleRows = 8,
  rowHeight = 36,
  onAddNewProduct,
  onProductSelect,
  isLoading = false,
  onCreateFreeRow,
  onRemoveFreeRow,
}) => {
  const tableContainerRef = useRef(null);
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
    rowNum: "2.5%",
    itemDesc: "14%",
    mfac: "7%",
    batch: "5%",
    hsn: "5%",
    exp: "5%",
    pack: "4%",
    pQty: "4%",
    qty: "4%",
    rate: "6%",
    dis: "4%",
    netRate: "5.5%",
    amount: "7%",
    sgst: "4%",
    mrp: "5%",
    rack: "3.5%",
    sRate: "5.5%",
    free: "4%",
  };

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, rows.length);
    while (rowRefs.current.length < rows.length) {
      rowRefs.current.push(null);
    }
  }, [rows.length]);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    const width = container.offsetWidth - container.clientWidth;
    setScrollbarWidth(width);
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
            if (focusQueue.fieldKey) {
              targetRow.focusField(focusQueue.fieldKey);
            } else {
              targetRow.focusFirstField();
            }
          }, 100);
        }
        setFocusQueue(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [focusQueue]);

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

  const scrollToTop = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);

  const handleNavigateToNextRow = useCallback(
    (currentIndex, fieldKey = null) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < rows.length) {
        scrollToRow(nextIndex);
        setTimeout(() => {
          const nextRow = rowRefs.current[nextIndex];
          if (nextRow) {
            if (fieldKey) {
              nextRow.focusField(fieldKey);
            } else {
              nextRow.focusFirstField();
            }
          }
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
          if (prevRow) {
            if (fieldKey) {
              prevRow.focusField(fieldKey);
            } else {
              prevRow.focusLastField();
            }
          }
        }, 100);
      }
    },
    [scrollToRow],
  );

  const handleCreateNewRow = useCallback(() => {
    const newRow = {
      medicine_id: null,
      mfac: "",
      rack: "",
      name: "",
      hsn: "",
      pack: "",
      batch: "",
      exp: "",
      qty: "",
      sch: "",
      mrp: "",
      price: "",
      schemePercent: "",
      schemeAmount: "",
      discountPercent: "",
      discountAmount: "",
      taxableValue: "",
      cgstPercent: "6",
      cgstAmount: "",
      sgstPercent: "6",
      sgstAmount: "",
      amount: "",
      sRate: "",
      pQty: "",
      netRate: "",
      isFreeItem: false,
      parentRowIndex: null,
    };

    setRows((prev) => [...prev, newRow]);
    setFocusQueue({ rowIndex: rows.length, fieldKey: null });
  }, [rows.length, setRows]);

  const handleRemoveRow = useCallback(
    (index) => {
      const row = rows[index];

      if (!row.isFreeItem) {
        const nextRow = rows[index + 1];
        if (nextRow && nextRow.isFreeItem && nextRow.parentRowIndex === index) {
          setRows((prev) => {
            const newRows = [...prev];
            newRows.splice(index, 2);
            return newRows;
          });
          return;
        }
      }

      if (row.isFreeItem && row.parentRowIndex !== null) {
        setRows((prev) => {
          const newRows = [...prev];
          if (newRows[row.parentRowIndex]) {
            newRows[row.parentRowIndex] = {
              ...newRows[row.parentRowIndex],
              sch: "",
            };
          }
          newRows.splice(index, 1);
          return newRows;
        });
        return;
      }

      if (rows.length <= 1) return;

      setRows((prev) => {
        const newRows = [...prev];
        newRows.splice(index, 1);
        return newRows;
      });

      const focusIndex = Math.max(0, index - 1);
      setTimeout(() => {
        const targetRow = rowRefs.current[focusIndex];
        if (targetRow) {
          targetRow.focusFirstField();
        }
      }, 50);
    },
    [rows, setRows],
  );

  // ═══════════════════════════════════════════════════════════════
  //  ROW CHANGE HANDLER: AUTO-SET sRate = mrp
  // ═══════════════════════════════════════════════════════════════
  const handleRowChange = useCallback(
    (idx, key, value) => {
      setRows((prev) => {
        const newRows = [...prev];
        let updatedRow = { ...newRows[idx], [key]: value };

        // Auto-update sRate when MRP changes (if sRate is empty or was matching previous MRP)
        if (key === "mrp") {
          const prevMrp = newRows[idx].mrp;
          const prevSRate = newRows[idx].sRate;
          if (
            !prevSRate ||
            prevSRate === prevMrp ||
            prevSRate === "0" ||
            prevSRate === "0.00"
          ) {
            updatedRow.sRate = value;
          }
        }

        if (!updatedRow.isFreeItem) {
          updatedRow = calculateRow(updatedRow);
        }

        newRows[idx] = updatedRow;
        return newRows;
      });
    },
    [setRows, calculateRow],
  );

  const handleProductSelect = useCallback(
    (idx, product) => {
      if (onProductSelect) {
        onProductSelect(idx, product);
      } else {
        setRows((prev) => {
          const newRows = [...prev];
          newRows[idx] = {
            ...newRows[idx],
            medicine_id: product.medicine_id,
            name: product.name,
            hsn: product.hsnCode || product.hsn || newRows[idx].hsn,
            pack: product.pack || newRows[idx].pack,
            rack: product.rackNo || product.rack || newRows[idx].rack,
            mfac: product.manufacturer || product.mfac || newRows[idx].mfac,
            cgstPercent: product.gst
              ? (Number(product.gst) / 2).toString()
              : product.cgstPercent || newRows[idx].cgstPercent,
            sgstPercent: product.gst
              ? (Number(product.gst) / 2).toString()
              : product.sgstPercent || newRows[idx].sgstPercent,
          };
          newRows[idx] = calculateRow(newRows[idx]);
          return newRows;
        });
      }
    },
    [onProductSelect, setRows, calculateRow],
  );

  const handleAddMultipleRows = useCallback(
    (count = 5) => {
      const newRows = Array.from({ length: count }).map(() => ({
        medicine_id: null,
        mfac: "",
        rack: "",
        name: "",
        hsn: "",
        pack: "",
        batch: "",
        exp: "",
        qty: "",
        sch: "",
        mrp: "",
        price: "",
        schemePercent: "",
        schemeAmount: "",
        discountPercent: "",
        discountAmount: "",
        taxableValue: "",
        cgstPercent: "6",
        cgstAmount: "",
        sgstPercent: "6",
        sgstAmount: "",
        amount: "",
        sRate: "",
        pQty: "",
        netRate: "",
        isFreeItem: false,
        parentRowIndex: null,
      }));

      setRows((prev) => [...prev, ...newRows]);
      setFocusQueue({ rowIndex: rows.length, fieldKey: null });
    },
    [rows.length, setRows],
  );

  const filledRows = rows.filter((r) => r.name).length;
  const freeRows = rows.filter((r) => r.name && r.isFreeItem).length;
  const billableRows = filledRows - freeRows;
  const totalRows = rows.length;
  const hasOverflow = totalRows > visibleRows;

  const newProductsCount = rows.filter((row) => {
    if (!row.name || !row.name.trim() || row.isFreeItem) return false;
    return !productMaster.some(
      (product) =>
        product.name.toLowerCase() === row.name.toLowerCase() ||
        product.name.toLowerCase().includes(row.name.toLowerCase()) ||
        row.name.toLowerCase().includes(product.name.toLowerCase()),
    );
  }).length;

  return (
    <div
      className="h-full w-full flex flex-col bg-white"
      ref={tableContainerRef}
    >
      {/* Table Header Stats */}
      {isLoading ? (
        <SkeletonHeaderStats />
      ) : (
        <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">
                Items:
              </span>
              <span className="text-[10px] font-bold text-indigo-600">
                {billableRows}
              </span>
              <span className="text-[8px] text-slate-400">/ {totalRows}</span>
            </div>

            {freeRows > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 rounded border border-green-300 text-[8px]">
                  <Gift size={10} className="text-green-600" />
                  <span className="text-green-700 font-medium">
                    {freeRows} free
                  </span>
                </div>
              </>
            )}

            {newProductsCount > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded border border-yellow-300 text-[8px]">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700 font-medium">
                    {newProductsCount} new
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

            <div className="h-3 w-px bg-slate-300" />
            <div className="hidden lg:flex text-[7px] text-slate-400 items-center gap-1">
              <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                ⏎
              </kbd>
              <span>Next</span>
              <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                Tab
              </kbd>
              <span>Navigate</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasOverflow && (
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  onClick={scrollToTop}
                  disabled={!scrollInfo.canScrollUp}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Scroll to top"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={scrollToBottom}
                  disabled={!scrollInfo.canScrollDown}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Scroll to bottom"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            )}

            <button
              onClick={() => handleAddMultipleRows(5)}
              className="px-1 py-0.5 text-[8px] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-0.5"
            >
              <Plus size={8} />
              +5
            </button>
            <button
              onClick={handleCreateNewRow}
              className="px-1.5 py-0.5 text-[8px] bg-indigo-500 text-white hover:bg-indigo-600 rounded flex items-center gap-0.5 font-medium shadow-sm"
            >
              <Plus size={8} />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
              <col style={{ width: columnWidths.hsn }} />
              <col style={{ width: columnWidths.exp }} />
              <col style={{ width: columnWidths.pack }} />
              <col style={{ width: columnWidths.pQty }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.rate }} />
              <col style={{ width: columnWidths.dis }} />
              <col style={{ width: columnWidths.netRate }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.sgst }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.sRate }} />
              <col style={{ width: columnWidths.free }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-5">
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-slate-800/20"></th>
                <th
                  colSpan="3"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-blue-900/30"
                >
                  Product Info
                </th>
                <th
                  colSpan="2"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-cyan-900/30"
                >
                  Identity
                </th>
                <th
                  colSpan="3"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-amber-900/30"
                >
                  Quantity
                </th>
                <th
                  colSpan="4"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-emerald-900/30"
                >
                  Pricing
                </th>
                <th
                  colSpan="2"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-orange-900/30"
                >
                  Tax
                </th>
                <th
                  colSpan="2"
                  className="px-0.5 py-0.5 text-[7px] font-bold text-center border-r border-slate-500/30 bg-purple-900/30"
                >
                  Output
                </th>
                <th className="px-0.5 py-0.5 text-[7px] font-bold text-center bg-green-900/30">
                  Free
                </th>
              </tr>

              <tr className="bg-gradient-to-r from-[#070170] to-[#0c03a0] text-white h-6">
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  #
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left pl-1 border-r border-slate-600/30">
                  Item Description
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-left border-r border-slate-600/30">
                  Mfac/company
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Batch
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  HSN
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Exp.date
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Pack
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  P.Qty
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Qty
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">
                  Rate
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Dis%
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">
                  NetRate
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">
                  Amount
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  SGST%
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">
                  MRP
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center border-r border-slate-600/30">
                  Rack
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-right pr-1 border-r border-slate-600/30">
                  SRate
                </th>
                <th className="px-0.5 py-0.5 text-[7px] 2xl:text-[8px] font-bold text-center">
                  Sch
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
              <col style={{ width: columnWidths.hsn }} />
              <col style={{ width: columnWidths.exp }} />
              <col style={{ width: columnWidths.pack }} />
              <col style={{ width: columnWidths.pQty }} />
              <col style={{ width: columnWidths.qty }} />
              <col style={{ width: columnWidths.rate }} />
              <col style={{ width: columnWidths.dis }} />
              <col style={{ width: columnWidths.netRate }} />
              <col style={{ width: columnWidths.amount }} />
              <col style={{ width: columnWidths.sgst }} />
              <col style={{ width: columnWidths.mrp }} />
              <col style={{ width: columnWidths.rack }} />
              <col style={{ width: columnWidths.sRate }} />
              <col style={{ width: columnWidths.free }} />
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
                    <PurchaseRowFixed
                      key={`row-${index}-${importVersion}-${item.isFreeItem ? "free" : "normal"}`}
                      ref={(el) => (rowRefs.current[index] = el)}
                      index={index}
                      item={item}
                      onChange={handleRowChange}
                      onProductSelect={handleProductSelect}
                      productMaster={productMaster}
                      rowNumber={index + 1}
                      isEven={index % 2 === 0}
                      isLast={index === rows.length - 1}
                      onRemoveRow={handleRemoveRow}
                      rowsLength={rows.length}
                      onNavigateToNextRow={handleNavigateToNextRow}
                      onNavigateToPrevRow={handleNavigateToPrevRow}
                      onCreateNewRow={handleCreateNewRow}
                      rowHeight={rowHeight}
                      onAddNewProduct={onAddNewProduct}
                      onCreateFreeRow={onCreateFreeRow}
                      onRemoveFreeRow={onRemoveFreeRow}
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
              <p className="text-[9px]">Press Enter to add items</p>
            </div>
          )}
        </div>

        {hasOverflow && !isLoading && (
          <div className="shrink-0 h-0.5 bg-slate-100 relative" />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-3 py-0.5 flex items-center justify-between text-[8px] text-slate-500">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
            <div
              className="w-12 h-3 bg-slate-200 rounded animate-pulse"
              style={{ animationDelay: "50ms" }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span>{totalRows} rows</span>
              {billableRows > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-600 font-medium">
                    {billableRows} billable
                  </span>
                </>
              )}
              {freeRows > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-green-600 font-medium">
                    {freeRows} free items
                  </span>
                </>
              )}
              {newProductsCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-yellow-600 font-medium">
                    {newProductsCount} new products
                  </span>
                </>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[7px]">
              <kbd className="px-0.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                Ctrl+⌫
              </kbd>
              <span>Delete row</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PurchaseTable;