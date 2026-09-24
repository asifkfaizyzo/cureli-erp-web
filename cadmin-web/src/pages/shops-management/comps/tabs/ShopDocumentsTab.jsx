// cadmin-web/src/pages/shops-management/comps/tabs/ShopDocumentsTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopDocumentsTab.jsx

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Image,
  File,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";

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
const REQUIRED_TYPES = [
  "drug_license",
  "pharmacy_registration",
  "business_registration_proof",
  "shop_establishment_license",
  "address_proof",
  "pan_card",
];

// Optional document types
const OPTIONAL_TYPES = ["gst_certificate", "fssai_license"];

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

const ShopDocumentsTab = ({ shop }) => {
  const documents = shop?.shopFiles || [];
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef(null);

  // Separate required and optional documents
  const { requiredDocs, optionalDocs } = useMemo(() => {
    const required = [];
    const optional = [];

    documents.forEach((doc) => {
      if (OPTIONAL_TYPES.includes(doc.file_type)) {
        optional.push(doc);
      } else {
        required.push(doc);
      }
    });

    return { requiredDocs: required, optionalDocs: optional };
  }, [documents]);

  // Reset zoom when preview changes
  useEffect(() => {
    if (previewFile) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [previewFile]);

  // Add mouse event listeners for dragging
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

  // Download file function
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

  // Open in new tab
  const handleOpenInNewTab = (doc, e) => {
    e?.stopPropagation();
    window.open(getFileUrl(doc.storage_key), "_blank");
  };

  // Toggle card expansion
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

  // Handle wheel zoom
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

  // Mouse down for panning
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

  // Touch support for mobile
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

  // Get file icon based on mime type
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("image")) return Image;
    if (mimeType?.includes("pdf")) return FileText;
    return File;
  };

  // Document stats
  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
    pending: documents.filter((d) => d.status === "uploaded").length,
  };

  const renderDocumentCard = (doc, isOptional = false) => {
    const FileIcon = getFileIcon(doc.mime_type);
    const isExpanded = expandedCards[doc.file_id];

    const statusDot = {
      verified: "bg-emerald-500",
      rejected: "bg-red-500",
      uploaded: "bg-yellow-500",
    };

    return (
      <div
        key={doc.file_id}
        className={`group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all ${
          isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3" : ""
        }`}
      >
        {/* Main Content */}
        <div className="p-3">
          {/* Header Row */}
          <div className="flex items-center gap-2.5 mb-3">
            {/* Status Dot + Icon */}
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

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-xs text-gray-900 truncate">
                  {FILE_TYPE_LABELS[doc.file_type] || doc.file_type}
                </h4>
                {isOptional && (
                  <>
                    <span className="text-[9px] text-gray-400">•</span>
                    <span className="text-[9px] text-gray-400">Optional</span>
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

              {doc.storage_key && (
                <button
                  onClick={(e) => handleOpenInNewTab(doc, e)}
                  className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition"
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </button>
              )}

              <button
                onClick={() => toggleCardExpansion(doc.file_id)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          {/* Meta Tags Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mb-3">
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
            {doc.user && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded truncate max-w-[100px]">
                {doc.user.full_name}
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

          {/* Conditional Status Message */}
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
                <div className="relative h-64 flex items-center justify-center">
                  <img
                    src={getFileUrl(doc.storage_key)}
                    alt={doc.original_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : doc.mime_type?.includes("pdf") ? (
                <div className="h-64">
                  <iframe
                    src={`${getFileUrl(doc.storage_key)}#toolbar=0`}
                    className="w-full h-full border-0"
                    title={doc.original_name}
                  />
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Preview not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400 text-[10px]">File Type</p>
                <p className="font-medium text-gray-700">
                  {doc.mime_type?.split("/")[1]?.toUpperCase() || "Unknown"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400 text-[10px]">Uploaded</p>
                <p className="font-medium text-gray-700">
                  {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400 text-[10px]">Size</p>
                <p className="font-medium text-gray-700">
                  {formatFileSize(doc.file_size)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400 text-[10px]">Resubmissions</p>
                <p className="font-medium text-gray-700">
                  {doc.resubmission_count || 0}
                </p>
              </div>
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
                onClick={(e) => handleDownload(doc, e)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
              >
                <Download size={12} />
                Download
              </button>
              <button
                onClick={(e) => handleOpenInNewTab(doc, e)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
              >
                <ExternalLink size={12} />
                New Tab
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Documents: {stats.total}
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
        {requiredDocs.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requiredDocs.map((doc) => renderDocumentCard(doc, false))}
            </div>
          </div>
        )}

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Optional Documents
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {optionalDocs.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optionalDocs.map((doc) => renderDocumentCard(doc, true))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal with Zoom and Pan */}
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
            {/* Preview Header */}
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

              {/* Zoom Controls - Only for images */}
              {previewFile.mime_type?.includes("image") && (
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-1.5 text-white hover:bg-white/20 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
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
                    className="p-1.5 text-white hover:bg-white/20 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
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

              {/* Right Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDownload(previewFile, e)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => handleOpenInNewTab(previewFile, e)}
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
                  {isFullscreen ? (
                    <Minimize2 size={18} />
                  ) : (
                    <Maximize2 size={18} />
                  )}
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors ml-2"
                  title="Close"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div
              ref={imageContainerRef}
              className="flex-1 h-[calc(100%-56px)] bg-gray-900 flex items-center justify-center overflow-hidden relative"
              onWheel={handleWheel}
            >
              {previewFile.mime_type?.includes("image") ? (
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      onClick={(e) => handleOpenInNewTab(previewFile, e)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      Open in New Tab
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Info Bar */}
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
                      Pending Review
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

export default ShopDocumentsTab;
