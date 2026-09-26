// pharmacy-web/src/pages/inventory/components/import/ImportLogsPanel.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportLogsPanel.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import inventoryImportAPI from "../../../../api/inventoryImport";
import ImportLogJobRow    from "./ImportLogJobRow";

// ── Status filter options ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "ALL",             label: "All Imports" },
  { value: "COMPLETED",       label: "Completed" },
  { value: "PARTIAL",         label: "Partial" },
  { value: "FAILED",          label: "Failed" },
  { value: "CANCELLED",       label: "Cancelled" },
  { value: "AWAITING_REVIEW", label: "Awaiting Review" },
  { value: "PROCESSING",      label: "Processing" },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ══════════════════════════════════════════════════════════════════════════════

const ImportLogsPanel = ({ open, onClose }) => {
  // ── ALL hooks must come before any early return ───────────────────────────

  const [jobs,         setJobs]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [meta,         setMeta]         = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery,  setSearchQuery]  = useState("");

  // ── Fetch history ─────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryImportAPI.getHistory(pageNum, 20);
      if (!response.success) throw new Error(response.message);

      if (append) {
        setJobs((prev) => [...prev, ...response.data.jobs]);
      } else {
        setJobs(response.data.jobs);
      }
      setMeta(response.data.meta);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Failed to load import history.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load on open / reset on close ────────────────────────────────────────

  useEffect(() => {
    if (open) {
      fetchHistory(1);
    } else {
      setJobs([]);
      setPage(1);
      setMeta(null);
      setError(null);
      setStatusFilter("ALL");
      setSearchQuery("");
    }
  }, [open, fetchHistory]);

  // ── Close on Escape ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ── Client-side filtering ─────────────────────────────────────────────────

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (statusFilter !== "ALL") {
      if (statusFilter === "PROCESSING") {
        result = result.filter((j) =>
          ["PARSING", "CONFIRMING"].includes(j.status)
        );
      } else {
        result = result.filter((j) => j.status === statusFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((j) =>
        j.original_file_name?.toLowerCase().includes(q) ||
        j.creator?.full_name?.toLowerCase().includes(q) ||
        j.branch?.branch_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [jobs, statusFilter, searchQuery]);

  // ── Status summary counters ───────────────────────────────────────────────
  // Must be here — not after the early return — to satisfy Rules of Hooks

  const statusCounts = useMemo(() => {
    const counts = { ALL: jobs.length };
    for (const j of jobs) {
      const key = ["PARSING", "CONFIRMING"].includes(j.status)
        ? "PROCESSING"
        : j.status;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [jobs]);

  // ── Early return AFTER all hooks ──────────────────────────────────────────

  if (!open) return null;

  const hasMore = meta && page < meta.totalPages;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl
                      bg-gray-50 shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between
                        px-6 py-4 border-b border-gray-200
                        bg-gradient-to-r from-[#000060] to-indigo-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-white" />
            <div>
              <h2 className="text-white font-semibold text-lg">Import Logs</h2>
              <p className="text-indigo-200 text-xs mt-0.5">
                View all import jobs and error details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(1)}
              disabled={loading}
              className="p-2 rounded-lg bg-white/20 text-white
                         hover:bg-white/30 transition-colors"
              title="Refresh"
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

        {/* ── Filters bar ── */}
        <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-200
                        space-y-3">

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, branch, or user..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200
                         rounded-lg bg-gray-50 focus:outline-none focus:ring-2
                         focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {STATUS_FILTERS.map((sf) => {
              const count    = statusCounts[sf.value] || 0;
              const isActive = statusFilter === sf.value;

              return (
                <button
                  key={sf.value}
                  onClick={() => setStatusFilter(sf.value)}
                  className={`
                    shrink-0 flex items-center gap-1.5 px-3 py-1.5
                    rounded-lg text-xs font-medium border transition-all
                    ${isActive
                      ? "bg-[#000060] text-white border-[#000060]"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }
                  `}
                >
                  {sf.label}
                  {count > 0 && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                      }
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Loading — initial */}
          {loading && jobs.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border
                            border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Empty — no imports at all */}
          {!loading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center
                            py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100
                              flex items-center justify-center">
                <FileSpreadsheet size={28} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">No imports yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Import history and error logs will appear here.
                </p>
              </div>
            </div>
          )}

          {/* Filtered empty */}
          {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center
                            py-16 gap-3 text-center">
              <Filter size={24} className="text-gray-300" />
              <p className="text-sm text-gray-500">
                No imports match the current filter
              </p>
              <button
                onClick={() => { setStatusFilter("ALL"); setSearchQuery(""); }}
                className="text-xs text-indigo-600 font-medium
                           hover:text-indigo-800 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Job list */}
          {filteredJobs.map((job) => (
            <ImportLogJobRow key={job.import_job_id} job={job} />
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => fetchHistory(page + 1, true)}
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-indigo-600
                         bg-white border border-indigo-200 rounded-xl
                         hover:bg-indigo-50 transition-colors
                         disabled:opacity-50 flex items-center
                         justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Loading...</>
                : `Load more (${meta.total - jobs.length} remaining)`
              }
            </button>
          )}
        </div>

        {/* ── Footer ── */}
        {meta && (
          <div className="shrink-0 px-6 py-3 border-t border-gray-200
                          bg-white text-xs text-gray-400 text-center">
            {meta.total} import{meta.total !== 1 ? "s" : ""} total
            {filteredJobs.length !== jobs.length && (
              <span> · {filteredJobs.length} shown</span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ImportLogsPanel;