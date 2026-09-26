// pharmacy-web/src/pages/sales/invoice/components/SalesInvoiceFilters.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/SalesInvoiceFilters.jsx

import React, { useState } from "react";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  Building2,
  CreditCard,
} from "lucide-react";

const SalesInvoiceFilters = ({
  filters,
  onChange,
  onSearch,
  onReset,
  branches = [],
  showBranchFilter = false,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field) => (e) => {
    onChange(field, e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch?.();
    }
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value && key !== "branch" && key !== "branchId",
  );

  const inputClass = `
    w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]
    transition-all placeholder:text-gray-400
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  const selectClass = `
    w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]
    transition-all appearance-none cursor-pointer
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Main Filter Row */}
      <div className="p-3 flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={filters.invoiceNumber || ""}
            onChange={handleInputChange("invoiceNumber")}
            onKeyDown={handleKeyDown}
            placeholder="Search by invoice number..."
            className={`${inputClass} pl-9`}
            disabled={disabled}
          />
        </div>

        {/* Customer Name */}
        <div className="w-48 relative">
          <User
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={filters.customerName || ""}
            onChange={handleInputChange("customerName")}
            onKeyDown={handleKeyDown}
            placeholder="Customer name..."
            className={`${inputClass} pl-9`}
            disabled={disabled}
          />
        </div>

        {/* Status Filter */}
        <div className="w-36 relative">
          <select
            value={filters.status || ""}
            onChange={handleInputChange("status")}
            className={selectClass}
            disabled={disabled}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARKED">Parked</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* Payment Status Filter */}
        <div className="w-36 relative">
          <select
            value={filters.paymentStatus || ""}
            onChange={handleInputChange("paymentStatus")}
            className={selectClass}
            disabled={disabled}
          >
            <option value="">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partial</option>
            <option value="UNPAID">Unpaid</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              isExpanded || hasActiveFilters
                ? "bg-[#000060] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
          `}
          disabled={disabled}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full bg-white text-[#000060] text-[10px] font-bold flex items-center justify-center">
              {
                Object.values(filters).filter(
                  (v) => v && v !== filters.branch && v !== filters.branchId,
                ).length
              }
            </span>
          )}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Search Button */}
        <button
          onClick={onSearch}
          disabled={disabled}
          className="px-4 py-2 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000060]/90 transition-colors disabled:opacity-50"
        >
          Search
        </button>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all filters"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100">
          <div className="grid grid-cols-5 gap-3 mt-3">
            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                From Date
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={filters.fromDate || ""}
                  onChange={handleInputChange("fromDate")}
                  className={`${inputClass} pl-9`}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                To Date
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={filters.toDate || ""}
                  onChange={handleInputChange("toDate")}
                  className={`${inputClass} pl-9`}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={filters.phone || ""}
                onChange={handleInputChange("phone")}
                onKeyDown={handleKeyDown}
                placeholder="Customer phone..."
                className={inputClass}
                disabled={disabled}
              />
            </div>

            {/* Branch Filter (if in global mode) */}
            {showBranchFilter && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Branch
                </label>
                <div className="relative">
                  <Building2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={filters.branch || ""}
                    onChange={handleInputChange("branch")}
                    className={`${selectClass} pl-9`}
                    disabled={disabled}
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            )}

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Payment Mode
              </label>
              <div className="relative">
                <CreditCard
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={filters.paymentMode || ""}
                  onChange={handleInputChange("paymentMode")}
                  className={`${selectClass} pl-9`}
                  disabled={disabled}
                >
                  <option value="">All Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT">Credit</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoiceFilters;
