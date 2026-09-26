// cadmin-web/src/pages/marketplace/Communications/pages/Email/comps/MobileEmailAudienceFilterPanel.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Communications/pages/Email/comps/MobileEmailAudienceFilterPanel.jsx

import { useState } from "react";
import { Users, Calendar, ShoppingBag, X } from "lucide-react";
import StyledDateFilter from "../../../../../../components/common/StyledDateFilter";

function MobileEmailAudienceFilterPanel({
  filters = {},
  onChange,
  disabled,
  recipientPreview,
}) {
  const [dateFrom, setDateFrom] = useState(filters.registered_from || "");
  const [dateTo, setDateTo] = useState(filters.registered_to || "");

  const handleToggleTargetAll = () => {
    const isTargetAll = filters.target_all !== false;
    onChange({
      ...filters,
      target_all: !isTargetAll,
    });
  };

  const handleToggleOrdersOnly = () => {
    onChange({
      ...filters,
      has_orders: !filters.has_orders,
    });
  };

  const handleDateFrom = (val) => {
    setDateFrom(val);
    onChange({ ...filters, registered_from: val || undefined });
  };

  const handleDateTo = (val) => {
    setDateTo(val);
    onChange({ ...filters, registered_to: val || undefined });
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    onChange({ target_all: true });
  };

  const hasActiveFilters =
    filters.has_orders || filters.registered_from || filters.registered_to;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Customer Filter Options
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* All Customers vs Filtered */}
        <div
          onClick={() => !disabled && handleToggleTargetAll()}
          className={`
            flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
            ${
              filters.target_all !== false
                ? "border-[#05015A] bg-white shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
              <Users size={18} className="text-[#05015A]" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">
                All Customers
              </span>
              <p className="text-xs text-gray-500">
                Target all verified app customers
              </p>
            </div>
          </div>
          <div
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
              ${
                filters.target_all !== false
                  ? "border-[#05015A] bg-[#05015A]"
                  : "border-gray-300"
              }
            `}
          >
            {filters.target_all !== false && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Has Placed Orders */}
        <div
          onClick={() => !disabled && handleToggleOrdersOnly()}
          className={`
            flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
            ${
              filters.has_orders
                ? "border-[#05015A] bg-white shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShoppingBag size={18} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">
                Active Buyers
              </span>
              <p className="text-xs text-gray-500">
                Customers with at least 1 order
              </p>
            </div>
          </div>
          <div
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
              ${
                filters.has_orders
                  ? "border-[#05015A] bg-[#05015A]"
                  : "border-gray-300"
              }
            `}
          >
            {filters.has_orders && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="pt-2">
        <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
          <Calendar size={12} />
          Customer Registration Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <StyledDateFilter
            date={dateFrom}
            setDate={handleDateFrom}
            placeholder="Registered From"
          />
          <StyledDateFilter
            date={dateTo}
            setDate={handleDateTo}
            placeholder="Registered To"
          />
        </div>
      </div>
    </div>
  );
}

export default MobileEmailAudienceFilterPanel;