// cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx (do not remove this comment)

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

import {
  getPricingConfig,
  updatePricingConfig,
} from "../../../api/cadminPricing";
import { useToast } from "../../../components/common/Toast";

import {
  toNum,
  Section,
  TierRow,
  Field,
  Toggle,
  InfoBanner,
  SkeletonSection,
} from "./comps/delivery/FormInputs";
import LivePreview from "./comps/delivery/LivePreview";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  service_tier_1_max: 999.99,
  service_tier_1_charge: 20,
  service_tier_2_max: 1999.99,
  service_tier_2_charge: 15,
  service_tier_3_charge: 0,

  delivery_tier_1_max: 299.99,
  delivery_tier_1_charge: 60,
  delivery_tier_2_max: 999.99,
  delivery_tier_2_charge: 50,
  delivery_tier_3_max: 1999.99,
  delivery_tier_3_charge: 40,
  delivery_tier_4_charge: 30,

  free_km_radius: 3,
  per_km_tier_1_max: 999.99,
  per_km_tier_1_rate: 15,
  per_km_tier_2_rate: 10,

  max_delivery_km: null,
  tip_enabled: true,
};

const MarketplaceDeliveryPricingPage = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [original, setOriginal] = useState(null);

  // ── Fetch ────────────────────────────────────────────────
  const fetchConfig = useCallback(
    async (showToast = false) => {
      try {
        setError(null);
        original ? setLoading(false) : setLoading(true);
        const res = await getPricingConfig();
        const data = res.data.data;

        // Normalise all Decimal fields to JS numbers
        const normalised = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [
            k,
            v !== null && typeof v === "string" ? parseFloat(v) : v,
          ]),
        );

        setForm(normalised);
        setOriginal(normalised);
        if (showToast) toast.success("Refreshed", "Pricing config reloaded");
      } catch (err) {
        const msg =
          err.response?.data?.message || "Failed to load pricing config";
        setError(msg);
        if (showToast) toast.error("Load Failed", msg);
      } finally {
        setLoading(false);
      }
    },
    [original, toast],
  );

  useEffect(() => {
    fetchConfig(false);
  }, []); // eslint-disable-line

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
        max_delivery_km:
          form.max_delivery_km === 0 || form.max_delivery_km === ""
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
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to load config
            </h3>
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
              <h1 className="text-xl font-bold text-gray-900">
                Delivery Pricing
              </h1>
              <p className="text-xs text-gray-500">
                Configure service charges, delivery fees and per-km rates for
                customer orders
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
                          ${
                            isDirty
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
                This is the base fee regardless of distance. The per-km
                surcharge below adds on top of this for distant orders.
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
                Orders within the free radius pay no distance surcharge. Beyond
                that, the per-km rate applies to every extra km.
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
                In-progress sessions use the rates locked at session creation
                time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDeliveryPricingPage;