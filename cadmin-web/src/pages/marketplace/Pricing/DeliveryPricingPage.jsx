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
  // ── New: Toggle fields ──
  service_charge_enabled: true,
  delivery_fee_enabled: true,
  km_surcharge_enabled: true,
  packing_enabled: false,
  // ── New: Packing charge tiers ──
  packing_tier_1_max: 999.99,
  packing_tier_1_charge: 10,
  packing_tier_2_max: 1999.99,
  packing_tier_2_charge: 15,
  packing_tier_3_charge: 20,
  // ── Same Day Cutoff ──
  same_day_cutoff_hour: 15,
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
        {activeFulfillment === "PICKUP" && (
          <div className="mt-2 px-4 py-2 bg-[#05015A]/5 border border-[#05015A]/15 rounded-lg">
            <p className="text-[11px] text-[#05015A] font-medium">
              Configuring charges for{" "}
              <strong className="font-bold">Pickup</strong> orders. Toggle
              individual charges on or off using the switch in each section
              header.
            </p>
          </div>
        )}
        {activeFulfillment === "SAME_DAY" && (
          <div className="mt-2 px-4 py-2 bg-[#05015A]/5 border border-[#05015A]/15 rounded-lg flex items-center gap-2">
            <Truck size={13} className="text-[#05015A] flex-shrink-0" />
            <p className="text-[11px] text-[#05015A] font-medium">
              <strong>Same Day Delivery</strong> — orders placed before the
              cutoff hour are batch-assigned to team riders by end of day.
            </p>
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

          {/* Delivery Fee */}
          <Section
            title="Base Delivery Fee"
            icon={Truck}
            description="Fulfillment base delivery fee tiers"
            toggleField="delivery_fee_enabled"
            form={form}
            onChange={handlePricingChange}
            defaultOpen={form.delivery_fee_enabled}
          >
            <InfoBanner>
              Flat baseline delivery cost before any distance surcharges are
              applied.
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
            toggleField="km_surcharge_enabled"
            form={form}
            onChange={handlePricingChange}
            defaultOpen={form.km_surcharge_enabled}
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
