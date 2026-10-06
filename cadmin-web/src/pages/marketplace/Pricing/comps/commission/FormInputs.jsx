// cadmin-web/src/pages/marketplace/Pricing/comps/commission/FormInputs.jsx (do not remove this comment)

import {
  Info,
  Percent,
  IndianRupee,
  Plus,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export function fmt(val) {
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

export function fmtDate(dateStr) {
  if (!dateStr) return "No end date";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────
// COMMISSION TYPE DEFINITIONS
// ─────────────────────────────────────────────

export const COMMISSION_TYPES = [
  {
    value: "FLAT_PERCENT",
    label: "Flat Percentage",
    icon: Percent,
    example: "18% of ₹500 = ₹90",
    description:
      "Cureli collects a fixed percentage of every order's medicine subtotal. This is the industry-standard model for marketplace operations.",
    bestFor: "Simple, predictable system setup. Best for most standard pharmacies.",
  },
  {
    value: "FLAT_AMOUNT",
    label: "Flat Amount Per Order",
    icon: IndianRupee,
    example: "₹15 per order (any size)",
    description:
      "Cureli takes a fixed rupee amount from every order, regardless of transaction scale.",
    bestFor: "When you want consistent per-order processing fees.",
  },
  {
    value: "HYBRID",
    label: "Hybrid (% + Flat)",
    icon: Plus,
    example: "12% + ₹5 on ₹500 = ₹65",
    description:
      "A percentage combined with a fixed processing fee. Guarantees base platform revenue on smaller tickets.",
    bestFor: "Ensuring minimum baseline earnings on low-value transactions.",
  },
  {
    value: "CAPPED_PERCENT",
    label: "Capped Percentage",
    icon: ShieldCheck,
    example: "15% of ₹2000 = ₹150 (not ₹300)",
    description:
      "A percentage charge with a maximum ceiling cap per transaction. System fees never exceed this limit.",
    bestFor: "Protecting high-ticket orders from disproportionate platform fees.",
  },
];

// ─────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────

export const Section = ({ title, icon: Icon, description, children, accent }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div
      className={`flex items-center gap-3 px-5 py-3 border-b border-gray-100 ${
        accent ? "bg-[#05015A]/5" : "bg-gray-50"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          accent ? "bg-[#05015A]/15" : "bg-[#05015A]/8"
        }`}
      >
        <Icon size={16} className="text-[#05015A]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 flex-wrap">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

// ─────────────────────────────────────────────
// Info banner (multi-variant)
// ─────────────────────────────────────────────

export const InfoBanner = ({ children, variant = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    green: "bg-emerald-50 border-emerald-100 text-emerald-700",
    red: "bg-red-50 border-red-100 text-red-700",
  };
  const iconColors = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    green: "text-emerald-500",
    red: "text-red-500",
  };
  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 border rounded-xl ${colors[variant]}`}
    >
      <Info
        size={14}
        className={`${iconColors[variant]} mt-0.5 flex-shrink-0`}
      />
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Single field with optional prefix/suffix
// ─────────────────────────────────────────────

export const Field = ({
  label,
  hint,
  fieldKey,
  form,
  onChange,
  prefix,
  suffix,
  type = "number",
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
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
            type === "number" ? toNum(e.target.value) : e.target.value
          )
        }
        className={`w-full py-2 text-sm border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                    focus:border-[#05015A] transition-colors
                    ${prefix ? "pl-7" : "pl-3"} ${suffix ? "pr-12" : "pr-3"}`}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-400 text-xs pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Preview pill
// ─────────────────────────────────────────────

export const PreviewPill = ({ label, value }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-semibold text-[#05015A]">{value}</span>
  </div>
);

// ─────────────────────────────────────────────
// Commission type card (used in RuleModal)
// ─────────────────────────────────────────────

export const TypeCard = ({ type, selected, onClick }) => {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(type.value)}
      className={`text-left p-4 rounded-xl border-2 transition-all
        ${
          selected
            ? "border-[#05015A] bg-[#05015A]/5"
            : "border-gray-200 hover:border-gray-300 bg-white"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
          ${selected ? "bg-[#05015A] text-white" : "bg-gray-100 text-gray-500"}`}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              selected ? "text-[#05015A]" : "text-gray-700"
            }`}
          >
            {type.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {type.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              Sample charge: {type.example}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 italic">
            Best for: {type.bestFor}
          </p>
        </div>
      </div>
    </button>
  );
};