// cadmin-web/src/pages/AppConfig/categories/comps/CategoryDisplayCard.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/categories/comps/CategoryDisplayCard.jsx
//
// One card per category in the CategoryDisplayPage grid.
//
// Shows:
//   - Category label and scope badge
//   - Current image (if any) or placeholder
//   - Upload / Replace image button
//   - Remove image button (when image exists)
//   - Show / Hide toggle
//
// Props:
//   category    — shape from GET /cadmin/app-config/categories
//   onRefetch   — called after any successful mutation to refresh the list

import { useState, useCallback } from "react";
import {
  ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ImageUploadModal from "./ImageUploadModal";
import {
  deleteCategoryImage,
  setCategoryVisibility,
} from "../../../../api/cadminAppConfig";

// ── Scope badge ───────────────────────────────────────────────────────────────

const SCOPE_LABELS = {
  curated:   { text: "Curated",   className: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  top_level: { text: "Top Level", className: "bg-amber-50  text-amber-600  border-amber-100"  },
};

function ScopeBadge({ scope }) {
  const config = SCOPE_LABELS[scope] ?? { text: scope, className: "bg-gray-50 text-gray-500 border-gray-100" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.className}`}>
      {config.text}
    </span>
  );
}

// ── Inline feedback (success / error) ─────────────────────────────────────────

function InlineFeedback({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-1.5 text-xs mt-1 ${isError ? "text-red-500" : "text-green-600"}`}>
      {isError
        ? <AlertCircle  size={13} className="shrink-0" />
        : <CheckCircle2 size={13} className="shrink-0" />
      }
      {message}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function CategoryDisplayCard({ category: initialCategory, onRefetch }) {
  // Local optimistic state so the card updates immediately without waiting
  // for the parent to refetch the full list
  const [category,      setCategory]      = useState(initialCategory);
  const [showModal,     setShowModal]      = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [togglingVis,   setTogglingVis]   = useState(false);
  const [feedback,      setFeedback]      = useState({ type: null, message: null });

  // Keep local state in sync when parent refetches and passes new props
  // (React re-renders with new initialCategory after onRefetch)
  // Simple approach: use a key on the parent — but also handle prop update here
  // by checking if the incoming prop differs from local state
  const syncIfChanged = useCallback((incoming) => {
    if (JSON.stringify(incoming) !== JSON.stringify(category)) {
      setCategory(incoming);
    }
  }, [category]);
  syncIfChanged(initialCategory);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  }, []);

  // ── Upload success ──────────────────────────────────────────────────────────

  const handleUploadSuccess = useCallback(({ imageUrl }) => {
    setShowModal(false);
    setCategory((prev) => ({
      ...prev,
      hasImage:  true,
      imageUrl,
    }));
    showFeedback("success", "Image updated");
    onRefetch();
  }, [showFeedback, onRefetch]);

  // ── Delete image ────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!category.hasImage) return;
    if (!window.confirm(`Remove the image for "${category.label}"? It will fall back to the default icon on mobile.`)) return;

    setDeleting(true);
    setFeedback({ type: null, message: null });

    try {
      await deleteCategoryImage(category.key);
      setCategory((prev) => ({
        ...prev,
        hasImage:          false,
        imageUrl:          null,
        imageOriginalName: null,
        imageFileSize:     null,
      }));
      showFeedback("success", "Image removed");
      onRefetch();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to remove image";
      showFeedback("error", msg);
    } finally {
      setDeleting(false);
    }
  }, [category, showFeedback, onRefetch]);

  // ── Toggle visibility ───────────────────────────────────────────────────────

  const handleToggleVisibility = useCallback(async () => {
    const nextHidden = !category.isHidden;

    setTogglingVis(true);
    setFeedback({ type: null, message: null });

    try {
      await setCategoryVisibility(category.key, nextHidden);
      setCategory((prev) => ({ ...prev, isHidden: nextHidden }));
      showFeedback(
        "success",
        nextHidden ? "Hidden from mobile" : "Visible on mobile"
      );
      onRefetch();
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to update visibility";
      showFeedback("error", msg);
    } finally {
      setTogglingVis(false);
    }
  }, [category, showFeedback, onRefetch]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const isHidden = category.isHidden;

  return (
    <>
      <div
        className={`
          bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden
          transition-all duration-200
          ${isHidden ? "border-gray-200 opacity-60" : "border-gray-200 hover:shadow-md"}
        `}
      >
        {/* Image area */}
        <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.label}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <ImageIcon size={36} />
              <span className="text-xs text-gray-400">No image</span>
            </div>
          )}

          {/* Hidden overlay */}
          {isHidden && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Hidden
              </span>
            </div>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex flex-col gap-3 p-4">

          {/* Label + scope */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {category.label}
              </p>
              <p className="text-[11px] text-gray-400 font-mono truncate">
                {category.key}
              </p>
            </div>
            <ScopeBadge scope={category.scope} />
          </div>

          {/* Image meta */}
          {category.hasImage && category.imageOriginalName && (
            <p className="text-[11px] text-gray-400 truncate">
              {category.imageOriginalName}
              {category.imageFileSize && (
                <span className="ml-1">
                  · {(category.imageFileSize / 1024).toFixed(0)} KB
                </span>
              )}
            </p>
          )}

          {/* Feedback */}
          <InlineFeedback type={feedback.type} message={feedback.message} />

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-auto">

            {/* Upload / Replace */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors"
            >
              <Upload size={13} />
              {category.hasImage ? "Replace Image" : "Upload Image"}
            </button>

            <div className="flex gap-2">
              {/* Remove image */}
              <button
                onClick={handleDelete}
                disabled={!category.hasImage || deleting}
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Trash2  size={13} />
                }
                Remove
              </button>

              {/* Show / Hide toggle */}
              <button
                onClick={handleToggleVisibility}
                disabled={togglingVis}
                className={`
                  flex items-center justify-center gap-1.5 flex-1 px-3 py-2
                  text-xs font-medium rounded-lg border transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${isHidden
                    ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                    : "text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }
                `}
              >
                {togglingVis ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : isHidden ? (
                  <Eye    size={13} />
                ) : (
                  <EyeOff size={13} />
                )}
                {isHidden ? "Show" : "Hide"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Upload modal */}
      {showModal && (
        <ImageUploadModal
          category={category}
          onClose={() => setShowModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}