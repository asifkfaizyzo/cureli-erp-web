// cadmin-web/src/pages/Fleet/Riders/comps/RiderDocumentsTab.jsx (do not remove this comment)

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  File,
  RefreshCw,
  Pencil,
  Upload,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import { reviewDocument, replaceRiderDocument } from "../../../../api/cadminRiders";

const BACKEND_URL = import.meta.env.VITE_API_URL || "";
const CDN = import.meta.env.VITE_CDN_DOMAIN;

function getDocUrl(key) {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (CDN) return `https://${CDN}/rider_documents/${key}`;
  return `${BACKEND_URL}/api/files/rider_documents/${key}`;
}

const DOC_LABELS = {
  DRIVING_LICENSE_FRONT: "Driving License",
  VEHICLE_RC: "Vehicle RC Document",
  AADHAAR_FRONT: "Aadhaar Card",
  PAN_FRONT: "PAN Card",
  PROFILE_PHOTO: "Live Photo",
};

const getMimeFromUrl = (url) => {
  if (!url) return "image/jpeg";
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  return "image/jpeg";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const RiderDocumentsTab = ({ rider, onRefresh }) => {
  const toast = useToast();

  // ── Preview modal state ──────────────────────────────
  const [previewDoc, setPreviewDoc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef(null);

  // ── Card expand state (one expanded at a time) ───────
  const [expandedCardId, setExpandedCardId] = useState(null);

  // ── Replace Modal state ──────────────────────────────
  const [replaceTarget, setReplaceTarget] = useState(null);

  // ── Review actions state ─────────────────────────────
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const docs = rider?.documents || [];

  // ── Stats ───────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: docs.length,
      approved: docs.filter((d) => d.status === "APPROVED").length,
      rejected: docs.filter((d) => d.status === "REJECTED").length,
      pending: docs.filter((d) => d.status === "PENDING").length,
    }),
    [docs]
  );

  useEffect(() => {
    if (previewDoc) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [previewDoc]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && zoom > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, zoom]);

  const handleApprove = async (doc) => {
    setActionLoading(true);
    try {
      await reviewDocument(rider.rider_id, doc.document_id, "APPROVED");
      toast.success(
        "Approved",
        `${DOC_LABELS[doc.type] || doc.type} approved.`
      );
      onRefresh?.();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await reviewDocument(
        rider.rider_id,
        rejectTarget.document_id,
        "REJECTED",
        rejectReason.trim()
      );
      toast.success(
        "Rejected",
        `${DOC_LABELS[rejectTarget.type] || rejectTarget.type} rejected.`
      );
      setRejectTarget(null);
      setRejectReason("");
      onRefresh?.();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (url, filename, e) => {
    e?.stopPropagation();
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "rider_document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "rider_document";
      link.click();
    }
  };

  const handleOpenInNewTab = (url, e) => {
    e?.stopPropagation();
    if (url) window.open(url, "_blank");
  };

  const openPreview = (url, label, sideLabel, doc) => {
    setPreviewDoc({
      url,
      label: `${label}${sideLabel ? ` — ${sideLabel}` : ""}`,
      mime: getMimeFromUrl(url),
      status: doc.status,
      uploaded_at: doc.uploaded_at,
      filename: `${doc.type}_${sideLabel || "front"}`.toLowerCase(),
    });
  };

  const toggleExpand = (docId) => {
    setExpandedCardId((prev) => (prev === docId ? null : docId));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback(
    (e) => {
      if (previewDoc?.mime?.includes("image")) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 5));
      }
    },
    [previewDoc]
  );

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleTouchStart = (e) => {
    if (zoom > 1 && e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const t = e.touches[0];
      setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No documents uploaded yet.</p>
      </div>
    );
  }

  const renderDocCard = (doc) => {
    const frontUrl = getDocUrl(doc.storage_key);
    const backUrl = getDocUrl(doc.back_storage_key);
    const label = DOC_LABELS[doc.type] || doc.type;
    const isExpanded = expandedCardId === doc.document_id;

    const frontMime = getMimeFromUrl(frontUrl);
    const backMime = getMimeFromUrl(backUrl);

    const statusDot = {
      APPROVED: "bg-emerald-500",
      REJECTED: "bg-red-500",
      PENDING: "bg-amber-500",
    };

    const FileTypeIcon = frontMime.includes("pdf") ? FileText : ImageIcon;

    return (
      <div
        key={doc.document_id}
        className={`group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all ${
          isExpanded ? "col-span-1 md:col-span-2" : ""
        }`}
      >
        <div className="p-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <FileTypeIcon size={14} className="text-gray-400" />
              </div>
              <span
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  statusDot[doc.status] || statusDot.PENDING
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-xs text-gray-900 truncate">
                  {label}
                </h4>
                {doc.resubmission_count > 1 && (
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                    <RefreshCw size={8} />
                    {doc.resubmission_count}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400">
                {formatDate(doc.uploaded_at)}
              </p>
            </div>

            <div className="flex gap-1 shrink-0">
              {/* Replace/Upload action */}
              <button
                onClick={() => setReplaceTarget(doc)}
                className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600 transition"
                title="Replace / Upload"
              >
                <Pencil size={13} />
              </button>

              {doc.status !== "APPROVED" && (
                <>
                  <button
                    onClick={() => handleApprove(doc)}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectTarget(doc);
                      setRejectReason(doc.rejection_reason || "");
                    }}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-red-50 text-red-700 text-[11px] font-semibold rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => toggleExpand(doc.document_id)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition shrink-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mb-3">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium
                ${doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : ""}
                ${doc.status === "REJECTED" ? "bg-red-100 text-red-700" : ""}
                ${doc.status === "PENDING" ? "bg-amber-100 text-amber-700" : ""}
              `}
            >
              {doc.status === "APPROVED" && <CheckCircle size={10} />}
              {doc.status === "REJECTED" && <XCircle size={10} />}
              {doc.status === "PENDING" && <Clock size={10} />}
              {doc.status}
            </span>
            {doc.reviewed_at && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                Reviewed {formatDate(doc.reviewed_at)}
              </span>
            )}
          </div>

          {doc.status === "REJECTED" && doc.rejection_reason && (
            <div className="mb-3 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-md text-[11px] text-red-600">
              <strong>Reason:</strong> {doc.rejection_reason}
            </div>
          )}

          <div className="flex gap-2">
            {frontUrl && (
              <ThumbTile
                url={frontUrl}
                mime={frontMime}
                sideLabel="Front"
                onView={() => openPreview(frontUrl, label, "Front", doc)}
                onDownload={(e) =>
                  handleDownload(
                    frontUrl,
                    `${doc.type}_front.${frontMime.includes("pdf") ? "pdf" : "jpg"}`,
                    e
                  )
                }
                onOpen={(e) => handleOpenInNewTab(frontUrl, e)}
              />
            )}

            {backUrl && (
              <ThumbTile
                url={backUrl}
                mime={backMime}
                sideLabel="Back"
                onView={() => openPreview(backUrl, label, "Back", doc)}
                onDownload={(e) =>
                  handleDownload(
                    backUrl,
                    `${doc.type}_back.${backMime.includes("pdf") ? "pdf" : "jpg"}`,
                    e
                  )
                }
                onOpen={(e) => handleOpenInNewTab(backUrl, e)}
              />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {frontUrl && (
                <ExpandedPreview
                  url={frontUrl}
                  mime={frontMime}
                  sideLabel="Front"
                />
              )}
              {backUrl && (
                <ExpandedPreview
                  url={backUrl}
                  mime={backMime}
                  sideLabel="Back"
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Uploaded Documents: {stats.total}
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle size={12} />
                {stats.approved} Approved
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Clock size={12} />
                {stats.pending} Pending
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle size={12} />
                {stats.rejected} Rejected
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc) => renderDocCard(doc))}
        </div>
      </div>

      {/* Full-screen preview */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className={`relative bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#05015A]">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-white" />
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {previewDoc.label}
                  </h3>
                  <p className="text-white/60 text-xs">
                    {previewDoc.mime.includes("pdf") ? "PDF Document" : "Image"}
                  </p>
                </div>
              </div>

              {previewDoc.mime.includes("image") && (
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-1.5 text-white hover:bg-white/20 rounded transition disabled:opacity-30"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-white text-xs font-medium px-2 min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                    className="p-1.5 text-white hover:bg-white/20 rounded transition disabled:opacity-30"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <div className="w-px h-4 bg-white/30 mx-1" />
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 text-white hover:bg-white/20 rounded transition"
                    title="Reset"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) =>
                    handleDownload(previewDoc.url, previewDoc.filename, e)
                  }
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => handleOpenInNewTab(previewDoc.url, e)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={18} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-white hover:bg-red-500/50 rounded-lg transition-colors ml-2"
                  title="Close"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            <div
              ref={imageContainerRef}
              className="flex-1 h-[calc(100%-56px)] bg-gray-900 flex items-center justify-center overflow-hidden relative"
              onWheel={handleWheel}
            >
              {previewDoc.mime.includes("image") ? (
                <>
                  {zoom === 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 z-10">
                      <span>Scroll to zoom • Drag to pan when zoomed</span>
                    </div>
                  )}
                  <div
                    className={`relative transition-transform ${
                      isDragging
                        ? "cursor-grabbing"
                        : zoom > 1
                          ? "cursor-grab"
                          : "cursor-default"
                    }`}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                      transformOrigin: "center center",
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.label}
                      className="max-w-full max-h-[calc(85vh-56px)] object-contain select-none"
                      draggable={false}
                    />
                  </div>
                </>
              ) : previewDoc.mime.includes("pdf") ? (
                <iframe
                  src={`${previewDoc.url}#toolbar=1`}
                  className="w-full h-full border-0"
                  title={previewDoc.label}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <File size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Preview not available</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
              <div className="flex items-center justify-between text-white/70 text-xs">
                <span>Uploaded: {formatDate(previewDoc.uploaded_at)}</span>
                <div>
                  {previewDoc.status === "APPROVED" && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle size={12} />
                      Approved
                    </span>
                  )}
                  {previewDoc.status === "REJECTED" && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle size={12} />
                      Rejected
                    </span>
                  )}
                  {previewDoc.status === "PENDING" && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock size={12} />
                      Pending Review
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation */}
      <ConfirmDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        title="Reject Document?"
        message={
          <div>
            <p className="text-xs text-gray-600 mb-2">
              Reject{" "}
              <strong>
                {DOC_LABELS[rejectTarget?.type] || rejectTarget?.type}
              </strong>
              ?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason (required)..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-xs resize-none focus:ring-2 focus:ring-red-400 focus:outline-none bg-white border-gray-300 text-gray-900"
              autoFocus
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
        loading={actionLoading}
        confirmDisabled={!rejectReason.trim()}
      />

      {/* Manual document replace modal */}
      {replaceTarget && (
        <ReplaceDocumentModal
          doc={replaceTarget}
          riderId={rider.rider_id}
          onClose={() => setReplaceTarget(null)}
          onSuccess={() => {
            setReplaceTarget(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENT: Thumbnail Tile (Front/Back)
// ═══════════════════════════════════════════════════════
const ThumbTile = ({ url, mime, sideLabel, onView, onDownload, onOpen }) => {
  const isPdf = mime.includes("pdf");

  return (
    <div className="relative flex-1 group overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <div
        className="cursor-pointer"
        onClick={onView}
      >
        {isPdf ? (
          <div className="w-full h-32 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 gap-1.5">
            <FileText size={28} className="text-red-500" />
            <span className="text-[10px] font-medium text-gray-600">
              PDF Document
            </span>
          </div>
        ) : (
          <img
            src={url}
            alt={sideLabel}
            className="w-full h-32 object-cover transition-transform group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
          <Eye
            size={20}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium pointer-events-none">
        {sideLabel}
      </span>

      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDownload}
          className="p-1 bg-white/90 hover:bg-white text-gray-700 rounded shadow-sm"
          title="Download"
        >
          <Download size={11} />
        </button>
        <button
          onClick={onOpen}
          className="p-1 bg-white/90 hover:bg-white text-gray-700 rounded shadow-sm"
          title="Open in new tab"
        >
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENT: Expanded Inline Preview
// ═══════════════════════════════════════════════════════
const ExpandedPreview = ({ url, mime, sideLabel }) => {
  const isPdf = mime.includes("pdf");

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
          {sideLabel}
        </span>
      </div>
      <div className="h-64 flex items-center justify-center bg-gray-50">
        {isPdf ? (
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-full border-0"
            title={`${sideLabel} preview`}
          />
        ) : (
          <img
            src={url}
            alt={sideLabel}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SUB-COMPONENT: Manual replace upload modal
// ═══════════════════════════════════════════════════════
const ReplaceDocumentModal = ({ doc, riderId, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // File Inputs
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  // Local URL previews
  const [frontPrev, setFrontPrev] = useState(null);
  const [backPrev, setBackPrev] = useState(null);

  const hasBackSide = ["DRIVING_LICENSE_FRONT", "AADHAAR_FRONT"].includes(doc.type);
  const label = DOC_LABELS[doc.type] || doc.type;

  const handleFileChange = (e, side) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max limit is 5MB.`);
      return;
    }

    // Validate mime types
    const valid = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!valid.includes(file.mimetype || file.type)) {
      setError("Invalid file type. Only JPG, PNG, and PDF files are allowed.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (side === "front") {
      setFrontFile(file);
      setFrontPrev(localUrl);
    } else {
      setBackFile(file);
      setBackPrev(localUrl);
    }
  };

  const cleanPreviews = () => {
    if (frontPrev) URL.revokeObjectURL(frontPrev);
    if (backPrev) URL.revokeObjectURL(backPrev);
  };

  useEffect(() => {
    return cleanPreviews;
  }, [frontPrev, backPrev]);

  const handleUploadSubmit = async () => {
    if (!frontFile && !backFile) {
      setError("Please select at least one document to upload.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      if (frontFile) data.append("front", frontFile);
      if (backFile) data.append("back", backFile);

      await replaceRiderDocument(riderId, doc.document_id, data);
      toast.success("Document Updated", `${label} has been replaced and auto-approved.`);
      cleanPreviews();
      onSuccess();
    } catch (err) {
      console.error("Manual document override upload failed:", err);
      setError(err.response?.data?.message || "Failed to upload document replacement.");
    } finally {
      setLoading(false);
    }
  };

  const FileInputBox = ({ side, file, prev, onChange, isRequired }) => {
    const isPdf = file?.type === "application/pdf";
    return (
      <div className="flex-1 min-w-[200px] border border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-4 transition bg-gray-50 flex flex-col items-center justify-center relative">
        {prev ? (
          <div className="w-full flex flex-col items-center">
            {isPdf ? (
              <div className="h-24 flex flex-col items-center justify-center gap-1.5">
                <FileText size={32} className="text-red-500" />
                <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{file.name}</span>
              </div>
            ) : (
              <img src={prev} alt="preview" className="h-24 object-contain rounded border bg-white mb-2" />
            )}
            <button
              type="button"
              onClick={() => {
                if (side === "front") {
                  setFrontFile(null);
                  setFrontPrev(null);
                } else {
                  setBackFile(null);
                  setBackPrev(null);
                }
              }}
              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-semibold transition"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center text-center">
            <Upload size={24} className="text-gray-400 mb-2 group-hover:text-indigo-600" />
            <span className="text-xs font-semibold text-gray-700">Upload {side}</span>
            <span className="text-[10px] text-gray-400 mt-1">
              JPG, PNG, or PDF up to 5MB
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => onChange(e, side)}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!loading) onClose(); }} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
            <Pencil size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-indigo-900">
              Replace {label}
            </h3>
            <p className="text-sm text-indigo-700 mt-0.5">
              Direct administrative override file upload.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {doc.status === "APPROVED" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              Note: This document is already approved. Replacing it will overwrite the file and increment resubmission counts.
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <FileInputBox
              side="front"
              file={frontFile}
              prev={frontPrev}
              onChange={handleFileChange}
            />
            {hasBackSide && (
              <FileInputBox
                side="back"
                file={backFile}
                prev={backPrev}
                onChange={handleFileChange}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={loading || (!frontFile && !backFile)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload & Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderDocumentsTab;