// pharmacy-web/src/pages/report/shared/ReportFiltersBar.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/shared/ReportFiltersBar.jsx

import { Search, X, ChevronDown } from "lucide-react";

const ReportFiltersBar = ({ filters, onFilterChange, onReset, config = [] }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {config.map((field) => {
        if (field.type === "date") {
          return (
            <div key={field.key} className="relative">
              <label className="absolute -top-2 left-2 text-[9px] bg-white px-1 font-semibold text-gray-500 z-10">
                {field.label}
              </label>
              <input
                type="date"
                value={filters[field.key] || ""}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
                className="h-9 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white min-w-[140px]"
              />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.key} className="relative">
              <label className="absolute -top-2 left-2 text-[9px] bg-white px-1 font-semibold text-gray-500 z-10">
                {field.label}
              </label>
              <select
                value={filters[field.key] || ""}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
                className="h-9 pl-3 pr-7 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white appearance-none min-w-[130px]"
              >
                <option value="">All</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          );
        }

        if (field.type === "search") {
          return (
            <div key={field.key} className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={filters[field.key] || ""}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
                placeholder={field.placeholder || "Search..."}
                className="h-9 pl-8 pr-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white min-w-[200px]"
              />
            </div>
          );
        }

        return null;
      })}

      {/* Reset */}
      <button
        onClick={onReset}
        className="h-9 px-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <X size={12} />
        Reset
      </button>
    </div>
  );
};

export default ReportFiltersBar;