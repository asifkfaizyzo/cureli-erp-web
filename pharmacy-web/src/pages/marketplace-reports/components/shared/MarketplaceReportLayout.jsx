// pharmacy-web/src/pages/marketplace-reports/components/shared/MarketplaceReportLayout.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/shared/MarketplaceReportLayout.jsx

import React from "react";
import MarketplaceExportButton from "./MarketplaceExportButton";

const MarketplaceReportLayout = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  filterBar,
  statCards,
  children,
  exportData,
  exportFilename,
  exportColumns,
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
      {/* ── Sub-header / Filter strip ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
        <div>
          {title && (
            <div className="flex items-center gap-2">
              {Icon && <Icon size={16} className="text-indigo-400" />}
              <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
            </div>
          )}
          {subtitle && (
            <p className="text-[11px] text-white/45 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {actions}
          {exportData && (
            <MarketplaceExportButton
              data={exportData}
              filename={exportFilename}
              columns={exportColumns}
            />
          )}
        </div>
      </div>

      {/* ── Filters Bar ── */}
      {filterBar && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] flex-shrink-0">
          {filterBar}
        </div>
      )}

      {/* ── Stat Cards Strip ── */}
      {statCards && (
        <div className="flex-shrink-0">
          {statCards}
        </div>
      )}

      {/* ── Main Analytical Panels / Tables ── */}
      <div className="flex-1 min-h-0 flex flex-col space-y-5">
        {children}
      </div>
    </div>
  );
};

export default MarketplaceReportLayout;