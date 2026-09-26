// cadmin-web/src/pages/Fleet/Verification/comps/DocumentReviewCard.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Verification/comps/DocumentReviewCard.jsx

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Info,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

/**
 * Single doc card. Manages its own image loading states.
 * Approve/Reject are local decisions — parent tracks the aggregated state.
 */
const DocumentReviewCard = ({
  doc,
  label,
  localDecision, // { action: "APPROVED" | "REJECTED" | null, reason: string }
  onApproveClick,
  onRejectClick,
  onReset,
  onPreview,
}) => {
  const decision = localDecision?.action; // Local (unsaved) decision
  const dbStatus = doc.status; // Server status

  // Effective status: prefer local decision if made, else DB status
  const effectiveStatus = decision || dbStatus;

  const borderClass =
    effectiveStatus === "APPROVED"
      ? "border-l-emerald-500 bg-emerald-50/30"
      : effectiveStatus === "REJECTED"
      ? "border-l-red-500 bg-red-50/30"
      : "border-l-amber-500 bg-white";

  return (
    <div
      className={`bg-white rounded-xl border border-l-4 border-gray-200 p-4 shadow-sm flex flex-col justify-between transition-all ${borderClass}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <h4 className="font-bold text-sm text-gray-900">{label}</h4>

            {doc.resubmission_count > 1 && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                <RotateCcw size={9} /> #{doc.resubmission_count}
              </span>
            )}

            {doc.was_rejected_this_cycle && dbStatus !== "APPROVED" && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                Rejected last cycle
              </span>
            )}
          </div>

          <StatusBadge status={effectiveStatus} isLocal={!!decision} />
        </div>

        {/* Rejection reason (server-side OR pending local) */}
        {(decision === "REJECTED" ||
          (dbStatus === "REJECTED" && !decision)) &&
          (localDecision?.reason || doc.rejection_reason) && (
            <div className="mb-3 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-md text-[11px] text-red-700 flex items-start gap-1.5">
              <Info size={12} className="shrink-0 mt-0.5" />
              <span className="break-words">
                {localDecision?.reason || doc.rejection_reason}
              </span>
            </div>
          )}

        {/* Thumbnails */}
        <div className="flex gap-2 mb-3">
          <Thumbnail
            url={doc.frontUrl}
            label="Front"
            onPreview={() => onPreview(doc.frontUrl, `${label} — Front`)}
          />
          {doc.hasBack &&
            (doc.backUrl ? (
              <Thumbnail
                url={doc.backUrl}
                label="Back"
                onPreview={() => onPreview(doc.backUrl, `${label} — Back`)}
              />
            ) : (
              <EmptySlot label="No back image" />
            ))}
        </div>

        {/* Uploaded date */}
        <p className="text-[10px] text-gray-400">
          Uploaded:{" "}
          {doc.uploaded_at
            ? new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
        {decision ? (
          <button
            onClick={onReset}
            className="text-[11px] text-gray-500 hover:text-gray-700 font-semibold inline-flex items-center gap-1 transition"
          >
            <RotateCcw size={11} /> Reset decision
          </button>
        ) : (
          <span className="text-[11px] text-gray-400 italic">Awaiting decision</span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={onRejectClick}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              decision === "REJECTED"
                ? "bg-red-600 border-red-600 text-white"
                : "border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            }`}
          >
            {decision === "REJECTED" ? "Rejected" : "Reject"}
          </button>

          <button
            onClick={onApproveClick}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1 ${
              decision === "APPROVED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
            }`}
          >
            <CheckCircle2 size={12} />
            {decision === "APPROVED" ? "Approved" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SUB-COMPONENTS ──────────────────────────────────────────

function StatusBadge({ status, isLocal }) {
  const config = {
    APPROVED: {
      icon: CheckCircle2,
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: isLocal ? "Approved (pending)" : "Approved",
    },
    REJECTED: {
      icon: XCircle,
      bg: "bg-red-100",
      text: "text-red-700",
      label: isLocal ? "Rejected (pending)" : "Rejected",
    },
    PENDING: {
      icon: Clock,
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: "Pending",
    },
  };

  const cfg = config[status] || config.PENDING;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function Thumbnail({ url, label, onPreview }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!url) return <EmptySlot label={`No ${label.toLowerCase()} image`} />;

  return (
    <div
      className="relative flex-1 group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
      onClick={() => !error && onPreview()}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 size={18} className="animate-spin text-gray-400" />
        </div>
      )}

      {error ? (
        <div className="w-full h-32 flex flex-col items-center justify-center text-gray-400 p-2 text-center bg-gray-50">
          <AlertCircle size={20} className="mb-1 text-red-300" />
          <span className="text-[10px] text-gray-500 mb-1">Load failed</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-indigo-600 underline font-semibold inline-flex items-center gap-0.5"
          >
            Open direct <ExternalLink size={9} />
          </a>
        </div>
      ) : (
        <img
          src={url}
          alt={label}
          className="w-full h-32 object-cover transition-transform group-hover:scale-105"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}

      {!error && (
        <>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
            <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-900 px-2 py-1 rounded-full">
              <Eye size={11} /> Click to preview
            </div>
          </div>
          <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            {label}
          </span>
        </>
      )}
    </div>
  );
}

function EmptySlot({ label }) {
  return (
    <div className="flex-1 h-32 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-200">
      <ImageIcon size={16} className="mr-1 opacity-40" /> {label}
    </div>
  );
}

export default DocumentReviewCard;