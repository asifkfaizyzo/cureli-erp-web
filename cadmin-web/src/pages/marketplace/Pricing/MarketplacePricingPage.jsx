// cadmin-web/src/pages/marketplace/Pricing/MarketplacePricingPage.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Pricing/MarketplacePricingPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  Truck,
  MapPin,
  Heart,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

import { getPricingConfig, updatePricingConfig } from "../../../api/cadminPricing";
import { useToast } from "../../../components/common/Toast";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function fmt(val) {
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVE COMPONENTS — match existing cadmin design exactly
// ─────────────────────────────────────────────────────────────────────────────

// Section wrapper — matches ProfileCard's Section pattern
const Section = ({ title, icon: Icon, description, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-[#05015A]/8 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-[#05015A]" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

// Tier row — label + two inputs (threshold + charge)
const TierRow = ({ label, thresholdLabel, thresholdKey, chargeKey, form, onChange, hideThreshold = false }) => (
  <div className="flex items-center gap-3">
    <div className="w-36 flex-shrink-0">
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </div>
    {!hideThreshold && (
      <div className="flex-1">
        <label className="block text-xs text-gray-400 mb-1">{thresholdLabel ?? "Up to (₹)"}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
          <input
            type="number"
            min={0}
            value={fmt(form[thresholdKey])}
            onChange={(e) => onChange(thresholdKey, toNum(e.target.value))}
            className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                       focus:border-[#05015A] transition-colors"
          />
        </div>
      </div>
    )}
    <div className="flex-1">
      <label className="block text-xs text-gray-400 mb-1">Charge (₹)</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
        <input
          type="number"
          min={0}
          value={fmt(form[chargeKey])}
          onChange={(e) => onChange(chargeKey, toNum(e.target.value))}
          className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                     focus:border-[#05015A] transition-colors"
        />
      </div>
    </div>
  </div>
);

// Single field with optional prefix/suffix
const Field = ({ label, hint, fieldKey, form, onChange, prefix, suffix, type = "number", optional = false }) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {optional && (
        <span className="text-xs text-gray-400">(optional)</span>
      )}
    </div>
    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-gray-400 text-xs pointer-events-none">{prefix}</span>
      )}
      <input
        type={type}
        min={0}
        value={fmt(form[fieldKey] ?? "")}
        onChange={(e) => onChange(fieldKey, type === "number" ? toNum(e.target.value) : e.target.value)}
        placeholder={optional ? "Leave blank for unlimited" : ""}
        className={`w-full py-2 text-sm border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                    focus:border-[#05015A] transition-colors
                    ${prefix ? "pl-7" : "pl-3"}
                    ${suffix ? "pr-12" : "pr-3"}`}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-400 text-xs pointer-events-none">{suffix}</span>
      )}
    </div>
  </div>
);

// Preview pill — shows computed example
const PreviewPill = ({ label, value }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-semibold text-[#05015A]">{value}</span>
  </div>
);

// Toggle switch
const Toggle = ({ label, hint, fieldKey, form, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(fieldKey, !form[fieldKey])}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                  ${form[fieldKey] ? "bg-[#05015A]" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
                    transition-transform ${form[fieldKey] ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  </div>
);

// Inline info banner
const InfoBanner = ({ children }) => (
  <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
    <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-blue-700 leading-relaxed">{children}</p>
  </div>
);

// Loading skeleton — matches SkeletonCard from MarketplaceDashboard
const SkeletonSection = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
      <div className="h-4 w-40 bg-gray-200 rounded" />
    </div>
    <div className="p-5 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
          <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
          <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// LIVE PREVIEW — example calculation
// ─────────────────────────────────────────────────────────────────────────────

function computePreview(form, subtotal, distanceKm) {
  const f = (v) => Number(v) || 0;

  // Service charge
  let service = 0;
  if (subtotal <= f(form.service_tier_1_max))       service = f(form.service_tier_1_charge);
  else if (subtotal <= f(form.service_tier_2_max))  service = f(form.service_tier_2_charge);
  else                                               service = f(form.service_tier_3_charge);

  // Delivery fee
  let delivery = 0;
  if (subtotal < f(form.delivery_tier_1_max))       delivery = f(form.delivery_tier_1_charge);
  else if (subtotal < f(form.delivery_tier_2_max))  delivery = f(form.delivery_tier_2_charge);
  else if (subtotal < f(form.delivery_tier_3_max))  delivery = f(form.delivery_tier_3_charge);
  else                                               delivery = f(form.delivery_tier_4_charge);

  // Km surcharge
  const extraKm = Math.max(0, distanceKm - f(form.free_km_radius));
  const kmRate = subtotal < f(form.per_km_tier_1_max)
    ? f(form.per_km_tier_1_rate)
    : f(form.per_km_tier_2_rate);
  const kmSurcharge = parseFloat((extraKm * kmRate).toFixed(2));

  return {
    service,
    delivery,
    kmSurcharge,
    total: subtotal + service + delivery + kmSurcharge,
  };
}

const PREVIEW_EXAMPLES = [
  { label: "₹150 · 5 km",  subtotal: 150,  distanceKm: 5  },
  { label: "₹600 · 2 km",  subtotal: 600,  distanceKm: 2  },
  { label: "₹1500 · 8 km", subtotal: 1500, distanceKm: 8  },
  { label: "₹2500 · 1 km", subtotal: 2500, distanceKm: 1  },
];

const LivePreview = ({ form }) => {
  const [selected, setSelected] = useState(0);
  const ex = PREVIEW_EXAMPLES[selected];
  const p  = computePreview(form, ex.subtotal, ex.distanceKm);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
          <p className="text-xs text-gray-400 mt-0.5">See how charges apply to example orders</p>
        </div>
      </div>

      <div className="p-5">
        {/* Example selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PREVIEW_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                          ${selected === i
                            ? "bg-[#05015A] text-white border-[#05015A]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#05015A]/40"
                          }`}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <PreviewPill label="Items subtotal"    value={`₹${ex.subtotal.toFixed(2)}`} />
          <PreviewPill label="Service charge"    value={`₹${p.service.toFixed(2)}`} />
          <PreviewPill label="Delivery fee"      value={`₹${p.delivery.toFixed(2)}`} />
          <PreviewPill
            label={`Distance surcharge (${ex.distanceKm} km)`}
            value={p.kmSurcharge > 0 ? `₹${p.kmSurcharge.toFixed(2)}` : "₹0 (within free radius)"}
          />
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#05015A] rounded-lg">
            <span className="text-xs font-semibold text-white/80">Grand Total</span>
            <span className="text-sm font-bold text-white">₹{p.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  service_tier_1_max:     999.99,
  service_tier_1_charge:  20,
  service_tier_2_max:     1999.99,
  service_tier_2_charge:  15,
  service_tier_3_charge:  0,

  delivery_tier_1_max:    299.99,
  delivery_tier_1_charge: 60,
  delivery_tier_2_max:    999.99,
  delivery_tier_2_charge: 50,
  delivery_tier_3_max:    1999.99,
  delivery_tier_3_charge: 40,
  delivery_tier_4_charge: 30,

  free_km_radius:         3,
  per_km_tier_1_max:      999.99,
  per_km_tier_1_rate:     15,
  per_km_tier_2_rate:     10,

  max_delivery_km:        null,
  tip_enabled:            true,
};

const MarketplacePricingPage = () => {
  const toast = useToast();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [saved,    setSaved]    = useState(false);
  const [form,     setForm]     = useState(DEFAULT_FORM);
  const [original, setOriginal] = useState(null);

  // ── Fetch ────────────────────────────────────────────────
  const fetchConfig = useCallback(async (showToast = false) => {
    try {
      setError(null);
      original ? setLoading(false) : setLoading(true);
      const res  = await getPricingConfig();
      const data = res.data.data;

      // Normalise all Decimal fields to JS numbers
      const normalised = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
          k,
          v !== null && typeof v === "string" ? parseFloat(v) : v,
        ])
      );

      setForm(normalised);
      setOriginal(normalised);
      if (showToast) toast.success("Refreshed", "Pricing config reloaded");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load pricing config";
      setError(msg);
      if (showToast) toast.error("Load Failed", msg);
    } finally {
      setLoading(false);
    }
  }, [original, toast]);

  useEffect(() => { fetchConfig(false); }, []); // eslint-disable-line

  // ── Field change ─────────────────────────────────────────
  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);

      // Coerce all numeric fields; handle max_delivery_km null case
      const payload = {
        ...form,
        max_delivery_km: form.max_delivery_km === 0 || form.max_delivery_km === ""
          ? null
          : toNum(form.max_delivery_km) || null,
      };

      await updatePricingConfig(payload);
      setOriginal(form);
      setSaved(true);
      toast.success("Saved", "Pricing configuration updated successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save config";
      toast.error("Save Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Discard ──────────────────────────────────────────────
  const handleDiscard = () => {
    if (original) {
      setForm(original);
      setSaved(false);
    }
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  // ─────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </div>
          <div>
            <SkeletonSection />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────
  if (error && !original) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load config</h3>
            <p className="text-gray-500 mt-1 text-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchConfig(false)}
            className="flex items-center gap-2 px-4 py-2 bg-[#05015A] text-white
                       rounded-lg hover:bg-[#05015A]/90 transition-colors text-sm"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Page header — matches SettingsPage pattern ── */}
      <div className="flex-shrink-0 px-1 py-3">
        <div className="flex items-center justify-between">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center">
              <Settings2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Delivery Pricing</h1>
              <p className="text-xs text-gray-500">
                Configure service charges, delivery fees and per-km rates
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchConfig(true)}
              disabled={saving}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         rounded-lg transition-colors disabled:opacity-50"
              title="Reload config"
            >
              <RefreshCw size={18} />
            </motion.button>

            <AnimatePresence>
              {isDirty && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onClick={handleDiscard}
                  disabled={saving}
                  className="px-3 py-2 text-sm font-medium text-gray-600
                             bg-gray-100 hover:bg-gray-200 rounded-lg
                             transition-colors disabled:opacity-50"
                >
                  Discard
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold
                          text-white rounded-lg transition-colors
                          ${isDirty
                            ? "bg-[#05015A] hover:bg-[#05015A]/90"
                            : "bg-gray-300 cursor-not-allowed"
                          }
                          disabled:opacity-60`}
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : saved ? (
                <CheckCircle2 size={15} />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">

          {/* ── Left column: config sections ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* Service Charge */}
            <Section
              title="Service Charge"
              icon={Settings2}
              description="Flat charge based on order subtotal"
            >
              <InfoBanner>
                Applied on every order. Goes to platform revenue.
              </InfoBanner>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-400 px-1">
                  <span>Tier</span>
                  <span>Subtotal up to</span>
                  <span>Charge</span>
                </div>

                <TierRow
                  label="Tier 1"
                  thresholdLabel="Up to (₹)"
                  thresholdKey="service_tier_1_max"
                  chargeKey="service_tier_1_charge"
                  form={form}
                  onChange={handleChange}
                />
                <TierRow
                  label="Tier 2"
                  thresholdLabel="Up to (₹)"
                  thresholdKey="service_tier_2_max"
                  chargeKey="service_tier_2_charge"
                  form={form}
                  onChange={handleChange}
                />
                <TierRow
                  label="Tier 3 (≥ Tier 2 max)"
                  chargeKey="service_tier_3_charge"
                  form={form}
                  onChange={handleChange}
                  hideThreshold
                />
              </div>
            </Section>

            {/* Delivery Fee */}
            <Section
              title="Delivery Fee"
              icon={Truck}
              description="Base delivery charge based on order subtotal"
            >
              <InfoBanner>
                This is the base fee regardless of distance.
                The per-km surcharge below adds on top of this for distant orders.
              </InfoBanner>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-400 px-1">
                  <span>Tier</span>
                  <span>Subtotal up to</span>
                  <span>Charge</span>
                </div>

                <TierRow
                  label="Tier 1"
                  thresholdKey="delivery_tier_1_max"
                  chargeKey="delivery_tier_1_charge"
                  form={form}
                  onChange={handleChange}
                />
                <TierRow
                  label="Tier 2"
                  thresholdKey="delivery_tier_2_max"
                  chargeKey="delivery_tier_2_charge"
                  form={form}
                  onChange={handleChange}
                />
                <TierRow
                  label="Tier 3"
                  thresholdKey="delivery_tier_3_max"
                  chargeKey="delivery_tier_3_charge"
                  form={form}
                  onChange={handleChange}
                />
                <TierRow
                  label="Tier 4 (≥ Tier 3 max)"
                  chargeKey="delivery_tier_4_charge"
                  form={form}
                  onChange={handleChange}
                  hideThreshold
                />
              </div>
            </Section>

            {/* Per-km Surcharge */}
            <Section
              title="Per-km Distance Surcharge"
              icon={MapPin}
              description="Extra charge per km beyond the free radius"
            >
              <InfoBanner>
                Orders within the free radius pay no distance surcharge.
                Beyond that, the per-km rate applies to every extra km.
              </InfoBanner>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Free delivery radius"
                  hint="No surcharge within this distance"
                  fieldKey="free_km_radius"
                  form={form}
                  onChange={handleChange}
                  suffix="km"
                />
                <Field
                  label="Subtotal threshold"
                  hint="Tier 1 applies below this amount"
                  fieldKey="per_km_tier_1_max"
                  form={form}
                  onChange={handleChange}
                  prefix="₹"
                />
                <Field
                  label="Rate — Tier 1 (below threshold)"
                  fieldKey="per_km_tier_1_rate"
                  form={form}
                  onChange={handleChange}
                  prefix="₹"
                  suffix="/km"
                />
                <Field
                  label="Rate — Tier 2 (above threshold)"
                  fieldKey="per_km_tier_2_rate"
                  form={form}
                  onChange={handleChange}
                  prefix="₹"
                  suffix="/km"
                />
              </div>
            </Section>

            {/* Limits & Options */}
            <Section
              title="Limits & Options"
              icon={Heart}
              description="Delivery distance cap and tip settings"
            >
              <Field
                label="Maximum delivery distance"
                hint="Orders beyond this distance will be declined. Leave blank for unlimited."
                fieldKey="max_delivery_km"
                form={form}
                onChange={(key, val) =>
                  handleChange(key, val === 0 ? null : val)
                }
                suffix="km"
                optional
              />

              <Toggle
                label="Enable tip for riders"
                hint="Customers will see a tip option during checkout"
                fieldKey="tip_enabled"
                form={form}
                onChange={handleChange}
              />
            </Section>
          </div>

          {/* ── Right column: live preview ── */}
          <div className="space-y-4">
            <LivePreview form={form} />

            {/* Config version note */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
              <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Changes take effect immediately for new checkout sessions.
                In-progress sessions use the rates locked at session creation time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePricingPage;