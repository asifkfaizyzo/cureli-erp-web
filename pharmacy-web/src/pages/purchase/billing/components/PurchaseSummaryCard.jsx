// pharmacy-web/src/pages/purchase/billing/components/PurchaseSummaryCard.jsx (do not remove this comment)
// src/pages/purchase/billing/components/PurchaseSummaryCard.jsx

import React from "react";
import {
  Calculator,
  Percent,
  Receipt,
  IndianRupee,
  Minus,
  Plus,
  Gift,
  AlertCircle,
} from "lucide-react";

// Skeleton component for loading state
const SkeletonLine = ({ width = "100%", height = "16px", className = "" }) => (
  <div
    className={`bg-slate-200 rounded animate-pulse ${className}`}
    style={{ width, height }}
  />
);

const PurchaseSummaryCard = ({
  summary,
  isLoading = false,
  isEditingConfirmed = false,
}) => {
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-gradient-to-r from-[#05015A] to-[#0a0280]">
          <SkeletonLine width="80px" height="14px" className="bg-white/20" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonLine width="60px" height="12px" />
              <SkeletonLine width="50px" height="12px" />
            </div>
          ))}
          <div className="pt-2 border-t border-slate-200 mt-2">
            <div className="flex justify-between items-center">
              <SkeletonLine width="80px" height="16px" />
              <SkeletonLine width="70px" height="16px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(summary.subtotal) || 0;
  const totalDiscount = parseFloat(summary.totalDiscount) || 0;
  const taxableAmount = parseFloat(summary.taxableAmount) || 0;
  const cgst = parseFloat(summary.cgst) || 0;
  const sgst = parseFloat(summary.sgst) || 0;
  const totalTax = parseFloat(summary.totalTax) || 0;
  const roundOff = parseFloat(summary.roundOff) || 0;
  const total = parseFloat(summary.total) || 0;
  const itemCount = summary.itemCount || 0;

  //  NEW: Free item info
  const freeItemCount = summary.freeItemCount || 0;
  const totalFreeQty = summary.totalFreeQty || 0;

  return (
    <div
      className={`
      h-full bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col
      ${isEditingConfirmed ? "border-amber-300" : "border-slate-200"}
    `}
    >
      {/* Header */}
      <div
        className={`
        px-3 py-2 flex items-center justify-between
        ${
          isEditingConfirmed
            ? "bg-gradient-to-r from-amber-600 to-orange-600"
            : "bg-gradient-to-r from-[#05015A] to-[#0a0280]"
        }
      `}
      >
        <div className="flex items-center gap-2">
          <Calculator size={14} className="text-white" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wide">
            Invoice Summary
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {freeItemCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/80 rounded text-[9px] text-white font-medium">
              <Gift size={10} />
              {freeItemCount}
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] text-white font-medium">
            {itemCount} items
          </span>
        </div>
      </div>

      {/*  NEW: Free Items Info Banner */}
      {freeItemCount > 0 && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <Gift size={12} className="text-green-600" />
              Free Items
            </span>
            <span className="text-green-800 font-bold">
              {freeItemCount} items ({totalFreeQty} units)
            </span>
          </div>
          <p className="text-[9px] text-green-600 mt-0.5">
            Free items are not included in the totals below
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1.5">
          {/* Subtotal */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Receipt size={10} className="text-slate-400" />
              Subtotal
            </span>
            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
              ₹{formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discount */}
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between py-1 px-2 bg-rose-50 rounded">
              <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                <Minus size={10} />
                Total Discount
              </span>
              <span className="text-[11px] font-semibold text-rose-600 tabular-nums">
                -₹{formatCurrency(totalDiscount)}
              </span>
            </div>
          )}

          {/* Taxable Amount */}
          <div className="flex items-center justify-between py-1 border-t border-dashed border-slate-200 pt-2">
            <span className="text-[10px] text-slate-500 font-medium">
              Taxable Amount
            </span>
            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
              ₹{formatCurrency(taxableAmount)}
            </span>
          </div>

          {/* Tax Breakdown */}
          <div className="bg-slate-50 rounded p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 flex items-center gap-1">
                <Percent size={9} className="text-slate-400" />
                CGST
              </span>
              <span className="text-[10px] font-medium text-slate-600 tabular-nums">
                ₹{formatCurrency(cgst)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 flex items-center gap-1">
                <Percent size={9} className="text-slate-400" />
                SGST
              </span>
              <span className="text-[10px] font-medium text-slate-600 tabular-nums">
                ₹{formatCurrency(sgst)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-1 mt-1">
              <span className="text-[9px] text-slate-600 font-medium">
                Total Tax
              </span>
              <span className="text-[10px] font-bold text-slate-700 tabular-nums">
                ₹{formatCurrency(totalTax)}
              </span>
            </div>
          </div>

          {/* Round Off */}
          {Math.abs(roundOff) > 0.001 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                {roundOff >= 0 ? <Plus size={10} /> : <Minus size={10} />}
                Round Off
              </span>
              <span
                className={`text-[10px] font-medium tabular-nums ${
                  roundOff >= 0 ? "text-green-600" : "text-rose-600"
                }`}
              >
                {roundOff >= 0 ? "+" : ""}₹{formatCurrency(roundOff)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div
        className={`
        p-3 border-t-2
        ${
          isEditingConfirmed
            ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300"
            : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
        }
      `}
      >
        <div className="flex items-center justify-between">
          <span
            className={`
            text-xs font-bold uppercase tracking-wide
            ${isEditingConfirmed ? "text-amber-800" : "text-indigo-800"}
          `}
          >
            Net Amount
          </span>
          <div className="flex items-center gap-1">
            <IndianRupee
              size={14}
              className={
                isEditingConfirmed ? "text-amber-700" : "text-indigo-700"
              }
            />
            <span
              className={`
              text-lg font-bold tabular-nums
              ${isEditingConfirmed ? "text-amber-900" : "text-indigo-900"}
            `}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Edit mode indicator */}
        {isEditingConfirmed && (
          <div className="mt-2 pt-2 border-t border-amber-200">
            <p className="text-[9px] text-amber-700 flex items-center gap-1">
              <AlertCircle size={10} />
              Changes will adjust inventory stock levels
            </p>
          </div>
        )}

        {/* In words - optional */}
        {total > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200/50">
            <p
              className={`
              text-[9px] italic
              ${isEditingConfirmed ? "text-amber-700" : "text-indigo-700"}
            `}
            >
              {convertToWords(Math.round(total))} Only
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert number to words
function convertToWords(num) {
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + numToWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        numToWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + numToWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        numToWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + numToWords(n % 100000) : "")
      );
    return (
      numToWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + numToWords(n % 10000000) : "")
    );
  };

  return "Rupees " + numToWords(num);
}

export default PurchaseSummaryCard;
