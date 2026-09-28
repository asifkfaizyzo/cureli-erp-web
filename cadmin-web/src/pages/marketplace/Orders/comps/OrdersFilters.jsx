// cadmin-web/src/pages/marketplace/Orders/comps/OrdersFilters.jsx (do not remove this comment)
import { Search, X, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import StyledSelect from "../../../../components/common/StyledSelect";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PLACED", label: "Placed" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const OrdersFilters = ({ search, setSearch, statusFilter, setStatusFilter }) => {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = useMemo(() => {
    return [statusFilter].filter(Boolean).length;
  }, [statusFilter]);

  const handleClearFilters = () => {
    setStatusFilter("");
    setSearch("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or Shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                       bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#05015A]/20 
                       focus:border-[#05015A] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                         text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2
                     transition-all shadow-sm relative flex-shrink-0
                     ${showFilters || activeFiltersCount > 0
                         ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                         : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                     }`}
        >
          <Filter size={18} />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                             text-xs font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StyledSelect
              label="Order Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={STATUS_OPTIONS}
              placeholder="All Statuses"
            />
          </div>

          {(statusFilter || search) && (
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 
                           hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 font-medium"
              >
                <X size={16} />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersFilters;