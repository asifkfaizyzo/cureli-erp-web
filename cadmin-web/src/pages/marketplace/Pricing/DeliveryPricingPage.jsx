// cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx (do not remove this comment)

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  Truck,
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
  getAllPricingConfigs,
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
  DeliveryTierEditor,
} from "./comps/delivery/FormInputs";
import SlashConfigSection from "./comps/delivery/SlashConfigSection";
import LivePreview from "./comps/delivery/LivePreview";

const FULFILLMENT_TYPES = [
  { value: "INSTANT_DELIVERY", label: "Delivery", icon: Truck },
  { value: "PICKUP", label: "Pickup", icon: Settings2 },
  { value: "SAME_DAY", label: "Same Day", icon: Truck },
];

const DEFAULT_PRICING = {
  service_tier_1_max: 999.99,
  service_tier_1_charge: 20,
  service_tier_2_max: 1999.99,
  service_tier_2_charge: 15,
  service_tier_3_charge: 0,
  // ── Dynamic Delivery Tiers (unlimited, replaces old 4-tier flat fee +
  // separate distance surcharge columns — those are deprecated in the DB
  // schema but kept for rollback safety only) ──
  delivery_tiers_json: [
    { min_order_value: 0, flat_charge: 60, free_radius_km: 3, per_km_rate: 15 },
    { min_order_value: 299.99, flat_charge: 50, free_radius_km: 3, per_km_rate: 15 },
    { min_order_value: 999.99, flat_charge: 40, free_radius_km: 3, per_km_rate: 10 },
    { min_order_value: 1999.99, flat_charge: 30, free_radius_km: 3, per_km_rate: 10 },
  ],
  max_delivery_km: null,
  tip_enabled: true,
  // ── New: Toggle fields ──
  service_charge_enabled: true,
  delivery_fee_enabled: true,
  packing_enabled: false,
  // ── New: Packing charge tiers ──
  packing_tier_1_max: 999.99,
  packing_tier_1_charge: 10,
  packing_tier_2_max: 1999.99,
  packing_tier_2_charge: 15,
  packing_tier_3_charge: 20,
  // ── Fulfillment Active Toggle ──
  is_active: true,
  // ── Same Day Cutoff ──
  same_day_cutoff_hour: 15,
  // ── GST (Tax) ──
  gst_enabled: false,
  gst_rate: 0,
  gst_type: "CGST_SGST",
  gst_on_subtotal: false,
  gst_on_delivery: false,
  gst_on_service: false,
  gst_on_packaging: false,
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

  // ── Fulfillment type tab state ──
  const [activeFulfillment, setActiveFulfillment] =
    useState("INSTANT_DELIVERY");

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
          getPricingConfig(activeFulfillment),
          getSlashConfig(),
        ]);

        const pricingData = pricingRes.data.data;
        const slashData = slashRes.data.data;

        // Normalise Decimal pricing config fields
        const normalizedPricing = Object.fromEntries(
          Object.entries(pricingData).map(([k, v]) => [
            k,
            v !== null && typeof v === "string" ? parseFloat(v) : v,
          ]),
        );

        // Normalise Decimal slash config fields
        const normalizedSlash = {
          ...slashData,
          service_pct:
            slashData.service_pct !== null
              ? parseFloat(slashData.service_pct)
              : 0,
          delivery_tiers: Array.isArray(slashData.delivery_tiers)
            ? slashData.delivery_tiers.map((t) => ({
                ...t,
                min_subtotal:
                  t.min_subtotal !== null ? parseFloat(t.min_subtotal) : null,
                max_distance_km:
                  t.max_distance_km !== null
                    ? parseFloat(t.max_distance_km)
                    : null,
                pct: parseFloat(t.pct) || 0,
              }))
            : [],
        };

        setForm(normalizedPricing);
        setOriginal(normalizedPricing);

        setSlashForm(normalizedSlash);
        setSlashOriginal(normalizedSlash);

        if (showToast)
          toast.success("Refreshed", "Configurations reloaded from database");
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Failed to load pricing or slash config";
        setError(msg);
        if (showToast) toast.error("Load Failed", msg);
      } finally {
        setLoading(false);
      }
    },
    [activeFulfillment, original, slashOriginal, toast],
  );

  useEffect(() => {
    fetchConfigs(false);
  }, [activeFulfillment]); // eslint-disable-line

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
        same_day_cutoff_hour:
          activeFulfillment === "SAME_DAY"
            ? Math.min(
                23,
                Math.max(0, parseInt(form.same_day_cutoff_hour) || 15),
              )
            : undefined,
      };

      const slashPayload = {
        ...slashForm,
        service_pct: Number(slashForm.service_pct) || 0,
        delivery_tiers: slashForm.delivery_tiers.map((t) => ({
          priority: Number(t.priority),
          min_subtotal: t.min_subtotal === "" ? null : Number(t.min_subtotal),
          max_distance_km:
            t.max_distance_km === "" ? null : Number(t.max_distance_km),
          pct: Number(t.pct),
          mode: t.mode === "EXCESS" ? "EXCESS" : "FULL",
        })),
      };

      // Perform updates concurrently
      await Promise.all([
        updatePricingConfig(pricingPayload, activeFulfillment),
        updateSlashConfig(slashPayload),
      ]);

      setOriginal(form);
      setSlashOriginal(slashForm);
      setSaved(true);
      toast.success(
        "Saved",
        "Marketplace and Slash display configurations updated",
      );
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

  const handleFulfillmentTabChange = (type) => {
    if (isPricingDirty) {
      if (!window.confirm("You have unsaved changes. Switch anyway?")) return;
    }
    setActiveFulfillment(type);
    setSaved(false);
  };

  const isPricingDirty = JSON.stringify(form) !== JSON.stringify(original);
  const isSlashDirty =
    JSON.stringify(slashForm) !== JSON.stringify(slashOriginal);
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
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to load configuration
            </h3>
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
              <h1 className="text-xl font-bold text-gray-900">
                Delivery Pricing Config
              </h1>
              <p className="text-xs text-gray-500">
                Manage service charges, base delivery tiers, surcharges, and
                visual slash displays
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

      {/* ── Fulfillment Type Tab Bar ── */}
      <div className="max-w-6xl mx-auto mb-4  ">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
          {FULFILLMENT_TYPES.map((ft) => {
            const isActive = activeFulfillment === ft.value;
            const Icon = ft.icon;
            return (
              <button
                key={ft.value}
                type="button"
                onClick={() => handleFulfillmentTabChange(ft.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#05015A] text-white shadow-sm"
                    : "text-gray-600 hover:text-[#05015A] hover:bg-gray-100"
                }`}
              >
                <Icon size={14} />
                {ft.label}
              </button>
            );
          })}
        </div>
        {activeFulfillment === "INSTANT_DELIVERY" && (
          <div className="mt-2 px-4 py-2.5 bg-[#05015A]/5 border border-[#05015A]/15 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] text-[#05015A] font-medium">
                Instant Delivery is <strong className="font-bold">always available</strong> to customers. This cannot be disabled.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                disabled
                className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-[#05015A] opacity-60"
              >
                <span className="pointer-events-none inline-block h-4 w-4 transform translate-x-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
              </button>
              <span className="text-[10px] font-bold text-[#05015A] uppercase tracking-wide">On</span>
            </div>
          </div>
        )}
        {activeFulfillment === "PICKUP" && (
          <div className="mt-2 px-4 py-2.5 bg-[#05015A]/5 border border-[#05015A]/15 rounded-lg flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#05015A] font-medium">
              Configuring charges for{" "}
              <strong className="font-bold">Pickup</strong> orders. Toggle
              individual charges on or off using the switch in each section
              header.
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => handlePricingChange("is_active", !form.is_active)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.is_active ? "bg-[#05015A]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.is_active ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${form.is_active ? "text-[#05015A]" : "text-gray-400"}`}>
                {form.is_active ? "On" : "Off"}
              </span>
            </div>
          </div>
        )}
        {activeFulfillment === "SAME_DAY" && (
          <div className="mt-2 px-4 py-2.5 bg-[#05015A]/5 border border-[#05015A]/15 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Truck size={13} className="text-[#05015A] flex-shrink-0" />
              <p className="text-[11px] text-[#05015A] font-medium">
                <strong>Same Day Delivery</strong> — orders placed before the
                cutoff hour are batch-assigned to team riders by end of day.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => handlePricingChange("is_active", !form.is_active)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.is_active ? "bg-[#05015A]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.is_active ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${form.is_active ? "text-[#05015A]" : "text-gray-400"}`}>
                {form.is_active ? "On" : "Off"}
              </span>
            </div>
          </div>
        )}
        {activeFulfillment === "NEXT_DAY" && (
          <div className="mt-2 px-4 py-2 bg-[#05015A]/5 border border-[#05015A]/15 rounded-lg">
            <p className="text-[11px] text-[#05015A] font-medium">
              Configuring charges for{" "}
              <strong className="font-bold">Next Day</strong> orders. Scheduling
              logic is not yet active — these currently behave like instant
              delivery.
            </p>
          </div>
        )}
      </div>

      {/* Same Day Cutoff — compact horizontal design */}
      {activeFulfillment === "SAME_DAY" && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#05015A]/5 via-white to-white rounded-xl border border-[#05015A]/15 shadow-sm">
            {/* Decorative accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#05015A]/60 to-[#05015A]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 pl-6">
              {/* Left: Title + Description */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center flex-shrink-0 ring-4 ring-[#05015A]/5">
                  <Truck size={18} className="text-[#05015A]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-gray-900">
                      Order Cutoff Time
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#05015A] bg-[#05015A]/10 px-1.5 py-0.5 rounded">
                      IST
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Same Day orders are blocked after this hour. Use 24h format
                    <span className="text-gray-400">
                      {" "}
                      (e.g. 15 = 3 PM, 18 = 6 PM)
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Input + Live preview */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Unified time input — no Field suffix gap */}
                <div className="flex items-center bg-white border border-[#05015A]/20 rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#05015A]/20 focus-within:border-[#05015A]/40">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={form.same_day_cutoff_hour ?? 15}
                    onChange={(e) => {
                      const v = e.target.value;
                      handlePricingChange(
                        "same_day_cutoff_hour",
                        v === ""
                          ? ""
                          : Math.min(23, Math.max(0, parseInt(v) || 0)),
                      );
                    }}
                    className="w-10 text-center text-base font-bold text-[#05015A] tabular-nums py-2 pl-3 pr-0 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-base font-bold text-gray-400 tabular-nums select-none">
                    :
                  </span>
                  <span className="text-base font-bold text-gray-400 tabular-nums select-none pr-1">
                    00
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#05015A]/60  px-2 py-2 border-l border-[#05015A]/10 select-none">
                    IST
                  </span>
                </div>

                {/* Live 12h preview */}
                <div className="hidden md:flex flex-col items-start px-3 py-1.5 bg-white rounded-lg border border-[#05015A]/15">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Cuts off at
                  </span>
                  <span className="text-sm font-bold text-[#05015A] tabular-nums">
                    {(() => {
                      const h = parseInt(form.same_day_cutoff_hour) || 0;
                      const period = h >= 12 ? "PM" : "AM";
                      const hr12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      return `${hr12}:00 ${period}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: items-start allows sticky elements to stop stretching and slide */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
        {/* Left Side Editors - Scrolls naturally with Page Body */}
        <div className="xl:col-span-2 space-y-5 pb-12">
          {/* Service Charge */}
          <Section
            title="Base Service Charge"
            icon={Settings2}
            description="Platform service charges on order baskets"
            toggleField="service_charge_enabled"
            form={form}
            onChange={handlePricingChange}
            defaultOpen={form.service_charge_enabled}
          >
            <InfoBanner>
              Applied on every basket. Goes directly to platform revenue.
            </InfoBanner>
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

          {/* Delivery Fee — merged flat fee + distance surcharge, unlimited tiers */}
          <Section
            title="Delivery Charges"
            icon={Truck}
            description="Flat fee + free distance + per-km rate, combined by order value"
            toggleField="delivery_fee_enabled"
            form={form}
            onChange={handlePricingChange}
            defaultOpen={form.delivery_fee_enabled}
          >
            <InfoBanner>
              Add as many order-value tiers as you like. Each tier bundles
              three things: a flat delivery fee, a free delivery distance, and
              a per-km rate charged only beyond that free distance. The
              system automatically picks the tier matching the customer's
              order value.
            </InfoBanner>
            <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
              <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <strong>Rule of thumb:</strong> as the order value tier goes
                up, the flat fee should go down (or stay the same), the free
                distance should go up (or stay the same), and the per-km rate
                should go down (or stay the same). Bigger orders should never
                cost more to deliver than smaller ones.
              </p>
            </div>
            <DeliveryTierEditor
              tiers={form.delivery_tiers_json}
              onChange={(tiers) =>
                handlePricingChange("delivery_tiers_json", tiers)
              }
            />
          </Section>
{/* Distance Surcharge Rate section removed — free distance + per-km rate
    are now configured per-tier inside the "Delivery Charges" section
    above (see delivery_tiers_json). Old free_km_radius / free_km_mode /
    per_km_tier_* columns remain in the DB schema (deprecated) for
    rollback safety only. */}

          {/* Packing Charge */}
          <Section
            title="Packing Charge"
            icon={Settings2}
            description="Packing and handling fee tiers based on order subtotal"
            toggleField="packing_enabled"
            form={form}
            onChange={handlePricingChange}
            defaultOpen={form.packing_enabled}
          >
            <InfoBanner>
              Uses the same subtotal-based tier structure as service charge.
            </InfoBanner>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 px-1">
                <span>Tier</span>
                <span>Subtotal up to</span>
                <span>Charge</span>
              </div>
              <TierRow
                label="Tier 1"
                thresholdLabel="Up to (₹)"
                thresholdKey="packing_tier_1_max"
                chargeKey="packing_tier_1_charge"
                form={form}
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 2"
                thresholdLabel="Up to (₹)"
                thresholdKey="packing_tier_2_max"
                chargeKey="packing_tier_2_charge"
                form={form}
                onChange={handlePricingChange}
              />
              <TierRow
                label="Tier 3 (≥ Tier 2 max)"
                chargeKey="packing_tier_3_charge"
                form={form}
                onChange={handlePricingChange}
                hideThreshold
              />
            </div>
          </Section>

          {/* Tax (GST) */}
          <Section
            title="Tax (GST)"
            icon={Settings2}
            description="Goods and Services Tax on platform charges"
            toggleField="gst_enabled"
            form={form}
            onChange={handlePricingChange}
            defaultOpen={form.gst_enabled}
          >
            <InfoBanner>
              GST is charged on top of platform fees (service, delivery, packing). Medicine MRP already includes GST — enabling tax on subtotal will double-tax medicines.
            </InfoBanner>
            <div className="space-y-4">
              {/* GST Rate */}
              <Field
                label="GST Rate"
                hint="Standard rate is 18% for platform services"
                fieldKey="gst_rate"
                form={form}
                onChange={handlePricingChange}
                suffix="%"
              />

              {/* GST Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Tax Type
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handlePricingChange("gst_type", "CGST_SGST")}
                    className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                      (form.gst_type || "CGST_SGST") === "CGST_SGST"
                        ? "bg-[#05015A]/5 border-[#05015A]/30 text-[#05015A]"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-bold block">CGST + SGST</span>
                    <span className="text-[11px] opacity-70">
                      Intra-state (within same state)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePricingChange("gst_type", "IGST")}
                    className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                      form.gst_type === "IGST"
                        ? "bg-[#05015A]/5 border-[#05015A]/30 text-[#05015A]"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-bold block">IGST</span>
                    <span className="text-[11px] opacity-70">
                      Inter-state (different states)
                    </span>
                  </button>
                </div>
              </div>

              {/* Component Toggles */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Apply GST on
                </label>

                {form.gst_on_subtotal && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    
                    <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                      Medicine MRP already includes GST. Taxing subtotal will double-charge customers on medicines.
                    </p>
                  </div>
                )}

                <Toggle
                  label="Service Charge"
                  hint="Platform service fee"
                  fieldKey="gst_on_service"
                  form={form}
                  onChange={handlePricingChange}
                />
                <Toggle
                  label="Delivery Charge"
                  hint="Delivery fee + distance surcharge (combined)"
                  fieldKey="gst_on_delivery"
                  form={form}
                  onChange={handlePricingChange}
                />
                <Toggle
                  label="Packing Charge"
                  hint="Packing and handling fee"
                  fieldKey="gst_on_packaging"
                  form={form}
                  onChange={handlePricingChange}
                />
                <Toggle
                  label="Medicine Subtotal"
                  hint="Not recommended — MRP already includes GST"
                  fieldKey="gst_on_subtotal"
                  form={form}
                  onChange={handlePricingChange}
                />
              </div>
            </div>
          </Section>

          {/* Limits */}
          <Section
            title="Delivery Limits & Tips"
            icon={Heart}
            description="Delivery radius cap and customer tipping settings"
            defaultOpen={false}
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
          <SlashConfigSection form={slashForm} onChange={handleSlashChange} />
        </div>

        {/* 
          Right Side - Sticky Preview Column.
          Stays sticky below the Header (top-[100px] offset accounts for the sticky header height).
        */}
        <div className="xl:col-span-1 xl:sticky xl:top-[100px] self-start flex flex-col gap-4 w-full">
          <LivePreview
            pricingConfig={form}
            slashConfig={slashForm}
            fulfillmentType={activeFulfillment}
          />

          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex-shrink-0">
            <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Settings update instantly across active customer channels. Pending
              orders/sessions initialized prior retain calculations locked at
              start time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
