// cadmin-web/src/components/common/PDFViewer.jsx (do not remove this comment)
// cadmin-web/src/components/common/PDFViewer.jsx

import { useState, useEffect, useRef } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";

//  UPDATED: Helper function to convert old URL format to new format
const convertToNewFileUrl = (url, folder = "shop_files") => {
  if (!url) return null;

  const baseURL = import.meta.env.VITE_API_URL;

  // If already using the new format, return as-is
  if (url.includes("/api/files/")) {
    return url;
  }

  // If it's a full URL (external), return as-is
  if (url.startsWith("http") && !url.includes(baseURL)) {
    return url;
  }

  // Extract filename from old URL formats
  let filename = null;

  // Handle /uploads/folder/filename format
  if (url.includes("/uploads/")) {
    const parts = url.replace(/.*\/uploads\//, "").split("/");
    if (parts.length >= 2) {
      folder = parts[0];
      filename = parts.slice(1).join("/");
    } else {
      filename = parts[0];
    }
  }
  // Handle direct storage key (just filename)
  else if (!url.startsWith("http") && !url.startsWith("/")) {
    filename = url;
  }
  // Handle /api/pdf/folder/filename (old proxy format)
  else if (url.includes("/api/pdf/")) {
    const parts = url.replace(/.*\/api\/pdf\//, "").split("/");
    if (parts.length >= 2) {
      folder = parts[0];
      filename = parts.slice(1).join("/");
    }
  }
  // Handle /api/download/folder/filename (old download format)
  else if (url.includes("/api/download/")) {
    const parts = url.replace(/.*\/api\/download\//, "").split("/");
    if (parts.length >= 2) {
      folder = parts[0];
      filename = parts.slice(1).join("/");
    }
  }

  if (!filename) {
    // Fallback: just return the original URL
    return url.startsWith("http") ? url : `${baseURL}${url}`;
  }

  //  New URL format: /api/files/:folder/:filename
  return `${baseURL}/api/files/${folder}/${filename}`;
};

const PDFViewer = ({ url, filename, folder = "shop_files", onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  //  UPDATED: Convert URL to new format
  const fileUrl = convertToNewFileUrl(url, folder);

  // Fetch PDF as blob
  useEffect(() => {
    const fetchPDF = async () => {
      if (!fileUrl) {
        setError("No file URL provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(fileUrl, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
        setLoading(false);
      } catch (err) {
        console.error("PDF fetch error:", err);
        setError(err.message || "Failed to load PDF");
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [fileUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, currentPage, totalPages]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  //  UPDATED: Download using fetch + blob
  const handleDownload = async () => {
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open in new tab
      window.open(fileUrl, "_blank");
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-gray-900 ${
        isFullscreen ? "" : "p-4 md:p-8"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between bg-gray-800 text-white px-4 py-2 ${
          isFullscreen ? "" : "rounded-t-xl"
        }`}
      >
        {/* Left: File info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
            <span className="text-xs font-bold">PDF</span>
          </div>
          <div>
            <h3 className="font-medium text-sm truncate max-w-[200px] md:max-w-[400px]">
              {filename || "Document.pdf"}
            </h3>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1.5 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
              title="Zoom Out (-)"
            >
              <ZoomOut size={18} />
            </button>
            <span className="px-2 text-sm font-medium min-w-[50px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-1.5 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
              title="Zoom In (+)"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Rotate"
          >
            <RotateCw size={18} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Open in new tab */}
          <button
            onClick={handleOpenInNewTab}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={18} />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download size={18} />
          </button>
        </div>

        {/* Right: Close */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-700 ${
          isFullscreen ? "" : "rounded-b-xl"
        }`}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={40} className="animate-spin text-white" />
            <p className="text-white/70">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <p className="text-white font-medium">Failed to load PDF</p>
            <p className="text-white/60 text-sm">{error}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
              >
                Download Instead
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
              >
                Open in New Tab
              </button>
            </div>
          </div>
        )}

        {!loading && !error && pdfBlobUrl && (
          <div
            className="flex items-center justify-center min-h-full p-4"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.3s ease",
            }}
          >
            <iframe
              ref={iframeRef}
              src={`${pdfBlobUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`}
              className="bg-white shadow-2xl"
              style={{
                width: `${zoom}%`,
                height: isFullscreen ? "100vh" : "calc(100vh - 200px)",
                maxWidth: "100%",
                border: "none",
              }}
              title={filename || "PDF Document"}
            />
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 px-4 py-2 rounded-full text-xs">
        <span className="hidden md:inline">
          Press <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> to close •{" "}
          <kbd className="bg-gray-700 px-1 rounded">+</kbd>/
          <kbd className="bg-gray-700 px-1 rounded">-</kbd> to zoom
        </span>
      </div>
    </div>
  );
};

export default PDFViewer;
