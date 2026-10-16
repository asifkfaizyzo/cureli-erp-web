// cadmin-web/src/pages/marketplace/Orders/comps/panels/delivery/RiderAssignList.jsx (do not remove this comment)
import { useEffect, useRef } from "react";
import {
  Truck,
  RefreshCw,
  Search,
  Loader2,
  Navigation,
  Coins,
} from "lucide-react";
import { SectionTitle } from "./deliveryMapConstants";

// ─────────────────────────────────────────────
// RIDER LIST (40% WIDTH) — Rider Assignment view only
// ─────────────────────────────────────────────

const RiderAssignList = ({
  riders,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onRiderSelect,
  selectedRider,
  onAssign,
  assigningId,
  loading,
  onRefresh,
}) => {
  const listContainerRef = useRef(null);

  useEffect(() => {
    if (selectedRider && listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector(
        `[data-rider-id="${selectedRider.rider_id}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedRider]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm flex flex-col h-full min-h-[350px] lg:min-h-0">
      <SectionTitle
        icon={Truck}
        title="Assign Partner"
        action={
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh Rider List"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />

      {/* Search & Filter Header */}
      <div className="space-y-2 mt-1 mb-4 flex-shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search partners by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTypeFilter("TEAM")}
            className={`flex-1 py-1.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all text-center ${
              typeFilter === "TEAM"
                ? "bg-white text-[#05015A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Fixed (Team)
          </button>
          <button
            onClick={() => setTypeFilter("INDEPENDENT")}
            className={`flex-1 py-1.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all text-center ${
              typeFilter === "INDEPENDENT"
                ? "bg-white text-[#05015A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Independent
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#05015A] mb-2" />
            <p className="text-xs text-gray-400 font-medium">
              Scanning logistics grid...
            </p>
          </div>
        ) : riders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
            <Search size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">
              No active drivers found
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Check spelling or online statuses.
            </p>
          </div>
        ) : (
          riders.map((rider) => {
            const isBusy = rider.has_active_delivery || !rider.is_online;
            const isSelected = selectedRider?.rider_id === rider.rider_id;

            return (
              <div
                key={rider.rider_id}
                data-rider-id={rider.rider_id}
                onClick={() => onRiderSelect(rider)}
                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isBusy
                    ? "bg-gray-50/50 border-gray-100 opacity-60 pointer-events-none"
                    : isSelected
                      ? "bg-[#05015A]/[0.02] border-[#05015A]/40 shadow-sm"
                      : "bg-white border-gray-100 hover:border-[#05015A]/25"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 truncate">
                        {rider.full_name}
                      </h4>
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          rider.is_online
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {rider.phone}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2 font-semibold">
                    {rider.distance_to_pharmacy_km != null ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px]">
                        <Navigation size={9} />
                        {rider.is_estimate ? "~" : ""}
                        {rider.distance_to_pharmacy_km} km
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        GPS missing
                      </span>
                    )}

                    {rider.has_active_delivery ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] uppercase tracking-wider">
                        Busy
                      </span>
                    ) : (
                      rider.is_online && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider">
                          Ready
                        </span>
                      )
                    )}
                  </div>

                  {rider.rider_type === "INDEPENDENT" &&
                    rider.estimated_earning && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 px-2 py-1 rounded-md">
                        <Coins
                          size={11}
                          className="text-emerald-600 flex-shrink-0"
                        />
                        <span>
                          ₹{rider.estimated_earning.total_earning.toFixed(2)}{" "}
                          est.
                        </span>
                        <span className="text-emerald-600/80 font-medium text-[9px] ml-0.5">
                          (₹{rider.estimated_earning.base_earning.toFixed(2)}{" "}
                          base
                          {rider.estimated_earning.surge_fee > 0
                            ? ` · +₹${rider.estimated_earning.surge_fee} surge`
                            : ""}
                          {rider.estimated_earning.tip_amount > 0
                            ? ` · +₹${rider.estimated_earning.tip_amount} tip`
                            : ""}
                          )
                        </span>
                      </div>
                    )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(rider.rider_id, rider.full_name);
                  }}
                  disabled={isBusy || assigningId != null}
                  className="flex-shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#05015A] text-white hover:bg-[#05015A]/90 disabled:bg-gray-100 disabled:text-gray-400 inline-flex items-center gap-1 transition-all"
                >
                  {assigningId === rider.rider_id ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Truck size={10} />
                  )}
                  Assign
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RiderAssignList;