// pharmacy-web/src/pages/inventory/components/import/ImportLogErrorTable.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportLogErrorTable.jsx

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  Package,
  Tag,
} from "lucide-react";
import StyledSelect from "../../../../components/common/StyledSelect";

// ── Human-readable error explanations ────────────────────────────────────────

const ERROR_EXPLANATIONS = {
  R001: { title: "Missing Product Name",      help: "The product/medicine name column was empty for this row." },
  R002: { title: "Missing Batch Number",      help: "Batch number is required. Check if this row has a batch column value." },
  R003: { title: "Invalid Quantity",          help: "Quantity must be a valid number. Check for text or special characters in the quantity column." },
  R004: { title: "Invalid MRP",               help: "MRP must be greater than zero. This product may have a missing or zero MRP in your file." },
  R005: { title: "Unparseable Expiry Date",   help: "The expiry date format could not be recognized. Common formats: MM/YY, MMM-YY, DD/MM/YYYY." },
  R006: { title: "Purchase Rate Exceeds MRP", help: "The purchase/cost price is higher than MRP. This usually indicates swapped columns or a data entry error in the source file." },
  R007: { title: "Negative Quantity",         help: "Quantity cannot be negative. Check the source file for minus signs or credit entries." },
  D001: { title: "Duplicate in File",         help: "This product + batch combination appears multiple times in the file. Only the first occurrence is imported." },
};

// ── Error code badge ──────────────────────────────────────────────────────────

const ErrorCodeBadge = ({ code }) => {
  const isWarning   = code?.startsWith("W");
  const isDuplicate = code === "D001";

  const colorClass = isDuplicate
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : isWarning
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
                      font-mono font-bold border ${colorClass}`}>
      {code}
    </span>
  );
};

// ── Single error row ──────────────────────────────────────────────────────────

const ErrorRow = ({ entry, isLast }) => {
  const [expanded, setExpanded] = useState(false);

  const errors = entry.errors || [];

  return (
    <div className={`${!isLast ? "border-b border-gray-100" : ""}`}>

      {/* Collapsed row — click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                   hover:bg-gray-50 transition-colors"
      >
        {/* Row number */}
        <div className="shrink-0 w-12 flex items-center gap-1">
          <Hash size={10} className="text-gray-300" />
          <span className="text-xs font-mono font-bold text-gray-500">
            {(entry.rowIndex ?? 0) + 1}
          </span>
        </div>

        {/* Product name + batch */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {entry.productName || "—"}
          </p>
          {entry.batchNumber && (
            <p className="text-[11px] text-gray-400 font-mono truncate">
              Batch: {entry.batchNumber}
            </p>
          )}
        </div>

        {/* Error code badges — show first 2, then +N */}
        <div className="shrink-0 flex items-center gap-1.5">
          {errors.slice(0, 2).map((err, i) => (
            <ErrorCodeBadge key={i} code={err.code} />
          ))}
          {errors.length > 2 && (
            <span className="text-[10px] text-gray-400 font-medium">
              +{errors.length - 2}
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <div className="shrink-0">
          {expanded
            ? <ChevronUp   size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />
          }
        </div>
      </button>

      {/* Expanded error detail cards */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {errors.map((err, i) => {
            const expl = err.code ? ERROR_EXPLANATIONS[err.code] : null;
            return (
              <div
                key={i}
                className="ml-12 p-3 bg-gray-50 border border-gray-200
                           rounded-lg space-y-1.5"
              >
                {/* Code badge + title */}
                <div className="flex items-center gap-2">
                  <ErrorCodeBadge code={err.code} />
                  {expl && (
                    <span className="text-xs font-semibold text-gray-700">
                      {expl.title}
                    </span>
                  )}
                </div>

                {/* Error message */}
                <p className="text-xs text-gray-600 leading-relaxed">
                  {err.message}
                </p>

                {/* Raw value */}
                {err.rawValue !== undefined && err.rawValue !== "" && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-gray-400">Raw value:</span>
                    <code className="px-1.5 py-0.5 bg-white border border-gray-200
                                     rounded font-mono text-gray-600">
                      {String(err.rawValue)}
                    </code>
                  </div>
                )}

                {/* Field name */}
                {err.field && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Tag size={10} className="text-gray-300" />
                    <span className="text-gray-400">
                      Field:{" "}
                      <span className="font-medium text-gray-600">
                        {err.field}
                      </span>
                    </span>
                  </div>
                )}

                {/* Help tip */}
                {expl && (
                  <p className="text-[11px] text-blue-600 bg-blue-50
                                border border-blue-100 rounded px-2 py-1.5
                                leading-relaxed">
                    💡 {expl.help}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main table ────────────────────────────────────────────────────────────────

const ImportLogErrorTable = ({ validationErrors }) => {
  const [search,     setSearch]     = useState("");
  const [showAll,    setShowAll]    = useState(false);
  const [filterCode, setFilterCode] = useState("ALL");

  // Build unique error code options for the StyledSelect
  const filterOptions = useMemo(() => {
    const codes = new Set();
    for (const entry of validationErrors) {
      for (const err of (entry.errors || [])) {
        if (err.code) codes.add(err.code);
      }
    }

    const sorted = Array.from(codes).sort();

    return [
      { value: "ALL", label: `All errors (${validationErrors.length})` },
      ...sorted.map((code) => {
        const expl = ERROR_EXPLANATIONS[code];
        return {
          value: code,
          label: expl ? `${code} — ${expl.title}` : code,
        };
      }),
    ];
  }, [validationErrors]);

  // Apply search + error code filter
  const filtered = useMemo(() => {
    let result = validationErrors;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        (e.productName || "").toLowerCase().includes(q) ||
        (e.batchNumber || "").toLowerCase().includes(q)
      );
    }

    if (filterCode !== "ALL") {
      result = result.filter((e) =>
        (e.errors || []).some((err) => err.code === filterCode)
      );
    }

    return result;
  }, [validationErrors, search, filterCode]);

  const displayCount = showAll ? filtered.length : Math.min(filtered.length, 25);
  const displayItems = filtered.slice(0, displayCount);
  const hasMore      = filtered.length > displayCount;

  // Empty state
  if (!validationErrors || validationErrors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Package size={24} className="text-gray-300" />
        <p className="text-sm text-gray-400">No errors found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── Search + filter bar ── */}
      <div className="flex items-center gap-2">

        {/* Search input */}
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or batch..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200
                       rounded-lg bg-white focus:outline-none focus:ring-2
                       focus:ring-indigo-500/20 focus:border-indigo-300
                       placeholder:text-gray-400"
          />
        </div>

        {/* Error code filter — StyledSelect */}
        <div className="w-56 shrink-0">
          <StyledSelect
            value={filterCode}
            onChange={setFilterCode}
            options={filterOptions}
            placeholder="Filter by error type"
          />
        </div>
      </div>

      {/* Results count when filtered */}
      {(search || filterCode !== "ALL") && (
        <p className="text-[11px] text-gray-400 px-1">
          Showing {filtered.length} of {validationErrors.length} errors
          {filterCode !== "ALL" && (
            <button
              onClick={() => setFilterCode("ALL")}
              className="ml-2 text-indigo-500 hover:text-indigo-700
                         underline underline-offset-2"
            >
              clear filter
            </button>
          )}
        </p>
      )}

      {/* ── Error rows ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">

        {displayItems.map((entry, idx) => (
          <ErrorRow
            key={`${entry.rowIndex}-${idx}`}
            entry={entry}
            isLast={idx === displayItems.length - 1 && !hasMore}
          />
        ))}

        {/* Show more button */}
        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2.5 text-xs font-medium text-indigo-600
                       bg-indigo-50 hover:bg-indigo-100 transition-colors
                       border-t border-gray-200"
          >
            Show all {filtered.length} errors
          </button>
        )}

        {/* No results from filter/search */}
        {filtered.length === 0 && (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs text-gray-400">No errors match your search</p>
            <button
              onClick={() => { setSearch(""); setFilterCode("ALL"); }}
              className="text-xs text-indigo-500 hover:text-indigo-700
                         underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportLogErrorTable;