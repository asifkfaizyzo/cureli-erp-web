// cadmin-web/src/pages/Fleet/Verification/comps/DocumentPreviewModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Verification/comps/DocumentPreviewModal.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

const DocumentPreviewModal = ({ imageUrl, title = "Document Preview", onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  // Reset when new image opens
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setImageLoading(true);
    setImageError(false);
  }, [imageUrl]);

  // Global drag handlers
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

  // Escape to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 5));
  }, []);

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

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      handleResetZoom();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = title.replace(/\s+/g, "_") + ".jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#05015A] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon size={16} className="text-white/80 shrink-0" />
            <span className="text-white text-sm font-semibold truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom controls */}
            {!imageError && (
              <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-white text-xs font-semibold px-2 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <div className="w-px h-4 bg-white/30 mx-1" />
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
                  title="Reset"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
              title="Download"
            >
              <Download size={15} />
            </button>

            <button
              onClick={() => window.open(imageUrl, "_blank")}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
              title="Open in new tab"
            >
              <ExternalLink size={15} />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white hover:bg-red-500/50 rounded ml-1 transition"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={containerRef}
          className="flex-1 bg-gray-950 flex items-center justify-center overflow-hidden relative"
          onWheel={handleWheel}
        >
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-white/50" />
            </div>
          )}

          {imageError ? (
            <div className="text-center text-gray-400 p-8">
              <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
              <p className="mb-4 text-sm">Failed to load image</p>
              <button
                onClick={() => window.open(imageUrl, "_blank")}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm inline-flex items-center gap-2 transition"
              >
                <ExternalLink size={14} />
                Open in new tab
              </button>
            </div>
          ) : (
            <>
              {/* Instruction pill */}
              {zoom === 1 && !imageLoading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-2 z-10 pointer-events-none">
                  <span>Scroll to zoom • Double-click to zoom in • Drag to pan when zoomed</span>
                </div>
              )}

              <div
                className={`relative transition-transform ${
                  isDragging
                    ? "cursor-grabbing"
                    : zoom > 1
                    ? "cursor-grab"
                    : "cursor-zoom-in"
                }`}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="max-w-[80vw] max-h-[75vh] object-contain select-none"
                  draggable={false}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;