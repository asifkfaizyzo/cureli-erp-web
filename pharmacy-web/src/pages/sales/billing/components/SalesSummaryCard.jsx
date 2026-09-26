// pharmacy-web/src/pages/sales/billing/components/SalesSummaryCard.jsx (do not remove this comment)
// src/pages/sales/billing/components/SalesSummaryCard.jsx

import { Wallet, TrendingUp, Percent, Calculator, Receipt, IndianRupee } from "lucide-react";

const SalesSummaryCard = ({ summary, customer, isLoading = false }) => {
  const netAmount = summary?.netAmount || 0;
  const cashReceived = parseFloat(customer?.cashReceived) || 0;
  const balance = netAmount - cashReceived;

  // Calculate if we have discounts to show
  const hasItemDiscount = (summary?.itemDiscountAmount || 0) > 0;
  const hasCustomerDiscount = (summary?.customerDiscountAmount || 0) > 0;
  const hasRoundOff = (summary?.roundOff || 0) !== 0;
  const hasPayment = cashReceived > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 w-full flex flex-col overflow-hidden h-full">
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="p-3 flex-1 flex flex-col justify-center gap-3 overflow-hidden">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
            </div>
          ))}
        </div>
        <div className="bg-slate-100 px-3 py-2 mt-auto shrink-0">
          <div className="flex justify-between items-center">
            <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="w-24 h-6 bg-slate-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 w-full flex flex-col overflow-hidden h-full">
      
      {/* Header - Fixed */}
      <div className="shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
          <Receipt size={10} className="text-indigo-600 sm:hidden" />
          <Receipt size={12} className="text-indigo-600 hidden sm:block" />
        </div>
        <h3 className="text-[10px] sm:text-xs font-bold text-gray-800 truncate">Bill Summary</h3>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2">
          {/* Sub Total */}
          <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
            <span className="text-gray-500 flex items-center gap-1 sm:gap-1.5 truncate">
              <Calculator size={9} className="shrink-0 sm:hidden" />
              <Calculator size={10} className="shrink-0 hidden sm:block" />
              <span className="truncate">Sub Total</span>
            </span>
            <span className="font-semibold text-gray-900 shrink-0 ml-2">₹ {(summary?.subtotal || 0).toFixed(2)}</span>
          </div>

          {/* Item Discount */}
          {hasItemDiscount && (
            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
              <span className="text-gray-500 flex items-center gap-1 sm:gap-1.5 truncate">
                <Percent size={9} className="shrink-0 sm:hidden" />
                <Percent size={10} className="shrink-0 hidden sm:block" />
                <span className="truncate">Item Disc.</span>
              </span>
              <span className="font-medium text-rose-600 shrink-0 ml-2">- ₹ {(summary?.itemDiscountAmount || 0).toFixed(2)}</span>
            </div>
          )}

          {/* Customer Discount */}
          {hasCustomerDiscount && (
            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
              <span className="text-gray-500 flex items-center gap-1 sm:gap-1.5 truncate">
                <TrendingUp size={9} className="shrink-0 sm:hidden" />
                <TrendingUp size={10} className="shrink-0 hidden sm:block" />
                <span className="truncate">Cust. Disc ({customer?.discountPercent || 0}%)</span>
              </span>
              <span className="font-medium text-rose-600 shrink-0 ml-2">- ₹ {(summary?.customerDiscountAmount || 0).toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-dashed border-gray-200 my-0.5 sm:my-1" />

          {/* Taxable Amount */}
          <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
            <span className="text-gray-500 truncate">Taxable Amt</span>
            <span className="font-medium text-gray-800 shrink-0 ml-2">₹ {(summary?.taxableAmount || 0).toFixed(2)}</span>
          </div>

          {/* CGST */}
          <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
            <span className="text-gray-500">CGST</span>
            <span className="font-medium text-gray-700 shrink-0 ml-2">₹ {(summary?.cgstAmount || 0).toFixed(2)}</span>
          </div>

          {/* SGST */}
          <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
            <span className="text-gray-500">SGST</span>
            <span className="font-medium text-gray-700 shrink-0 ml-2">₹ {(summary?.sgstAmount || 0).toFixed(2)}</span>
          </div>

          {/* Round Off */}
          {hasRoundOff && (
            <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
              <span className="text-gray-400">Round Off</span>
              <span className="text-gray-500 shrink-0 ml-2">
                {(summary?.roundOff || 0) >= 0 ? '+' : ''} ₹ {(summary?.roundOff || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Net Amount - Fixed */}
      <div className="shrink-0 bg-[#05015A] px-2 sm:px-3 py-2 sm:py-2.5 text-white">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-[11px] font-medium opacity-90">Net Amount</span>
          <span className="text-base sm:text-lg lg:text-xl font-bold tabular-nums">
            ₹ {netAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Summary - Fixed */}
      {hasPayment && (
        <div className="shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">
            <span className="text-gray-500 flex items-center gap-1">
              <Wallet size={9} className="shrink-0 text-green-500" />
              <span className="truncate">Cash Received</span>
            </span>
            <span className="font-semibold text-green-600 shrink-0 ml-2 tabular-nums">
              ₹ {cashReceived.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
            <span className={`font-medium truncate ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {balance > 0 ? 'Balance Due' : balance < 0 ? 'Return Change' : 'Settled'}
            </span>
            <span className={`font-bold shrink-0 ml-2 tabular-nums ${balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              ₹ {Math.abs(balance).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSummaryCard;