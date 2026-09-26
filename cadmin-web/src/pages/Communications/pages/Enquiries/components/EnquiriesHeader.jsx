// cadmin-web/src/pages/Communications/pages/Enquiries/components/EnquiriesHeader.jsx (do not remove this comment)
//cadmin-web\src\pages\Communications\pages\Enquiries\components\EnquiriesHeader.jsx
import { Search, RefreshCw } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const statusOptions = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REPLIED", label: "Replied" },
  { value: "CLOSED", label: "Closed" },
];

const EnquiriesHeader = memo(
  ({ stats, filters, onFilterChange, onRefresh, isLoading }) => {
    const [searchValue, setSearchValue] = useState(filters.search || "");

    //  Debounce search to prevent too many API calls
    const debouncedSearch = useDebouncedCallback((value) => {
      onFilterChange({ search: value });
    }, 500);

    const handleSearchChange = useCallback(
      (e) => {
        const value = e.target.value;
        setSearchValue(value);
        debouncedSearch(value);
      },
      [debouncedSearch],
    );

    const handleStatusChange = useCallback(
      (e) => {
        onFilterChange({ status: e.target.value });
      },
      [onFilterChange],
    );

    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.total ?? 0}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
            <p className="text-xs text-yellow-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">
              {stats?.pending ?? 0}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">
              {stats?.inProgress ?? 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
            <p className="text-xs text-green-600 font-medium">Replied</p>
            <p className="text-2xl font-bold text-green-700">
              {stats?.replied ?? 0}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Closed</p>
            <p className="text-2xl font-bold text-gray-700">
              {stats?.closed ?? 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or enquiry number..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

EnquiriesHeader.displayName = "EnquiriesHeader";

export default EnquiriesHeader;
