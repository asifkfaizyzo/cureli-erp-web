// cadmin-web/src/pages/AppConfig/banners/comps/SlideFormModal.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/banners/comps/SlideFormModal.jsx

import { useState, useRef, useCallback } from "react";
import {
  X,
  Loader2,
  ImageIcon,
  Type,
  Maximize,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Bike,
  Tag,
  Heart,
  Dumbbell,
  BandageIcon,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import {
  uploadBannerSlideImage,
  deleteBannerSlideImage,
} from "../../../../api/cadminBanners";
import StyledSelect from "../../../../components/common/StyledSelect";

// ── Constants ──────────────────────────────────────────────────────────────────

const CTA_ACTIONS = [
  { value: "NONE", label: "No action (decorative)" },
  { value: "ROUTE", label: "Internal screen" },
  { value: "CATEGORY", label: "Category page" },
  { value: "EXTERNAL_URL", label: "External URL" },
];

const ROUTE_OPTIONS = [
  { value: "/search", label: "Search → /search" },
  {
    value: "/prescription-request",
    label: "Prescription Request → /prescription-request",
  },
  {
    value: "/marketplace/categories",
    label: "All Categories → /marketplace/categories",
  },
  { value: "/cart", label: "Cart → /cart" },
  { value: "/profile", label: "Profile → /profile" },
  { value: "/orders", label: "Orders → /orders" },
];

const CATEGORY_OPTIONS = [
  { value: "PAIN ANALGESICS", label: "Pain Relief" },
  { value: "ANTI DIABETIC", label: "Diabetes" },
  { value: "CARDIAC", label: "Heart Care" },
  { value: "RESPIRATORY", label: "Cold & Cough" },
  { value: "DERMA", label: "Skin Care" },
  { value: "GASTRO INTESTINAL", label: "Stomach Care" },
  { value: "Vitamins & Nutrition", label: "Vitamins" },
  { value: "Baby Care", label: "Baby Care" },
  { value: "Personal Care Products", label: "Wellness" },
  { value: "ENGLISH_MEDICINE", label: "English Medicine" },
  { value: "Ayurveda Products", label: "Ayurvedic" },
  { value: "Pet Care", label: "Pet Care" },
];

const DEFAULT_GRADIENT = { color1: "#05015A", color2: "#3b2fd4", angle: 135 };

const PLACEHOLDER_ICONS = [
  { name: "medkit-outline", label: "Medkit", icon: Stethoscope },
  { name: "bicycle-outline", label: "Delivery", icon: Bike },
  { name: "pricetag-outline", label: "Price", icon: Tag },
  { name: "heart-outline", label: "Health", icon: Heart },
  { name: "fitness-outline", label: "Fitness", icon: Dumbbell },
  { name: "bandage-outline", label: "Bandage", icon: BandageIcon },
  { name: "flask-outline", label: "Lab", icon: FlaskConical },
  { name: "shield-checkmark-outline", label: "Verified", icon: ShieldCheck },
];

const LAYOUT_MODES = [
  {
    value: "FULL_IMAGE",
    label: "Full Image",
    description: "Image covers the entire banner",
    icon: Maximize,
  },
  {
    value: "TEXT_WITH_IMAGE",
    label: "Text + Image",
    description: "Text on left, image/icon on right",
    icon: Type,
  },
];

// ── Shared aspect ratio — same as mobile HERO_BANNER_ASPECT_RATIO ─────────────
const BANNER_ASPECT_RATIO = 2.04;
const PREVIEW_WIDTH = 220;
const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH / BANNER_ASPECT_RATIO);

// ── Mobile theme constants ────────────────────────────────────────────────────
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

// ── LivePreview ────────────────────────────────────────────────────────────────

function LivePreview({ form, previewImageUrl }) {
  const gradientColor1 = form.gradientColor1 ?? DEFAULT_GRADIENT.color1;
  const gradientColor2 = form.gradientColor2 ?? DEFAULT_GRADIENT.color2;
  const gradientAngle = form.gradientAngle ?? DEFAULT_GRADIENT.angle;
  const gradientCSS = `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`;

  const hasImage = !!previewImageUrl;
  const isFullImage = form.layoutMode === "FULL_IMAGE";
  const hasCta = !!form.ctaLabel;

  const selectedIcon =
    PLACEHOLDER_ICONS.find((i) => i.name === form.placeholderIcon) ??
    PLACEHOLDER_ICONS[0];

  const S = PREVIEW_WIDTH / 346;

  // ── Full Image + has image ────────────────────────────────────
  if (isFullImage && hasImage) {
    const hasOverlay = !!(form.title || form.subtitle || hasCta);
    return (
      <div
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          borderRadius: M.cardRadius * S,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={previewImageUrl}
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
              background:
                "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              display: "flex",
              flexDirection: "column",
              gap: 2 * S,
            }}
          >
            {!!form.title && (
              <p
                style={{
                  margin: 0,
                  color: M.onGradientText,
                  fontSize: M.titleFontSize * S,
                  fontWeight: M.titleWeight,
                  lineHeight: `${M.titleLineHeight * S}px`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {form.title}
              </p>
            )}
            {!!form.subtitle && (
              <p
                style={{
                  margin: 0,
                  color: M.onGradientTextMuted,
                  fontSize: M.subtitleFontSize * S,
                  lineHeight: `${M.subtitleLH * S}px`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {form.subtitle}
              </p>
            )}
            {hasCta && (
              <span
                style={{
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
                }}
              >
                {form.ctaLabel}
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
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
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
          <p style={{ margin: 0, fontSize: 12 * S }}>Upload a banner image</p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 10 * S,
              color: "rgba(255,255,255,0.40)",
            }}
          >
            Recommended: 1440×706px
          </p>
        </div>
      </div>
    );
  }

  // ── Text + Image mode ─────────────────────────────────────────
  const IconComp = selectedIcon.icon;

  return (
    <div
      style={{
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
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
      <div
        style={{
          position: "absolute",
          width: 160 * S,
          height: 160 * S,
          borderRadius: 80 * S,
          top: -50 * S,
          right: -40 * S,
          backgroundColor: M.decorCircle,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 110 * S,
          height: 110 * S,
          borderRadius: 55 * S,
          bottom: -30 * S,
          left: -20 * S,
          backgroundColor: M.decorCircleSecondary,
          pointerEvents: "none",
        }}
      />

      {/* Left — text block */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {!!form.title ? (
          <p
            style={{
              margin: 0,
              marginBottom: M.xs * S,
              color: M.onGradientText,
              fontSize: M.titleFontSize * S,
              fontWeight: M.titleWeight,
              lineHeight: `${M.titleLineHeight * S}px`,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {form.title}
          </p>
        ) : (
          <p
            style={{
              margin: 0,
              marginBottom: M.xs * S,
              color: "rgba(255,255,255,0.25)",
              fontSize: M.titleFontSize * S,
              fontWeight: M.titleWeight,
              fontStyle: "italic",
            }}
          >
            No title
          </p>
        )}

        {!!form.subtitle && (
          <p
            style={{
              margin: 0,
              marginBottom: M.md * S,
              color: M.onGradientTextMuted,
              fontSize: M.subtitleFontSize * S,
              lineHeight: `${M.subtitleLH * S}px`,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {form.subtitle}
          </p>
        )}

        {hasCta && (
          <span
            style={{
              display: "inline-block",
              alignSelf: "flex-start",
              borderWidth: 1,
              borderStyle: "solid",
              borderRadius: M.ctaRadius * S,
              paddingLeft: M.md * S,
              paddingRight: M.md * S,
              paddingTop: (M.xs + 2) * S,
              paddingBottom: (M.xs + 2) * S,
              backgroundColor: M.ctaBg,
              borderColor: M.ctaBorder,
              fontSize: M.ctaFontSize * S,
              fontWeight: M.ctaWeight,
              lineHeight: `${M.ctaLineHeight * S}px`,
              color: M.ctaText,
              whiteSpace: "nowrap",
            }}
          >
            {form.ctaLabel}
          </span>
        )}
      </div>

      {/* Right — image / icon block */}
      <div
        style={{
          width: 88 * S,
          height: 88 * S,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {hasImage ? (
          <img
            src={previewImageUrl}
            alt=""
            style={{
              width: 80 * S,
              height: 80 * S,
              borderRadius: 40 * S,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 80 * S,
              height: 80 * S,
              borderRadius: 40 * S,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: M.placeholderBorder,
              backgroundColor: M.placeholderBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComp size={34 * S} color="rgba(255,255,255,0.7)" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline Feedback ────────────────────────────────────────────────────────────

function InlineFeedback({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${isError ? "text-red-500" : "text-green-600"}`}
    >
      {isError ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
      {message}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export default function SlideFormModal({ slide, onClose, onSave, onRefetch }) {
  const isEdit = !!slide;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: slide?.title ?? "",
    subtitle: slide?.subtitle ?? "",
    ctaLabel: slide?.ctaLabel ?? "",
    ctaAction: slide?.ctaAction ?? "NONE",
    ctaActionValue: slide?.ctaActionValue ?? "",
    isActive: slide?.isActive ?? true,
    gradientColor1: slide?.gradientColor1 ?? DEFAULT_GRADIENT.color1,
    gradientColor2: slide?.gradientColor2 ?? DEFAULT_GRADIENT.color2,
    gradientAngle: slide?.gradientAngle ?? DEFAULT_GRADIENT.angle,
    placeholderIcon: slide?.placeholderIcon ?? "medkit-outline",
    layoutMode: slide?.layoutMode ?? "TEXT_WITH_IMAGE",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(slide?.imageUrl ?? null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [imageFeedback, setImageFeedback] = useState({
    type: null,
    message: null,
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const showImageFeedback = useCallback((type, message) => {
    setImageFeedback({ type, message });
    setTimeout(() => setImageFeedback({ type: null, message: null }), 3000);
  }, []);

  const isFullImage = form.layoutMode === "FULL_IMAGE";
  const isTextWithImage = form.layoutMode === "TEXT_WITH_IMAGE";

  // ── Image select ──────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!isEdit) {
      setPendingFile(file);
      const reader = new FileReader();
      reader.onload = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
      showImageFeedback(
        "success",
        "Image ready — will upload when slide is created",
      );
      return;
    }

    setUploadProgress(0);
    try {
      const res = await uploadBannerSlideImage(
        slide.slideId,
        file,
        setUploadProgress,
      );
      const newUrl =
        res.data?.data?.imageUrl ?? res.data?.data?.slide?.imageUrl;
      if (newUrl) setImageUrl(newUrl);
      showImageFeedback("success", "Image uploaded");
      onRefetch?.();
    } catch (err) {
      showImageFeedback(
        "error",
        err.response?.data?.message ?? "Upload failed",
      );
    } finally {
      setUploadProgress(null);
    }
  };

  // ── Image delete ──────────────────────────────────────────────
  const handleDeleteImage = async () => {
    if (!imageUrl) return;

    if (!isEdit) {
      setPendingFile(null);
      setImageUrl(null);
      return;
    }

    if (!window.confirm("Remove the image from this slide?")) return;
    setDeletingImage(true);
    try {
      await deleteBannerSlideImage(slide.slideId);
      setImageUrl(null);
      showImageFeedback("success", "Image removed");
      onRefetch?.();
    } catch (err) {
      showImageFeedback("error", err.response?.data?.message ?? "Failed");
    } finally {
      setDeletingImage(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const payload = {
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
      ctaAction: form.ctaAction,
      ctaActionValue:
        form.ctaAction !== "NONE" ? form.ctaActionValue.trim() || null : null,
      isActive: form.isActive,
      gradientColor1: form.gradientColor1,
      gradientColor2: form.gradientColor2,
      gradientAngle: form.gradientAngle,
      placeholderIcon: form.placeholderIcon,
      layoutMode: form.layoutMode,
    };

    setSaving(true);
    setError(null);

    try {
      const createdSlide = await onSave(payload);

      if (!isEdit && pendingFile && createdSlide?.slideId) {
        setUploadProgress(0);
        try {
          await uploadBannerSlideImage(
            createdSlide.slideId,
            pendingFile,
            setUploadProgress,
          );
          onRefetch?.();
        } catch (uploadErr) {
          console.warn(
            "[SlideFormModal] post-create image upload failed:",
            uploadErr,
          );
        } finally {
          setUploadProgress(null);
        }
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save slide");
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit Slide" : "New Slide"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              All fields optional — configure what you need
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1  flex flex-col lg:flex-row min-h-0">
          {/* LEFT: sticky preview */}
          <div
            className="lg:w-[280px] shrink-0 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 p-5 flex flex-col gap-4"
            style={{ overflow: "hidden" }}
          >
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Live Preview
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Aspect ratio {BANNER_ASPECT_RATIO}:1 — same as mobile
              </p>
            </div>

            <div
              className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center"
              style={{ padding: 10 }}
            >
              <LivePreview form={form} previewImageUrl={imageUrl} />
            </div>

            {/* Image section */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Banner Image
              </p>

              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#05015A] rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <InlineFeedback
                type={imageFeedback.type}
                message={imageFeedback.message}
              />

              {imageUrl && !pendingFile && (
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                  <span className="truncate">Image attached</span>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors disabled:opacity-40"
              >
                <Upload size={12} />
                {imageUrl ? "Replace Image" : "Upload Image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {imageUrl && (
                <button
                  onClick={handleDeleteImage}
                  disabled={deletingImage}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
                >
                  {deletingImage ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Remove Image
                </button>
              )}

              <p className="text-[10px] text-gray-400 leading-tight">
                {isFullImage
                  ? "Recommended: 1440×706px (2.04:1). JPEG, PNG or WebP. Max 5 MB."
                  : "Pip image: 200×200px square. JPEG, PNG or WebP. Max 5 MB."}
              </p>
            </div>
          </div>

          {/* RIGHT: scrollable form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4"
          >
            {/* Layout Mode */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Banner Layout
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const selected = form.layoutMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => set("layoutMode", mode.value)}
                      className={`
                        flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left
                        ${
                          selected
                            ? "border-[#05015A] bg-[#05015A]/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          size={14}
                          className={
                            selected ? "text-[#05015A]" : "text-gray-400"
                          }
                        />
                        <span
                          className={`text-xs font-semibold ${selected ? "text-[#05015A]" : "text-gray-700"}`}
                        >
                          {mode.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 leading-tight">
                        {mode.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Content */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Content
                {isFullImage && (
                  <span className="normal-case font-normal ml-1">
                    — optional overlay text on image
                  </span>
                )}
              </p>
              <div className="flex flex-col gap-3">
                <Field label="Title" hint={`${form.title.length}/200`}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder={
                      isFullImage
                        ? "Optional overlay title"
                        : "e.g. Order medicines fast"
                    }
                    maxLength={200}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                  />
                </Field>
                <Field label="Subtitle" hint={`${form.subtitle.length}/300`}>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => set("subtitle", e.target.value)}
                    placeholder="e.g. From pharmacies near you"
                    maxLength={300}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                  />
                </Field>
                <Field label="CTA Button Label">
                  <input
                    type="text"
                    value={form.ctaLabel}
                    onChange={(e) => set("ctaLabel", e.target.value)}
                    placeholder="e.g. Order Now"
                    maxLength={80}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                  />
                </Field>
              </div>
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
                    value={form.ctaAction}
                    onChange={(val) => {
                      set("ctaAction", val);
                      set("ctaActionValue", "");
                    }}
                    options={CTA_ACTIONS}
                    placeholder="Select action…"
                  />
                </Field>

                {form.ctaAction !== "NONE" && (
                  <Field
                    label={
                      form.ctaAction === "ROUTE"
                        ? "App Route"
                        : form.ctaAction === "CATEGORY"
                          ? "Category"
                          : "URL"
                    }
                  >
                    {form.ctaAction === "ROUTE" ? (
                      <StyledSelect
                        value={form.ctaActionValue}
                        onChange={(val) => set("ctaActionValue", val)}
                        options={ROUTE_OPTIONS}
                        placeholder="Select a screen…"
                      />
                    ) : form.ctaAction === "CATEGORY" ? (
                      <StyledSelect
                        value={form.ctaActionValue}
                        onChange={(val) => set("ctaActionValue", val)}
                        options={CATEGORY_OPTIONS}
                        placeholder="Select a category…"
                      />
                    ) : (
                      <input
                        type="url"
                        value={form.ctaActionValue}
                        onChange={(e) => set("ctaActionValue", e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                      />
                    )}
                  </Field>
                )}
              </div>
            </div>

            {/* Appearance — Text+Image only */}
            {isTextWithImage && (
              <>
                <div className="border-t border-gray-100" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Fallback Appearance
                    <span className="normal-case font-normal ml-1">
                      — when no image
                    </span>
                  </p>
                  <div className="flex flex-col gap-3">
                    <Field label="Background Gradient">
                      <div className="flex flex-col gap-3">
                        {/* Live Preview */}
                        <div
                          className="w-full h-16 rounded-xl border border-gray-200 shadow-inner"
                          style={{
                            background: `linear-gradient(${form.gradientAngle ?? DEFAULT_GRADIENT.angle}deg, ${form.gradientColor1 ?? DEFAULT_GRADIENT.color1}, ${form.gradientColor2 ?? DEFAULT_GRADIENT.color2})`,
                          }}
                        />

                        {/* Color Pickers */}
                        <div className="flex gap-3">
                          <label className="flex-1 flex flex-col gap-1.5">
                            <span className="text-xs text-gray-500 font-medium">
                              Start Color
                            </span>
                            <div className="relative flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-gray-300 transition-colors">
                              <input
                                type="color"
                                value={
                                  form.gradientColor1 ?? DEFAULT_GRADIENT.color1
                                }
                                onChange={(e) =>
                                  set("gradientColor1", e.target.value)
                                }
                                className="w-7 h-7 rounded-md border-0 cursor-pointer p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                              />
                              <span className="text-xs font-mono text-gray-600 uppercase">
                                {form.gradientColor1 ?? DEFAULT_GRADIENT.color1}
                              </span>
                            </div>
                          </label>

                          <label className="flex-1 flex flex-col gap-1.5">
                            <span className="text-xs text-gray-500 font-medium">
                              End Color
                            </span>
                            <div className="relative flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-gray-300 transition-colors">
                              <input
                                type="color"
                                value={
                                  form.gradientColor2 ?? DEFAULT_GRADIENT.color2
                                }
                                onChange={(e) =>
                                  set("gradientColor2", e.target.value)
                                }
                                className="w-7 h-7 rounded-md border-0 cursor-pointer p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                              />
                              <span className="text-xs font-mono text-gray-600 uppercase">
                                {form.gradientColor2 ?? DEFAULT_GRADIENT.color2}
                              </span>
                            </div>
                          </label>
                        </div>

                        {/* Angle Slider */}
                        <label className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">
                              Angle
                            </span>
                            <span className="text-xs font-mono text-gray-400">
                              {form.gradientAngle ?? DEFAULT_GRADIENT.angle}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={form.gradientAngle ?? DEFAULT_GRADIENT.angle}
                            onChange={(e) =>
                              set("gradientAngle", Number(e.target.value))
                            }
                            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
                                       [&::-webkit-slider-thumb]:appearance-none
                                       [&::-webkit-slider-thumb]:w-4
                                       [&::-webkit-slider-thumb]:h-4
                                       [&::-webkit-slider-thumb]:rounded-full
                                       [&::-webkit-slider-thumb]:bg-[#05015A]
                                       [&::-webkit-slider-thumb]:shadow-md
                                       [&::-webkit-slider-thumb]:cursor-pointer
                                       [&::-webkit-slider-thumb]:border-2
                                       [&::-webkit-slider-thumb]:border-white"
                          />
                          {/* Quick angle presets */}
                          <div className="flex gap-1.5 mt-0.5">
                            {[0, 45, 90, 135, 180, 270].map((angle) => (
                              <button
                                key={angle}
                                type="button"
                                onClick={() => set("gradientAngle", angle)}
                                className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${
                                  (form.gradientAngle ??
                                    DEFAULT_GRADIENT.angle) === angle
                                    ? "border-[#05015A] bg-[#05015A] text-white"
                                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                {angle}°
                              </button>
                            ))}
                          </div>
                        </label>

                        {/* Reset Button */}
                        <button
                          type="button"
                          onClick={() => {
                            set("gradientColor1", DEFAULT_GRADIENT.color1);
                            set("gradientColor2", DEFAULT_GRADIENT.color2);
                            set("gradientAngle", DEFAULT_GRADIENT.angle);
                          }}
                          className="self-start text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                        >
                          Reset to default
                        </button>
                      </div>
                    </Field>

                    <Field label="Fallback Icon" hint="When no image uploaded">
                      <div className="flex flex-wrap gap-1.5">
                        {PLACEHOLDER_ICONS.map((item) => {
                          const selected = form.placeholderIcon === item.name;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => set("placeholderIcon", item.name)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                                selected
                                  ? "border-[#05015A] bg-[#05015A] text-white"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              <Icon
                                size={14}
                                className={
                                  selected ? "text-white" : "text-gray-500"
                                }
                              />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* Active toggle */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-medium text-gray-700">Active</p>
                <p className="text-[11px] text-gray-500">
                  Show this slide in the mobile app
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  form.isActive ? "bg-[#05015A]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-[#05015A] rounded-xl hover:bg-[#06018a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Slide"}
          </button>
        </div>
      </div>
    </div>
  );
}