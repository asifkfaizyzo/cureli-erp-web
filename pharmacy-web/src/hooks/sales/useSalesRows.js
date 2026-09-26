// pharmacy-web/src/hooks/sales/useSalesRows.js (do not remove this comment)
// pharmacy-web/src/hooks/sales/useSalesRows.js

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY        = 'sales_billing_rows';
const STORAGE_EXPIRY_KEY = 'sales_billing_rows_expiry';
const EXPIRY_HOURS       = 24;

const makeEmptyRow = () => ({
  medicine_id:     null,
  inventory_id:    null,
  name:            '',
  manufacturer:    '',
  batch:           '',
  exp:             '',
  qty:             '',
  mrp:             '',
  rate:            '',
  rack:            '',
  stock:           '',
  discountPercent: '0',
  cgstPercent:     '0', // ← Fixed: was '6'
  sgstPercent:     '0', // ← Fixed: was '6'
  amount:          '',
  availableBatches: [],
});

const isDataExpired = () => {
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry);
};

const setExpiry = () => {
  const expiryTime = Date.now() + EXPIRY_HOURS * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
};

const loadFromStorage = () => {
  try {
    if (isDataExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (error) {
    console.error('Failed to load sales rows from storage:', error);
  }
  return null;
};

const saveToStorage = (rows) => {
  try {
    const hasData = rows.some((row) => row.name && row.name.trim() !== '');
    if (hasData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      setExpiry();
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
    }
  } catch (error) {
    console.error('Failed to save sales rows to storage:', error);
  }
};

export function useSalesRows(initialRowCount = 8) {
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef(null);

  const [rows, setRows] = useState(() => {
    const storedRows = loadFromStorage();
    if (storedRows && storedRows.length > 0) {
      if (storedRows.length < initialRowCount) {
        const needed = initialRowCount - storedRows.length;
        return [...storedRows, ...Array.from({ length: needed }).map(makeEmptyRow)];
      }
      return storedRows;
    }
    return Array.from({ length: initialRowCount }).map(makeEmptyRow);
  });

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (rows.length < initialRowCount) {
      const needed = initialRowCount - rows.length;
      setRows((prev) => [...prev, ...Array.from({ length: needed }).map(makeEmptyRow)]);
    }
  }, [initialRowCount, rows.length]);

  useEffect(() => {
    if (!isInitialized) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToStorage(rows), 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [rows, isInitialized]);

  const getFilledRows = useCallback(() => {
    return rows.filter(
      (row) =>
        row.name &&
        row.name.trim() !== '' &&
        row.medicine_id &&
        row.inventory_id &&
        parseFloat(row.qty) > 0,
    );
  }, [rows]);

  const clearAllRows = useCallback(() => {
    setRows(Array.from({ length: initialRowCount }).map(makeEmptyRow));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  }, [initialRowCount]);

  const hasUnsavedData = useCallback(() => {
    return rows.some((row) => row.name && row.name.trim() !== '');
  }, [rows]);

  const importRows = useCallback((newRows) => {
    const paddedRows = [...newRows];
    if (paddedRows.length < initialRowCount) {
      const needed = initialRowCount - paddedRows.length;
      paddedRows.push(...Array.from({ length: needed }).map(makeEmptyRow));
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
    setRows(paddedRows);
  }, [initialRowCount]);

  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveToStorage(rows);
  }, [rows]);

  return {
    rows,
    setRows,
    getFilledRows,
    clearAllRows,
    hasUnsavedData,
    isInitialized,
    importRows,
    forceSave,
  };
}

const CUSTOMER_STORAGE_KEY = 'sales_billing_customer';

export function useSalesCustomer() {
  const [customer, setCustomer] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name || parsed.phone || parsed.patientName) return parsed;
      }
    } catch (error) {
      console.error('Failed to load customer from storage:', error);
    }
    return {
      customer_id:     null,
      name:            '',
      phone:           '',
      address:         '',
      doctorName:      '',
      patientName:     '',
      paymentType:     'CASH',
      cashReceived:    '',
      gstNumber:       '',
      discountPercent: 0,
      eWayBillNo:      '',
      sameAsCustomer:  false,
    };
  });

  useEffect(() => {
    const hasData = customer.name || customer.phone || customer.patientName || customer.doctorName;
    if (hasData) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    }
  }, [customer]);

  const clearCustomer = useCallback(() => {
    setCustomer({
      customer_id:     null,
      name:            '',
      phone:           '',
      address:         '',
      doctorName:      '',
      patientName:     '',
      paymentType:     'CASH',
      cashReceived:    '',
      gstNumber:       '',
      discountPercent: 0,
      eWayBillNo:      '',
      sameAsCustomer:  false,
    });
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  }, []);

  return { customer, setCustomer, clearCustomer };
}