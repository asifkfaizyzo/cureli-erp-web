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
  Phone,
  CalendarDays,
  Globe,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import BranchMarketplaceModal from "./BranchMarketplaceModal";
import { toggleBranchMarketplaceVisibility } from "../../../../api/cadminMarketplaceShops";
import { resolveFileUrl } from "../../../../utils/resolveFileUrl";

const isLinked = (branch) => !!branch.marketplaceSettings;
const isEnabled = (branch) =>
  branch.marketplaceSettings?.marketplace_enabled === true;

const DAYS_MAP = {
  MON: "Mo",
  TUE: "Tu",
  WED: "We",
  THU: "Th",
  FRI: "Fr",
  SAT: "Sa",
  SUN: "Su",
};

const BranchCard = ({ branch, shop, onUpdated }) => {
  const [showModal, setShowModal] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleErr, setToggleErr] = useState("");
  const ms = branch.marketplaceSettings;
  const linked = isLinked(branch);
  const visible = isEnabled(branch);
  const shopIsLive = shop.marketplaceProfile?.is_live === true;

  const handleVisibilityToggle = async () => {
    if (!linked) return;
    setToggling(true);
    setToggleErr("");
    try {
      await toggleBranchMarketplaceVisibility(
        shop.shop_id,
        branch.branch_id,
        !visible,
      );
      onUpdated();
    } catch (err) {
      setToggleErr(
        err.response?.data?.message || "Failed to update branch visibility",
      );
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div
        className={`relative group p-4 rounded-xl border transition-all ${
          !branch.is_active
            ? "bg-gray-50 border-gray-200 opacity-60"
            : visible
              ? "bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-sm"
              : linked
                ? "bg-white border-orange-200 hover:border-orange-300 hover:shadow-sm"
                : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Branch Image / Fallback Icon */}
          <div className="relative flex-shrink-0">
            {ms?.shop_image_url ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={resolveFileUrl(ms.shop_image_url)}
                  alt={branch.branch_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  visible
                    ? "bg-emerald-50 text-emerald-600"
                    : linked
                      ? "bg-orange-50 text-orange-600"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <Building2 size={20} />
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            {/* Header row: Name + Tags */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-gray-900 text-sm truncate">
                {branch.branch_name}
              </span>
              {branch.branch_type === "main" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#05015A] text-white uppercase">
                  MAIN
                </span>
              )}
              {!branch.is_active && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                  <ShieldOff size={9} /> Blocked
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {!linked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                  <XCircle size={10} /> Not Linked
                </span>
              ) : visible ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Globe size={10} /> Visible on App
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  <EyeOff size={10} /> Hidden on App
                </span>
              )}

              {linked && ms.delivery_enabled && (
                <span className="text-[9px] font-bold text-[#05015A] bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                  {ms.delivery_mode === "SELF"
                    ? "Own Delivery"
                    : "Cureli Fleet"}
                </span>
              )}
            </div>

            {/* Location */}
            {ms?.formatted_address ? (
              <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1.5">
                <MapPin
                  size={12}
                  className="text-gray-400 flex-shrink-0 mt-0.5"
                />
                <span className="line-clamp-1">{ms.formatted_address}</span>
              </div>
            ) : branch.city ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                <span>
                  {branch.city}
                  {branch.state ? `, ${branch.state}` : ""}
                </span>
              </div>
            ) : null}

            {/* Phone (with override indicator) */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Phone size={12} className="text-gray-400 flex-shrink-0" />
              {ms?.contact_override ? (
                <span className="text-[#05015A] font-semibold">
                  {ms.contact_override} (Override)
                </span>
              ) : (
                <span>{branch.contact_number || "No contact number"}</span>
              )}
            </div>

            {/* Fulfillment & Schedule Meta */}
            {linked && (
              <div className="space-y-1.5 border-t border-gray-100 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {ms.pickup_enabled && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                      <Package size={11} className="text-gray-400" />
                      Pickup
                    </span>
                  )}
                  {ms.delivery_enabled && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                      <Truck size={11} className="text-gray-400" />
                      Delivery
                    </span>
                  )}
                  {ms.is_24_hours ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                      <Clock size={11} /> 24 Hours Open
                    </span>
                  ) : ms.opening_time && ms.closing_time ? (
                    <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <Clock size={11} className="text-gray-400" />
                      {ms.opening_time} – {ms.closing_time}
                    </span>
                  ) : null}
                </div>

                {/* Operating Days */}
                {ms.open_days && ms.open_days.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-wrap">
                    <CalendarDays size={11} className="text-gray-400" />
                    <span className="font-bold uppercase text-[9px] mr-1">
                      Days:
                    </span>
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                      (d) => {
                        const active = ms.open_days.includes(d);
                        return (
                          <span
                            key={d}
                            className={`px-1 rounded text-[8px] font-bold ${
                              active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-300 border border-transparent"
                            }`}
                          >
                            {DAYS_MAP[d]}
                          </span>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Auto open cron log */}
                {ms.last_auto_opened_date && (
                  <p className="text-[9px] text-gray-400">
                    Last auto-opened:{" "}
                    <span className="text-gray-600 font-semibold">
                      {ms.last_auto_opened_date}
                    </span>
                  </p>
                )}
              </div>
            )}

            {toggleErr && (
              <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-[11px] text-red-600">
                <AlertCircle size={11} className="flex-shrink-0" />
                <span>{toggleErr}</span>
              </div>
            )}
          </div>

          {/* Right Action Stack: Inline Toggle + Config Modal Button */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            {linked && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleVisibilityToggle}
                  disabled={
                    toggling || !branch.is_active || (!visible && !shopIsLive)
                  }
                  title={
                    !shopIsLive
                      ? "Shop is hidden — enable shop first"
                      : visible
                        ? "Click to hide branch from marketplace"
                        : "Click to make branch visible on marketplace"
                  }
                  className={`relative inline-flex items-center rounded-full transition-colors ${
                    visible ? "bg-emerald-500" : "bg-gray-300"
                  } ${
                    toggling || !branch.is_active || (!visible && !shopIsLive)
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  style={{ width: "36px", height: "20px" }}
                >
                  {toggling ? (
                    <Loader2
                      size={10}
                      className="animate-spin text-white absolute left-1/2 -translate-x-1/2"
                    />
                  ) : (
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                        visible ? "translate-x-[18px]" : "translate-x-[2px]"
                      }`}
                    />
                  )}
                </button>
                <span className="text-[9px] font-bold text-gray-400 uppercase">
                  {visible ? "Live" : "Hidden"}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowModal(true)}
              title="Configure Marketplace Settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-[#05015A] transition-colors border border-transparent hover:border-gray-200"
            >
              <Settings size={15} />
            </button>
          </div>
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
  const hidden = linked.length - live.length;

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 font-semibold">No branches found</p>
        <p className="text-xs text-gray-400 mt-1">
          Branches created in ERP will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Mini Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Branches",
            value: branches.length,
            color: "bg-gray-100 text-gray-800",
          },
          {
            label: "Linked",
            value: linked.length,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Visible on App",
            value: live.length,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Hidden on App",
            value: hidden,
            color: "bg-orange-50 text-orange-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.color} rounded-xl p-3 text-center border border-gray-200`}
          >
            <p className="text-2xl font-bold leading-none">{s.value}</p>
            <p className="text-[10px] font-bold opacity-70 mt-1 uppercase tracking-wide">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Linked Branches */}
      {linked.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Linked Branches ({linked.length})
            </h4>
            <p className="text-[11px] text-gray-400">
              Toggle the switch on each card to show/hide from customer app
            </p>
          </div>
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

      {/* Unlinked Branches */}
      {unlinked.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Not Linked ({unlinked.length})
            </h4>
            <p className="text-[11px] text-gray-400">
              Click the gear icon on a branch to configure location & timings
            </p>
          </div>
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
  );
};

export default ShopBranchesTab;
