// cadmin-web/src/pages/AppConfig/categories/comps/ImageUploadModal.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/categories/comps/ImageUploadModal.jsx
//
// Modal for uploading or replacing a category image.
//
// Props:
//   category   — { key, label, scope, hasImage, imageUrl }
//   onClose    — close without changes
//   onSuccess  — called with { imageUrl } after successful upload
//
// Behaviour:
//   - Drag-and-drop or click to select
//   - Shows local preview before upload
//   - Upload progress bar
//   - Error display inline
//   - Accepts JPEG, PNG, WebP up to 5MB

import { useState, useRef, useCallback } from "react";
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { uploadCategoryImage } from "../../../../api/cadminAppConfig";

const MAX_SIZE_BYTES  = 5 * 1024 * 1024;
const ALLOWED_TYPES   = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_LABEL   = "JPEG, PNG, WebP";

export default function ImageUploadModal({ category, onClose, onSuccess }) {
  const [file,         setFile]         = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [progress,     setProgress]     = useState(0);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState(null);
  const [dragging,     setDragging]     = useState(false);

  const inputRef = useRef(null);

  // ── File validation ───────────────────────────────────────────────────────

  const validateAndSet = useCallback((f) => {
    setError(null);

    if (!f) return;

    if (!ALLOWED_TYPES.has(f.type)) {
      setError(`Invalid file type. Allowed: ${ALLOWED_LABEL}`);
      return;
    }

    if (f.size > MAX_SIZE_BYTES) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      validateAndSet(dropped);
    },
    [validateAndSet]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  // ── File input ────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e) => {
      validateAndSet(e.target.files?.[0]);
    },
    [validateAndSet]
  );

  const handleClickZone = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const res = await uploadCategoryImage(category.key, file, setProgress);
      const { imageUrl } = res.data?.data ?? {};
      onSuccess({ imageUrl });
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        "Upload failed. Please try again.";
      setError(msg);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }, [file, category.key, onSuccess]);

  // ── Clear selection ───────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {category.hasImage ? "Replace Image" : "Upload Image"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {category.label}
              <span className="ml-2 text-gray-400">
                · {category.scope === "top_level" ? "Top Level" : "Curated"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Current image preview (if exists and no new file selected) */}
          {category.hasImage && !preview && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-gray-500">Current image</p>
              <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                <img
                  src={category.imageUrl}
                  alt={category.label}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Drop zone or new file preview */}
          {preview ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-gray-500">New image</p>
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
                {!uploading && (
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white shadow text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : (
            <div
              onClick={handleClickZone}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                w-full h-36 rounded-xl border-2 border-dashed
                flex flex-col items-center justify-center gap-2
                cursor-pointer transition-colors
                ${dragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                }
              `}
            >
              <div className="p-2.5 rounded-full bg-white shadow-sm">
                <ImageIcon size={22} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Drop image here or{" "}
                  <span className="text-blue-600">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ALLOWED_LABEL} · Max 5MB
                </p>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Progress bar */}
          {uploading && (
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right">{progress}%</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload size={15} />
                {category.hasImage ? "Replace" : "Upload"}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}