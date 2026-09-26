// pharmacy-web/src/pages/report/shared/ExportButtons.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/shared/ExportButtons.jsx

import { useState } from "react";
import { Download, FileText, Sheet, Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

const ExportButtons = ({ data = [], filename = "report", columns = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // ── 1. EXCEL EXPORT (.xlsx) ──────────────────────────────────────────────
  const handleExcel = () => {
    if (!data.length) return;

    // Transform data according to defined columns
    const excelRows = data.map((row) => {
      const rowObj = {};
      columns.forEach((col) => {
        const val = row[col.key] ?? "";
        // If numeric string, convert to Number for Excel formulas/formatting
        rowObj[col.label] = !isNaN(val) && val !== "" && typeof val !== "boolean"
          ? Number(val)
          : val;
      });
      return rowObj;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Auto-fit column widths
    const colWidths = columns.map((col) => {
      const maxLen = Math.max(
        col.label.length,
        ...data.map((row) => String(row[col.key] ?? "").length),
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
    });
    worksheet["!cols"] = colWidths;

    // Create workbook and write file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);

    setIsOpen(false);
  };

  // ── 2. CSV EXPORT (.csv) ─────────────────────────────────────────────────
  const handleCSV = () => {
    if (!data.length) return;

    const headers = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key] ?? "";
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes('"') ? `"${str}"` : str;
        })
        .join(","),
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // ── 3. PRINT ─────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
      >
        <Download size={14} />
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
            {/* Excel Option */}
            <button
              onClick={handleExcel}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Export Excel (.xlsx)
            </button>

            {/* CSV Option */}
            <button
              onClick={handleCSV}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              <Sheet size={15} className="text-blue-600" />
              Export CSV (.csv)
            </button>

            {/* Print Option */}
            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors font-medium border-t border-gray-100"
            >
              <Printer size={15} className="text-gray-600" />
              Print Report
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButtons;