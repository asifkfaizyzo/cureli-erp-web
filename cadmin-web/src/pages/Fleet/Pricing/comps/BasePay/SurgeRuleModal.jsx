// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/SurgeRuleModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/SurgeRuleModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import StyledSelect from "../../../../../components/common/StyledSelect";

const CALC_TYPE_OPTIONS = [
  { value: "MULTIPLIER", label: "Multiplier (e.g., 1.5x)" },
  { value: "FLAT_ADDITION", label: "Flat Addition (₹)" },
];

export default function SurgeRuleModal({ open, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    calc_type: "MULTIPLIER",
    value: 1.5,
  });

  if (!open) return null;

  const handleChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.value) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Create Surge Rule</h3>
          <button onClick={onClose} disabled={saving} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Monsoon Surge"
              maxLength={100}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>

          <StyledSelect
            label="Calculation Type"
            value={form.calc_type}
            onChange={(v) => handleChange("calc_type", v)}
            options={CALC_TYPE_OPTIONS}
          />

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              {form.calc_type === "MULTIPLIER" ? "Multiplier Value *" : "Flat Amount (₹) *"}
            </label>
            <input
              type="number"
              min={form.calc_type === "MULTIPLIER" ? 1 : 0}
              step={form.calc_type === "MULTIPLIER" ? 0.1 : 1}
              value={form.value}
              onChange={(e) => handleChange("value", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {form.calc_type === "MULTIPLIER"
                ? `e.g., 1.5 = 50% surge bonus applied on subtotal`
                : `e.g., 25 = flat ₹25 added to every delivery`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={saving}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200
                       hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.name.trim() || !form.value}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#05015A] hover:bg-[#05015A]/90
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Creating..." : "Create Surge Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}