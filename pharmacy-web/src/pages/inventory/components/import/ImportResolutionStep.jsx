// pharmacy-web/src/pages/inventory/components/import/ImportResolutionStep.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportResolutionStep.jsx

import React, { useState, useMemo } from "react";
import {
  CheckCircle, Clock, AlertCircle, Search,
  ChevronDown, ChevronUp, ArrowRight, Loader2
} from "lucide-react";

// Status badge — mirrors ImportResultModal StatusBadge
const StatusBadge = ({ status }) => {
  const config = {
    AUTO_LINKED:  { label: "Auto-linked",    color: "emerald" },
    PENDING:      { label: "Needs review",   color: "amber"   },
    NO_MATCH:     { label: "Not in catalog", color: "slate"   },
    EXISTING:     { label: "Already in shop","color": "blue"  },
  };
  const c     = config[status] || config.NO_MATCH;
  const colors = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber:   "bg-amber-50   border-amber-200   text-amber-700",
    slate:   "bg-slate-50   border-slate-200   text-slate-600",
    blue:    "bg-blue-50    border-blue-200    text-blue-700",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                      text-xs font-medium border ${colors[c.color]}`}>
      {c.label}
    </span>
  );
};

// Decision selector for one medicine entry
const MedicineDecisionRow = ({ entry, decision, onSetDecision }) => {
  const [expanded, setExpanded] = useState(false);

  const handleAction = (action, extra = {}) => {
    onSetDecision(entry.key, { action, ...extra });
  };

  const hasDecision = !!decision;
  const actionLabel = decision
    ? decision.action === "link"         ? "Link to catalog"
    : decision.action === "create"       ? "Create new"
    : decision.action === "use_existing" ? "Use existing"
    : decision.action === "skip"         ? "Skip"
    : "Decided"
    : null;

  return (
    <div className={`
      border rounded-xl overflow-hidden transition-all
      ${hasDecision ? "border-gray-200" : "border-amber-200"}
    `}>
      {/* Row header */}
      <div
        className={`
          flex items-center gap-3 px-4 py-3 cursor-pointer
          ${hasDecision ? "bg-white hover:bg-gray-50" : "bg-amber-50 hover:bg-amber-100"}
        `}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Status indicator */}
        <div className={`
          w-5 h-5 rounded-full shrink-0 flex items-center justify-center
          ${hasDecision ? "bg-emerald-500" : "bg-amber-200"}
        `}>
          {hasDecision ? (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {entry.inputName}
          </p>
          <p className="text-xs text-gray-500">
            {entry.inputCompany || "Unknown manufacturer"}
            <span className="mx-1">·</span>
            {entry.rowCount} {entry.rowCount === 1 ? "batch" : "batches"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={entry.status} />
          {hasDecision && (
            <span className="text-xs text-emerald-600 font-medium">
              {actionLabel}
            </span>
          )}
          {expanded
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">

            {/* Use existing — shown when medicine already in shop */}
            {entry.status === "EXISTING" && entry.existingMedicineId && (
              <button
                onClick={() => handleAction("use_existing", {
                  existingMedicineId: entry.existingMedicineId,
                  masterMedicineId:   entry.masterMedicineId || null,
                  variantId:          entry.variantId        || null,
                })}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                  ${decision?.action === "use_existing"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                  }
                `}
              >
                ✓ Use existing medicine
              </button>
            )}

            {/* Auto-link — shown when catalog match is high confidence */}
            {(entry.status === "AUTO_LINKED") && entry.masterMedicineId && (
              <button
                onClick={() => handleAction("link", {
                  masterMedicineId: entry.masterMedicineId,
                  variantId:        entry.variantId || null,
                })}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                  ${decision?.action === "link"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  }
                `}
              >
                ✓ Link to catalog
              </button>
            )}

            {/* Create new */}
            {entry.status !== "EXISTING" && (
              <button
                onClick={() => handleAction("create")}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                  ${decision?.action === "create"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  }
                `}
              >
                + Create as new medicine
              </button>
            )}

            {/* Skip */}
            <button
              onClick={() => handleAction("skip")}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                ${decision?.action === "skip"
                  ? "bg-gray-600 text-white border-gray-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              Skip all {entry.rowCount} {entry.rowCount === 1 ? "batch" : "batches"}
            </button>
          </div>

          {/* Suggestions for PENDING/NO_MATCH */}
          {(entry.status === "PENDING" || entry.status === "NO_MATCH") &&
            entry.suggestions?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                Catalog suggestions:
              </p>
              <div className="space-y-1.5">
                {entry.suggestions.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction("link", {
                      masterMedicineId: s.master_medicine_id,
                      variantId:        s.variant_id,
                    })}
                    className={`
                      w-full text-left px-3 py-2 text-xs rounded-lg border
                      transition-colors
                      ${decision?.masterMedicineId === s.master_medicine_id
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-gray-50 border-gray-200 hover:border-indigo-300 text-gray-700"
                      }
                    `}
                  >
                    <span className="font-medium">{s.variant_name}</span>
                    <span className="ml-2 opacity-60">
                      {s.confidence}% match
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const ImportResolutionStep = ({
  resolutionReport,
  userResolutions,
  onSetDecision,
  resolvedCount,
  totalCount,
  allDone,
  validationErrors,
  onProceed,
  loading,
  error,
  onClearError,
}) => {
  const entries = useMemo(
    () => Object.values(resolutionReport),
    [resolutionReport]
  );

  // Separate by status for grouped display
  const existing    = entries.filter((e) => e.status === "EXISTING");
  const autoLinked  = entries.filter((e) => e.status === "AUTO_LINKED");
  const needsReview = entries.filter(
    (e) => e.status === "PENDING" || e.status === "NO_MATCH"
  );

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="shrink-0 grid grid-cols-3 gap-3 px-6 py-4
                      bg-slate-50 border-b border-slate-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-700">{existing.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Already in shop</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-700">{autoLinked.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Auto-linked</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-700">{needsReview.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Needs decision</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="shrink-0 px-6 py-3 border-b border-gray-100 bg-white
                      flex items-center justify-between">
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{resolvedCount}</span>
          {" "}of{" "}
          <span className="font-semibold text-gray-900">{totalCount}</span>
          {" "}medicines decided
        </span>
        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Validation errors summary */}
      {validationErrors.length > 0 && (
        <div className="shrink-0 mx-6 mt-4 p-3 bg-red-50 border
                        border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-700">
            {validationErrors.length} rows have validation errors and will not
            be imported.
          </p>
        </div>
      )}

      {/* Medicine list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">

        {/* Needs review first — these require action */}
        {needsReview.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-amber-700 uppercase
                          tracking-wider px-1">
              Needs Decision ({needsReview.length})
            </p>
            {needsReview.map((entry) => (
              <MedicineDecisionRow
                key={entry.key}
                entry={entry}
                decision={userResolutions[entry.key]}
                onSetDecision={onSetDecision}
              />
            ))}
          </div>
        )}

        {/* Auto-linked — can confirm or change */}
        {autoLinked.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-bold text-emerald-700 uppercase
                          tracking-wider px-1">
              Auto-Linked ({autoLinked.length})
            </p>
            {autoLinked.map((entry) => (
              <MedicineDecisionRow
                key={entry.key}
                entry={entry}
                decision={userResolutions[entry.key]}
                onSetDecision={onSetDecision}
              />
            ))}
          </div>
        )}

        {/* Already in shop — auto-resolved, shown collapsed */}
        {existing.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-bold text-blue-700 uppercase
                          tracking-wider px-1">
              Already in Shop ({existing.length}) — Auto-resolved
            </p>
            {existing.map((entry) => (
              <MedicineDecisionRow
                key={entry.key}
                entry={entry}
                decision={userResolutions[entry.key]}
                onSetDecision={onSetDecision}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <button
          onClick={onProceed}
          disabled={!allDone || loading}
          className={`
            w-full flex items-center justify-center gap-2 py-3 px-6
            rounded-xl font-semibold text-sm transition-all
            ${allDone && !loading
              ? "bg-[#000060] text-white hover:bg-indigo-800"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" />Saving decisions...</>
          ) : (
            <>Continue <ArrowRight size={16} /></>
          )}
        </button>
        {!allDone && (
          <p className="text-xs text-center text-amber-600 mt-2">
            {totalCount - resolvedCount} medicines still need a decision.
          </p>
        )}
      </div>
    </div>
  );
};

export default ImportResolutionStep;