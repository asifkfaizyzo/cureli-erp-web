// cadmin-web/src/pages/marketplace/Shops/comps/ShopBranchesTab.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/ShopBranchesTab.jsx

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Truck,
  Package,
  ShieldOff,
  Settings,
} from "lucide-react";
import BranchMarketplaceModal from "./BranchMarketplaceModal";

const isLinked = (branch) => !!branch.marketplaceSettings;
const isEnabled = (branch) =>
  branch.marketplaceSettings?.marketplace_enabled === true;

const BranchCard = ({ branch, shop, onUpdated }) => {
  const [showModal, setShowModal] = useState(false);
  const ms = branch.marketplaceSettings;

  return (
    <>
      <div
        className={`relative group p-4 rounded-lg border transition-all ${
          !branch.is_active
            ? "bg-gray-50 border-gray-200 opacity-60"
            : isEnabled(branch)
            ? "bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-sm"
            : isLinked(branch)
            ? "bg-white border-amber-200 hover:border-amber-300 hover:shadow-sm"
            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isEnabled(branch)
              ? "bg-emerald-50"
              : isLinked(branch)
              ? "bg-amber-50"
              : "bg-gray-100"
          }`}>
            <Building2
              size={18}
              className={
                isEnabled(branch)
                  ? "text-emerald-600"
                  : isLinked(branch)
                  ? "text-amber-600"
                  : "text-gray-400"
              }
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-gray-900 text-sm">
                {branch.branch_name}
              </span>
              {branch.branch_type === "main" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#05015A] text-white">
                  MAIN
                </span>
              )}
              {!branch.is_active && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                  <ShieldOff size={9} />
                  Blocked
                </span>
              )}
            </div>

            {/* Status */}
            <div className="mb-2">
              {!isLinked(branch) ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  <XCircle size={10} />
                  Not Linked
                </span>
              ) : isEnabled(branch) ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={10} />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={10} />
                  Linked · Disabled
                </span>
              )}
            </div>

            {/* Location */}
            {ms?.formatted_address ? (
              <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-2">
                <MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{ms.formatted_address}</span>
              </div>
            ) : branch.city ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                <span>
                  {branch.city}{branch.state ? `, ${branch.state}` : ""}
                </span>
              </div>
            ) : null}

            {/* Marketplace meta */}
            {isLinked(branch) && (
              <div className="flex items-center gap-3 flex-wrap">
                {ms.pickup_enabled && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Package size={11} className="text-gray-400" />
                    Pickup
                  </span>
                )}
                {ms.delivery_enabled && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Truck size={11} className="text-gray-400" />
                    Delivery
                  </span>
                )}
                {ms.is_24_hours ? (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock size={11} className="text-gray-400" />
                    24h
                  </span>
                ) : ms.opening_time && ms.closing_time ? (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock size={11} className="text-gray-400" />
                    {ms.opening_time} – {ms.closing_time}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showModal && (
        <BranchMarketplaceModal
          branch={branch}
          shop={shop}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
};

const ShopBranchesTab = ({ branches = [], shop, onUpdated }) => {
  const linked = branches.filter((b) => isLinked(b));
  const unlinked = branches.filter((b) => !isLinked(b));
  const live = branches.filter(isEnabled);

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 font-medium">No branches found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: branches.length, color: "bg-gray-100 text-gray-700" },
          { label: "Linked", value: linked.length, color: "bg-amber-50 text-amber-700" },
          { label: "Live", value: live.length, color: "bg-emerald-50 text-emerald-700" },
          { label: "Not Linked", value: unlinked.length, color: "bg-gray-100 text-gray-500" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-lg p-3 text-center border border-gray-200`}>
            <p className="text-2xl font-bold leading-none">{s.value}</p>
            <p className="text-[10px] font-medium opacity-70 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Branches grid */}
      <div className="space-y-4">
        {linked.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Linked to Marketplace ({linked.length})
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {linked.map((branch) => (
                <BranchCard
                  key={branch.branch_id}
                  branch={branch}
                  shop={shop}
                  onUpdated={onUpdated}
                />
              ))}
            </div>
          </div>
        )}

        {unlinked.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Not Linked ({unlinked.length})
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {unlinked.map((branch) => (
                <BranchCard
                  key={branch.branch_id}
                  branch={branch}
                  shop={shop}
                  onUpdated={onUpdated}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopBranchesTab;