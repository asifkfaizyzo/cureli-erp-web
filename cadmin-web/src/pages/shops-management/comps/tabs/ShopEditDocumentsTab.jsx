// cadmin-web/src/pages/shops-management/comps/tabs/ShopEditDocumentsTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopEditDocumentsTab.jsx

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Image,
  File,
  Plus,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import {
  verifyShopFile,
  rejectShopFile,
  uploadShopDocument,
} from "../../../../api/cadminShops";

//  UPDATED: New URL format matching backend fileStorage service
const getFileUrl = (storageKey) => {
  if (!storageKey) return null;
  if (storageKey.startsWith("http")) return storageKey;

  const baseURL = import.meta.env.VITE_API_URL;
  // Backend serves files via /api/files/:folder/:filename
  // storage_key contains just the filename (e.g., "1234567890-abcdef12.jpg")
  return `${baseURL}/api/files/shop_files/${storageKey}`;
};

// Required document types
const REQUIRED_DOCUMENT_TYPES = [
  { key: "drug_license", label: "Drug License" },
  { key: "pharmacy_registration", label: "Pharmacy Registration" },
  { key: "business_registration_proof", label: "Business Registration" },
  { key: "shop_establishment_license", label: "Shop Establishment" },
  { key: "address_proof", label: "Address Proof" },
  { key: "pan_card", label: "PAN Card" },
];

// Optional document types
const OPTIONAL_DOCUMENT_TYPES = [
  { key: "gst_certificate", label: "GST Certificate" },
  { key: "fssai_license", label: "FSSAI License" },
];

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

const ShopEditDocumentsTab = ({ shop, onRefresh, onValidationChange }) => {
  const documents = shop?.shopFiles || [];

  // File input refs
  const fileInputRefs = useRef({});

  // State
  const [rejectingFile, setRejectingFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingFileType, setUploadingFileType] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef(null);

  // Build document map
  const documentsByType = useMemo(() => {
    const map = {};
    documents.forEach((doc) => {
      map[doc.file_type] = doc;
    });
    return map;
  }, [documents]);

  // Missing documents
  const missingRequiredTypes = useMemo(() => {
    return REQUIRED_DOCUMENT_TYPES.filter((type) => !documentsByType[type.key]);
  }, [documentsByType]);

  const missingOptionalTypes = useMemo(() => {
    return OPTIONAL_DOCUMENT_TYPES.filter((type) => !documentsByType[type.key]);
  }, [documentsByType]);

  const allRequiredPresent = missingRequiredTypes.length === 0;

  // Stats
  const stats = useMemo(
    () => ({
      requiredTotal: REQUIRED_DOCUMENT_TYPES.length,
      requiredUploaded:
        REQUIRED_DOCUMENT_TYPES.length - missingRequiredTypes.length,
      requiredMissing: missingRequiredTypes.length,
      optionalTotal: OPTIONAL_DOCUMENT_TYPES.length,
      optionalUploaded:
        OPTIONAL_DOCUMENT_TYPES.length - missingOptionalTypes.length,
      verified: documents.filter((d) => d.status === "verified").length,
      rejected: documents.filter((d) => d.status === "rejected").length,
      pending: documents.filter((d) => d.status === "uploaded").length,
    }),
    [documents, missingRequiredTypes, missingOptionalTypes],
  );

  // Notify parent
  useMemo(() => {
    onValidationChange?.(allRequiredPresent);
  }, [allRequiredPresent, onValidationChange]);

  // Reset zoom when preview changes
  useEffect(() => {
    if (previewFile) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [previewFile]);

  // Mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && zoom > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, zoom]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("image")) return Image;
    if (mimeType?.includes("pdf")) return FileText;
    return File;
  };

  // Download function
  const handleDownload = async (doc, e) => {
    e?.stopPropagation();
    try {
      const url = getFileUrl(doc.storage_key);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.original_name || `${doc.file_type}_document`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      const link = document.createElement("a");
      link.href = getFileUrl(doc.storage_key);
      link.download = doc.original_name || `${doc.file_type}_document`;
      link.click();
    }
  };

  const handleOpenInNewTab = (doc, e) => {
    e?.stopPropagation();
    window.open(getFileUrl(doc.storage_key), "_blank");
  };

  const toggleCardExpansion = (fileId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback(
    (e) => {
      if (previewFile?.mime_type?.includes("image")) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 5));
      }
    },
    [previewFile],
  );

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleTouchStart = (e) => {
    if (zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // File upload
  const handleFileSelect = async (fileType, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload JPG, PNG, WebP or PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    setUploadingFileType(fileType);
    try {
      await uploadShopDocument(shop.shop_id, fileType, file);
      onRefresh?.();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingFileType(null);
      if (fileInputRefs.current[fileType]) {
        fileInputRefs.current[fileType].value = "";
      }
    }
  };

  const triggerFileInput = (fileType) => {
    fileInputRefs.current[fileType]?.click();
  };

  const handleRejectConfirm = async () => {
    if (!rejectingFile || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      await rejectShopFile(rejectingFile.file_id, rejectionReason.trim());
      setRejectingFile(null);
      setRejectionReason("");
      onRefresh?.();
    } catch (err) {
      console.error("Reject failed:", err);
      alert(err.response?.data?.message || "Failed to reject document");
    } finally {
      setActionLoading(false);
    }
  };

  // Render document card
  const renderDocumentCard = (docType, isRequired = true) => {
    const doc = documentsByType[docType.key];
    const isUploading = uploadingFileType === docType.key;
    const FileIcon = doc ? getFileIcon(doc.mime_type) : FileText;
    const isExpanded = doc ? expandedCards[doc.file_id] : false;

    const statusDot = {
      verified: "bg-emerald-500",
      rejected: "bg-red-500",
      uploaded: "bg-yellow-500",
    };

    return (
      <div
        key={docType.key}
        className={`group bg-white rounded-xl border transition-all ${
          doc
            ? `border-gray-100 hover:border-gray-200 hover:shadow-sm ${
                isExpanded ? "col-span-1 md:col-span-2" : ""
              }`
            : isRequired
              ? "border-red-200 border-dashed bg-red-50/30"
              : "border-gray-200 border-dashed bg-gray-50/50"
        }`}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={(el) => (fileInputRefs.current[docType.key] = el)}
          onChange={(e) => handleFileSelect(docType.key, e)}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
        />

        {doc ? (
          /* ══════════════ EXISTING DOCUMENT ══════════════ */
          <>
            <div className="p-3">
              {/* Header Row */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <FileIcon size={14} className="text-gray-400" />
                  </div>
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      statusDot[doc.status] || statusDot.uploaded
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-xs text-gray-900 truncate">
                      {docType.label}
                    </h4>
                    {!isRequired && (
                      <>
                        <span className="text-[9px] text-gray-400">•</span>
                        <span className="text-[9px] text-gray-400">
                          Optional
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">
                    {doc.original_name}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => triggerFileInput(docType.key)}
                    disabled={isUploading}
                    className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600 transition"
                    title="Replace"
                  >
                    {isUploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                  </button>

                  {doc.status === "verified" && (
                    <button
                      onClick={() => setRejectingFile(doc)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition"
                      title="Reject"
                    >
                      <XCircle size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => setPreviewFile(doc)}
                    className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600 transition"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>

                  {doc.storage_key && (
                    <button
                      onClick={(e) => handleDownload(doc, e)}
                      className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => toggleCardExpansion(doc.file_id)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <Minimize2 size={14} />
                    ) : (
                      <Maximize2 size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  {formatDate(doc.uploaded_at)}
                </span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  {formatFileSize(doc.file_size)}
                </span>
                {doc.resubmission_count > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                    <RefreshCw size={8} />
                    {doc.resubmission_count}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded font-medium ml-auto
                    ${doc.status === "verified" ? "bg-emerald-100 text-emerald-700" : ""}
                    ${doc.status === "rejected" ? "bg-red-100 text-red-700" : ""}
                    ${doc.status === "uploaded" ? "bg-yellow-100 text-yellow-700" : ""}
                  `}
                >
                  {doc.status === "verified" && "✓ Verified"}
                  {doc.status === "rejected" && "✗ Rejected"}
                  {doc.status === "uploaded" && "⏳ Pending"}
                </span>
              </div>

              {/* Status Messages */}
              {doc.status === "rejected" && doc.verification_notes && (
                <div className="mt-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded-md text-[10px] text-red-600">
                  <strong>Reason:</strong> {doc.verification_notes}
                </div>
              )}
              {doc.status === "verified" && doc.verified_at && (
                <div className="mt-2 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md text-[10px] text-emerald-600">
                  Verified on {formatDate(doc.verified_at)}
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-3">
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {doc.mime_type?.includes("image") ? (
                    <div className="relative h-48 flex items-center justify-center">
                      <img
                        src={getFileUrl(doc.storage_key)}
                        alt={doc.original_name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : doc.mime_type?.includes("pdf") ? (
                    <div className="h-48">
                      <iframe
                        src={`${getFileUrl(doc.storage_key)}#toolbar=0`}
                        className="w-full h-full border-0"
                        title={doc.original_name}
                      />
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <FileText
                          size={24}
                          className="mx-auto mb-1 opacity-50"
                        />
                        <p className="text-xs">Preview not available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setPreviewFile(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Eye size={12} />
                    View Full
                  </button>
                  <button
                    onClick={() => triggerFileInput(docType.key)}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 transition disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    Replace
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ══════════════ MISSING DOCUMENT ══════════════ */
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isRequired ? "bg-red-100" : "bg-gray-100"
              }`}
            >
              <FileText
                size={20}
                className={isRequired ? "text-red-300" : "text-gray-300"}
              />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="font-semibold text-xs text-gray-700">
                {docType.label}
              </h4>
              {!isRequired && (
                <span className="text-[9px] text-gray-400">• Optional</span>
              )}
            </div>

            <p
              className={`text-[10px] mb-3 flex items-center gap-1 ${
                isRequired ? "text-red-500" : "text-gray-400"
              }`}
            >
              {isRequired ? (
                <>
                  <XCircle size={10} />
                  Required - Not uploaded
                </>
              ) : (
                <>
                  <Clock size={10} />
                  Not uploaded
                </>
              )}
            </p>

            <button
              onClick={() => triggerFileInput(docType.key)}
              disabled={isUploading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                isRequired
                  ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus size={12} />
                  Upload
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Validation Status */}
        {!allRequiredPresent && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-red-800 mb-1">
                Missing Required Documents ({stats.requiredMissing} of{" "}
                {stats.requiredTotal})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingRequiredTypes.map((type) => (
                  <span
                    key={type.key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded-full"
                  >
                    <XCircle size={10} />
                    {type.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {allRequiredPresent && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle
              size={18}
              className="text-emerald-600 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-semibold text-sm text-emerald-800">
                All Required Documents Uploaded
              </p>
              <p className="text-xs text-emerald-600">
                {stats.requiredTotal} required documents present.
              </p>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Document Management
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle size={12} />
                {stats.verified} Verified
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
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

        {/* Required Documents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Required Documents
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                allRequiredPresent
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {stats.requiredUploaded} / {stats.requiredTotal}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REQUIRED_DOCUMENT_TYPES.map((docType) =>
              renderDocumentCard(docType, true),
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
          <AlertTriangle size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Instructions</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>6 required documents must be uploaded</li>
              <li>Accepted: PDF, JPG, PNG, WebP (max 5MB)</li>
              <li>Replace any document • Reject verified documents</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      <ConfirmDialog
        isOpen={!!rejectingFile}
        onClose={() => {
          setRejectingFile(null);
          setRejectionReason("");
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Document?"
        message={
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Rejecting{" "}
              <strong>{FILE_TYPE_LABELS[rejectingFile?.file_type]}</strong> will
              require re-upload.
            </p>
            <textarea
              className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading}
        confirmDisabled={!rejectionReason.trim()}
      />

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className={`relative bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isFullscreen
                ? "w-full h-full rounded-none"
                : "w-full max-w-5xl h-[85vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#05015A]">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-white" />
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {FILE_TYPE_LABELS[previewFile.file_type] ||
                      previewFile.file_type}
                  </h3>
                  <p className="text-white/60 text-xs">
                    {previewFile.original_name}
                  </p>
                </div>
              </div>

              {previewFile.mime_type?.includes("image") && (
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
                  onClick={(e) => handleDownload(previewFile, e)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => handleOpenInNewTab(previewFile, e)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition"
                  title="Open in new tab"
                >
                  <ExternalLink size={18} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 size={18} />
                  ) : (
                    <Maximize2 size={18} />
                  )}
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition ml-2"
                  title="Close"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              ref={imageContainerRef}
              className="flex-1 h-[calc(100%-56px)] bg-gray-900 flex items-center justify-center overflow-hidden relative"
              onWheel={handleWheel}
            >
              {previewFile.mime_type?.includes("image") ? (
                <>
                  {zoom === 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full z-10">
                      Scroll to zoom • Drag to pan
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
                      src={getFileUrl(previewFile.storage_key)}
                      alt={previewFile.original_name}
                      className="max-w-full max-h-[calc(85vh-56px)] object-contain select-none"
                      draggable={false}
                    />
                  </div>
                </>
              ) : previewFile.mime_type?.includes("pdf") ? (
                <iframe
                  src={`${getFileUrl(previewFile.storage_key)}#toolbar=1`}
                  className="w-full h-full border-0"
                  title={previewFile.original_name}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Preview not available</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button
                      onClick={(e) => handleDownload(previewFile, e)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
              <div className="flex items-center justify-between text-white/70 text-xs">
                <div className="flex items-center gap-4">
                  <span>{formatFileSize(previewFile.file_size)}</span>
                  <span>•</span>
                  <span>Uploaded: {formatDate(previewFile.uploaded_at)}</span>
                </div>
                <div>
                  {previewFile.status === "verified" && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle size={12} />
                      Verified
                    </span>
                  )}
                  {previewFile.status === "rejected" && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle size={12} />
                      Rejected
                    </span>
                  )}
                  {previewFile.status === "uploaded" && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Clock size={12} />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopEditDocumentsTab;
