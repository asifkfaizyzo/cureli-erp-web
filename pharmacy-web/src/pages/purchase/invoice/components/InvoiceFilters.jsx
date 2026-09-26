// pharmacy-web/src/pages/purchase/invoice/components/InvoiceFilters.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/invoice/components/InvoiceFilters.jsx

import React from "react";
import {
  Search,
  Building2,
  Hash,
  RotateCcw,
  ChevronRight,
  Filter,
  Layers,
  Loader2,
} from "lucide-react";
import StyledSelect from "../../../../components/common/StyledSelect";
import StyledDateFilter from "../../../../components/common/StyledDateFilter";

// ════════════════════════════════════════════════════════════════════════════
// TEXT INPUT FIELD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const TextInputField = ({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const isActive = Boolean(value && value.trim());

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
        {Icon && <Icon size={10} />}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          className={`
            h-10 px-3 w-full border rounded-lg text-sm shadow-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            transition-all duration-200 ease-in-out
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50
            ${
              isActive
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium placeholder:text-indigo-400"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 placeholder:text-gray-400"
            }
          `}
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// FILTER OPTIONS
// ════════════════════════════════════════════════════════════════════════════

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const InvoiceFilters = ({
  filters,
  onChange,
  onSearch,
  onReset,
  branches = [],
  showBranchFilter = false,
  disabled = false,
}) => {
  // Convert branches array to options format
  const branchOptions = [
    { value: "", label: "All Branches" },
    ...branches.map((branch) => ({ value: branch, label: branch })),
  ];

  const hasActiveFilters = Object.values(filters).some(
    (val) => val && val.toString().trim() !== "",
  );

  const activeFilterCount = Object.values(filters).filter(
    (val) => val && val.toString().trim() !== "",
  ).length;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FILTER HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 text-gray-700 shrink-0">
          <div className="relative">
            <Filter size={16} className="text-indigo-600" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-semibold">Filters</span>
          {disabled && (
            <Loader2 size={12} className="animate-spin text-indigo-500" />
          )}
          {hasActiveFilters && !disabled && (
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TEXT FILTERS */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {/* Supplier Name */}
        <div className="w-40">
          <TextInputField
            label="Supplier"
            icon={Building2}
            value={filters.supplierName}
            onChange={(value) => onChange("supplierName", value)}
            placeholder="Supplier name..."
            disabled={disabled}
          />
        </div>

        {/* Invoice Number */}
        <div className="w-32">
          <TextInputField
            label="Invoice #"
            icon={Hash}
            value={filters.invoiceNumber}
            onChange={(value) => onChange("invoiceNumber", value)}
            placeholder="PUR-000001..."
            disabled={disabled}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SELECT FILTERS */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {/* Branch Filter - Only shown in global mode */}
        {/* {showBranchFilter && (
          <div className="w-36">
            <StyledSelect
              label={
                <span className="flex items-center gap-1">
                  <Layers size={10} />
                  Branch
                </span>
              }
              value={filters.branch || ""}
              onChange={(value) => onChange("branch", value)}
              options={branchOptions}
              placeholder="All Branches"
              disabled={disabled}
            />
          </div>
        )} */}

        {/* Status Filter */}
        <div className="w-32">
          <StyledSelect
            label="Status"
            value={filters.status || ""}
            onChange={(value) => onChange("status", value)}
            options={STATUS_OPTIONS}
            placeholder="All Status"
            disabled={disabled}
          />
        </div>

        {/* Payment Status */}
        <div className="w-36">
          <StyledSelect
            label="Payment"
            value={filters.paymentStatus || ""}
            onChange={(value) => onChange("paymentStatus", value)}
            options={PAYMENT_STATUS_OPTIONS}
            placeholder="All Payments"
            disabled={disabled}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DATE FILTERS */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="h-8 w-px bg-gray-200" />

        {/* From Date */}
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
          <StyledDateFilter
            label="From"
            date={filters.fromDate || ""}
            setDate={(value) => onChange("fromDate", value)}
          />
        </div>

        {/* Arrow */}
        <div className="flex items-center h-10 text-gray-300 mt-5">
          <ChevronRight size={14} />
        </div>

        {/* To Date */}
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
          <StyledDateFilter
            label="To"
            date={filters.toDate || ""}
            setDate={(value) => onChange("toDate", value)}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ACTION BUTTONS */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="flex items-center gap-2 ml-auto mt-5">
          {/* Reset Button */}
          <button
            onClick={onReset}
            disabled={disabled || !hasActiveFilters}
            className={`
              flex items-center justify-center
              h-10 w-10 rounded-lg
              border transition-all duration-150
              ${
                hasActiveFilters && !disabled
                  ? "text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
                  : "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
              }
              active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
            `}
            title={hasActiveFilters ? "Reset Filters" : "No active filters"}
          >
            <RotateCcw size={14} />
          </button>

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={disabled}
            className="
              flex items-center gap-2 h-10 px-5
              bg-indigo-600 text-white text-sm font-semibold
              rounded-lg shadow-sm
              hover:bg-indigo-700
              active:scale-95 transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:active:scale-100
            "
          >
            {disabled ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilters;
