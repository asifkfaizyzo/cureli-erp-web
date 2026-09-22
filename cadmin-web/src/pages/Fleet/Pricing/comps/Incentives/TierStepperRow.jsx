// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/TierStepperRow.jsx
import { Trash2 } from "lucide-react";

export default function TierStepperRow({ tier, index, metricType, onChange, onRemove }) {
  const metricLabel = metricType === "ORDER_COUNT" ? "orders" : "₹ base earn.";
  const metricPrefix = metricType === "BASE_EARNINGS" ? "₹" : null;

  return (
    <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-[#05015A] flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-white">T{index + 1}</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 font-medium mb-0.5 block">Target ({metricLabel})</label>
          <div className="relative">
            {metricPrefix && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{metricPrefix}</span>
            )}
            <input
              type="number" min={1} step={metricType === "ORDER_COUNT" ? 1 : 10}
              value={tier.target_value}
              onChange={(e) => onChange(index, "target_value", parseFloat(e.target.value) || 0)}
              className={`w-full py-1.5 text-xs border border-gray-200 rounded
                          focus:outline-none focus:ring-1 focus:ring-[#05015A]/40 focus:border-[#05015A]
                          ${metricPrefix ? "pl-6 pr-2" : "px-2"}`}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-medium mb-0.5 block">Reward (₹)</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
            <input
              type="number" min={1} step={10}
              value={tier.reward_amount}
              onChange={(e) => onChange(index, "reward_amount", parseFloat(e.target.value) || 0)}
              className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded
                         focus:outline-none focus:ring-1 focus:ring-[#05015A]/40 focus:border-[#05015A]"
            />
          </div>
        </div>
      </div>

      <button type="button" onClick={() => onRemove(index)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}