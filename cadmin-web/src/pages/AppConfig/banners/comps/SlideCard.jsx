// cadmin-web/src/pages/AppConfig/banners/comps/SlideCard.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/banners/comps/SlideCard.jsx

import { useState } from "react";
import {
  GripVertical, ImageIcon, Upload, Trash2, Edit2,
  Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
  Maximize, Type,
  Stethoscope, Bike, Tag, Heart, Dumbbell, BandageIcon, FlaskConical, ShieldCheck,
} from "lucide-react";
import {
  uploadBannerSlideImage,
  deleteBannerSlideImage,
  updateBannerSlide,
  deleteBannerSlide,
} from "../../../../api/cadminBanners";

// ── Constants (same as SlideFormModal) ──────────────────────────────────────────

const CTA_ACTION_LABELS = {
  NONE:         "No action",
  ROUTE:        "Route",
  CATEGORY:     "Category",
  EXTERNAL_URL: "URL",
};

const LAYOUT_LABELS = {
  FULL_IMAGE:     "Full Image",
  TEXT_WITH_IMAGE: "Text + Image",
};

const DEFAULT_GRADIENT = { color1: "#05015A", color2: "#3b2fd4", angle: 135 };

const PLACEHOLDER_ICONS = [
  { name: "medkit-outline",            icon: Stethoscope },
  { name: "bicycle-outline",           icon: Bike },
  { name: "pricetag-outline",          icon: Tag },
  { name: "heart-outline",             icon: Heart },
  { name: "fitness-outline",           icon: Dumbbell },
  { name: "bandage-outline",           icon: BandageIcon },
  { name: "flask-outline",             icon: FlaskConical },
  { name: "shield-checkmark-outline",  icon: ShieldCheck },
];

const BANNER_ASPECT_RATIO = 2.04;

// ── Mobile theme constants — mirrors SlideFormModal exactly ────────────────────
const M = {
  paddingH: 20,
  paddingV: 20,
  gap: 16,
  xs: 4,
  sm: 8,
  md: 12,
  cardRadius: 20,
  ctaRadius: 12,
  badgeRadius: 8,
  titleFontSize: 18,
  titleLineHeight: 26,
  titleWeight: 600,
  subtitleFontSize: 12,
  subtitleLH: 18,
  ctaFontSize: 12,
  ctaLineHeight: 18,
  ctaWeight: 600,
  ctaBg: "rgba(255,255,255,0.20)",
  ctaBorder: "rgba(255,255,255,0.35)",
  ctaText: "#ffffff",
  decorCircle: "rgba(255,255,255,0.07)",
  decorCircleSecondary: "rgba(255,255,255,0.05)",
  placeholderBg: "rgba(255,255,255,0.13)",
  placeholderBorder: "rgba(255,255,255,0.20)",
  onGradientText: "#ffffff",
  onGradientTextMuted: "rgba(255,255,255,0.80)",
};

// ── LivePreview — identical to SlideFormModal's version ─────────────────────────
// Accepts `slide` data shape (camelCase keys from API) instead of `form` state.
// The `previewWidth` prop lets the card control sizing.

function CardLivePreview({ slide, previewWidth }) {
  const pw = previewWidth;
  const ph = Math.round(pw / BANNER_ASPECT_RATIO);
  const S  = pw / 346;

  const gradientColor1 = slide.gradientColor1 ?? DEFAULT_GRADIENT.color1;
  const gradientColor2 = slide.gradientColor2 ?? DEFAULT_GRADIENT.color2;
  const gradientAngle  = slide.gradientAngle  ?? DEFAULT_GRADIENT.angle;
  const gradientCSS    = `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`;

  const hasImage   = !!slide.imageUrl;
  const isFullImage = (slide.layoutMode ?? "TEXT_WITH_IMAGE") === "FULL_IMAGE";
  const hasCta     = !!slide.ctaLabel;

  const selectedIcon =
    PLACEHOLDER_ICONS.find((i) => i.name === slide.placeholderIcon) ??
    PLACEHOLDER_ICONS[0];

  // ── Full Image + has image ────────────────────────────────────
  if (isFullImage && hasImage) {
    const hasOverlay = !!(slide.title || slide.subtitle || hasCta);
    return (
      <div
        style={{
          width: pw,
          height: ph,
          borderRadius: M.cardRadius * S,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={slide.imageUrl}
          alt="Preview"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {hasOverlay && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingLeft: M.paddingH * S,
              paddingRight: M.paddingH * S,
              paddingBottom: M.md * S,
              paddingTop: 32 * S,
              background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              display: "flex",
              flexDirection: "column",
              gap: 2 * S,
            }}
          >
            {!!slide.title && (
              <p style={{
                margin: 0,
                color: M.onGradientText,
                fontSize: M.titleFontSize * S,
                fontWeight: M.titleWeight,
                lineHeight: `${M.titleLineHeight * S}px`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {slide.title}
              </p>
            )}
            {!!slide.subtitle && (
              <p style={{
                margin: 0,
                color: M.onGradientTextMuted,
                fontSize: M.subtitleFontSize * S,
                lineHeight: `${M.subtitleLH * S}px`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {slide.subtitle}
              </p>
            )}
            {hasCta && (
              <span style={{
                display: "inline-block",
                alignSelf: "flex-start",
                marginTop: M.xs * S,
                paddingLeft: M.sm * S,
                paddingRight: M.sm * S,
                paddingTop: 4 * S,
                paddingBottom: 4 * S,
                backgroundColor: "rgba(255,255,255,0.92)",
                borderRadius: M.badgeRadius * S,
                fontSize: 11 * S,
                fontWeight: M.ctaWeight,
                color: "#111111",
              }}>
                {slide.ctaLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Full Image + no image ─────────────────────────────────────
  if (isFullImage && !hasImage) {
    return (
      <div
        style={{
          width: pw,
          height: ph,
          borderRadius: M.cardRadius * S,
          overflow: "hidden",
          background: gradientCSS,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.60)" }}>
          <ImageIcon size={28 * S} style={{ margin: "0 auto 4px" }} />
          <p style={{ margin: 0, fontSize: 12 * S }}>No banner image</p>
        </div>
      </div>
    );
  }

  // ── Text + Image mode ─────────────────────────────────────────
  const IconComp = selectedIcon.icon;

  return (
    <div
      style={{
        width: pw,
        height: ph,
        borderRadius: M.cardRadius * S,
        overflow: "hidden",
        background: gradientCSS,
        paddingLeft: M.paddingH * S,
        paddingRight: M.paddingH * S,
        paddingTop: M.paddingV * S,
        paddingBottom: M.paddingV * S,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        gap: M.gap * S,
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: "absolute",
        width: 160 * S, height: 160 * S, borderRadius: 80 * S,
        top: -50 * S, right: -40 * S,
        backgroundColor: M.decorCircle,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 110 * S, height: 110 * S, borderRadius: 55 * S,
        bottom: -30 * S, left: -20 * S,
        backgroundColor: M.decorCircleSecondary,
        pointerEvents: "none",
      }} />

      {/* Left — text block */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {!!slide.title ? (
          <p style={{
            margin: 0, marginBottom: M.xs * S,
            color: M.onGradientText,
            fontSize: M.titleFontSize * S,
            fontWeight: M.titleWeight,
            lineHeight: `${M.titleLineHeight * S}px`,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {slide.title}
          </p>
        ) : (
          <p style={{
            margin: 0, marginBottom: M.xs * S,
            color: "rgba(255,255,255,0.25)",
            fontSize: M.titleFontSize * S,
            fontWeight: M.titleWeight,
            fontStyle: "italic",
          }}>
            No title
          </p>
        )}

        {!!slide.subtitle && (
          <p style={{
            margin: 0, marginBottom: M.md * S,
            color: M.onGradientTextMuted,
            fontSize: M.subtitleFontSize * S,
            lineHeight: `${M.subtitleLH * S}px`,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {slide.subtitle}
          </p>
        )}

        {hasCta && (
          <span style={{
            display: "inline-block",
            alignSelf: "flex-start",
            borderWidth: 1, borderStyle: "solid",
            borderRadius: M.ctaRadius * S,
            paddingLeft: M.md * S, paddingRight: M.md * S,
            paddingTop: (M.xs + 2) * S, paddingBottom: (M.xs + 2) * S,
            backgroundColor: M.ctaBg,
            borderColor: M.ctaBorder,
            fontSize: M.ctaFontSize * S,
            fontWeight: M.ctaWeight,
            lineHeight: `${M.ctaLineHeight * S}px`,
            color: M.ctaText,
            whiteSpace: "nowrap",
          }}>
            {slide.ctaLabel}
          </span>
        )}
      </div>

      {/* Right — image / icon block */}
      <div style={{
        width: 88 * S, height: 88 * S, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {hasImage ? (
          <img
            src={slide.imageUrl}
            alt=""
            style={{
              width: 80 * S, height: 80 * S,
              borderRadius: 40 * S, objectFit: "cover",
            }}
          />
        ) : (
          <div style={{
            width: 80 * S, height: 80 * S, borderRadius: 40 * S,
            borderWidth: 1, borderStyle: "solid",
            borderColor: M.placeholderBorder,
            backgroundColor: M.placeholderBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconComp size={34 * S} color="rgba(255,255,255,0.7)" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function InlineFeedback({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-1.5 text-xs mt-1 ${isError ? "text-red-500" : "text-green-600"}`}>
      {isError
        ? <AlertCircle  size={12} className="shrink-0" />
        : <CheckCircle2 size={12} className="shrink-0" />}
      {message}
    </div>
  );
}

// ── SlideCard ───────────────────────────────────────────────────────────────────

export default function SlideCard({ slide, onRefetch, onEdit, dragHandleProps }) {
  const [uploadProgress, setUploadProgress] = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [togglingVis,    setTogglingVis]    = useState(false);
  const [feedback,       setFeedback]       = useState({ type: null, message: null });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadProgress(0);
    try {
      await uploadBannerSlideImage(slide.slideId, file, setUploadProgress);
      showFeedback("success", "Image uploaded");
      onRefetch();
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDeleteImage = async () => {
    if (!slide.imageUrl) return;
    if (!window.confirm("Remove the image for this slide?")) return;
    setDeleting(true);
    try {
      await deleteBannerSlideImage(slide.slideId);
      showFeedback("success", "Image removed");
      onRefetch();
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleVisibility = async () => {
    setTogglingVis(true);
    try {
      await updateBannerSlide(slide.slideId, { isActive: !slide.isActive });
      showFeedback("success", slide.isActive ? "Slide hidden" : "Slide visible");
      onRefetch();
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed");
    } finally {
      setTogglingVis(false);
    }
  };

  const handleDeleteSlide = async () => {
    if (!window.confirm(`Delete slide "${slide.title || "Untitled"}"? This cannot be undone.`)) return;
    try {
      await deleteBannerSlide(slide.slideId);
      onRefetch();
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed to delete");
    }
  };

  const layoutMode  = slide.layoutMode ?? "TEXT_WITH_IMAGE";
  const isFullImage = layoutMode === "FULL_IMAGE";

  return (
    <div className={`
      bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200
      ${slide.isActive ? "border-gray-200" : "border-gray-200 opacity-60"}
    `}>
      {/* ── Mobile-accurate preview ── */}
      <div className="relative w-full bg-gray-50 flex items-center justify-center overflow-hidden">
        <CardLivePreview slide={slide} previewWidth={280} />

        {/* Upload progress overlay */}
        {uploadProgress !== null && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-10">
            <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-white text-xs font-medium">{uploadProgress}%</span>
          </div>
        )}

        {/* Position badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center z-10">
          <span className="text-white text-xs font-bold">{slide.position + 1}</span>
        </div>

        {/* Layout mode badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white z-10">
          {isFullImage ? <Maximize size={10} /> : <Type size={10} />}
          <span className="text-[10px] font-medium">
            {LAYOUT_LABELS[layoutMode] ?? layoutMode}
          </span>
        </div>

        {/* Inactive overlay */}
        {!slide.isActive && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hidden</span>
          </div>
        )}

        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 p-1 rounded-lg bg-black/40 text-white cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical size={14} />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title + subtitle */}
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {slide.title || <span className="text-gray-400 italic">No title</span>}
          </p>
          {slide.subtitle && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{slide.subtitle}</p>
          )}
        </div>

        {/* ── Metadata badges ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {slide.ctaLabel && (
            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-medium">
              CTA: {slide.ctaLabel}
            </span>
          )}
          <span className="text-[11px] px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full border border-gray-100">
            {CTA_ACTION_LABELS[slide.ctaAction] ?? slide.ctaAction}
            {slide.ctaActionValue && ` → ${slide.ctaActionValue}`}
          </span>
          {!isFullImage && slide.placeholderIcon && (
            <span className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100 font-medium">
              Icon: {slide.placeholderIcon}
            </span>
          )}
        </div>

        <InlineFeedback type={feedback.type} message={feedback.message} />

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors cursor-pointer">
            <Upload size={13} />
            {slide.imageUrl ? "Replace Image" : "Upload Image"}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(slide)}
              className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 size={12} />
              Edit
            </button>

            <button
              onClick={handleToggleVisibility}
              disabled={togglingVis}
              className={`
                flex items-center justify-center gap-1.5 flex-1 px-3 py-2
                text-xs font-medium rounded-lg border transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                ${slide.isActive
                  ? "text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
                  : "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                }
              `}
            >
              {togglingVis
                ? <Loader2 size={12} className="animate-spin" />
                : slide.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
              {slide.isActive ? "Hide" : "Show"}
            </button>

            <button
              onClick={handleDeleteSlide}
              className="flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {slide.imageUrl && (
            <button
              onClick={handleDeleteImage}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Remove Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}