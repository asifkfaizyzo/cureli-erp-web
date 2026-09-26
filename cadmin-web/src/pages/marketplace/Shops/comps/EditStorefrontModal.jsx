// cadmin-web/src/pages/marketplace/Shops/comps/EditStorefrontModal.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/EditStorefrontModal.jsx

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  FileText,
  Phone,
  Image,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  XCircle,
} from "lucide-react";
import {
  uploadMarketplaceAsset,
  updateShopStorefront,
} from "../../../../api/cadminMarketplaceShops";
import { resolveFileUrl } from "../../../../utils/resolveFileUrl"; // ← ADD

// ── Helpers ────────────────────────────────────────────────────
function validate(form) {
  const errors = {};
  if (!form.storefront_name?.trim()) {
    errors.storefront_name = "Storefront name is required";
  } else if (form.storefront_name.trim().length < 3) {
    errors.storefront_name = "At least 3 characters";
  } else if (form.storefront_name.trim().length > 200) {
    errors.storefront_name = "Max 200 characters";
  }

  if (!form.storefront_description?.trim()) {
    errors.storefront_description = "Description is required";
  } else if (form.storefront_description.trim().length < 10) {
    errors.storefront_description = "At least 10 characters";
  }

  if (!form.support_phone?.trim()) {
    errors.support_phone = "Support phone is required";
  } else if (form.support_phone.trim().length < 10) {
    errors.support_phone = "Enter a valid phone number";
  }

  if (!form.logo_url) {
    errors.logo_url = "Logo is required";
  }

  return errors;
}

// ── Section ────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="text-gray-400" />
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
    </div>
    {children}
  </div>
);

// ── Image upload zone ──────────────────────────────────────────
const ImageUploadZone = ({
  type,
  label,
  hint,
  currentUrl,
  onUploaded,
  onClear,
  isUploading,
  progress,
  error,
  aspect = "square",
}) => {
  const inputRef = useRef(null);

  // ← Resolve so /api/files/... paths become http://localhost:5000/api/files/...
  const displayUrl = resolveFileUrl(currentUrl);

  const handleFile = async (file) => {
    if (!file) return;
    await onUploaded(type, file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const containerClass =
    aspect === "wide" ? "h-24 w-full" : "h-24 w-24 flex-shrink-0";

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed overflow-hidden
          transition-colors cursor-pointer group ${containerClass}
          ${error
            ? "border-red-300"
            : "border-gray-200 hover:border-[#05015A]/30"
          }`}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        {/* Current image — use displayUrl, not currentUrl */}
        {displayUrl && !isUploading && (
          <>
            <img
              src={displayUrl}                       // ← was: currentUrl
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0
              group-hover:opacity-100 transition-opacity flex items-center
              justify-center">
              <Upload size={16} className="text-white" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear(type);
              }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full
                bg-black/60 flex items-center justify-center z-10
                opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={9} className="text-white" />
            </button>
          </>
        )}

        {/* Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col
            items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#05015A]" />
            <div className="w-3/4 h-1 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[#05015A] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{progress}%</span>
          </div>
        )}

        {/* Empty state */}
        {!displayUrl && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center
            justify-center gap-1 text-gray-300 group-hover:text-[#05015A]/60
            transition-colors">
            <Image size={aspect === "wide" ? 18 : 22} />
            <span className="text-[10px] font-medium">
              {aspect === "wide" ? "Click or drag" : "Upload"}
            </span>
            {hint && (
              <span className="text-[9px] text-gray-300">{hint}</span>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
};

// ── Main — unchanged from here down ───────────────────────────
const EditStorefrontModal = ({ shop, onClose, onSaved }) => {
  const mp = shop.marketplaceProfile;

  const [form, setForm] = useState({
    storefront_name: mp?.storefront_name ?? "",
    storefront_description: mp?.storefront_description ?? "",
    support_phone: mp?.support_phone ?? "",
    logo_url: mp?.logo_url ?? null,
    banner_url: mp?.banner_url ?? null,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  const [uploading, setUploading] = useState({ logo: false, banner: false });
  const [progress, setProgress] = useState({ logo: 0, banner: 0 });
  const [uploadErrors, setUploadErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const patch = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleUpload = async (type, file) => {
    setUploading((prev) => ({ ...prev, [type]: true }));
    setProgress((prev) => ({ ...prev, [type]: 0 }));
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

    try {
      const res = await uploadMarketplaceAsset(
        type,
        file,
        (pct) => setProgress((prev) => ({ ...prev, [type]: pct }))
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error("No URL returned");
      patch(`${type}_url`, url);
    } catch (err) {
      setUploadErrors((prev) => ({
        ...prev,
        [type]: err.response?.data?.message || err.message || "Upload failed",
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleClear = (type) => {
    patch(`${type}_url`, null);
  };

  const handleSave = async () => {
    setSubmitErr(null);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await updateShopStorefront(shop.shop_id, {
        storefront_name: form.storefront_name.trim(),
        storefront_description: form.storefront_description.trim(),
        support_phone: form.support_phone.trim(),
        logo_url: form.logo_url,
        banner_url: form.banner_url ?? null,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved();
      }, 900);
    } catch (err) {
      setSubmitErr(err.response?.data?.message || "Failed to save storefront");
    } finally {
      setSaving(false);
    }
  };

  const isAnyUploading = uploading.logo || uploading.banner;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4
          pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[90vh] flex
            flex-col rounded-2xl bg-white shadow-2xl shadow-black/15
            border border-gray-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4
            border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200
                shadow-sm flex items-center justify-center">
                <Store size={16} className="text-[#05015A]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Edit Storefront</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {shop.business_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <Section icon={Image} title="Branding Assets">
              <div className="flex gap-3 items-start">
                <ImageUploadZone
                  type="logo"
                  label="Logo *"
                  hint="Square"
                  currentUrl={form.logo_url}
                  onUploaded={handleUpload}
                  onClear={handleClear}
                  isUploading={uploading.logo}
                  progress={progress.logo}
                  error={errors.logo_url || uploadErrors.logo}
                  aspect="square"
                />
                <div className="flex-1">
                  <ImageUploadZone
                    type="banner"
                    label="Banner (optional)"
                    hint="1200×400px"
                    currentUrl={form.banner_url}
                    onUploaded={handleUpload}
                    onClear={handleClear}
                    isUploading={uploading.banner}
                    progress={progress.banner}
                    error={uploadErrors.banner}
                    aspect="wide"
                  />
                </div>
              </div>
            </Section>

            <Section icon={Store} title="Storefront Name *">
              <input
                type="text"
                value={form.storefront_name}
                onChange={(e) => patch("storefront_name", e.target.value)}
                placeholder="e.g. Apollo Health Pharmacy"
                maxLength={200}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                  focus:border-[#05015A]/40 transition-all bg-white
                  text-gray-800 placeholder-gray-300
                  ${errors.storefront_name ? "border-red-300" : "border-gray-200"}`}
              />
              <div className="flex items-center justify-between">
                {errors.storefront_name ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.storefront_name}
                  </p>
                ) : <span />}
                <span className="text-[10px] text-gray-400 ml-auto">
                  {form.storefront_name.length}/200
                </span>
              </div>
            </Section>

            <Section icon={FileText} title="Description *">
              <textarea
                value={form.storefront_description}
                onChange={(e) => patch("storefront_description", e.target.value)}
                placeholder="Describe your pharmacy — services, specialities, hours..."
                maxLength={1000}
                rows={3}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                  focus:border-[#05015A]/40 transition-all bg-white resize-none
                  text-gray-800 placeholder-gray-300
                  ${errors.storefront_description ? "border-red-300" : "border-gray-200"}`}
              />
              <div className="flex items-center justify-between">
                {errors.storefront_description ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.storefront_description}
                  </p>
                ) : <span />}
                <span className="text-[10px] text-gray-400 ml-auto">
                  {form.storefront_description.length}/1000
                </span>
              </div>
            </Section>

            <Section icon={Phone} title="Support Phone *">
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2
                  -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.support_phone}
                  onChange={(e) => patch("support_phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  maxLength={15}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                    focus:border-[#05015A]/40 transition-all bg-white
                    text-gray-800 placeholder-gray-300
                    ${errors.support_phone ? "border-red-300" : "border-gray-200"}`}
                />
              </div>
              {errors.support_phone && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.support_phone}
                </p>
              )}
              <p className="text-[10px] text-gray-400">
                Shown to customers for order support
              </p>
            </Section>

            {submitErr && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                bg-red-50 border border-red-100">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{submitErr}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5
            border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm text-gray-500
                hover:bg-gray-100 hover:text-gray-700 transition-all
                disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || isAnyUploading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl
                text-sm font-bold transition-all disabled:opacity-50 shadow-sm
                ${saveSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[#05015A] hover:bg-[#0a0280] text-white"
                }`}
            >
              {saving ? (
                <><Loader2 size={13} className="animate-spin" /> Saving...</>
              ) : saveSuccess ? (
                <><Check size={13} /> Saved!</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EditStorefrontModal;