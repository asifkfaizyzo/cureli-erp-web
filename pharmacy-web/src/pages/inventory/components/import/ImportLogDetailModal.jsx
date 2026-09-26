// pharmacy-web/src/pages/inventory/components/import/ImportLogDetailModal.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportLogDetailModal.jsx

import React, { useEffect, useState } from "react";
import {
  X,
  FileSpreadsheet,
  Building2,
  User,
  Calendar,
  Download,
  Package,
  GitMerge,
  SkipForward,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import inventoryImportAPI  from "../../../../api/inventoryImport";
import ImportLogErrorTable from "./ImportLogErrorTable";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  COMPLETED: {
    label:  "Completed",
    icon:   CheckCircle,
    color:  "text-emerald-600",
    bg:     "bg-emerald-50",
    border: "border-emerald-200",
  },
  PARTIAL: {
    label:  "Partial Import",
    icon:   AlertTriangle,
    color:  "text-amber-600",
    bg:     "bg-amber-50",
    border: "border-amber-200",
  },
  FAILED: {
    label:  "Failed",
    icon:   XCircle,
    color:  "text-red-600",
    bg:     "bg-red-50",
    border: "border-red-200",
  },
  CANCELLED: {
    label:  "Cancelled",
    icon:   XCircle,
    color:  "text-gray-400",
    bg:     "bg-gray-50",
    border: "border-gray-200",
  },
  AWAITING_REVIEW: {
    label:  "Awaiting Review",
    icon:   Clock,
    color:  "text-indigo-600",
    bg:     "bg-indigo-50",
    border: "border-indigo-200",
  },
  PARSING: {
    label:  "Processing",
    icon:   Loader2,
    color:  "text-indigo-600",
    bg:     "bg-indigo-50",
    border: "border-indigo-200",
  },
  CONFIRMING: {
    label:  "Writing",
    icon:   Loader2,
    color:  "text-indigo-600",
    bg:     "bg-indigo-50",
    border: "border-indigo-200",
  },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-xl
                   border ${bgClass} gap-1.5`}>
    <Icon size={18} className={colorClass} />
    <p className={`text-xl font-extrabold tabular-nums ${colorClass}`}>
      {(value ?? 0).toLocaleString()}
    </p>
    <p className="text-[11px] text-gray-500 font-medium text-center leading-tight">
      {label}
    </p>
  </div>
);

// ── Meta row ──────────────────────────────────────────────────────────────────

const MetaItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon size={14} className="text-gray-400 shrink-0" />
      <span className="text-gray-400 shrink-0">{label}:</span>
      <span className="font-medium text-gray-800 truncate">{value}</span>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ══════════════════════════════════════════════════════════════════════════════

const ImportLogDetailModal = ({ importJobId, onClose }) => {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Fetch detail on mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (!importJobId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    inventoryImportAPI.getJobDetail(importJobId)
      .then((response) => {
        if (cancelled) return;
        if (!response.success) throw new Error(response.message);
        setDetail(response.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load import details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [importJobId]);

  // ── Close on Escape ───────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Derived values ────────────────────────────────────────────────────────

  const config = detail
    ? (STATUS_CONFIG[detail.status] || STATUS_CONFIG.FAILED)
    : null;
  const StatusIcon = config?.icon;
  const isSpinner  = detail && ["PARSING", "CONFIRMING"].includes(detail.status);

  const createdLabel = detail?.createdAt
    ? new Date(detail.createdAt).toLocaleString("en-IN", {
        day:    "2-digit",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const completedLabel = detail?.completedAt
    ? new Date(detail.completedAt).toLocaleString("en-IN", {
        day:    "2-digit",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const durationSeconds = detail?.completedAt && detail?.createdAt
    ? Math.round(
        (new Date(detail.completedAt) - new Date(detail.createdAt)) / 1000
      )
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl
                     shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="shrink-0 flex items-center justify-between
                          px-6 py-4 bg-gradient-to-r from-[#000060] to-indigo-800">
            <div className="flex items-center gap-3 min-w-0">
              <FileSpreadsheet size={20} className="text-white shrink-0" />
              <div className="min-w-0">
                <h2 className="text-white font-semibold text-base truncate">
                  Import Details
                </h2>
                <p className="text-indigo-200 text-xs mt-0.5 truncate">
                  {loading ? "Loading..." : (detail?.originalFileName || "—")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg bg-white/20 text-white
                         hover:bg-red-500/30 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-24 gap-3">
                <Loader2 size={22} className="animate-spin text-indigo-500" />
                <span className="text-sm text-gray-500">Loading details...</span>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="p-6">
                <div className="flex items-center gap-3 p-4 bg-red-50 border
                                border-red-200 rounded-xl">
                  <AlertCircle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Detail content */}
            {detail && !loading && (
              <div className="p-6 space-y-6">

                {/* ── Status banner ── */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border
                                 ${config.bg} ${config.border}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center
                                   justify-center shrink-0 bg-white/60`}>
                    <StatusIcon
                      size={20}
                      className={`${config.color} ${isSpinner ? "animate-spin" : ""}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${config.color}`}>
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {detail.originalFileName}
                      {detail.detectedSoftware &&
                       detail.detectedSoftware !== "Unknown" && (
                        <span className="ml-2 text-gray-400">
                          · {detail.detectedSoftware}
                        </span>
                      )}
                    </p>
                  </div>
                  {durationSeconds !== null && (
                    <span className="shrink-0 text-xs text-gray-400 font-medium">
                      {durationSeconds}s
                    </span>
                  )}
                </div>

                {/* ── Meta info ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4
                                bg-gray-50 border border-gray-200 rounded-xl">
                  <MetaItem
                    icon={Building2}
                    label="Branch"
                    value={detail.branch?.branch_name}
                  />
                  <MetaItem
                    icon={User}
                    label="Imported by"
                    value={detail.creator?.full_name}
                  />
                  <MetaItem
                    icon={Calendar}
                    label="Started"
                    value={createdLabel}
                  />
                  {completedLabel && (
                    <MetaItem
                      icon={Calendar}
                      label="Completed"
                      value={completedLabel}
                    />
                  )}
                </div>

                {/* ── Stats grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard
                    icon={FileSpreadsheet}
                    label="Total Rows"
                    value={detail.totalRows}
                    colorClass="text-gray-700"
                    bgClass="bg-white border-gray-200"
                  />
                  <StatCard
                    icon={Package}
                    label="New Batches"
                    value={detail.newBatches}
                    colorClass="text-emerald-700"
                    bgClass="bg-emerald-50 border-emerald-200"
                  />
                  <StatCard
                    icon={GitMerge}
                    label="Merged / Replaced"
                    value={detail.mergedAndReplaced}
                    colorClass="text-blue-700"
                    bgClass="bg-blue-50 border-blue-200"
                  />
                  <StatCard
                    icon={SkipForward}
                    label="Skipped"
                    value={detail.skippedRows}
                    colorClass="text-gray-600"
                    bgClass="bg-white border-gray-200"
                  />
                  <StatCard
                    icon={AlertCircle}
                    label="Errors"
                    value={detail.errorRows}
                    colorClass={detail.errorRows > 0 ? "text-red-700" : "text-gray-400"}
                    bgClass={detail.errorRows > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-gray-200"
                    }
                  />
                </div>

                {/* ── New medicines created ── */}
                {detail.newMedicinesCreated > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50
                                  border border-indigo-200 rounded-xl">
                    <Package size={16} className="text-indigo-500 shrink-0" />
                    <p className="text-sm text-indigo-800">
                      <span className="font-bold">{detail.newMedicinesCreated}</span>
                      {" "}new medicine{detail.newMedicinesCreated !== 1 ? "s" : ""} added
                      to your catalog during this import.
                    </p>
                  </div>
                )}

                {/* ── No errors — happy state ── */}
                {!detail.hasErrors && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50
                                  border border-emerald-200 rounded-xl">
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-800 font-medium">
                      All rows imported successfully with no errors.
                    </p>
                  </div>
                )}

                {/* ── Error section ── */}
                {detail.hasErrors && (
                  <div className="space-y-3">

                    {/* Section header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-500" />
                        <h3 className="text-sm font-bold text-gray-800">
                          Row Errors
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5
                                         bg-red-50 text-red-600 border border-red-200
                                         rounded-full">
                          {detail.validationErrors.length} rows affected
                        </span>
                      </div>

                      {/* Download error report */}
                      <a
                        href={inventoryImportAPI.downloadErrorReport(importJobId)}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                                   font-medium text-gray-600 bg-white border
                                   border-gray-200 rounded-lg hover:bg-gray-50
                                   hover:border-gray-300 transition-colors"
                      >
                        <Download size={13} />
                        Download CSV
                      </a>
                    </div>

                    {/* Context note */}
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50
                                    border border-amber-200 rounded-lg">
                      <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        These rows were skipped during import. Fix the issues
                        in your source file and re-import to add them.
                        Click any row below to see the specific error and
                        what to fix.
                      </p>
                    </div>

                    {/* Error table */}
                    <ImportLogErrorTable
                      validationErrors={detail.validationErrors}
                    />
                  </div>
                )}

                {/* ── Failed job with system error (no row errors) ── */}
                {detail.status === "FAILED" &&
                 !detail.hasErrors &&
                 detail.validationErrors?.length > 0 &&
                 detail.validationErrors[0]?.message &&
                 !detail.validationErrors[0]?.errors && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      System Error
                    </p>
                    <p className="text-sm text-red-600">
                      {detail.validationErrors[0].message}
                    </p>
                    {detail.validationErrors[0].phase && (
                      <p className="text-xs text-red-400 mt-1.5">
                        Phase: {detail.validationErrors[0].phase}
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50
                          flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Job ID:{" "}
              <span className="font-mono text-gray-500">
                {importJobId}
              </span>
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-white
                         bg-[#000060] hover:bg-indigo-800 rounded-xl
                         transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default ImportLogDetailModal;