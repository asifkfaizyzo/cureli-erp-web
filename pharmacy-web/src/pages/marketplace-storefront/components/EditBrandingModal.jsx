// pharmacy-web/src/pages/marketplace-storefront/components/EditBrandingModal.jsx (do not remove this comment)
// src/pages/marketplace-storefront/components/EditBrandingModal.jsx

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  Image,
  Type,
  FileText,
  Phone,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Mirrors the pattern from PreviewStep.jsx
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

function validateStorefront(data) {
  const errors = {};
  if (!data.storefront_name?.trim()) {
    errors.storefront_name = "Storefront name is required";
  } else if (data.storefront_name.trim().length < 3) {
    errors.storefront_name = "Must be at least 3 characters";
  } else if (data.storefront_name.trim().length > 200) {
    errors.storefront_name = "Must be under 200 characters";
  }

  if (!data.storefront_description?.trim()) {
    errors.storefront_description = "Description is required";
  } else if (data.storefront_description.trim().length < 10) {
    errors.storefront_description = "Must be at least 10 characters";
  } else if (data.storefront_description.trim().length > 1000) {
    errors.storefront_description = "Must be under 1000 characters";
  }

  if (!data.support_phone?.trim()) {
    errors.support_phone = "Support phone is required";
  } else if (data.support_phone.trim().length < 10 || data.support_phone.trim().length > 15) {
    errors.support_phone = "Enter a valid phone number";
  }

  if (!data.logo_url) {
    errors.logo_url = "Logo is required";
  }

  return errors;
}

const Field = ({ label, icon: Icon, error, children, hint }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold flex items-center gap-1">
      {Icon && <Icon size={9} />}
      {label}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-red-400 flex items-center gap-1">
        <AlertCircle size={10} /> {error}
      </p>
    )}
    {hint && !error && <p className="text-[11px] text-white/20">{hint}</p>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, error, maxLength }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
      error ? "border-red-500/40 focus:ring-red-500/20" : "border-white/10 focus:ring-white/10 focus:border-white/20"
    }`}
  />
);

const TextArea = ({ value, onChange, placeholder, error, maxLength, rows = 3 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    rows={rows}
    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all resize-none ${
      error ? "border-red-500/40 focus:ring-red-500/20" : "border-white/10 focus:ring-white/10 focus:border-white/20"
    }`}
  />
);

const ImageUploadZone = ({
  type,
  currentUrl,       // raw URL from form state (may need resolution for display)
  onUpload,
  onClear,
  isUploading,
  uploadProgress,
  error,
  aspectLabel,
}) => {
  const inputRef = useRef(null);
  const isLogo   = type === "logo";

  // Resolve URL for display — handles both full S3 URLs and relative paths
  const displayUrl = resolveImageUrl(currentUrl);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await onUpload(type, file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) return;
    await onUpload(type, file);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
        {isLogo ? "Logo" : "Banner"}
        {!isLogo && <span className="ml-1 text-white/15 normal-case font-normal">(optional)</span>}
      </label>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed overflow-hidden transition-colors ${
          error ? "border-red-500/30" : "border-white/10 hover:border-white/20"
        } ${isLogo ? "w-24 h-24" : "h-24 w-full"}`}
      >
        {/* Current image */}
        {displayUrl && !isUploading && (
          <>
            <img
              src={displayUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
            >
              <X size={10} className="text-white" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10"
            >
              <Upload size={16} className="text-white/70" />
            </button>
          </>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 z-20">
            <Loader2 size={16} className="text-white/60 animate-spin" />
            <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white/40 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[9px] text-white/40">{uploadProgress}%</span>
          </div>
        )}

        {/* Empty state */}
        {!displayUrl && !isUploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/20 hover:text-white/40 transition-colors"
          >
            <Image size={isLogo ? 20 : 16} />
            {!isLogo && <span className="text-[10px]">Click or drag to upload</span>}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {aspectLabel && <p className="text-[10px] text-white/15">{aspectLabel}</p>}
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
};

const EditBrandingModal = ({
  isOpen,
  onClose,
  storefront,
  onSave,
  onUpload,
  isUploading,
  uploadProgress,
}) => {
  const [form, setForm] = useState({
    storefront_name:        "",
    storefront_description: "",
    support_phone:          "",
    logo_url:               null,
    banner_url:             null,
  });
  const [errors,    setErrors]    = useState({});
  const [isSaving,  setIsSaving]  = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  // Seed form on open — use raw URLs from storefront (hook already resolved them,
  // but we store them as-is in form state; ImageUploadZone resolves for display)
  useEffect(() => {
    if (!isOpen || !storefront) return;
    setForm({
      storefront_name:        storefront.storefront_name        ?? "",
      storefront_description: storefront.storefront_description ?? "",
      support_phone:          storefront.support_phone          ?? "",
      logo_url:               storefront.logo_url               ?? null,
      banner_url:             storefront.banner_url             ?? null,
    });
    setErrors({});
    setSubmitErr(null);
  }, [isOpen, storefront]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleUpload = async (type, file) => {
    const result = await onUpload(type, file);
    if (result.success) {
      patch(type === "logo" ? "logo_url" : "banner_url", result.url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr(null);

    const validation = validateStorefront(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSaving(true);
    const result = await onSave({
      storefront_name:        form.storefront_name.trim(),
      storefront_description: form.storefront_description.trim(),
      support_phone:          form.support_phone.trim(),
      logo_url:               form.logo_url,
      banner_url:             form.banner_url ?? null,
    });
    setIsSaving(false);

    if (result.success) {
      onClose();
    } else {
      setSubmitErr(result.error ?? "Failed to save. Please try again.");
    }
  };

  const isAnyUploading = isUploading?.logo || isUploading?.banner;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="branding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="branding-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 16,  scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#0d0a2e] shadow-2xl shadow-black/60 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Store size={15} className="text-white/50" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Edit Storefront Branding</h2>
                    <p className="text-[11px] text-white/25 mt-0.5">Changes appear in the customer app</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <form id="branding-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                {/* Images */}
                <div className="flex gap-4 items-start">
                  <ImageUploadZone
                    type="logo"
                    currentUrl={form.logo_url}
                    onUpload={handleUpload}
                    onClear={() => patch("logo_url", null)}
                    isUploading={isUploading?.logo}
                    uploadProgress={uploadProgress?.logo ?? 0}
                    error={errors.logo_url}
                    aspectLabel="Square · min 200×200px"
                  />
                  <div className="flex-1">
                    <ImageUploadZone
                      type="banner"
                      currentUrl={form.banner_url}
                      onUpload={handleUpload}
                      onClear={() => patch("banner_url", null)}
                      isUploading={isUploading?.banner}
                      uploadProgress={uploadProgress?.banner ?? 0}
                      error={errors.banner_url}
                      aspectLabel="1200×400px recommended"
                    />
                  </div>
                </div>

                {/* Name */}
                <Field label="Storefront Name" icon={Type} error={errors.storefront_name}>
                  <TextInput
                    value={form.storefront_name}
                    onChange={(v) => patch("storefront_name", v)}
                    placeholder="e.g. Cureli Health Pharmacy"
                    error={errors.storefront_name}
                    maxLength={200}
                  />
                  <p className="text-[10px] text-white/15 text-right">{form.storefront_name.length} / 200</p>
                </Field>

                {/* Description */}
                <Field label="Description" icon={FileText} error={errors.storefront_description} hint="Shown below your pharmacy name in the app">
                  <TextArea
                    value={form.storefront_description}
                    onChange={(v) => patch("storefront_description", v)}
                    placeholder="Describe your pharmacy — services, specialities, hours..."
                    error={errors.storefront_description}
                    maxLength={1000}
                    rows={4}
                  />
                  <p className="text-[10px] text-white/15 text-right">{form.storefront_description.length} / 1000</p>
                </Field>

                {/* Support phone */}
                <Field label="Support Phone" icon={Phone} error={errors.support_phone} hint="Customers call this number for order support">
                  <TextInput
                    value={form.support_phone}
                    onChange={(v) => patch("support_phone", v)}
                    placeholder="+91 98765 43210"
                    error={errors.support_phone}
                    maxLength={15}
                  />
                </Field>

                {/* Submit error */}
                {submitErr && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                    <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{submitErr}</p>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="branding-form"
                  disabled={isSaving || isAnyUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-[#010015] text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40"
                >
                  {isSaving ? (
                    <><Loader2 size={13} className="animate-spin" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditBrandingModal;