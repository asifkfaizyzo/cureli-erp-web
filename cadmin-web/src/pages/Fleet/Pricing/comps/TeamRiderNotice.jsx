// cadmin-web/src/pages/Fleet/Pricing/comps/TeamRiderNotice.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/TeamRiderNotice.jsx
import { Info } from "lucide-react";

export default function TeamRiderNotice() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
      <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-amber-700 leading-relaxed">
        <span className="font-semibold">Independent Riders Only.</span>{" "}
        These settings apply exclusively to Independent riders. Cureli Team riders
        receive a fixed monthly payroll and are not affected by base pay, surge, or incentive configurations.
      </p>
    </div>
  );
}