// pharmacy-web/src/pages/inventory/components/import/ImportLogJobRow.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportLogJobRow.jsx

import React, { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  FileSpreadsheet,
  Package,
  GitMerge,
  SkipForward,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import ImportLogDetailModal from "./ImportLogDetailModal";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  COMPLETED: {
    label:   "Completed",
    icon:    CheckCircle,
    color:   "text-emerald-600",
    bg:      "bg-emerald-50",
    border:  "border-emerald-200",
    leftBar: "bg-emerald-500",
  },
  PARTIAL: {
    label:   "Partial",
    icon:    AlertTriangle,
    color:   "text-amber-600",
    bg:      "bg-amber-50",
    border:  "border-amber-200",
    leftBar: "bg-amber-500",
  },
  FAILED: {
    label:   "Failed",
    icon:    XCircle,
    color:   "text-red-600",
    bg:      "bg-red-50",
    border:  "border-red-200",
    leftBar: "bg-red-500",
  },
  CANCELLED: {
    label:   "Cancelled",
    icon:    XCircle,
    color:   "text-gray-400",
    bg:      "bg-gray-50",
    border:  "border-gray-200",
    leftBar: "bg-gray-300",
  },
  AWAITING_REVIEW: {
    label:   "Awaiting Review",
    icon:    Clock,
    color:   "text-indigo-600",
    bg:      "bg-indigo-50",
    border:  "border-indigo-200",
    leftBar: "bg-indigo-500",
  },
  PARSING: {
    label:   "Processing",
    icon:    Loader2,
    color:   "text-indigo-600",
    bg:      "bg-indigo-50",
    border:  "border-indigo-200",
    leftBar: "bg-indigo-400",
  },
  CONFIRMING: {
    label:   "Writing",
    icon:    Loader2,
    color:   "text-indigo-600",
    bg:      "bg-indigo-50",
    border:  "border-indigo-200",
    leftBar: "bg-indigo-400",
  },
};

// ── Stat pill ─────────────────────────────────────────────────────────────────

const StatPill = ({ icon: Icon, label, value, colorClass }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border
                    border-gray-200 rounded-lg">
      <Icon size={12} className={colorClass} />
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-xs font-bold ${colorClass}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const ImportLogJobRow = ({ job }) => {
  const [expanded,     setExpanded]     = useState(false);
  const [detailOpen,   setDetailOpen]   = useState(false);

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

  const mergedAndReplaced = job.existing_batches_merged || 0;
  const totalImported     = job.imported_rows || 0;
  const pureNew           = Math.max(0, totalImported - mergedAndReplaced);

  return (
    <>
      <div className={`
        relative border rounded-xl overflow-hidden transition-all
        ${expanded ? "shadow-md" : "shadow-sm hover:shadow-md"}
        ${config.border}
      `}>
        {/* Left color bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.leftBar}`} />

        {/* ── Header row ── */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 pl-5 pr-4 py-3.5
                     text-left hover:bg-gray-50/50 transition-colors"
        >
          {/* Status icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                           shrink-0 ${config.bg}`}>
            <Icon
              size={16}
              className={`${config.color} ${isSpinner ? "animate-spin" : ""}`}
            />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {job.original_file_name}
              </p>
              {job.detected_software && job.detected_software !== "Unknown" && (
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100
                                 px-1.5 py-0.5 rounded shrink-0">
                  {job.detected_software}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span>{dateLabel} at {timeLabel}</span>
              {job.branch?.branch_name && (
                <span className="flex items-center gap-1">
                  <Building2 size={10} />
                  {job.branch.branch_name}
                </span>
              )}
              {job.creator?.full_name && (
                <span className="flex items-center gap-1">
                  <User size={10} />
                  {job.creator.full_name}
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="shrink-0 flex items-center gap-2">
            {totalImported > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50
                               px-2 py-1 rounded-lg">
                {totalImported.toLocaleString()} imported
              </span>
            )}
            {(job.error_rows || 0) > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50
                               px-2 py-1 rounded-lg">
                {job.error_rows.toLocaleString()} errors
              </span>
            )}
          </div>

          {/* Status badge */}
          <span className={`
            shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold
            ${config.color} ${config.bg} border ${config.border}
          `}>
            {config.label}
          </span>

          {/* Chevron */}
          {expanded
            ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0" />
          }
        </button>

        {/* ── Expanded summary ── */}
        {expanded && (
          <div className="border-t border-gray-200 bg-white px-5 py-4 space-y-3">

            {/* Stats row */}
            <div className="flex flex-wrap gap-2">
              <StatPill
                icon={FileSpreadsheet}
                label="Total"
                value={job.total_rows}
                colorClass="text-gray-600"
              />
              <StatPill
                icon={Package}
                label="New batches"
                value={pureNew}
                colorClass="text-emerald-600"
              />
              {mergedAndReplaced > 0 && (
                <StatPill
                  icon={GitMerge}
                  label="Merged/Replaced"
                  value={mergedAndReplaced}
                  colorClass="text-blue-600"
                />
              )}
              {(job.skipped_rows || 0) > 0 && (
                <StatPill
                  icon={SkipForward}
                  label="Skipped"
                  value={job.skipped_rows}
                  colorClass="text-gray-500"
                />
              )}
              {(job.error_rows || 0) > 0 && (
                <StatPill
                  icon={AlertCircle}
                  label="Errors"
                  value={job.error_rows}
                  colorClass="text-red-600"
                />
              )}
              {(job.new_medicines_created || 0) > 0 && (
                <StatPill
                  icon={Package}
                  label="New medicines"
                  value={job.new_medicines_created}
                  colorClass="text-indigo-600"
                />
              )}
            </div>

            {/* View details button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDetailOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                         text-white bg-[#000060] hover:bg-indigo-800 rounded-xl
                         transition-colors shadow-sm"
            >
              <ExternalLink size={14} />
              View Full Details
              {(job.error_rows || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold
                                 bg-red-500 text-white rounded-full">
                  {job.error_rows} errors
                </span>
              )}
            </button>

          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailOpen && (
        <ImportLogDetailModal
          importJobId={job.import_job_id}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
};

export default ImportLogJobRow;