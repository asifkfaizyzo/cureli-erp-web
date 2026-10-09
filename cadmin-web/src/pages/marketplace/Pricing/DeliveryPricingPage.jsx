// cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx (do not remove this comment)

import React, { useState, useEffect, useCallback } from "react";
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
  getSlashConfig,
  updateSlashConfig,
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
import SlashConfigSection from "./comps/delivery/SlashConfigSection";
import LivePreview from "./comps/delivery/LivePreview";

const DEFAULT_PRICING = {
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

const DEFAULT_SLASH = {
  is_enabled: false,
  service_mode: "NONE",
  service_pct: 0,
  delivery_mode: "NONE",
  delivery_tiers: [],
};

export default function MarketplaceDeliveryPricingPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // States for base pricing
  const [form, setForm] = useState(DEFAULT_PRICING);
  const [original, setOriginal] = useState(null);

  // States for slash display
  const [slashForm, setSlashForm] = useState(DEFAULT_SLASH);
  const [slashOriginal, setSlashOriginal] = useState(null);

  // ── Fetch both configurations ─────────────────────────────
  const fetchConfigs = useCallback(
    async (showToast = false) => {
      try {
        setError(null);
        original && slashOriginal ? setLoading(false) : setLoading(true);

        const [pricingRes, slashRes] = await Promise.all([
          getPricingConfig(),
          getSlashConfig(),
        ]);

        const pricingData = pricingRes.data.data;
        const slashData = slashRes.data.data;

        // Normalise Decimal pricing config fields
        const normalizedPricing = Object.fromEntries(
          Object.entries(pricingData).map(([k, v]) => [
            k,
            v !== null && typeof v === "string" ? parseFloat(v) : v,
          ])
        );

        // Normalise Decimal slash config fields
        const normalizedSlash = {
          ...slashData,
          service_pct: slashData.service_pct !== null ? parseFloat(slashData.service_pct) : 0,
          delivery_tiers: Array.isArray(slashData.delivery_tiers)
            ? slashData.delivery_tiers.map((t) => ({
                ...t,
                min_subtotal: t.min_subtotal !== null ? parseFloat(t.min_subtotal) : null,
                max_distance_km: t.max_distance_km !== null ? parseFloat(t.max_distance_km) : null,
                pct: parseFloat(t.pct) || 0,
              }))
            : [],
        };

        setForm(normalizedPricing);
        setOriginal(normalizedPricing);

        setSlashForm(normalizedSlash);
        setSlashOriginal(normalizedSlash);

        if (showToast) toast.success("Refreshed", "Configurations reloaded from database");
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load pricing or slash config";
        setError(msg);
        if (showToast) toast.error("Load Failed", msg);
      } finally {
        setLoading(false);
      }
    },
    [original, slashOriginal, toast]
  );

  useEffect(() => {
    fetchConfigs(false);
  }, []); // eslint-disable-line

  // ── Handlers ──────────────────────────────────────────────
  const handlePricingChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSlashChange = useCallback((key, value) => {
    setSlashForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  // ── Save action ───────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);

      const pricingPayload = {
        ...form,
        max_delivery_km:
          form.max_delivery_km === 0 || form.max_delivery_km === ""
            ? null
            : toNum(form.max_delivery_km) || null,
      };

      const slashPayload = {
        ...slashForm,
        service_pct: Number(slashForm.service_pct) || 0,
        delivery_tiers: slashForm.delivery_tiers.map((t) => ({
          priority: Number(t.priority),
          min_subtotal: t.min_subtotal === "" ? null : Number(t.min_subtotal),
          max_distance_km: t.max_distance_km === "" ? null : Number(t.max_distance_km),
          pct: Number(t.pct),
        })),
      };

      // Perform updates concurrently
      await Promise.all([
        updatePricingConfig(pricingPayload),
        updateSlashConfig(slashPayload),
      ]);

      setOriginal(form);
      setSlashOriginal(slashForm);
      setSaved(true);
      toast.success("Saved", "Marketplace and Slash display configurations updated");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save configuration";
      toast.error("Save Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Discard modifications ─────────────────────────────────
  const handleDiscard = () => {
    if (original) setForm(original);
    if (slashOriginal) setSlashForm(slashOriginal);
    setSaved(false);
  };

  const isPricingDirty = JSON.stringify(form) !== JSON.stringify(original);
  const isSlashDirty = JSON.stringify(slashForm) !== JSON.stringify(slashOriginal);
  const isDirty = isPricingDirty || isSlashDirty;

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

  if (error && !original) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load configuration</h3>
            <p className="text-gray-500 mt-1 text-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchConfigs(false)}
            className="flex items-center gap-2 px-4 py-2 bg-[#05015A] text-white
                       rounded-lg hover:bg-[#05015A]/90 transition-colors text-sm"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50/50">
      
      {/* 
        Page Header - Stays Fixed/Sticky at the Top.
        Negative margins offset the main wrapper padding to look perfectly seamless.
      */}
      <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4 bg-white/95  border-b border-gray-100  -mx-2 sm:-mx-6 lg:-mx-8 -mt-2 mb-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center shadow-sm">
              <Settings2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Delivery Pricing Config</h1>
              <p className="text-xs text-gray-500">
                Manage service charges, base delivery tiers, surcharges, and visual slash displays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchConfigs(true)}
              disabled={saving}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         rounded-lg transition-colors disabled:opacity-50"
              title="Reload settings"
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
                  className="px-3 py-2 text-sm font-semibold text-gray-600
                             bg-white hover:bg-gray-100 rounded-lg border border-gray-200
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
                          text-white rounded-lg transition-colors shadow-sm
                          ${
                            isDirty
                              ? "bg-[#05015A] hover:bg-[#05015A]/90"
                              : "bg-gray-300 cursor-not-allowed shadow-none"
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

      {/* Main Grid: items-start allows sticky elements to stop stretching and slide */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
        
        {/* Left Side Editors - Scrolls naturally with Page Body */}
        <div className="xl:col-span-2 space-y-5 pb-12">
          {/* Service Charge */}
          <Section
            title="Base Service Charge"
            icon={Settings2}
            description="Platform service charges on order baskets"
          >
            <InfoBanner>Applied on every basket. Goes directly to platform revenue.</InfoBanner>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 px-1">
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
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 2"
                thresholdLabel="Up to (₹)"
                thresholdKey="service_tier_2_max"
                chargeKey="service_tier_2_charge"
                form={form}
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 3 (≥ Tier 2 max)"
                chargeKey="service_tier_3_charge"
                form={form}
                onChange={handlePricingChange}
                hideThreshold
              />
            </div>
          </Section>

          {/* Delivery Fee */}
          <Section
            title="Base Delivery Fee"
            icon={Truck}
            description="Fulfillment base delivery fee tiers"
          >
            <InfoBanner>
              Flat baseline delivery cost before any distance surcharges are applied.
            </InfoBanner>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 px-1">
                <span>Tier</span>
                <span>Subtotal up to</span>
                <span>Charge</span>
              </div>
              <TierRow
                label="Tier 1"
                thresholdKey="delivery_tier_1_max"
                chargeKey="delivery_tier_1_charge"
                form={form}
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 2"
                thresholdKey="delivery_tier_2_max"
                chargeKey="delivery_tier_2_charge"
                form={form}
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 3"
                thresholdKey="delivery_tier_3_max"
                chargeKey="delivery_tier_3_charge"
                form={form}
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 4 (≥ Tier 3 max)"
                chargeKey="delivery_tier_4_charge"
                form={form}
                onChange={handlePricingChange}
                hideThreshold
              />
            </div>
          </Section>

          {/* Surcharge limits */}
          <Section
            title="Distance Surcharge Rate"
            icon={MapPin}
            description="Per-km mileage rates beyond the free zone threshold"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Free delivery radius"
                hint="No distance fees applied inside this boundary"
                fieldKey="free_km_radius"
                form={form}
                onChange={handlePricingChange}
                suffix="km"
              />
              <Field
                label="Subtotal threshold"
                hint="Higher rate applies below this order basket size"
                fieldKey="per_km_tier_1_max"
                form={form}
                onChange={handlePricingChange}
                prefix="₹"
              />
              <Field
                label="Rate — Tier 1 (Below threshold)"
                fieldKey="per_km_tier_1_rate"
                form={form}
                onChange={handlePricingChange}
                prefix="₹"
                suffix="/km"
              />
              <Field
                label="Rate — Tier 2 (Above threshold)"
                fieldKey="per_km_tier_2_rate"
                form={form}
                onChange={handlePricingChange}
                prefix="₹"
                suffix="/km"
              />
            </div>
          </Section>

          {/* Limits */}
          <Section
            title="Delivery Limits"
            icon={Heart}
            description="Delivery radius cap and customer tipping settings"
          >
            <Field
              label="Maximum delivery distance limit"
              hint="Baskets farther than this will be blocked. Empty means infinite."
              fieldKey="max_delivery_km"
              form={form}
              onChange={(k, v) => handlePricingChange(k, v === 0 ? null : v)}
              suffix="km"
              optional
            />
            <Toggle
              label="Allow customer tips for riders"
              hint="Add tip presets to the final customer invoice screen"
              fieldKey="tip_enabled"
              form={form}
              onChange={handlePricingChange}
            />
          </Section>

          {/* Price slash configuration section */}
          <SlashConfigSection
            form={slashForm}
            onChange={handleSlashChange}
          />
        </div>

        {/* 
          Right Side - Sticky Preview Column.
          Stays sticky below the Header (top-[100px] offset accounts for the sticky header height).
        */}
        <div className="xl:col-span-1 xl:sticky xl:top-[100px] self-start flex flex-col gap-4 w-full">
          <LivePreview
            pricingConfig={form}
            slashConfig={slashForm}
          />

          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex-shrink-0">
            <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Settings update instantly across active customer channels. Pending
              orders/sessions initialized prior retain calculations locked at start time.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}