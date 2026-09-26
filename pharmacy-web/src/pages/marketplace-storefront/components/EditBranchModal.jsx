// pharmacy-web/src/pages/marketplace-storefront/components/EditBranchModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-storefront/components/EditBranchModal.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Clock,
  Truck,
  ShoppingBag,
  Phone,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Shield,
  ImageIcon,
  CalendarX,
  Plus,
  Trash2,
} from "lucide-react";

import LocationPicker from "../../marketplace-onboarding/components/LocationPicker";
import TimePicker from "../../marketplace-onboarding/components/TimePicker";
import UnifiedBranchMap from "../../marketplace-onboarding/components/UnifiedBranchMap";
import { useGoogleMaps } from "../../../hooks/useGoogleMaps";
import {
  uploadMarketplaceAsset,
  listHolidays as apiListHolidays,
  createHoliday as apiCreateHoliday,
  deleteHoliday as apiDeleteHoliday,
} from "../../../api/marketplace";

// ─────────────────────────────────────────────────────────────────
// IMAGE URL RESOLVER
// ─────────────────────────────────────────────────────────────────
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

// ─────────────────────────────────────────────────────────────────
// DAY SELECTOR
// ─────────────────────────────────────────────────────────────────
const ALL_DAYS = [
  { key: "MON", label: "M" },
  { key: "TUE", label: "T" },
  { key: "WED", label: "W" },
  { key: "THU", label: "T" },
  { key: "FRI", label: "F" },
  { key: "SAT", label: "S" },
  { key: "SUN", label: "S" },
];

const DaySelector = ({ value = [], onChange, disabled = false }) => (
  <div className="flex items-center gap-1">
    {ALL_DAYS.map((day) => {
      const active = value.includes(day.key);
      return (
        <button
          key={day.key}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            const next = active
              ? value.filter((d) => d !== day.key)
              : [...value, day.key];
            onChange(next);
          }}
          title={day.key}
          className={`
            w-8 h-8 rounded-lg text-[10px] font-bold transition-all
            ${
              active
                ? "bg-white/15 text-white border border-white/20"
                : "bg-white/[0.03] text-white/20 border border-white/[0.06] hover:border-white/15"
            }
            ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          `}
        >
          {day.label}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────
function validateBranchForm(data, isSuperAdmin) {
  const errors = {};

  if (!data.marketplace_enabled) return errors;

  if (isSuperAdmin) {
    if (!data.latitude || !data.longitude || !data.google_place_id) {
      errors.location = "Select a location from the search results";
    }
  }

  if (!data.pickup_enabled && !data.delivery_enabled) {
    errors.fulfillment = "Enable at least one: pickup or delivery";
  }

  if (!data.is_24_hours) {
    if (!data.opening_time) errors.opening_time = "Opening time is required";
    if (!data.closing_time) errors.closing_time = "Closing time is required";
  }

  const contact = data.contact_override?.trim();
  if (!contact) {
    errors.contact_override = "Contact number is required";
  } else if (contact.length < 10 || contact.length > 15) {
    errors.contact_override = "Enter a valid phone number (10–15 digits)";
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="space-y-3">
    <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
      {title}
    </p>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// TOGGLE ROW
// ─────────────────────────────────────────────────────────────────
const ToggleRow = ({
  icon: Icon,
  label,
  description,
  enabled,
  onChange,
  disabled,
}) => (
  <div
    className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors ${
      enabled
        ? "bg-white/[0.04] border-white/[0.08]"
        : "bg-white/[0.02] border-white/[0.04]"
    }`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          enabled ? "bg-white/[0.08]" : "bg-white/[0.03]"
        }`}
      >
        <Icon
          size={13}
          className={enabled ? "text-white/60" : "text-white/20"}
        />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium ${enabled ? "text-white/80" : "text-white/30"}`}
        >
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-white/20 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-colors flex-shrink-0 ml-3
        h-5 w-9
        ${enabled ? "bg-emerald-500" : "bg-white/10"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// HOLIDAY SECTION
// ─────────────────────────────────────────────────────────────────
const HolidaySection = ({ branchId }) => {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [applyToShop, setApplyToShop] = useState(false);
  const [addError, setAddError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!branchId) return;
    setIsLoading(true);
    apiListHolidays(branchId)
      .then((res) => setHolidays(res.data?.holidays ?? []))
      .catch(() => setHolidays([]))
      .finally(() => setIsLoading(false));
  }, [branchId]);

  const handleAdd = async () => {
    if (!newDate) {
      setAddError("Select a date");
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      const res = await apiCreateHoliday({
        branch_id: branchId,
        scope: applyToShop ? "SHOP" : "BRANCH",
        holiday_date: newDate,
        reason: newReason.trim() || undefined,
      });
      setHolidays((prev) =>
        [...prev, res.data.holiday].sort((a, b) =>
          a.holiday_date.localeCompare(b.holiday_date),
        ),
      );
      setNewDate("");
      setNewReason("");
      setApplyToShop(false);
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.response?.data?.message ?? "Failed to add holiday");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (holidayId) => {
    setDeletingId(holidayId);
    try {
      await apiDeleteHoliday(holidayId);
      setHolidays((prev) => prev.filter((h) => h.holiday_id !== holidayId));
    } catch {
      // silent fail — holiday stays in list
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarX size={12} className="text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
            Closed Days / Holidays
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]
            font-semibold text-white/40 border border-white/[0.06]
            hover:border-white/15 hover:text-white/60 transition-all"
        >
          <Plus size={10} /> Add
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence initial={false}>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/25">Date</p>
                <input
                  type="date"
                  min={todayStr}
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setAddError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10
                    text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/10
                    focus:border-white/20 transition-all [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-white/25">Reason (optional)</p>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Diwali, Emergency"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10
                    text-white text-xs placeholder-white/15 focus:outline-none focus:ring-2
                    focus:ring-white/10 focus:border-white/20 transition-all"
                />
              </div>

              {/* Apply to all branches toggle */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setApplyToShop((v) => !v)}
                  className={`
                    relative inline-flex h-4 w-7 items-center rounded-full transition-colors
                    ${applyToShop ? "bg-amber-500" : "bg-white/10"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-3 w-3 rounded-full bg-white shadow
                      transform transition-transform
                      ${applyToShop ? "translate-x-3.5" : "translate-x-0.5"}
                    `}
                  />
                </button>
                <span className="text-[11px] text-white/40">
                  Apply to all branches
                </span>
              </div>

              {addError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={10} /> {addError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddError(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-[11px] font-medium
                    text-white/30 hover:text-white/50 border border-white/[0.06]
                    hover:border-white/15 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="flex-[2] py-2 rounded-lg text-[11px] font-semibold
                    bg-white/10 text-white hover:bg-white/15 transition-all
                    disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={10} className="animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Holiday"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holiday list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={14} className="animate-spin text-white/20" />
        </div>
      ) : holidays.length === 0 ? (
        <p className="text-[11px] text-white/20 px-1">
          No upcoming closed days. Add dates when your branch won't be open.
        </p>
      ) : (
        <div className="space-y-1.5">
          {holidays.map((h) => (
            <div
              key={h.holiday_id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl
                bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/70 font-medium">
                    {new Date(h.holiday_date + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                  {h.scope === "SHOP" && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-semibold
                      bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      All branches
                    </span>
                  )}
                </div>
                {h.reason && (
                  <p className="text-[10px] text-white/30 mt-0.5 truncate">
                    {h.reason}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(h.holiday_id)}
                disabled={deletingId === h.holiday_id}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-white/20 hover:text-red-400 hover:bg-red-500/10
                  transition-all disabled:opacity-40 flex-shrink-0 ml-2"
              >
                {deletingId === h.holiday_id ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────
const EditBranchModal = ({ isOpen, onClose, branch, isSuperAdmin, onSave }) => {
  const { isLoaded, loadError } = useGoogleMaps();

  const [form, setForm] = useState({
    marketplace_enabled: false,
    shop_image_url: null,
    latitude: null,
    longitude: null,
    google_place_id: null,
    formatted_address: null,
    opening_time: null,
    closing_time: null,
    is_24_hours: false,
    open_days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    pickup_enabled: false,
    delivery_enabled: false,
    delivery_mode: "CURELI",
    contact_override: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState(null);
  const imageInputRef = useRef(null);

  // Seed form from branch on open
  useEffect(() => {
    if (!isOpen || !branch) return;
    setForm({
      marketplace_enabled: branch.marketplace_enabled ?? false,
      shop_image_url: branch.shop_image_url ?? null,
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      google_place_id: branch.google_place_id ?? null,
      formatted_address: branch.formatted_address ?? null,
      opening_time: branch.opening_time ?? null,
      closing_time: branch.closing_time ?? null,
      is_24_hours: branch.is_24_hours ?? false,
      open_days: branch.open_days ?? [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN",
      ],
      pickup_enabled: branch.pickup_enabled ?? false,
      delivery_enabled: branch.delivery_enabled ?? false,
      delivery_mode: branch.delivery_mode ?? "CURELI",
      contact_override: branch.contact_override ?? "",
    });
    setErrors({});
    setSubmitErr(null);
    setImageUploadError(null);
  }, [isOpen, branch]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    const errorKeyMap = {
      pickup_enabled: ["fulfillment"],
      delivery_enabled: ["fulfillment"],
      opening_time: ["opening_time"],
      closing_time: ["closing_time"],
      is_24_hours: ["opening_time", "closing_time"],
      contact_override: ["contact_override"],
    };
    const keys = errorKeyMap[key] ?? [key];
    if (keys.some((k) => errors[k])) {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setIsImageUploading(true);
    setImageUploadProgress(0);
    setImageUploadError(null);
    try {
      const res = await uploadMarketplaceAsset("branch_image", file, (pct) =>
        setImageUploadProgress(pct),
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error("No URL returned");
      patch("shop_image_url", url);
    } catch (err) {
      setImageUploadError(
        err.response?.data?.message || err.message || "Upload failed",
      );
    } finally {
      setIsImageUploading(false);
      setImageUploadProgress(0);
    }
  };

  const handleLocationChange = (locationData) => {
    setForm((prev) => ({
      ...prev,
      latitude: locationData.latitude ?? null,
      longitude: locationData.longitude ?? null,
      google_place_id: locationData.google_place_id ?? null,
      formatted_address: locationData.formatted_address ?? null,
    }));
    if (errors.location) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.location;
        return n;
      });
    }
  };

  const handleLocationUpdate = (_branchId, locationData) => {
    setForm((prev) => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      formatted_address: locationData.formatted_address,
    }));
  };

  const mapBranches = useMemo(() => {
    if (!isSuperAdmin || !form.latitude || !form.longitude) return [];
    return [
      {
        branch_id: branch?.branch_id ?? "editing",
        branch_name: branch?.branch_name ?? "Branch",
        latitude: form.latitude,
        longitude: form.longitude,
        formatted_address: form.formatted_address,
        isPersisted: branch?.is_configured ?? false,
        isActive: true,
      },
    ];
  }, [
    isSuperAdmin,
    form.latitude,
    form.longitude,
    form.formatted_address,
    branch,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr(null);

    const validation = validateBranchForm(form, isSuperAdmin);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSaving(true);
    const payload = {
      marketplace_enabled: form.marketplace_enabled,
      shop_image_url: form.shop_image_url,
      latitude: form.latitude,
      longitude: form.longitude,
      google_place_id: form.google_place_id,
      formatted_address: form.formatted_address,
      opening_time: form.is_24_hours ? null : form.opening_time,
      closing_time: form.is_24_hours ? null : form.closing_time,
      is_24_hours: form.is_24_hours,
      open_days: form.open_days,
      pickup_enabled: form.pickup_enabled,
      delivery_enabled: form.delivery_enabled,
      delivery_mode: form.delivery_mode,
      contact_override: form.contact_override?.trim(),
    };

    const result = await onSave(branch.branch_id, payload);
    setIsSaving(false);

    if (result.success) {
      onClose();
    } else {
      setSubmitErr(result.error ?? "Failed to save. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && branch && (
        <>
          {/* Backdrop */}
          <motion.div
            key="branch-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="branch-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
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
                    <Building2 size={15} className="text-white/50" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white truncate max-w-[240px]">
                      {branch.branch_name}
                    </h2>
                    <p className="text-[11px] text-white/25 mt-0.5 flex items-center gap-1.5">
                      Branch marketplace settings
                      {branch.branch_type === "main" && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-blue-500/15 text-blue-300 uppercase">
                          Main
                        </span>
                      )}
                    </p>
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
              <form
                id="branch-form"
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-6"
              >
                {/* ── Marketplace enabled ─────────────────────── */}
                <Section title="Marketplace Status">
                  <ToggleRow
                    icon={Building2}
                    label="Enable in Marketplace"
                    description="Customers can find and order from this branch"
                    enabled={form.marketplace_enabled}
                    onChange={(v) => patch("marketplace_enabled", v)}
                  />
                </Section>

                {/* ── Content only when enabled ───────────────── */}
                <AnimatePresence initial={false}>
                  {form.marketplace_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-6"
                    >
                      {/* ── Branch Image ─────────────────────── */}
                      <Section title="Branch Image">
                        <div className="flex items-start gap-3">
                          <div
                            className={`
                              relative w-24 h-24 rounded-xl border-2 border-dashed
                              overflow-hidden flex-shrink-0 transition-colors
                              ${
                                form.shop_image_url
                                  ? "border-white/10"
                                  : "border-white/10 hover:border-white/20"
                              }
                            `}
                          >
                            {form.shop_image_url && !isImageUploading && (
                              <>
                                <img
                                  src={resolveImageUrl(form.shop_image_url)}
                                  alt="Branch"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => imageInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/50 opacity-0
                                    hover:opacity-100 transition-opacity flex items-center
                                    justify-center z-10"
                                >
                                  <ImageIcon
                                    size={14}
                                    className="text-white/70"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => patch("shop_image_url", null)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full
                                    bg-black/60 flex items-center justify-center
                                    opacity-0 hover:opacity-100 transition-opacity z-20"
                                >
                                  <X size={9} className="text-white" />
                                </button>
                              </>
                            )}

                            {isImageUploading && (
                              <div
                                className="absolute inset-0 bg-black/60 flex flex-col
                                  items-center justify-center gap-1.5 z-20"
                              >
                                <Loader2
                                  size={14}
                                  className="text-white/60 animate-spin"
                                />
                                <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-white/40 rounded-full transition-all duration-300"
                                    style={{ width: `${imageUploadProgress}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-white/40">
                                  {imageUploadProgress}%
                                </span>
                              </div>
                            )}

                            {!form.shop_image_url && !isImageUploading && (
                              <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="absolute inset-0 flex flex-col items-center
                                  justify-center gap-1 text-white/20 hover:text-white/40
                                  transition-colors"
                              >
                                <ImageIcon size={18} />
                                <span className="text-[9px]">Upload</span>
                              </button>
                            )}

                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                                e.target.value = "";
                              }}
                            />
                          </div>

                          <div className="flex-1 pt-1 space-y-1">
                            <p className="text-[11px] text-white/30 leading-relaxed">
                              Shown on your branch's marketplace page. Helps
                              customers recognise your location.
                            </p>
                            <p className="text-[10px] text-white/15">
                              JPG, PNG or WebP · Max 5 MB · Optional
                            </p>
                            {imageUploadError && (
                              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                                <AlertCircle size={9} /> {imageUploadError}
                              </p>
                            )}
                          </div>
                        </div>
                      </Section>

                      {/* ── Location ──────────────────────────── */}
                      <Section title="Location">
                        {isSuperAdmin ? (
                          <div className="space-y-3">
                            <LocationPicker
                              value={{
                                google_place_id: form.google_place_id,
                                formatted_address: form.formatted_address,
                                latitude: form.latitude,
                                longitude: form.longitude,
                              }}
                              onChange={handleLocationChange}
                              disabled={false}
                              isLoaded={isLoaded}
                              loadError={loadError}
                            />

                            {form.latitude && form.longitude && (
                              <UnifiedBranchMap
                                branches={mapBranches}
                                activeBranchId={branch?.branch_id ?? "editing"}
                                onMarkerClick={() => {}}
                                onLocationUpdate={handleLocationUpdate}
                                isLoaded={isLoaded}
                                loadError={loadError}
                              />
                            )}

                            {errors.location && (
                              <p className="text-[11px] text-red-400 flex items-center gap-1">
                                <AlertCircle size={10} /> {errors.location}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <div className="flex items-start gap-2">
                              <Lock
                                size={12}
                                className="text-white/20 mt-0.5 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/25 font-medium mb-1">
                                  Location (super admin only)
                                </p>
                                {form.formatted_address ? (
                                  <div>
                                    <p className="text-xs text-white/50 leading-relaxed">
                                      {form.formatted_address}
                                    </p>
                                    {form.latitude && form.longitude && (
                                      <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] text-emerald-400 font-medium">
                                        <Shield size={8} /> Location verified
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-amber-400/60">
                                    Location not configured — contact your super
                                    admin
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Section>

                      {/* ── Fulfillment ───────────────────────── */}
                      <Section title="Fulfillment">
                        <div className="space-y-2">
                          <ToggleRow
                            icon={ShoppingBag}
                            label="Pickup"
                            description="Customers collect orders in-store"
                            enabled={form.pickup_enabled}
                            onChange={(v) => patch("pickup_enabled", v)}
                          />
                          <ToggleRow
                            icon={Truck}
                            label="Delivery"
                            description="Orders delivered to customer location"
                            enabled={form.delivery_enabled}
                            onChange={(v) => patch("delivery_enabled", v)}
                          />

                          {/* ── DELIVERY SERVICE PROVIDER TOGGLE ── */}
                          <AnimatePresence initial={false}>
                            {form.delivery_enabled && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 pl-1 space-y-2">
                                  <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
                                    Delivery Service Provider
                                  </p>
                                  <div className="flex gap-2">
                                    {[
                                      {
                                        key: "CURELI",
                                        label: "Cureli Riders",
                                        desc: "Use Cureli's delivery network",
                                      },
                                      {
                                        key: "SELF",
                                        label: "Own Riders",
                                        desc: "Use your pharmacy's delivery team",
                                      },
                                    ].map((mode) => {
                                      const active =
                                        form.delivery_mode === mode.key;
                                      return (
                                        <button
                                          key={mode.key}
                                          type="button"
                                          onClick={() =>
                                            patch("delivery_mode", mode.key)
                                          }
                                          className={`flex-1 p-2.5 rounded-xl border text-left transition-all ${
                                            active
                                              ? "bg-white/10 border-white/20 text-white"
                                              : "bg-white/[0.02] border-white/[0.04] text-white/40 hover:border-white/10"
                                          }`}
                                        >
                                          <p className="text-xs font-semibold">
                                            {mode.label}
                                          </p>
                                          <p className="text-[10px] text-white/30 mt-0.5 leading-tight">
                                            {mode.desc}
                                          </p>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {errors.fulfillment && (
                            <p className="text-[11px] text-red-400 flex items-center gap-1 px-1">
                              <AlertCircle size={10} /> {errors.fulfillment}
                            </p>
                          )}
                        </div>
                      </Section>

                      {/* ── Operating Hours ───────────────────── */}
                      <Section title="Operating Hours">
                        <div className="space-y-3">
                          <ToggleRow
                            icon={Clock}
                            label="Open 24 Hours"
                            description="Branch accepts orders at any time"
                            enabled={form.is_24_hours}
                            onChange={(v) => patch("is_24_hours", v)}
                          />

                          {/* Open days — always shown */}
                          <div className="space-y-2 mt-1">
                            <div className="px-3.5 py-3 rounded-xl border bg-white/[0.02] border-white/[0.04]">
                              <p className="text-[10px] text-white/25 font-medium mb-2">
                                Open days
                              </p>
                              <DaySelector
                                value={form.open_days}
                                onChange={(days) => patch("open_days", days)}
                              />
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {!form.is_24_hours && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] text-white/25 font-medium">
                                      Opens at
                                    </p>
                                    <TimePicker
                                      value={form.opening_time}
                                      onChange={(v) => patch("opening_time", v)}
                                      placeholder="09:00 AM"
                                    />
                                    {errors.opening_time && (
                                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                                        <AlertCircle size={10} />{" "}
                                        {errors.opening_time}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] text-white/25 font-medium">
                                      Closes at
                                    </p>
                                    <TimePicker
                                      value={form.closing_time}
                                      onChange={(v) => patch("closing_time", v)}
                                      placeholder="09:00 PM"
                                    />
                                    {errors.closing_time && (
                                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                                        <AlertCircle size={10} />{" "}
                                        {errors.closing_time}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Section>

                      {/* ── Contact Override ──────────────────── */}
                      <Section title="Contact Number">
                        <div className="space-y-1.5">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                              <Phone size={13} className="text-white/25" />
                            </div>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={form.contact_override}
                              onChange={(e) => {
                                const digitsOnly = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10);
                                patch("contact_override", digitsOnly);
                              }}
                              placeholder="e.g. 9876543210"
                              maxLength={10}
                              className={` w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/[0.04]
          border text-white placeholder-white/20
          focus:outline-none focus:ring-2 transition-all
          ${
            errors.contact_override
              ? "border-red-500/40 focus:ring-red-500/20"
              : "border-white/10 focus:ring-white/10 focus:border-white/20"
          } `}
                            />
                          </div>
                          {errors.contact_override ? (
                            <p className="text-[11px] text-red-400 flex items-center gap-1">
                              <AlertCircle size={10} />{" "}
                              {errors.contact_override}
                            </p>
                          ) : (
                            <p className="text-[10px] text-white/15">
                              Required — 10-digit mobile number for customer
                              inquiries
                            </p>
                          )}
                        </div>
                      </Section>

                      {/* ── Holidays ──────────────────────────── */}
                      <Section title="Closed Days / Holidays">
                        <HolidaySection branchId={branch?.branch_id} />
                      </Section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit error */}
                {submitErr && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                    <AlertCircle
                      size={13}
                      className="text-red-400 flex-shrink-0 mt-0.5"
                    />
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
                  form="branch-form"
                  disabled={isSaving || isImageUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-[#010015] text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={13} /> Save Changes
                    </>
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

export default EditBranchModal;
