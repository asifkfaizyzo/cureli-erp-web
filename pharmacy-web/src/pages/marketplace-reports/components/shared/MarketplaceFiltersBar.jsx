// pharmacy-web/src/pages/marketplace-reports/components/shared/MarketplaceFiltersBar.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/shared/MarketplaceFiltersBar.jsx

import React from "react";
import { Search, RotateCcw, Calendar } from "lucide-react";
import DarkSelect from "../../../marketplace-listings/components/DarkSelect";

// Helper for date presets (IST timezone safe)
function getPresetDates(type) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (type === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (type === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { startDate: d.toISOString().split("T")[0], endDate: todayStr };
  }

  if (type === "mtd") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start.toISOString().split("T")[0], endDate: todayStr };
  }

  if (type === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }

  return null;
}

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "mtd", label: "This Month" },
  { id: "last_month", label: "Last Month" },
];

const MarketplaceFiltersBar = ({
  filters,
  onFilterChange,
  onReset,
  config = [],
  showPresets = true,
}) => {
  // Determine if active dates match any quick preset
  const activePreset = PRESETS.find((p) => {
    const dates = getPresetDates(p.id);
    return (
      dates &&
      filters.startDate === dates.startDate &&
      filters.endDate === dates.endDate
    );
  })?.id;

  const handleApplyPreset = (presetId) => {
    const dates = getPresetDates(presetId);
    if (!dates) return;
    onFilterChange("startDate", dates.startDate);
    onFilterChange("endDate", dates.endDate);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* ── Quick Date Presets ── */}
      {showPresets && (
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activePreset === p.id
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                  : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Dynamic Field Controls ── */}
      {config.map((field) => {
        // Date Input
        if (field.type === "date") {
          return (
            <div key={field.key} className="relative flex items-center">
              <input
                type="date"
                value={filters[field.key] || ""}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
                className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-all min-w-[135px] [color-scheme:dark]"
              />
            </div>
          );
        }

        // Custom Dropdown using DarkSelect
        if (field.type === "select") {
          const selectOptions = [
            { value: "", label: field.allLabel || `All ${field.label || ""}`.trim() },
            ...(field.options || []),
          ];

          return (
            <div key={field.key}>
              <DarkSelect
                value={filters[field.key] || ""}
                onChange={(val) => onFilterChange(field.key, val)}
                options={selectOptions}
                placeholder={field.label || "Select..."}
                prefix={field.prefix || ""}
              />
            </div>
          );
        }

        // Search Input
        if (field.type === "search") {
          return (
            <div key={field.key} className="relative flex-1 min-w-[180px] max-w-xs">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
              />
              <input
                type="text"
                value={filters[field.key] || ""}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
                placeholder={field.placeholder || "Search..."}
                className="h-9 w-full pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/30 text-xs outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-all"
              />
            </div>
          );
        }

        return null;
      })}

      {/* ── Reset Button ── */}
      <button
        type="button"
        onClick={onReset}
        title="Reset filters to default"
        className="h-9 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-semibold flex items-center gap-1.5"
      >
        <RotateCcw size={12} />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default MarketplaceFiltersBar;