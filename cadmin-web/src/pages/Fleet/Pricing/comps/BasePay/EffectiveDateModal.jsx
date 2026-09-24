// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/EffectiveDateModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/EffectiveDateModal.jsx
import { useState } from "react";
import { X, Zap, CalendarClock } from "lucide-react";
import StyledDateFilter from "../../../../../components/common/StyledDateFilter";

export default function EffectiveDateModal({ open, onClose, onConfirm, saving }) {
  const [mode, setMode] = useState("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [name, setName] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (mode === "scheduled" && !scheduledDate) return;
    onConfirm({
      is_immediate: mode === "immediate",
      effective_from: mode === "scheduled" ? new Date(scheduledDate).toISOString() : null,
      name: name || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Apply Pricing Changes</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            When would you like this new pricing configuration to take effect?
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMode("immediate")}
              className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all
                ${mode === "immediate" ? "border-[#05015A] bg-[#05015A]/5" : "border-gray-200 hover:border-gray-300"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                ${mode === "immediate" ? "bg-[#05015A]" : "bg-gray-100"}`}>
                <Zap size={16} className={mode === "immediate" ? "text-white" : "text-gray-500"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Apply Immediately</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Archive the current active version and make this new pricing live for all new deliveries.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("scheduled")}
              className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all
                ${mode === "scheduled" ? "border-[#05015A] bg-[#05015A]/5" : "border-gray-200 hover:border-gray-300"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                ${mode === "scheduled" ? "bg-[#05015A]" : "bg-gray-100"}`}>
                <CalendarClock size={16} className={mode === "scheduled" ? "text-white" : "text-gray-500"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Schedule for Later</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Save now and automatically activate on a future date.
                </p>
              </div>
            </button>
          </div>

          {mode === "scheduled" && (
            <div>
              <StyledDateFilter
                label="Effective From Date"
                date={scheduledDate}
                setDate={setScheduledDate}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              Version Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali Season Rates"
              maxLength={100}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200
                       hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || (mode === "scheduled" && !scheduledDate)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#05015A] hover:bg-[#05015A]/90
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : mode === "immediate" ? "Activate Now" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}