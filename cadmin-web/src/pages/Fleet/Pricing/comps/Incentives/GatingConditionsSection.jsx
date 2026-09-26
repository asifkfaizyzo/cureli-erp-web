// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/GatingConditionsSection.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/GatingConditionsSection.jsx
import { Shield } from "lucide-react";

const CONDITIONS = [
  { key: "min_online_hours", label: "Minimum online hours", suffix: "hrs", max: 24, step: 0.5,
    hint: "Rider must be online for at least this many hours in the shift" },
  { key: "max_denial_count", label: "Maximum denials allowed", suffix: "denials", max: 100, step: 1,
    hint: "Denials = ignoring/rejecting order alerts on the rider app" },
  { key: "max_cancellation_count", label: "Maximum cancellations allowed", suffix: "cancels", max: 100, step: 1,
    hint: "Cancellations = accepting an order but cancelling mid-delivery" },
];

export default function GatingConditionsSection({ conditions, onChange }) {
  const toggle = (key, checked) => {
    if (checked) onChange(key, key.startsWith("min_online") ? 6 : 5);
    else onChange(key, null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-gray-500" />
        <p className="text-xs font-semibold text-gray-600">
          Qualifying Conditions <span className="text-gray-400 font-normal">(optional)</span>
        </p>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Only riders meeting ALL enabled conditions will receive the incentive reward.
      </p>

      <div className="space-y-2">
        {CONDITIONS.map((cond) => {
          const enabled = conditions[cond.key] !== null && conditions[cond.key] !== undefined;
          return (
            <div key={cond.key} className={`p-3 border rounded-lg transition-colors
              ${enabled ? "border-[#05015A]/30 bg-[#05015A]/3" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={enabled}
                      onChange={(e) => toggle(cond.key, e.target.checked)}
                      className="rounded border-gray-300 text-[#05015A] focus:ring-[#05015A]/20" />
                    <span className="text-xs font-medium text-gray-700">{cond.label}</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5 ml-6">{cond.hint}</p>
                </div>
                {enabled && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number" min={0} max={cond.max} step={cond.step}
                      value={conditions[cond.key]}
                      onChange={(e) => onChange(cond.key, parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-xs border border-gray-200 rounded
                                 focus:outline-none focus:ring-1 focus:ring-[#05015A]/40 focus:border-[#05015A]"
                    />
                    <span className="text-[10px] text-gray-500">{cond.suffix}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}