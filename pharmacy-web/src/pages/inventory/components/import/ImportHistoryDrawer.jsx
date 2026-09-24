// pharmacy-web/src/pages/inventory/components/import/ImportHistoryDrawer.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportHistoryDrawer.jsx
//
// Slide-in drawer showing past import jobs for this shop.
// Accessible via the "Import History" button on InventoryPage.

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import inventoryImportAPI from "../../../../api/inventoryImport";

// ══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  COMPLETED: {
    label:  "Completed",
    icon:   CheckCircle,
    color:  "text-emerald-600",
    bg:     "bg-emerald-50",
    border: "border-emerald-200",
  },
  PARTIAL: {
    label:  "Partial",
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

// ══════════════════════════════════════════════════════════════════════════════
// SINGLE JOB ROW
// ══════════════════════════════════════════════════════════════════════════════

const JobRow = ({ job }) => {
  const [expanded, setExpanded] = useState(false);

  const config    = STATUS_CONFIG[job.status] || STATUS_CONFIG.FAILED;
  const Icon      = config.icon;
  const isSpinner = ["PARSING", "CONFIRMING"].includes(job.status);

  const createdAt = new Date(job.created_at);
  const dateLabel = createdAt.toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
  const timeLabel = createdAt.toLocaleTimeString("en-IN", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const totalWritten =
    (job.imported_rows || 0) + 0; // merged/replaced not stored separately on history

  return (
    <div className={`
      border rounded-xl overflow-hidden transition-all
      ${config.border}
    `}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-left
          ${config.bg} hover:brightness-95 transition-all
        `}
      >
        {/* Status icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                         shrink-0 bg-white/70`}>
          <Icon
            size={16}
            className={`${config.color} ${isSpinner ? "animate-spin" : ""}`}
          />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {job.original_file_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {dateLabel} at {timeLabel}
            {job.detected_software && job.detected_software !== "Unknown" && (
              <span className="ml-2 text-gray-400">
                · {job.detected_software}
              </span>
            )}
          </p>
        </div>

        {/* Status badge */}
        <span className={`
          shrink-0 px-2.5 py-1 rounded-full text-xs font-medium
          ${config.color} bg-white/70 border ${config.border}
        `}>
          {config.label}
        </span>

        {expanded
          ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
          : <ChevronDown size={14} className="text-gray-400 shrink-0" />
        }
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Total rows</span>
              <span className="font-medium text-gray-900">
                {(job.total_rows || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Imported</span>
              <span className="font-medium text-emerald-700">
                {(job.imported_rows || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Skipped</span>
              <span className="font-medium text-gray-600">
                {(job.skipped_rows || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Errors</span>
              <span className={`font-medium ${job.error_rows > 0 ? "text-red-600" : "text-gray-600"}`}>
                {(job.error_rows || 0).toLocaleString()}
              </span>
            </div>
            {job.new_medicines_created > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-50 col-span-2">
                <span className="text-gray-500">New medicines created</span>
                <span className="font-medium text-indigo-700">
                  {job.new_medicines_created.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Imported by */}
          {job.creator?.full_name && (
            <p className="text-xs text-gray-400">
              Imported by{" "}
              <span className="font-medium text-gray-600">
                {job.creator.full_name}
              </span>
              {job.branch?.branch_name && (
                <span>
                  {" "}· Branch:{" "}
                  <span className="font-medium text-gray-600">
                    {job.branch.branch_name}
                  </span>
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DRAWER
// ══════════════════════════════════════════════════════════════════════════════

const ImportHistoryDrawer = ({ open, onClose }) => {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);
  const [meta,    setMeta]    = useState(null);

  const fetchHistory = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryImportAPI.getHistory(pageNum, 15);
      if (!response.success) throw new Error(response.message);

      if (pageNum === 1) {
        setJobs(response.data.jobs);
      } else {
        setJobs((prev) => [...prev, ...response.data.jobs]);
      }
      setMeta(response.data.meta);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Failed to load import history.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on open
  useEffect(() => {
    if (open) {
      fetchHistory(1);
    } else {
      // Reset when closed
      setJobs([]);
      setPage(1);
      setMeta(null);
      setError(null);
    }
  }, [open, fetchHistory]);

  if (!open) return null;

  const hasMore = meta && page < meta.totalPages;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md
                      bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between
                        px-5 py-4 border-b border-gray-200
                        bg-gradient-to-r from-[#000060] to-indigo-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-white" />
            <h2 className="text-white font-semibold">Import History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(1)}
              disabled={loading}
              className="p-2 rounded-lg bg-white/20 text-white
                         hover:bg-white/30 transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white
                         hover:bg-red-500/30 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50
                            border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center
                            py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100
                              flex items-center justify-center">
                <FileSpreadsheet size={28} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">No imports yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your import history will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobRow key={job.import_job_id} job={job} />
              ))}

              {/* Load more */}
              {hasMore && (
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-medium text-indigo-600
                             bg-indigo-50 border border-indigo-200 rounded-xl
                             hover:bg-indigo-100 transition-colors
                             disabled:opacity-50 flex items-center
                             justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" />Loading...</>
                    : `Load more (${meta.total - jobs.length} remaining)`
                  }
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {meta && (
          <div className="shrink-0 px-5 py-3 border-t border-gray-200
                          bg-gray-50 text-xs text-gray-400 text-center">
            {meta.total} import{meta.total !== 1 ? "s" : ""} total
          </div>
        )}
      </div>
    </>
  );
};

export default ImportHistoryDrawer;