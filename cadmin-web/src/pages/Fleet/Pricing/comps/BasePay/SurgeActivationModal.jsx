// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/SurgeActivationModal.jsx
import { useState } from "react";
import { X, Zap } from "lucide-react";
import StyledSelect from "../../../../../components/common/StyledSelect";

const DURATION_OPTIONS = [
  { value: "", label: "Until manually disabled" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "360", label: "6 hours" },
  { value: "720", label: "12 hours" },
  { value: "1440", label: "24 hours" },
];

export default function SurgeActivationModal({ open, rule, onClose, onConfirm, saving }) {
  const [durationMinutes, setDurationMinutes] = useState("");

  if (!open || !rule) return null;

  const handleConfirm = () => {
    let expiresAt = null;
    if (durationMinutes) {
      const ms = Number(durationMinutes) * 60 * 1000;
      expiresAt = new Date(Date.now() + ms).toISOString();
    }
    onConfirm(rule, expiresAt);
  };

  const displayValue = rule.calc_type === "MULTIPLIER"
    ? `${rule.value}x multiplier`
    : `+₹${rule.value} flat`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Activate Surge</h3>
          </div>
          <button onClick={onClose} disabled={saving}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="px-3 py-2.5 bg-orange-50 border border-orange-100 rounded-lg">
            <p className="text-xs font-semibold text-gray-900">{rule.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{displayValue}</p>
          </div>

          <p className="text-xs text-gray-500">
            This will <span className="font-semibold text-orange-600">deactivate any currently active surge</span> and
            apply this rule to all new deliveries.
          </p>

          <StyledSelect
            label="Auto-Expire After"
            value={durationMinutes}
            onChange={setDurationMinutes}
            options={DURATION_OPTIONS}
          />

          {durationMinutes && (
            <p className="text-[10px] text-amber-600 -mt-2">
              Surge will auto-deactivate in{" "}
              {Number(durationMinutes) >= 60
                ? `${Number(durationMinutes) / 60} hour(s)`
                : `${durationMinutes} minute(s)`}.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={saving}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200
                       hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Activating..." : "Activate Now"}
          </button>
        </div>
      </div>
    </div>
  );
}