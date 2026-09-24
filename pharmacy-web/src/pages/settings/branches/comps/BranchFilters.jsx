// pharmacy-web/src/pages/settings/branches/comps/BranchFilters.jsx (do not remove this comment)
// src/pages/settings/branches/comps/BranchFilters.jsx

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/**
 * BranchFilters
 * Search and filter controls for branch list
 */
const BranchFilters = ({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const searchTimeoutRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange("search", searchValue);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, filters.search, onFilterChange]);

  const handleClearSearch = () => {
    setSearchValue("");
    onFilterChange("search", "");
  };

  const handleClearFilters = () => {
    setSearchValue("");
    onFilterChange("search", "");
    onFilterChange("status", "active");
  };

  const hasActiveFilters =
    filters.search || filters.status !== "active";

  const activeFilterCount = [
    filters.search,
    filters.status !== "active" ? filters.status : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by branch name, city, or contact..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-[#000060] text-white border-[#000060]"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-white text-[#000060] rounded-full text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </motion.button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onFilterChange("status", "active")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.status === "active"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <CheckCircle2 size={14} />
                Active
              </button>
              <button
                onClick={() => onFilterChange("status", "inactive")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.status === "inactive"
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <XCircle size={14} />
                Inactive
              </button>
              <button
                onClick={() => onFilterChange("status", "")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.status === ""
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BranchFilters;