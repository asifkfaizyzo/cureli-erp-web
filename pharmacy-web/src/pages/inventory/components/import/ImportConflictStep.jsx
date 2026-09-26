// pharmacy-web/src/pages/inventory/components/import/ImportConflictStep.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportConflictStep.jsx

import React, { useMemo } from "react";
import {
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Package,
} from "lucide-react";

/* ── Decision button config ─────────────────────────── */
const DECISIONS = [
  {
    key:    "merge",
    label:  "Add",
    active: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    idle:   "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  {
    key:    "replace",
    label:  "Replace",
    active: "bg-amber-600 text-white border-amber-600 shadow-sm",
    idle:   "bg-white text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  {
    key:    "skip",
    label:  "Skip",
    active: "bg-gray-600 text-white border-gray-600 shadow-sm",
    idle:   "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
  },
];

/* ── Compact conflict row ───────────────────────────── */
const ConflictRow = ({ cardKey, entry, currentDecision, onSetDecision }) => {
  const isResolved = !!currentDecision;

  const getResult = (action) => {
    if (action === "merge")
      return (entry.existingStock + entry.importQuantity).toLocaleString();
    if (action === "replace")
      return entry.importQuantity.toLocaleString();
    return entry.existingStock.toLocaleString();
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 transition-colors
        ${isResolved ? "bg-white" : "bg-amber-50/50"}
      `}
    >
      {/* Status dot */}
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0
          ${isResolved ? "bg-emerald-500" : "bg-amber-400"}`}
      />

      {/* Medicine + batch — takes most space */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {entry.medicineName}
        </p>
        <p className="text-[11px] text-gray-400 font-mono truncate">
          {entry.batchNumber}
        </p>
      </div>

      {/* Stock numbers */}
      <div className="shrink-0 flex items-center gap-1.5 text-xs tabular-nums">
        <span className="font-bold text-gray-700 w-10 text-right">
          {entry.existingStock.toLocaleString()}
        </span>
        <span className="text-gray-300">+</span>
        <span className="font-bold text-indigo-600 w-10 text-right">
          {entry.importQuantity.toLocaleString()}
        </span>
      </div>

      {/* Result preview */}
      <div className="shrink-0 w-12 text-right">
        {isResolved && (
          <span
            className={`text-xs font-bold tabular-nums
              ${currentDecision === "merge"   ? "text-emerald-600" : ""}
              ${currentDecision === "replace" ? "text-amber-600"   : ""}
              ${currentDecision === "skip"    ? "text-gray-400"    : ""}
            `}
          >
            {currentDecision === "skip" ? "—" : `→ ${getResult(currentDecision)}`}
          </span>
        )}
      </div>

      {/* Decision buttons — compact pill group */}
      <div className="shrink-0 flex rounded-lg overflow-hidden border border-gray-200">
        {DECISIONS.map((d) => {
          const isChosen = currentDecision === d.key;
          return (
            <button
              key={d.key}
              onClick={() => onSetDecision(cardKey, d.key)}
              className={`
                px-2.5 py-1 text-[11px] font-semibold transition-all
                border-r border-gray-200 last:border-r-0
                ${isChosen ? d.active : d.idle}
              `}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main component ─────────────────────────────────── */
const ImportConflictStep = ({
  conflictReport,
  userConflictDecisions,
  onSetDecision,
  onSetAll,
  resolvedCount,
  totalCount,
  allDone,
  onProceed,
  loading,
  error,
}) => {
  const entries = Object.entries(conflictReport || {});

  const progressPercent = useMemo(
    () => (totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0),
    [resolvedCount, totalCount]
  );

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 bg-amber-50 border-b border-amber-200">

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-gray-900">
              {totalCount} Conflict{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${allDone
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
              }`}
          >
            {resolvedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden
                        border border-amber-200 mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500
              ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-medium">
            All:
          </span>
          {[
            { key: "merge",   label: "Add all",     cls: "text-emerald-700 hover:bg-emerald-100" },
            { key: "replace", label: "Replace all", cls: "text-amber-700 hover:bg-amber-100"     },
            { key: "skip",    label: "Skip all",    cls: "text-gray-600 hover:bg-gray-100"        },
          ].map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() => onSetAll(key)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md
                          bg-white border border-gray-200 transition-colors
                          ${cls}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Column header ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2
                      bg-gray-50 border-b border-gray-200
                      text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        <div className="w-1.5" />
        <div className="flex-1">Medicine / Batch</div>
        <div className="w-[90px] text-right">Stock + Import</div>
        <div className="w-12 text-right">Result</div>
        <div className="w-[148px] text-center">Action</div>
      </div>

      {/* ── Conflict rows ── */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-gray-100">
        {entries.map(([key, entry]) => (
          <ConflictRow
            key={key}
            cardKey={key}
            entry={entry}
            currentDecision={userConflictDecisions[key]}
            onSetDecision={onSetDecision}
          />
        ))}

        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={32} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No conflicts</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">

        {allDone && !error && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3
                          bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <p className="text-xs font-medium text-emerald-700">
              All conflicts resolved
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 mb-3 px-1">{error}</p>
        )}

        <button
          onClick={onProceed}
          disabled={!allDone || loading}
          className={`
            w-full flex items-center justify-center gap-2 py-3 px-6
            rounded-xl font-bold text-sm transition-all
            ${allDone && !loading
              ? "bg-[#000060] text-white hover:bg-indigo-800 shadow-lg shadow-indigo-900/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {!allDone && !loading && (
          <p className="text-[11px] text-center text-gray-400 mt-2">
            {totalCount - resolvedCount} remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default ImportConflictStep;