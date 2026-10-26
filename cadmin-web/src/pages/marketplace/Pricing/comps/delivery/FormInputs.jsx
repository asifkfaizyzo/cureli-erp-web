// cadmin-web/src/pages/marketplace/Pricing/comps/delivery/FormInputs.jsx (do not remove this comment)

import { useState } from "react";
import { Info, ChevronDown, Trash2, Plus, AlertTriangle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export function fmt(val) {
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper — collapsible, with optional inline toggle switch in header
//
// Props:
//   - title, icon, description, children      (same as before)
//   - defaultOpen (bool, default: true)       initial collapse state
//   - collapsible (bool, default: true)       whether header is clickable to collapse
//   - toggleField (string, optional)          field key for inline enable/disable toggle
//   - form, onChange                          only needed when toggleField is provided
//   - disabled (bool, optional)               when true, body is dimmed + inputs disabled visually
// ─────────────────────────────────────────────────────────────────────────────

export const Section = ({
  title,
  icon: Icon,
  description,
  children,
  defaultOpen = true,
  collapsible = true,
  toggleField = null,
  form = null,
  onChange = null,
  disabled = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggleOn = toggleField && form ? !!form[toggleField] : null;
  const bodyDisabled = disabled || (toggleField && !toggleOn);

  const handleHeaderClick = () => {
    if (collapsible) setOpen((o) => !o);
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (toggleField && onChange) {
      onChange(toggleField, !toggleOn);
      // Auto-expand when enabling, auto-collapse when disabling
      setOpen(!toggleOn);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        onClick={handleHeaderClick}
        className={`flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 ${
          collapsible ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
        } ${!open ? "border-b-0" : ""}`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            bodyDisabled ? "bg-gray-200" : "bg-[#05015A]/8"
          }`}
        >
          <Icon
            size={16}
            className={bodyDisabled ? "text-gray-400" : "text-[#05015A]"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-semibold ${
                bodyDisabled ? "text-gray-400" : "text-gray-700"
              }`}
            >
              {title}
            </h3>
            {toggleField && !toggleOn && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded">
                Disabled
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Inline toggle switch */}
        {toggleField && (
          <button
            type="button"
            onClick={handleToggleClick}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                        focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                        ${toggleOn ? "bg-[#05015A]" : "bg-gray-300"}`}
            title={toggleOn ? "Disable this charge" : "Enable this charge"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
                          transition-transform ${toggleOn ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        )}

        {/* Collapse chevron */}
        {collapsible && (
          <ChevronDown
            size={16}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {open && (
        <div
          className={`p-5 space-y-4 transition-opacity ${
            bodyDisabled ? "opacity-50 pointer-events-none select-none" : ""
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier row — label + two inputs (threshold + charge)
// ─────────────────────────────────────────────────────────────────────────────

export const TierRow = ({
  label,
  thresholdLabel,
  thresholdKey,
  chargeKey,
  form,
  onChange,
  hideThreshold = false,
}) => (
  <div className="flex items-center gap-3">
    <div className="w-36 flex-shrink-0">
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </div>
    {!hideThreshold && (
      <div className="flex-1">
        <label className="block text-xs text-gray-400 mb-1">
          {thresholdLabel ?? "Up to (₹)"}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ₹
          </span>
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
          ₹
        </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Single field with optional prefix/suffix
// ─────────────────────────────────────────────────────────────────────────────

export const Field = ({
  label,
  hint,
  fieldKey,
  form,
  onChange,
  prefix,
  suffix,
  type = "number",
  optional = false,
}) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {optional && <span className="text-xs text-gray-400">(optional)</span>}
    </div>
    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-gray-400 text-xs pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        min={0}
        value={fmt(form[fieldKey] ?? "")}
        onChange={(e) =>
          onChange(
            fieldKey,
            type === "number" ? toNum(e.target.value) : e.target.value,
          )
        }
        placeholder={optional ? "Leave blank for unlimited" : ""}
        className={`w-full py-2 text-sm border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                    focus:border-[#05015A] transition-colors
                    ${prefix ? "pl-7" : "pl-3"}
                    ${suffix ? "pr-12" : "pr-3"}`}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-400 text-xs pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Toggle switch (standalone — for things like tip_enabled)
// ─────────────────────────────────────────────────────────────────────────────

export const Toggle = ({ label, hint, fieldKey, form, onChange }) => (
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

// ─────────────────────────────────────────────────────────────────────────────
// Inline info banner
// ─────────────────────────────────────────────────────────────────────────────

export const InfoBanner = ({ children }) => (
  <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
    <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-blue-700 leading-relaxed">{children}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

export const SkeletonSection = () => (
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
// Delivery Tier validation — monotonicity guard (soft warning, mirrors the
// hard block enforced server-side in cadminPricing.service.js). Shown live
// in the admin UI so non-technical staff see the problem before saving.
// ─────────────────────────────────────────────────────────────────────────────

export function validateDeliveryTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) return [];

  const sorted = [...tiers].sort(
    (a, b) => (Number(a.min_order_value) || 0) - (Number(b.min_order_value) || 0),
  );

  const warnings = [];

  if (Number(sorted[0].min_order_value) !== 0) {
    warnings.push("The lowest tier must start at ₹0 order value.");
  }

  const seen = new Set();
  for (const t of sorted) {
    const mv = Number(t.min_order_value) || 0;
    if (seen.has(mv)) {
      warnings.push(
        `Duplicate tier threshold: ₹${mv}. Each tier must have a unique order value.`,
      );
    }
    seen.add(mv);
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevMin = Number(prev.min_order_value) || 0;
    const currMin = Number(curr.min_order_value) || 0;

    if (Number(curr.flat_charge) > Number(prev.flat_charge)) {
      warnings.push(
        `₹${currMin}+ tier: flat fee (₹${curr.flat_charge}) cannot be higher than the ₹${prevMin}+ tier (₹${prev.flat_charge}). Bigger orders should cost the same or less.`,
      );
    }
    if (Number(curr.free_radius_km) < Number(prev.free_radius_km)) {
      warnings.push(
        `₹${currMin}+ tier: free distance (${curr.free_radius_km}km) cannot be smaller than the ₹${prevMin}+ tier (${prev.free_radius_km}km). Bigger orders should get the same or more free distance.`,
      );
    }
    if (Number(curr.per_km_rate) > Number(prev.per_km_rate)) {
      warnings.push(
        `₹${currMin}+ tier: per-km rate (₹${curr.per_km_rate}/km) cannot be higher than the ₹${prevMin}+ tier (₹${prev.per_km_rate}/km). Bigger orders should pay the same or less per km.`,
      );
    }
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Tier Editor — dynamic, unlimited-tier table.
// Replaces the old fixed 4-tier "Base Delivery Fee" + separate
// "Distance Surcharge Rate" section with ONE merged, per-tier structure:
// { min_order_value, flat_charge, free_radius_km, per_km_rate }
// ─────────────────────────────────────────────────────────────────────────────

export const DeliveryTierEditor = ({ tiers, onChange }) => {
  const safeTiers =
    Array.isArray(tiers) && tiers.length > 0
      ? tiers
      : [{ min_order_value: 0, flat_charge: 60, free_radius_km: 3, per_km_rate: 15 }];

  const lowestMin = Math.min(
    ...safeTiers.map((t) => Number(t.min_order_value) || 0),
  );

  const warnings = validateDeliveryTiers(safeTiers);

  const handleFieldChange = (index, field, value) => {
    const updated = [...safeTiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    const last = safeTiers[safeTiers.length - 1];
    const newTier = {
      min_order_value: last ? Number(last.min_order_value) + 500 : 0,
      flat_charge: last ? Math.max(0, Number(last.flat_charge) - 10) : 50,
      free_radius_km: last ? Number(last.free_radius_km) : 3,
      per_km_rate: last ? Number(last.per_km_rate) : 15,
    };
    onChange([...safeTiers, newTier]);
  };

  const handleRemove = (index) => {
    if (safeTiers.length <= 1) return; // must keep at least one tier
    onChange(safeTiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-gray-100 rounded-lg">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-3">Order value from</th>
              <th className="p-3">Flat delivery fee</th>
              <th className="p-3">Free distance</th>
              <th className="p-3">Rate beyond free distance</th>
              <th className="p-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {safeTiers.map((t, index) => {
              const isBaseTier = Number(t.min_order_value) === lowestMin;
              return (
                <tr key={index} className="text-xs hover:bg-gray-50/50">
                  <td className="p-2">
                    {isBaseTier ? (
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-500 font-semibold text-center">
                        ₹0 (Base tier — all orders)
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={fmt(t.min_order_value)}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "min_order_value",
                              toNum(e.target.value),
                            )
                          }
                          className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={fmt(t.flat_charge)}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "flat_charge",
                            toNum(e.target.value),
                          )
                        }
                        className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={fmt(t.free_radius_km)}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "free_radius_km",
                            toNum(e.target.value),
                          )
                        }
                        className="w-full pl-2 pr-8 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        km
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={fmt(t.per_km_rate)}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "per_km_rate",
                            toNum(e.target.value),
                          )
                        }
                        className="w-full pl-6 pr-10 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        /km
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    {!isBaseTier && safeTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Remove this tier"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                   text-[#05015A] hover:bg-[#05015A]/5 rounded-lg border border-dashed border-gray-300 transition-colors"
      >
        <Plus size={14} /> Add Another Tier
      </button>

      {warnings.length > 0 && (
        <div className="space-y-1.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          {warnings.map((w, i) => (
            <p
              key={i}
              className="text-[11px] text-red-700 font-medium leading-relaxed flex items-start gap-1.5"
            >
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};