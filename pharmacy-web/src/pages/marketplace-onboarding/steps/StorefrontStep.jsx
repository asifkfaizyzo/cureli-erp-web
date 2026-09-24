// pharmacy-web/src/pages/marketplace-onboarding/steps/StorefrontStep.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/steps/StorefrontStep.jsx

import { useState, useRef } from "react";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  ImageIcon,
  X,
  Store,
  Phone,
  FileText,
  Image,
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";
import { uploadMarketplaceAsset } from "../../../api/marketplace";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

const inputClass = `
  w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
  placeholder-white/20 text-sm focus:outline-none focus:ring-2
  focus:ring-white/20 focus:border-white/30 transition-all
`;

// ─── Compact image upload ───────────────────────────────────────
const ImageUploadBox = ({
  label,
  hint,
  value,
  onUpload,
  type,
  isUploading,
  uploadProgress,
}) => {
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(type, file);
    e.target.value = "";
  };

  const resolvedSrc = resolveImageUrl(value);

  return (
    <div>
      {resolvedSrc ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group">
          <div className="bg-white/[0.03] flex items-center justify-center p-1.5 h-[90px]">
            <img
              src={resolvedSrc}
              alt={label}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => onUpload(type, null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60
              flex items-center justify-center opacity-0 group-hover:opacity-100
              transition-opacity hover:bg-black/80"
          >
            <X size={10} className="text-white" />
          </button>
          <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-[9px] text-white/60 font-medium">{label}</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-[90px] rounded-xl border-2 border-dashed border-white/10
            hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all
            flex flex-col items-center justify-center gap-1.5
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="text-white/40 animate-spin" />
              <span className="text-[10px] text-white/40">
                {uploadProgress}%
              </span>
            </>
          ) : (
            <>
              <ImageIcon size={16} className="text-white/25" />
              <p className="text-[10px] text-white/35">{label}</p>
              {hint && <p className="text-[9px] text-white/15">{hint}</p>}
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

// ─── Compact live preview ───────────────────────────────────────
const LivePreview = ({ storefront }) => {
  const logoSrc = resolveImageUrl(storefront.logo_url);
  const bannerSrc = resolveImageUrl(storefront.banner_url);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Browser chrome */}
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        </div>
        <p className="text-[9px] text-white/15 font-medium ml-1">Preview</p>
      </div>

      {/* Storefront mock */}
      <div className="bg-white">
        {/* Banner */}
        <div className="relative h-16">
          {bannerSrc ? (
            <img
              src={bannerSrc}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          )}
          <div className="absolute -bottom-4 left-3 w-9 h-9 rounded-lg bg-black/30 backdrop-blur-md shadow-md flex items-center justify-center overflow-hidden border border-white/20">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Store size={13} className="text-indigo-300" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pt-5 pb-3">
          <h4 className="font-bold text-gray-900 text-xs leading-tight">
            {storefront.storefront_name || (
              <span className="text-gray-300">Pharmacy Name</span>
            )}
          </h4>
          <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed line-clamp-2">
            {storefront.storefront_description || (
              <span className="text-gray-300">Description here</span>
            )}
          </p>
          {storefront.support_phone && (
            <div className="flex items-center gap-1 mt-1.5">
              <Phone size={8} className="text-gray-300" />
              <span className="text-[9px] text-gray-400">
                {storefront.support_phone}
              </span>
            </div>
          )}
          <div className="mt-2 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
            <span className="text-[9px] text-white font-semibold">
              Order Now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main ───────────────────────────────────────────────────────
const StorefrontStep = ({ onNext, onBack }) => {
  const storefront = useMarketplaceStore((s) => s.storefront);
  const updateStorefront = useMarketplaceStore((s) => s.updateStorefront);
  const submitStorefront = useMarketplaceStore((s) => s.submitStorefront);
  const isSubmitting = useMarketplaceStore((s) => s.isSubmitting);

  const [errors, setErrors] = useState({});
  const [uploadingType, setUploadingType] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const validate = () => {
    const e = {};
    if (!storefront.storefront_name?.trim())
      e.storefront_name = "Storefront name is required";
    else if (storefront.storefront_name.trim().length < 3)
      e.storefront_name = "At least 3 characters";
    if (!storefront.storefront_description?.trim())
      e.storefront_description = "Description is required";
    else if (storefront.storefront_description.trim().length < 10)
      e.storefront_description = "At least 10 characters";
    if (!storefront.support_phone?.trim())
      e.support_phone = "Support phone is required";
    else if (storefront.support_phone.trim().length < 10)
      e.support_phone = "Enter a valid phone number";
    if (!storefront.logo_url) e.logo_url = "Logo is required";
    return e;
  };

  const handleNext = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    const result = await submitStorefront();
    if (result.success) onNext();
    else setErrors({ submit: result.error });
  };

  const handleUpload = async (type, file) => {
    if (!file) {
      updateStorefront({ [`${type}_url`]: null });
      return;
    }
    setUploadingType(type);
    setUploadProgress(0);
    setUploadError(null);
    try {
      const res = await uploadMarketplaceAsset(type, file, (pct) =>
        setUploadProgress(pct),
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error("Upload failed — no URL returned");
      updateStorefront({ [`${type}_url`]: url });
    } catch (err) {
      setUploadError(
        `${type} upload failed: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setUploadingType(null);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* ── Left: Form ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white mb-1">
              Storefront Identity
            </h2>
            <p className="text-white/40 text-sm">
              How customers discover your pharmacy.
            </p>
          </div>

          {/* Two-column form grid for compact layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3">
            {/* Name — full width */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                <Store size={12} className="text-white/25" />
                Pharmacy Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={storefront.storefront_name}
                maxLength={200}
                onChange={(e) => {
                  updateStorefront({ storefront_name: e.target.value });
                  if (errors.storefront_name)
                    setErrors((p) => ({ ...p, storefront_name: null }));
                }}
                placeholder="e.g. Apollo Pharmacy"
                className={inputClass}
              />
              {errors.storefront_name && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.storefront_name}
                </p>
              )}
            </div>

            {/* Description — full width */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                <FileText size={12} className="text-white/25" />
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={storefront.storefront_description}
                maxLength={1000}
                onChange={(e) => {
                  updateStorefront({ storefront_description: e.target.value });
                  if (errors.storefront_description)
                    setErrors((p) => ({ ...p, storefront_description: null }));
                }}
                placeholder="Tell customers about your pharmacy..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
              {errors.storefront_description && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.storefront_description}
                </p>
              )}
            </div>

            {/* Phone — left column */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                <Phone size={12} className="text-white/25" />
                Support Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={storefront.support_phone}
                onChange={(e) => {
                  // Strip anything that isn't digits, +, spaces, or hyphens
                  const raw = e.target.value.replace(/[^\d+\s\-]/g, "");
                  updateStorefront({ support_phone: raw });
                  if (errors.support_phone)
                    setErrors((p) => ({ ...p, support_phone: null }));
                }}
                placeholder="+91 99999 99999"
                maxLength={10} // ← hard cap in the DOM
                className={inputClass}
              />
              {/* live counter */}
              <p className="text-[10px] text-white/20 text-right mt-0.5">
                {storefront.support_phone.length} / 10
              </p>
              {errors.support_phone && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.support_phone}
                </p>
              )}
            </div>

            {/* Spacer on right for alignment */}
            <div className="hidden lg:block" />

            {/* Images — two columns */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                <Image size={12} className="text-white/25" />
                Logo <span className="text-red-400">*</span>
              </label>
              <ImageUploadBox
                label="Upload logo"
                hint="Square · Max 5MB"
                type="logo"
                value={storefront.logo_url}
                onUpload={handleUpload}
                isUploading={uploadingType === "logo"}
                uploadProgress={uploadProgress}
              />
              {errors.logo_url && (
                <p className="mt-1 text-xs text-red-400">{errors.logo_url}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
                <Image size={12} className="text-white/25" />
                Banner
                <span className="text-white/20 font-normal text-[10px] ml-1">
                  optional
                </span>
              </label>
              <ImageUploadBox
                label="Upload banner"
                hint="Wide format · Max 5MB"
                type="banner"
                value={storefront.banner_url}
                onUpload={handleUpload}
                isUploading={uploadingType === "banner"}
                uploadProgress={uploadProgress}
              />
            </div>
          </div>

          {/* Errors */}
          {uploadError && (
            <p className="text-xs text-red-400 mt-2">{uploadError}</p>
          )}
          {errors.submit && (
            <p className="text-xs text-red-400 mt-2">{errors.submit}</p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-white/10
                text-white/60 text-sm font-medium hover:border-white/20
                hover:text-white/80 transition-all flex items-center
                justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || !!uploadingType}
              className="flex-[2] py-3 bg-white text-[#010015] rounded-xl
                font-bold text-sm hover:bg-white/90 disabled:opacity-50
                disabled:cursor-not-allowed transition-all flex items-center
                justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Continue <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Right: Live preview ────────────────────────────────── */}
        <div className="w-full lg:w-[240px] flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-2">
              Live Preview
            </p>
            <LivePreview storefront={storefront} />
            <p className="text-[9px] text-white/10 text-center mt-2">
              Updates as you type
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorefrontStep;
