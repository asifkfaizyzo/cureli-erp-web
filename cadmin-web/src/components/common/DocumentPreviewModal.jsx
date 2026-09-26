// cadmin-web/src/components/common/DocumentPreviewModal.jsx (do not remove this comment)
// cadmin-web/src/components/common/DocumentPreviewModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import PDFViewer from "./PDFViewer";

const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setLoading(true);
      setError(null);
      setZoom(100);
      setRotation(0);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !document) return null;

  const isPDF =
    document.mime_type === "application/pdf" ||
    document.storage_key?.toLowerCase().endsWith(".pdf");

  const isImage =
    document.mime_type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.storage_key);

  const getFileUrl = () => {
    if (document.storage_key) {
      return `${apiBase}/uploads/shop_files/${document.storage_key}`;
    }
    return document.pdfUrl || document.url;
  };

  const handleDownload = () => {
    if (document.storage_key) {
      const downloadUrl = `${apiBase}/api/download/shop_files/${document.storage_key}?name=${encodeURIComponent(document.name || "document")}`;
      window.open(downloadUrl, "_blank");
    }
  };

  // For PDF files, use dedicated PDF viewer
  if (isPDF) {
    return (
      <PDFViewer
        url={getFileUrl()}
        filename={document.name || document.original_name || "document.pdf"}
        onClose={onClose}
      />
    );
  }

  // For images
  if (isImage) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        {/* Toolbar */}
        <div className="fixed top-0 left-0 right-0 flex items-center justify-between bg-gray-900/80 backdrop-blur px-4 py-3 z-10">
          <div className="flex items-center gap-3">
            <ImageIcon size={20} className="text-blue-400" />
            <span className="text-white font-medium truncate max-w-[300px]">
              {document.name || "Image"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => Math.max(prev - 25, 25));
              }}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-white text-sm min-w-[50px] text-center">
              {zoom}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => Math.min(prev + 25, 300));
              }}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ZoomIn size={20} />
            </button>

            {/* Rotate */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRotation((prev) => (prev + 90) % 360);
              }}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <RotateCw size={20} />
            </button>

            {/* Download */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Download size={20} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div
          className="flex items-center justify-center w-full h-full pt-16 overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="animate-spin text-white" />
              <p className="text-white/70">Loading image...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle size={40} className="text-red-400" />
              <p className="text-white">Failed to load image</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
              >
                Download Instead
              </button>
            </div>
          )}

          <img
            src={getFileUrl()}
            alt={document.name || "Document"}
            className="max-w-full max-h-full object-contain transition-all duration-300"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              display: loading ? "none" : "block",
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Failed to load image");
            }}
          />
        </div>
      </div>
    );
  }

  // For other file types - show download option
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={40} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {document.name || "Document"}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          This file type cannot be previewed. Please download to view.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download size={18} />
            Download
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
