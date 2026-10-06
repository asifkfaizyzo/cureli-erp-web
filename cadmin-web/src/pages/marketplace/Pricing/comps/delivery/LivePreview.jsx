// cadmin-web/src/pages/marketplace/Pricing/comps/delivery/LivePreview.jsx (do not remove this comment)

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Preview pill — shows computed example
// ─────────────────────────────────────────────────────────────────────────────

const PreviewPill = ({ label, value }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-semibold text-[#05015A]">{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Example calculation
// ─────────────────────────────────────────────────────────────────────────────

function computePreview(form, subtotal, distanceKm) {
  const f = (v) => Number(v) || 0;

  // Service charge
  let service = 0;
  if (subtotal <= f(form.service_tier_1_max))
    service = f(form.service_tier_1_charge);
  else if (subtotal <= f(form.service_tier_2_max))
    service = f(form.service_tier_2_charge);
  else service = f(form.service_tier_3_charge);

  // Delivery fee
  let delivery = 0;
  if (subtotal < f(form.delivery_tier_1_max))
    delivery = f(form.delivery_tier_1_charge);
  else if (subtotal < f(form.delivery_tier_2_max))
    delivery = f(form.delivery_tier_2_charge);
  else if (subtotal < f(form.delivery_tier_3_max))
    delivery = f(form.delivery_tier_3_charge);
  else delivery = f(form.delivery_tier_4_charge);

  // Km surcharge
  const extraKm = Math.max(0, distanceKm - f(form.free_km_radius));
  const kmRate =
    subtotal < f(form.per_km_tier_1_max)
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
  { label: "₹150 · 5 km", subtotal: 150, distanceKm: 5 },
  { label: "₹600 · 2 km", subtotal: 600, distanceKm: 2 },
  { label: "₹1500 · 8 km", subtotal: 1500, distanceKm: 8 },
  { label: "₹2500 · 1 km", subtotal: 2500, distanceKm: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LivePreview component
// ─────────────────────────────────────────────────────────────────────────────

const LivePreview = ({ form }) => {
  const [selected, setSelected] = useState(0);
  const ex = PREVIEW_EXAMPLES[selected];
  const p = computePreview(form, ex.subtotal, ex.distanceKm);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            See how charges apply to example orders
          </p>
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
          <PreviewPill
            label="Items subtotal"
            value={`₹${ex.subtotal.toFixed(2)}`}
          />
          <PreviewPill
            label="Service charge"
            value={`₹${p.service.toFixed(2)}`}
          />
          <PreviewPill
            label="Delivery fee"
            value={`₹${p.delivery.toFixed(2)}`}
          />
          <PreviewPill
            label={`Distance surcharge (${ex.distanceKm} km)`}
            value={
              p.kmSurcharge > 0
                ? `₹${p.kmSurcharge.toFixed(2)}`
                : "₹0 (within free radius)"
            }
          />
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#05015A] rounded-lg">
            <span className="text-xs font-semibold text-white/80">
              Grand Total
            </span>
            <span className="text-sm font-bold text-white">
              ₹{p.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;