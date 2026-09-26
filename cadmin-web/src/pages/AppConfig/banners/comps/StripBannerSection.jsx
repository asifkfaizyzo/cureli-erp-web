// cadmin-web/src/pages/AppConfig/banners/comps/StripBannerSection.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/banners/comps/StripBannerSection.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ImageIcon,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import StyledSelect from "../../../../components/common/StyledSelect";
import {
  getStrips,
  createStrip,
  updateStrip,
  deleteStrip,
  uploadStripImage,
  deleteStripImage,
  reorderStrips,
} from "../../../../api/cadminBanners";

// ── Constants ──────────────────────────────────────────────────────────────────

const CTA_ACTIONS = [
  { value: "NONE",         label: "No action (decorative)" },
  { value: "ROUTE",        label: "Internal screen" },
  { value: "CATEGORY",     label: "Category page" },
  { value: "EXTERNAL_URL", label: "External URL" },
];

const ROUTE_OPTIONS = [
  { value: "/search",                 label: "Search → /search" },
  { value: "/prescription-request",   label: "Prescription Request → /prescription-request" },
  { value: "/marketplace/categories", label: "All Categories → /marketplace/categories" },
  { value: "/cart",                   label: "Cart → /cart" },
  { value: "/profile",                label: "Profile → /profile" },
  { value: "/orders",                 label: "Orders → /orders" },
];

const CATEGORY_OPTIONS = [
  { value: "PAIN ANALGESICS",        label: "Pain Relief" },
  { value: "ANTI DIABETIC",          label: "Diabetes" },
  { value: "CARDIAC",                label: "Heart Care" },
  { value: "RESPIRATORY",            label: "Cold & Cough" },
  { value: "DERMA",                  label: "Skin Care" },
  { value: "GASTRO INTESTINAL",      label: "Stomach Care" },
  { value: "Vitamins & Nutrition",   label: "Vitamins" },
  { value: "Baby Care",              label: "Baby Care" },
  { value: "Personal Care Products", label: "Wellness" },
  { value: "ENGLISH_MEDICINE",       label: "English Medicine" },
  { value: "Ayurveda Products",      label: "Ayurvedic" },
  { value: "Pet Care",               label: "Pet Care" },
];

const MAX_STRIPS = 6;

const MOBILE_SCREEN_W    = 390;
const MOBILE_MARGIN      = 16;
const MOBILE_STRIP_W     = MOBILE_SCREEN_W - MOBILE_MARGIN * 2; // 358
const MOBILE_STRIP_H     = 70;
const STRIP_ASPECT_RATIO = MOBILE_STRIP_W / MOBILE_STRIP_H;
const STRIP_PADDING_TOP  = `${(MOBILE_STRIP_H / MOBILE_STRIP_W) * 100}%`;
const STRIP_BORDER_RADIUS = 12;

// ── Helpers ────────────────────────────────────────────────────────────────────

function InlineFeedback({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-1.5 text-xs ${isError ? "text-red-500" : "text-green-600"}`}>
      {isError
        ? <AlertCircle  size={12} className="shrink-0" />
        : <CheckCircle2 size={12} className="shrink-0" />}
      {message}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function StripPreview({ imageUrl, uploadProgress }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100"
      style={{ paddingTop: STRIP_PADDING_TOP, borderRadius: STRIP_BORDER_RADIUS }}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Strip preview"
            className="w-full h-full object-cover"
            style={{ borderRadius: STRIP_BORDER_RADIUS }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gray-50">
            <ImageIcon size={20} className="text-gray-300" />
            <span className="text-[10px] text-gray-400 font-medium">
              No image — {STRIP_ASPECT_RATIO.toFixed(2)}:1 ratio
            </span>
          </div>
        )}

        {uploadProgress !== null && (
          <div
            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2"
            style={{ borderRadius: STRIP_BORDER_RADIUS }}
          >
            <div className="w-2/3 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-white text-[10px] font-medium">{uploadProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single Strip Card ──────────────────────────────────────────────────────────

function StripCard({ strip, index, total, onDeleted, onUpdated, onMoveUp, onMoveDown }) {
  const fileInputRef = useRef(null);

  const [ctaAction,      setCtaAction]      = useState(strip.ctaAction ?? "NONE");
  const [ctaActionValue, setCtaActionValue] = useState(strip.ctaActionValue ?? "");
  const [isActive,       setIsActive]       = useState(strip.isActive ?? true);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [deletingImg,    setDeletingImg]    = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [feedback,       setFeedback]       = useState({ type: null, message: null });
  const [imageUrl,       setImageUrl]       = useState(strip.imageUrl ?? null);
  const [expanded,       setExpanded]       = useState(!strip.imageUrl);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadProgress(0);
    try {
      const res = await uploadStripImage(strip.stripId, file, setUploadProgress);
      const url = res.data?.data?.imageUrl ?? res.data?.data?.strip?.imageUrl;
      if (url) setImageUrl(url);
      onUpdated?.({ ...strip, imageUrl: url });
      showFeedback("success", "Image uploaded");
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    if (!window.confirm("Remove this strip image?")) return;
    setDeletingImg(true);
    try {
      await deleteStripImage(strip.stripId);
      setImageUrl(null);
      onUpdated?.({ ...strip, imageUrl: null });
      showFeedback("success", "Image removed");
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed");
    } finally {
      setDeletingImg(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateStrip(strip.stripId, {
        ctaAction,
        ctaActionValue: ctaAction !== "NONE" ? ctaActionValue || null : null,
        isActive,
      });
      onUpdated?.(res.data?.data?.strip);
      showFeedback("success", "Saved");
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this strip banner?")) return;
    setDeleting(true);
    try {
      await deleteStrip(strip.stripId);
      onDeleted?.(strip.stripId);
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed to delete");
      setDeleting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
      isActive ? "border-gray-200" : "border-gray-100 opacity-75"
    }`}>

      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <GripVertical size={14} className="text-gray-300 cursor-grab shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">
              Strip {index + 1}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
              isActive
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-gray-100 text-gray-400 border-gray-200"
            }`}>
              {isActive ? "Active" : "Hidden"}
            </span>
            {imageUrl && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                Has image
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={13} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={13} />
          </button>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1"
            title={expanded ? "Collapse" : "Expand"}
          >
            <svg
              width="13" height="13" viewBox="0 0 13 13"
              fill="currentColor"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <path d="M6.5 8.5L2 4h9z" />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete strip"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5"
          >
            {deleting
              ? <Loader2 size={13} className="animate-spin" />
              : <X size={13} />}
          </button>
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Preview
          </p>
          <p className="text-[10px] text-gray-400">
            {STRIP_ASPECT_RATIO.toFixed(2)}:1 — same as mobile
          </p>
        </div>
        <StripPreview imageUrl={imageUrl} uploadProgress={uploadProgress} />
      </div>

      {/* ── Expandable body ── */}
      {expanded && (
        <div className="px-4 pt-4 pb-4 flex flex-col gap-4">

          <div className="border-t border-gray-100" />

          {/* Image actions */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Banner Image
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {imageUrl && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mr-1">
                  <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                  <span>Image attached</span>
                </div>
              )}

              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors cursor-pointer">
                <Upload size={12} />
                {imageUrl ? "Replace Image" : "Upload Image"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {imageUrl && (
                <button
                  onClick={handleDeleteImage}
                  disabled={deletingImg}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
                >
                  {deletingImg
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Trash2 size={11} />}
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">
              Recommended: {MOBILE_STRIP_W}×{MOBILE_STRIP_H}px ({STRIP_ASPECT_RATIO.toFixed(2)}:1).
              JPEG, PNG or WebP. Max 5 MB.
            </p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Tap Action */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Tap Action
            </p>
            <div className="flex flex-col gap-3">
              <Field label="When user taps this banner">
                <StyledSelect
                  value={ctaAction}
                  onChange={(val) => { setCtaAction(val); setCtaActionValue(""); }}
                  options={CTA_ACTIONS}
                  placeholder="Select action…"
                />
              </Field>

              {ctaAction !== "NONE" && (
                <Field
                  label={
                    ctaAction === "ROUTE"
                      ? "App Route"
                      : ctaAction === "CATEGORY"
                        ? "Category"
                        : "URL"
                  }
                >
                  {ctaAction === "ROUTE" ? (
                    <StyledSelect
                      value={ctaActionValue}
                      onChange={(val) => setCtaActionValue(val)}
                      options={ROUTE_OPTIONS}
                      placeholder="Select a screen…"
                    />
                  ) : ctaAction === "CATEGORY" ? (
                    <StyledSelect
                      value={ctaActionValue}
                      onChange={(val) => setCtaActionValue(val)}
                      options={CATEGORY_OPTIONS}
                      placeholder="Select a category…"
                    />
                  ) : (
                    <input
                      type="url"
                      value={ctaActionValue}
                      onChange={(e) => setCtaActionValue(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                    />
                  )}
                </Field>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Active + Save row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50 rounded-xl flex-1">
              <div>
                <p className="text-xs font-medium text-gray-700">Active</p>
                <p className="text-[11px] text-gray-500">Show in the app</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  isActive ? "bg-[#05015A]" : "bg-gray-300"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <InlineFeedback type={feedback.type} message={feedback.message} />
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-xl transition-colors disabled:opacity-40"
              >
                {saving
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Save size={12} />}
                Save Changes
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────

export default function StripBannerSection() {
  const [strips,   setStrips]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: null });

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  }, []);

  const loadStrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStrips();
      setStrips(res.data?.data?.strips ?? []);
    } catch (err) {
      console.error("[strip] load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStrips(); }, [loadStrips]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createStrip({ ctaAction: "NONE", isActive: true });
      const newStrip = res.data?.data?.strip;
      if (newStrip) setStrips((prev) => [...prev, newStrip]);
      showFeedback("success", "Strip banner added");
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleted = useCallback((stripId) => {
    setStrips((prev) => prev.filter((s) => s.stripId !== stripId));
  }, []);

  const handleUpdated = useCallback((updated) => {
    if (!updated) return;
    setStrips((prev) =>
      prev.map((s) => (s.stripId === updated.stripId ? updated : s))
    );
  }, []);

  const handleMove = useCallback(async (index, direction) => {
    const next = [...strips];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setStrips(next);
    try {
      await reorderStrips({ orderedIds: next.map((s) => s.stripId) });
    } catch {
      showFeedback("error", "Reorder failed");
      loadStrips();
    }
  }, [strips, loadStrips, showFeedback]);

  const atLimit = strips.length >= MAX_STRIPS;

  return (
    <section>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Strip Banners</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Carousel below the hero. Up to {MAX_STRIPS} strips —{" "}
            only strips with images are shown on mobile.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <InlineFeedback type={feedback.type} message={feedback.message} />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-400">
              {strips.length}/{MAX_STRIPS}
            </span>
            <button
              onClick={handleCreate}
              disabled={creating || atLimit}
              title={atLimit ? `Maximum ${MAX_STRIPS} strips reached` : "Add a new strip"}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors disabled:opacity-40"
            >
              {creating
                ? <Loader2 size={12} className="animate-spin" />
                : <Plus size={12} />}
              Add Strip
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : strips.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-14 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
            <ImageIcon size={22} className="text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">No strip banners yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add a strip to display a promotional banner below the hero carousel.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors disabled:opacity-40"
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add First Strip
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {strips.map((strip, i) => (
            <StripCard
              key={strip.stripId}
              strip={strip}
              index={i}
              total={strips.length}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
              onMoveUp={() => handleMove(i, -1)}
              onMoveDown={() => handleMove(i, 1)}
            />
          ))}
          {atLimit && (
            <p className="text-center text-xs text-gray-400 py-2">
              Maximum of {MAX_STRIPS} strip banners reached.
            </p>
          )}
        </div>
      )}
    </section>
  );
}