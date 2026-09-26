// pharmacy-web/src/pages/inventory/components/import/ImportProcessingStep.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportProcessingStep.jsx

import React from "react";
import { FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";

const PHASE_STEPS = [
  { key: "PARSING",       label: "File parsed" },
  { key: "DEDUPLICATING", label: "Deduplication complete" },
  { key: "CATALOG_CHECK", label: "Catalog check" },
  { key: "VALIDATING",    label: "Validation complete" },
  { key: "READY",         label: "Ready for review" },
];

const PHASE_ORDER = PHASE_STEPS.map((p) => p.key);

function getPhaseIndex(phase) {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx === -1 ? 0 : idx;
}

const ImportProcessingStep = ({
  fileName,
  totalRows,
  processingPhase,
  processingProgress,
  phaseLabel,
  detectedSoftware,
  error,
  onCancel,
}) => {
  const currentPhaseIdx = getPhaseIndex(processingPhase);

  // Estimate time remaining (rough: catalog check is ~200ms per unique medicine)
  const estimatedSeconds =
    processingProgress > 0 && processingProgress < 100
      ? Math.round(((100 - processingProgress) / processingProgress) * 10)
      : null;

  return (
    <div className="p-6 space-y-6">
      {/* File info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 border
                      border-gray-200 rounded-xl">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex
                        items-center justify-center shrink-0">
          <FileSpreadsheet size={24} className="text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">
            {fileName || "Inventory file"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalRows.toLocaleString()} rows detected
            {detectedSoftware && detectedSoftware !== "Unknown" && (
              <span className="ml-2 text-indigo-600">
                · {detectedSoftware}
              </span>
            )}
          </p>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 p-4 bg-red-50 border
                        border-red-200 rounded-xl">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700">Processing failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium text-gray-700 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                {phaseLabel}
              </span>
              <span className="font-bold text-indigo-600">
                {processingProgress}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all
                            duration-500 ease-out"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            {estimatedSeconds !== null && estimatedSeconds > 5 && (
              <p className="text-xs text-gray-400 mt-1.5 text-right">
                Estimated time remaining: ~{estimatedSeconds}s
              </p>
            )}
          </div>

          {/* Phase checklist */}
          <div className="space-y-2">
            {PHASE_STEPS.map((phase, idx) => {
              const isDone    = idx < currentPhaseIdx;
              const isCurrent = idx === currentPhaseIdx;
              const isFuture  = idx > currentPhaseIdx;

              return (
                <div
                  key={phase.key}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
                    transition-colors
                    ${isDone    ? "bg-emerald-50  text-emerald-700" : ""}
                    ${isCurrent ? "bg-indigo-50   text-indigo-700 font-medium" : ""}
                    ${isFuture  ? "bg-gray-50     text-gray-400"  : ""}
                  `}
                >
                  {isDone && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500
                                     flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none"
                           viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {isCurrent && (
                    <span className="w-5 h-5 shrink-0 flex items-center
                                     justify-center">
                      <Loader2 size={14} className="animate-spin" />
                    </span>
                  )}
                  {isFuture && (
                    <span className="w-5 h-5 rounded-full border-2
                                     border-gray-300 shrink-0" />
                  )}
                  <span>{phase.label}</span>

                  {/* Show progress detail for catalog check */}
                  {isCurrent && phase.key === "CATALOG_CHECK" &&
                    processingProgress > 25 && (
                    <span className="ml-auto text-xs opacity-70">
                      {processingProgress}% complete
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Warning */}
          <p className="text-xs text-center text-gray-400">
            Please keep this window open while processing. Large files may take
            1–2 minutes.
          </p>
        </>
      )}
    </div>
  );
};

export default ImportProcessingStep;