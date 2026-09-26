// pharmacy-web/src/hooks/sales/useSalesCustomer.js (do not remove this comment)
// src/hooks/sales/useSalesCustomer.js
import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "sales_draft_customer";

const defaultCustomer = {
  customer_id: null,
  name: "",
  phone: "",
  doctor_name: "",
  patient_name: "",
  address: "",
  gst_number: "",
  discount_percent: 0,
  credit_limit: 0,
  outstanding_balance: 0,
  payment_mode: "CASH",
  cash_received: "",
  is_credit_sale: false,
};

export function useSalesCustomer() {
  const [customer, setCustomer] = useState(defaultCustomer);
  const isInitializedRef = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomer({ ...defaultCustomer, ...parsed });
      }
    } catch (e) {
      console.warn("Failed to load saved customer:", e);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const hasData = customer.name || customer.phone || customer.patient_name;
    if (hasData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
    }
  }, [customer]);

  // Select a customer from search
  const selectCustomer = useCallback((selectedCustomer) => {
    if (!selectedCustomer) {
      setCustomer(defaultCustomer);
      return;
    }

    setCustomer({
      ...defaultCustomer,
      customer_id: selectedCustomer.customer_id,
      name: selectedCustomer.name || "",
      phone: selectedCustomer.phone || "",
      address: selectedCustomer.address_line_1 || "",
      gst_number: selectedCustomer.gst_number || "",
      discount_percent: parseFloat(selectedCustomer.discount_percent) || 0,
      credit_limit: parseFloat(selectedCustomer.credit_limit) || 0,
      outstanding_balance: parseFloat(selectedCustomer.outstanding_balance) || 0,
    });
  }, []);

  // Update a single field
  const updateField = useCallback((field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Validate customer
  const validateCustomer = useCallback(() => {
    const errors = [];

    if (customer.payment_mode === "CREDIT" && !customer.customer_id) {
      errors.push("Credit sales require a registered customer");
    }

    if (customer.cash_received) {
      const received = parseFloat(customer.cash_received) || 0;
      if (received < 0) {
        errors.push("Cash received cannot be negative");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [customer]);

  // Reset customer
  const resetCustomer = useCallback(() => {
    setCustomer(defaultCustomer);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Calculate change/balance
  const calculateChange = useCallback((totalAmount) => {
    const received = parseFloat(customer.cash_received) || 0;
    return received - totalAmount;
  }, [customer.cash_received]);

  return {
    customer,
    setCustomer,
    selectCustomer,
    updateField,
    validateCustomer,
    resetCustomer,
    calculateChange,
    isInitialized: isInitializedRef.current,
  };
}

export default useSalesCustomer;