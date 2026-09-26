// cadmin-web/src/pages/User-Shop-Verifications/comps/DocumentCard.jsx (do not remove this comment)
// cadmin-web/src/components/Verification/DocumentCard.jsx

import { useState } from "react";
import {
  RotateCcw,
  Download,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  File,
  X,
  ZoomIn,
  ZoomOut,
  Eye,
  Loader2,
  Info,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../../components/common/Toast";

//  UPDATED: New URL format matching backend fileStorage service
const getFileUrl = (storageKey) => {
  if (!storageKey) return null;
  if (storageKey.startsWith("http")) return storageKey;

  const baseURL = import.meta.env.VITE_API_URL;
  // Backend serves files via /api/files/:folder/:filename
  // storage_key contains just the filename (e.g., "1234567890-abcdef12.jpg")
  return `${baseURL}/api/files/shop_files/${storageKey}`;
};

const FILE_TYPE_LABELS = {
  drug_license: "Drug License",
  pharmacy_registration: "Pharmacy Registration",
  gst_certificate: "GST Certificate",
  business_registration_proof: "Business Registration",
  shop_establishment_license: "Shop Establishment",
  address_proof: "Address Proof",
  pan_card: "PAN Card",
  fssai_license: "FSSAI License",
};

// ============================================
// Tooltip Component
// ============================================
const Tooltip = ({ children, content, position = "top" }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// File Preview Modal
// ============================================
const FilePreviewModal = ({ isOpen, onClose, doc }) => {
  const toast = useToast();
  const [zoom, setZoom] = useState(100);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !doc) return null;

  //  UPDATED: Use new URL format
  const fileUrl = getFileUrl(doc.storage_key);
  const isImage = doc.mime_type?.includes("image");
  const isPdf = doc.mime_type?.includes("pdf");

  //  UPDATED: Download using fetch + blob for better compatibility
  const handleDownload = async () => {
    if (!fileUrl) {
      toast.error("Download Failed", "File URL not available.");
      return;
    }

    try {
      toast.info("Downloading", `Downloading ${doc.name}...`, 2000);

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.name || `${doc.file_type}_document`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Downloaded", `${doc.name} downloaded successfully.`, 2000);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(
        "Download Failed",
        "Unable to download file. Opening in new tab instead.",
      );
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#05015A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              {isImage ? (
                <Image size={16} className="text-white" />
              ) : (
                <FileText size={16} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">
                {FILE_TYPE_LABELS[doc.file_type] || doc.file_type}
              </h3>
              <p className="text-white/60 text-xs truncate max-w-[200px]">
                {doc.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom controls for images */}
            {isImage && !imageError && (
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 mr-2">
                <button
                  onClick={() => setZoom((p) => Math.max(p - 25, 50))}
                  className="p-1.5 text-white/70 hover:text-white"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-white text-xs px-2">{zoom}%</span>
                <button
                  onClick={() => setZoom((p) => Math.min(p + 25, 200))}
                  className="p-1.5 text-white/70 hover:text-white"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              title="Download"
            >
              <Download size={16} />
            </button>

            {/* Open in new tab */}
            <button
              onClick={() => window.open(fileUrl, "_blank")}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-red-500/50 rounded-lg ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center">
          {isImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-white/50" />
                </div>
              )}
              {!imageError && (
                <img
                  src={fileUrl}
                  alt={doc.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})` }}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                    toast.error(
                      "Image Load Failed",
                      "Unable to load image preview.",
                    );
                  }}
                />
              )}
              {imageError && (
                <div className="text-center text-gray-400">
                  <Image size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="mb-4">Failed to load image</p>
                  <button
                    onClick={() => window.open(fileUrl, "_blank")}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
                  >
                    Open in new tab
                  </button>
                </div>
              )}
            </div>
          )}

          {isPdf && (
            <iframe
              src={`${fileUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={doc.name}
            />
          )}

          {!isImage && !isPdf && (
            <div className="text-center text-gray-400 p-8">
              <File size={48} className="mx-auto mb-2 opacity-50" />
              <p className="mb-4">Preview not available for this file type</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
              >
                Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Document Card Component
// ============================================
const DocumentCard = ({ doc, onApprove, onReject, onReset }) => {
  const toast = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  //  UPDATED: Use new URL format
  const fileUrl = getFileUrl(doc.storage_key);

  const getFileIcon = () => {
    if (doc.mime_type?.includes("image")) return Image;
    if (doc.mime_type?.includes("pdf")) return FileText;
    return File;
  };

  const FileIcon = getFileIcon();

  const statusConfig = {
    approved: {
      border: "border-l-emerald-500",
      bg: "bg-emerald-50/50",
      icon: <CheckCircle size={12} className="text-emerald-600" />,
      label: "Verified",
      labelBg: "bg-emerald-100 text-emerald-700",
    },
    failed: {
      border: "border-l-red-500",
      bg: "bg-red-50/50",
      icon: <XCircle size={12} className="text-red-600" />,
      label: "Rejected",
      labelBg: "bg-red-100 text-red-700",
    },
    normal: {
      border: "border-l-amber-500",
      bg: "bg-white",
      icon: <Clock size={12} className="text-amber-600" />,
      label: "Pending",
      labelBg: "bg-amber-100 text-amber-700",
    },
  };

  const config = statusConfig[doc.status] || statusConfig.normal;

  //  UPDATED: Download using fetch + blob
  const handleDownload = async (e) => {
    e.stopPropagation();

    if (!doc.storage_key) {
      toast.error("Download Failed", "File not available for download.");
      return;
    }

    setDownloading(true);

    try {
      toast.info("Downloading", `Downloading ${doc.name}...`, 2000);

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.name || `${doc.file_type}_document`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(
        "Download Failed",
        "Unable to download file. Opening in new tab instead.",
      );
      // Fallback: open in new tab
      window.open(fileUrl, "_blank");
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <>
      <div
        className={`group rounded-lg border border-l-4 ${config.border} ${config.bg} border-black/20 hover:shadow-md transition-all duration-200`}
      >
        <div className="p-3">
          {/* Top Row: Icon, Title, Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-indigo-100 transition"
                onClick={() => setShowPreview(true)}
              >
                <FileIcon size={14} className="text-gray-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-xs text-gray-800 truncate">
                  {FILE_TYPE_LABELS[doc.file_type] || doc.file_type}
                </h4>
                <p className="text-[10px] text-gray-400 truncate">{doc.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Resubmission Badge */}
              {doc.resubmission_count > 0 && (
                <Tooltip
                  content={`Resubmitted ${doc.resubmission_count} time(s)`}
                >
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-700">
                    <RefreshCw size={10} />
                    <span className="text-[10px] font-medium">
                      {doc.resubmission_count}
                    </span>
                  </div>
                </Tooltip>
              )}

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.labelBg}`}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </span>
            </div>
          </div>

          {/* Rejection Reason */}
          {doc.status === "failed" && doc.reason && (
            <Tooltip content={doc.reason} position="bottom">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded text-[10px] text-red-600 cursor-help mb-2">
                <Info size={10} />
                <span className="truncate">Hover to see reason</span>
              </div>
            </Tooltip>
          )}

          {/* Meta Row */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
            <span>{doc.date}</span>
            <span>{doc.size}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {doc.status === "normal" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white text-[10px] font-semibold rounded hover:bg-emerald-700 transition"
                >
                  <CheckCircle size={12} />
                  Approve
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-semibold rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                >
                  <XCircle size={12} />
                  Reject
                </button>
              </>
            )}

            {(doc.status === "approved" || doc.status === "failed") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded hover:bg-gray-200 transition"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}

            {/* View Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded hover:bg-indigo-100 transition ml-auto"
            >
              <Eye size={12} />
              View
            </button>

            {/* Download Button */}
            {fileUrl && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-50"
                title="Download"
              >
                {downloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        doc={doc}
      />
    </>
  );
};

export default DocumentCard;
