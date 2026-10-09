// pharmacy-web/src/pages/marketplace-reports/components/shared/MarketplaceExportButton.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/shared/MarketplaceExportButton.jsx

import React, { useState } from "react";
import { FileSpreadsheet, Check } from "lucide-react";

const MarketplaceExportButton = ({
  data = [],
  filename = "marketplace_report",
  columns = [],
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Resolve column headers and keys
    const cols =
      columns.length > 0
        ? columns
        : Object.keys(data[0] || {}).map((k) => ({
            key: k,
            label: k.replace(/_/g, " ").toUpperCase(),
          }));

    const esc = (val) => {
      if (val === null || val === undefined) return '""';
      if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const headerRow = cols.map((c) => esc(c.label)).join(",");
    const rows = data.map((row) =>
      cols
        .map((c) => {
          const val = c.renderRaw ? c.renderRaw(row[c.key], row) : row[c.key];
          return esc(val);
        })
        .join(",")
    );

    const csvContent = "\uFEFF" + [headerRow, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDisabled = disabled || !data || data.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={isDisabled}
      className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all
        ${
          isDisabled
            ? "opacity-30 cursor-not-allowed bg-white/[0.02] border-white/[0.06] text-white/40"
            : copied
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15]"
        }
      `}
      title={isDisabled ? "No data available to export" : "Export current table to CSV"}
    >
      {copied ? (
        <>
          <Check size={13} className="text-emerald-400" />
          <span>Exported</span>
        </>
      ) : (
        <>
          <FileSpreadsheet size={13} className="text-emerald-400" />
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
};

export default MarketplaceExportButton;