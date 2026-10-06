// cadmin-web/src/pages/marketplace/Pricing/comps/delivery/FormInputs.jsx (do not remove this comment)

import { Info } from "lucide-react";

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
// Section wrapper — matches ProfileCard's Section pattern
// ─────────────────────────────────────────────────────────────────────────────

export const Section = ({ title, icon: Icon, description, children }) => (
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
// Toggle switch
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