// pharmacy-web/src/hooks/purchase/usePurchaseRows.js (do not remove this comment)
// src/hooks/purchase/usePurchaseRows.js

import { useState, useCallback, useEffect, useRef } from "react";

const LOCAL_STORAGE_KEY = "purchase_rows_draft";

//  Generate unique ID for row tracking
const generateRowId = () =>
  `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createEmptyRow = () => ({
  rowId: generateRowId(), //  Unique identifier
  medicine_id: null,
  name: "",
  mfac: "",
  batch: "",
  hsn: "",
  exp: "",
  pack: "",
  pQty: "",
  qty: "",
  price: "",
  schemePercent: "",
  discountPercent: "",
  netRate: "",
  amount: "",
  cgstPercent: "6",
  sgstPercent: "6",
  mrp: "",
  rack: "",
  sRate: "",
  sch: "",
  //  Free item tracking
  isFreeItem: false,
  parentRowId: null, //  Use rowId instead of index
});

export const usePurchaseRows = (initialRowCount = 10) => {
  const [rows, setRows] = useState([]);
  const [importVersion, setImportVersion] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedRef = useRef(false);
  const processingFreeRowRef = useRef(false); //  Prevent recursive calls

  // Load from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all rows have rowId
          const rowsWithIds = parsed.map((row) => ({
            ...row,
            rowId: row.rowId || generateRowId(),
          }));
          setRows(rowsWithIds);
          setIsInitialized(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to load rows from localStorage:", error);
    }

    // Initialize with empty rows
    const emptyRows = Array.from({ length: initialRowCount }, () =>
      createEmptyRow(),
    );
    setRows(emptyRows);
    setIsInitialized(true);
  }, [initialRowCount]);

  // Save to localStorage when rows change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rows));
    } catch (error) {
      console.warn("Failed to save rows to localStorage:", error);
    }
  }, [rows, isInitialized]);

  // ═══════════════════════════════════════════════════════════════════════
  //  FIXED: CREATE FREE ROW - Prevents duplicates and infinite loops
  // ═══════════════════════════════════════════════════════════════════════
  const createFreeRow = useCallback((sourceRowIndex) => {
    // Prevent recursive/concurrent calls
    if (processingFreeRowRef.current) {
      return;
    }

    setRows((prev) => {
      const sourceRow = prev[sourceRowIndex];

      // Validation checks
      if (!sourceRow) {
      
        return prev;
      }

      if (sourceRow.isFreeItem) {
      
        return prev;
      }

      if (!sourceRow.name || !sourceRow.name.trim()) {
     
        return prev;
      }

      const schValue = sourceRow.sch;
      if (!schValue || schValue.toString().trim() === "") {
     
        return prev;
      }

      const sourceRowId = sourceRow.rowId;

      //  Find existing free row by parentRowId (not by index)
      const existingFreeRowIndex = prev.findIndex(
        (row) => row.isFreeItem && row.parentRowId === sourceRowId,
      );

      if (existingFreeRowIndex !== -1) {
        //  Update existing free row's quantity
        const freeQty = parseFreeQuantity(schValue);
       

        const newRows = [...prev];
        newRows[existingFreeRowIndex] = {
          ...newRows[existingFreeRowIndex],
          qty: String(freeQty),
        };
        return newRows;
      }

      // Parse free quantity
      const freeQty = parseFreeQuantity(schValue);
      if (freeQty <= 0) {
    
        return prev;
      }

      processingFreeRowRef.current = true;

      //  Create new free row
      const freeRow = {
        rowId: generateRowId(),
        medicine_id: sourceRow.medicine_id,
        name: sourceRow.name,
        mfac: sourceRow.mfac,
        batch: sourceRow.batch,
        hsn: sourceRow.hsn,
        exp: sourceRow.exp,
        pack: sourceRow.pack,
        pQty: sourceRow.pQty,
        qty: String(freeQty),
        price: sourceRow.price,
        schemePercent: sourceRow.schemePercent,
        discountPercent: sourceRow.discountPercent,
        netRate: "0",
        amount: "0",
        cgstPercent: sourceRow.cgstPercent,
        sgstPercent: sourceRow.sgstPercent,
        mrp: sourceRow.mrp,
        rack: sourceRow.rack,
        sRate: sourceRow.sRate,
        sch: "", //  Clear sch on free row
        isFreeItem: true,
        parentRowId: sourceRowId, //  Link to parent by rowId
      };

      // Insert free row after source row
      const newRows = [...prev];
      newRows.splice(sourceRowIndex + 1, 0, freeRow);

      

      // Reset processing flag after state update
      setTimeout(() => {
        processingFreeRowRef.current = false;
      }, 100);

      return newRows;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  //  FIXED: REMOVE FREE ROW - Uses rowId instead of index
  // ═══════════════════════════════════════════════════════════════════════
  const removeFreeRow = useCallback((sourceRowIndex) => {
    setRows((prev) => {
      const sourceRow = prev[sourceRowIndex];
      if (!sourceRow) return prev;

      const sourceRowId = sourceRow.rowId;

      // Find and remove free row linked to this parent
      const freeRowIndex = prev.findIndex(
        (row) => row.isFreeItem && row.parentRowId === sourceRowId,
      );

      if (freeRowIndex !== -1) {
        const newRows = [...prev];
        newRows.splice(freeRowIndex, 1);
      
        return newRows;
      }

      return prev;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  //  UPDATE FREE ROW QUANTITY - When sch value changes
  // ═══════════════════════════════════════════════════════════════════════
  const updateFreeRowQuantity = useCallback((sourceRowIndex, schValue) => {
    setRows((prev) => {
      const sourceRow = prev[sourceRowIndex];
      if (!sourceRow || sourceRow.isFreeItem) return prev;

      const sourceRowId = sourceRow.rowId;
      const freeRowIndex = prev.findIndex(
        (row) => row.isFreeItem && row.parentRowId === sourceRowId,
      );

      if (freeRowIndex === -1) return prev;

      const freeQty = parseFreeQuantity(schValue);
      if (freeQty <= 0) {
        // Remove free row if qty is 0
        const newRows = [...prev];
        newRows.splice(freeRowIndex, 1);
        return newRows;
      }

      const newRows = [...prev];
      newRows[freeRowIndex] = {
        ...newRows[freeRowIndex],
        qty: String(freeQty),
      };
      return newRows;
    });
  }, []);

  // Import rows from file
  const importRows = useCallback((importedRows) => {
    // Process imported rows - ensure rowIds and free item flags
    const processedRows = importedRows.map((row) => ({
      ...createEmptyRow(),
      ...row,
      rowId: row.rowId || generateRowId(),
      isFreeItem: row.isFreeItem || false,
    }));

    setRows(processedRows);
    setImportVersion((v) => v + 1);
  }, []);

  // Get only filled rows (with data)
  const getFilledRows = useCallback(() => {
    return rows.filter((row) => row.name && row.name.trim() !== "");
  }, [rows]);

  // Get billable rows (exclude free items)
  const getBillableRows = useCallback(() => {
    return rows.filter(
      (row) => row.name && row.name.trim() !== "" && !row.isFreeItem,
    );
  }, [rows]);

  // Get free rows only
  const getFreeRows = useCallback(() => {
    return rows.filter(
      (row) => row.name && row.name.trim() !== "" && row.isFreeItem,
    );
  }, [rows]);

  // Check if there's unsaved data
  const hasUnsavedData = useCallback(() => {
    return rows.some((row) => row.name && row.name.trim() !== "");
  }, [rows]);

  // Clear all rows
  const clearAllRows = useCallback(() => {
    const emptyRows = Array.from({ length: initialRowCount }, () =>
      createEmptyRow(),
    );
    setRows(emptyRows);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, [initialRowCount]);

  //  Check if a row has a free row attached
  const hasFreeRow = useCallback(
    (rowIndex) => {
      const row = rows[rowIndex];
      if (!row) return false;
      return rows.some((r) => r.isFreeItem && r.parentRowId === row.rowId);
    },
    [rows],
  );

  return {
    rows,
    setRows,
    importRows,
    getFilledRows,
    getBillableRows,
    getFreeRows,
    importVersion,
    clearAllRows,
    hasUnsavedData,
    isInitialized,
    createFreeRow,
    removeFreeRow,
    updateFreeRowQuantity,
    hasFreeRow,
  };
};

// ═══════════════════════════════════════════════════════════════════════
//  HELPER: Parse free quantity from various inputs
// ═══════════════════════════════════════════════════════════════════════
function parseFreeQuantity(value) {
  if (!value) return 0;

  const str = String(value).trim().toUpperCase();

  // If it's "F", "FREE", or similar text, default to 1
  if (str === "F" || str === "FR" || str === "FREE" || str === "FREEBIE") {
    return 1;
  }

  // If it's a plain number
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    return Math.floor(num); // Ensure whole number
  }

  // If it matches pattern like "2+1" (buy 2 get 1 free)
  const plusPattern = str.match(/(\d+)\s*\+\s*(\d+)/);
  if (plusPattern) {
    return parseInt(plusPattern[2]) || 1;
  }

  // Default: any non-empty value means 1 free
  return 1;
}

export default usePurchaseRows;
