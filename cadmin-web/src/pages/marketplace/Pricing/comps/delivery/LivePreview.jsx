// cadmin-web/src/pages/marketplace/Pricing/comps/delivery/LivePreview.jsx (do not remove this comment)

import React, { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";

const PreviewPill = ({ label, value, anchorValue }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
    <span className="text-xs text-gray-500">{label}</span>
    <div className="flex items-center gap-1.5">
      {anchorValue && (
        <span className="text-xs text-gray-400 line-through">
          ₹{anchorValue}
        </span>
      )}
      <span className="text-xs font-semibold text-[#05015A]">₹{value}</span>
    </div>
  </div>
);

// ── Shared pure math calculations (sync with slash.engine.js) ───────────

function evaluateSlashPercentage(value, mode, pct) {
  if (mode === "NONE" || !pct) return { actual: value, anchor: null };
  const numVal = Number(value) || 0;
  const numPct = Number(pct) || 0;

  if (mode === "NEW") {
    return {
      actual: numVal,
      anchor: parseFloat((numVal * (1 + numPct / 100)).toFixed(2)),
    };
  }

  if (mode === "OLD") {
    return {
      actual: Math.max(0, parseFloat((numVal * (1 + numPct / 100)).toFixed(2))),
      anchor: numVal,
    };
  }

  return { actual: numVal, anchor: null };
}

function findMatchingSlashTier(tiers, subtotal, distanceKm) {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.priority - b.priority);

  for (const tier of sorted) {
    let matches = true;

    // Treat 0, null, undefined as "no condition"
    const minSub = Number(tier.min_subtotal);
    if (minSub > 0 && subtotal < minSub) matches = false;

    const maxDist = Number(tier.max_distance_km);
    if (maxDist > 0 && distanceKm > maxDist) matches = false;

    if (matches) return tier;
  }
  return null;
}

function computePreview(pricingConfig, slashConfig, subtotal, distanceKm) {
  const f = (v) => Number(v) || 0;

  // ── 1. Calculate Base Service Charge ──
  let service = 0;
  if (subtotal <= f(pricingConfig.service_tier_1_max))
    service = f(pricingConfig.service_tier_1_charge);
  else if (subtotal <= f(pricingConfig.service_tier_2_max))
    service = f(pricingConfig.service_tier_2_charge);
  else service = f(pricingConfig.service_tier_3_charge);

  // ── 2. Calculate Base Delivery Fee ──
  let delivery = 0;
  if (subtotal < f(pricingConfig.delivery_tier_1_max))
    delivery = f(pricingConfig.delivery_tier_1_charge);
  else if (subtotal < f(pricingConfig.delivery_tier_2_max))
    delivery = f(pricingConfig.delivery_tier_2_charge);
  else if (subtotal < f(pricingConfig.delivery_tier_3_max))
    delivery = f(pricingConfig.delivery_tier_3_charge);
  else delivery = f(pricingConfig.delivery_tier_4_charge);

  // ── 3. Calculate Base Distance Surcharge ──
  const extraKm = Math.max(0, distanceKm - f(pricingConfig.free_km_radius));
  const kmRate =
    subtotal < f(pricingConfig.per_km_tier_1_max)
      ? f(pricingConfig.per_km_tier_1_rate)
      : f(pricingConfig.per_km_tier_2_rate);
  const kmSurcharge = parseFloat((extraKm * kmRate).toFixed(2));

  const rawDeliveryCharge = parseFloat((delivery + kmSurcharge).toFixed(2));

  // ── 4. Apply Slash Displays (if enabled) ──
  let serviceActual = service;
  let serviceAnchor = null;
  let deliveryActual = rawDeliveryCharge;
  let deliveryAnchor = null;
  let platformSavings = 0;

  if (slashConfig && slashConfig.is_enabled) {
    // Service Charge Slash
    const serviceRes = evaluateSlashPercentage(
      service,
      slashConfig.service_mode,
      slashConfig.service_pct,
    );
    serviceActual = serviceRes.actual;
    serviceAnchor = serviceRes.anchor;

    // Delivery Charge Slash (Combined delivery_fee + distance surcharge)
    if (slashConfig.delivery_mode !== "NONE") {
      const tier = findMatchingSlashTier(
        slashConfig.delivery_tiers,
        subtotal,
        distanceKm,
      );
      if (tier) {
        const deliveryRes = evaluateSlashPercentage(
          rawDeliveryCharge,
          slashConfig.delivery_mode,
          tier.pct,
        );
        deliveryActual = deliveryRes.actual;
        deliveryAnchor = deliveryRes.anchor;
      }
    }

    const sSavings = serviceAnchor != null ? serviceAnchor - serviceActual : 0;
    const dSavings =
      deliveryAnchor != null ? deliveryAnchor - deliveryActual : 0;
    platformSavings = parseFloat(Math.max(0, sSavings + dSavings).toFixed(2));
  }

  return {
    service: serviceActual,
    serviceAnchor,
    delivery: deliveryActual,
    deliveryAnchor,
    platformSavings,
    grandTotal: subtotal + serviceActual + deliveryActual,
  };
}

const PREVIEW_EXAMPLES = [
  { label: "₹150 · 5 km", subtotal: 150, distanceKm: 5 },
  { label: "₹600 · 2 km", subtotal: 600, distanceKm: 2 },
  { label: "₹1500 · 8 km", subtotal: 1500, distanceKm: 8 },
  { label: "₹2500 · 1 km", subtotal: 2500, distanceKm: 1 },
];

export default function LivePreview({ pricingConfig, slashConfig }) {
  const [selected, setSelected] = useState(0);
  const ex = PREVIEW_EXAMPLES[selected];

  const p = computePreview(
    pricingConfig,
    slashConfig,
    ex.subtotal,
    ex.distanceKm,
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            See how slash displays apply to example baskets
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Selector */}
        <div className="flex flex-wrap gap-2">
          {PREVIEW_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                          ${
                            selected === i
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
          <PreviewPill label="Items subtotal" value={ex.subtotal.toFixed(2)} />
          <PreviewPill
            label="Service charge"
            value={p.service.toFixed(2)}
            anchorValue={p.serviceAnchor ? p.serviceAnchor.toFixed(2) : null}
          />
          <PreviewPill
            label={`Delivery fee (${ex.distanceKm} km)`}
            value={p.delivery.toFixed(2)}
            anchorValue={p.deliveryAnchor ? p.deliveryAnchor.toFixed(2) : null}
          />

          {p.platformSavings > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100/50 text-emerald-800">
              <span className="text-xs font-semibold">Total Savings</span>
              <span className="text-xs font-bold">
                -₹{p.platformSavings.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-2.5 bg-[#05015A] rounded-lg">
            <span className="text-xs font-semibold text-white/80">
              Grand Total
            </span>
            <span className="text-sm font-bold text-white">
              ₹{p.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
