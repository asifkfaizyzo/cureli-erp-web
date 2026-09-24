// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/LiveFarePreview.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/LiveFarePreview.jsx
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { simulatePricing } from "../../../../../api/cadminFleetPricing";

const PreviewPill = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-xs font-semibold ${highlight ? "text-emerald-600" : "text-[#05015A]"}`}>
      {value}
    </span>
  </div>
);

export default function LiveFarePreview({ form }) {
  const [pickupKm, setPickupKm] = useState(1.5);
  const [dropKm, setDropKm] = useState(4);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const payload = {
          pickup_distance_km: pickupKm,
          drop_distance_km: dropKm,
          min_floor_payout: Number(form.min_floor_payout) || 0,
          pickup_base_fee: Number(form.pickup_base_fee) || 0,
          drop_base_fee: Number(form.drop_base_fee) || 0,
          pickup_slabs: form.pickup_slabs || [],
          drop_slabs: form.drop_slabs || [],
        };
        const res = await simulatePricing(payload);
        setPreview(res.data.data);
      } catch (err) {
        console.error("preview error", err);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(run, 400);
    return () => clearTimeout(debounce);
  }, [pickupKm, dropKm, form]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 size={16} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Live Fare Preview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Test the fare model with sample distances</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Pickup km (Leg 1)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={pickupKm}
              onChange={(e) => setPickupKm(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Drop km (Leg 2)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={dropKm}
              onChange={(e) => setDropKm(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>
        </div>

        {loading && !preview ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#05015A]" />
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <PreviewPill label={`Leg 1: Pickup (${preview.pickup_distance_km} km)`} value={`₹${preview.pickup_fee.toFixed(2)}`} />
            <PreviewPill label={`Leg 2: Drop (${preview.drop_distance_km} km)`} value={`₹${preview.drop_fee.toFixed(2)}`} />
            {preview.surge_fee > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-xs text-orange-700 flex items-center gap-1">
                  <Zap size={11} /> Active surge bonus
                </span>
                <span className="text-xs font-semibold text-orange-700">+₹{preview.surge_fee.toFixed(2)}</span>
              </div>
            )}
            {preview.floor_topup_fee > 0 && (
              <PreviewPill
                label={`Floor guarantee top-up (min ₹${preview.min_floor_guarantee})`}
                value={`+₹${preview.floor_topup_fee.toFixed(2)}`}
                highlight
              />
            )}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#05015A] rounded-lg">
              <span className="text-xs font-semibold text-white/80">Rider Total Earning</span>
              <span className="text-sm font-bold text-white">₹{preview.total_rider_earning.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-gray-400 text-center pt-1">
              Total distance: {preview.total_distance_km} km
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}