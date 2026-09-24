// cadmin-web/src/pages/Subscription-management/comps/risk/TimeRangeFilter.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/TimeRangeFilter.jsx

import { useMemo } from "react";

const TIME_RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

export default function TimeRangeFilter({
  value,
  onChange,
  disabled = false,
  compact = false,
}) {
  const options = useMemo(() => TIME_RANGE_OPTIONS, []);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">Range:</span>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`px-2 py-1 text-xs rounded transition-all
              ${
                value === option.value
                  ? "bg-[#000060] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  // Original full-size version
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600 font-medium">Time Range:</span>
      <div className="flex items-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all
              ${
                value === option.value
                  ? "bg-[#000060] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}