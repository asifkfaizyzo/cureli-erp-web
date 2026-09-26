// pharmacy-web/src/hooks/purchase/usePurchaseCalculation.js (do not remove this comment)
// src/hooks/purchase/usePurchaseCalculation.js

import { useMemo } from "react";

/**
 *  Create empty purchase row with all fields
 */
export const makeEmptyPurchaseRow = () => ({
  rowId: null,
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
  isFreeItem: false,
  parentRowId: null,
});

/**
 * Calculate single row values
 */
export const calculateRow = (row) => {
  //  FREE ITEM HANDLING - Return zero amounts
  if (row.isFreeItem) {
    return {
      ...row,
      amount: "0",
      netRate: "0",
      cgstAmount: "0",
      sgstAmount: "0",
      taxableValue: "0",
      discountAmount: "0",
      schemeAmount: "0",
    };
  }

  const qty = parseFloat(row.qty) || 0;
  const price = parseFloat(row.price) || 0;
  const schemePercent = parseFloat(row.schemePercent) || 0;
  const discountPercent = parseFloat(row.discountPercent) || 0;
  const cgstPercent = parseFloat(row.cgstPercent) || 0;
  const sgstPercent = parseFloat(row.sgstPercent) || 0;

  const gross = qty * price;
  const schemeAmount = (gross * schemePercent) / 100;
  const afterScheme = gross - schemeAmount;
  const discountAmount = (afterScheme * discountPercent) / 100;
  const taxableValue = afterScheme - discountAmount;

  const cgstAmount = (taxableValue * cgstPercent) / 100;
  const sgstAmount = (taxableValue * sgstPercent) / 100;

  const netRate = qty > 0 ? taxableValue / qty : 0;
  const amount = taxableValue + cgstAmount + sgstAmount;

  return {
    ...row,
    schemeAmount: schemeAmount.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxableValue: taxableValue.toFixed(2),
    cgstAmount: cgstAmount.toFixed(2),
    sgstAmount: sgstAmount.toFixed(2),
    netRate: netRate.toFixed(2),
    amount: amount.toFixed(2),
  };
};

/**
 *  Hook to calculate purchase invoice summary - Excludes free items
 */
export const usePurchaseCalculation = (rows) => {
  const summary = useMemo(() => {
    const billableRows = rows.filter((row) => !row.isFreeItem);
    const freeRows = rows.filter((row) => row.isFreeItem);

    let subtotal = 0;
    let totalSchemeDiscount = 0;
    let totalTradeDiscount = 0;
    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let itemCount = 0;
    let freeItemCount = 0;
    let totalFreeQty = 0;

    billableRows.forEach((row) => {
      if (!row.name || !row.qty) return;

      const qty = parseFloat(row.qty) || 0;
      const price = parseFloat(row.price) || 0;
      const schemePercent = parseFloat(row.schemePercent) || 0;
      const discountPercent = parseFloat(row.discountPercent) || 0;
      const cgstPercent = parseFloat(row.cgstPercent) || 0;
      const sgstPercent = parseFloat(row.sgstPercent) || 0;

      if (qty <= 0 || price <= 0) return;

      const gross = qty * price;
      const schemeAmt = (gross * schemePercent) / 100;
      const afterScheme = gross - schemeAmt;
      const tradeAmt = (afterScheme * discountPercent) / 100;
      const taxable = afterScheme - tradeAmt;
      const cgstAmt = (taxable * cgstPercent) / 100;
      const sgstAmt = (taxable * sgstPercent) / 100;

      subtotal += gross;
      totalSchemeDiscount += schemeAmt;
      totalTradeDiscount += tradeAmt;
      taxableAmount += taxable;
      totalCgst += cgstAmt;
      totalSgst += sgstAmt;
      itemCount += 1;
    });

    freeRows.forEach((row) => {
      if (!row.name || !row.qty) return;
      const qty = parseFloat(row.qty) || 0;
      if (qty > 0) {
        freeItemCount += 1;
        totalFreeQty += qty;
      }
    });

    const totalDiscount = totalSchemeDiscount + totalTradeDiscount;
    const totalTax = totalCgst + totalSgst;
    const grossTotal = taxableAmount + totalTax;
    const roundOff = Math.round(grossTotal) - grossTotal;
    const netAmount = Math.round(grossTotal);

    return {
      subtotal: subtotal.toFixed(2),
      schemeDiscount: totalSchemeDiscount.toFixed(2),
      tradeDiscount: totalTradeDiscount.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      cgst: totalCgst.toFixed(2),
      sgst: totalSgst.toFixed(2),
      totalTax: totalTax.toFixed(2),
      roundOff: roundOff.toFixed(2),
      total: netAmount.toFixed(2),
      itemCount,
      freeItemCount,
      totalFreeQty,
      totalRowCount: billableRows.length + freeRows.length,
    };
  }, [rows]);

  return { summary };
};

export default usePurchaseCalculation;
