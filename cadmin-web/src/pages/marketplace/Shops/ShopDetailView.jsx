// cadmin-web/src/pages/marketplace/Shops/ShopDetailView.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/ShopDetailView.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Link2,
  Radio,
  Globe,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import ShopOverviewTab from "./comps/ShopOverviewTab";
import ShopBranchesTab from "./comps/ShopBranchesTab";
import ShopHolidaysTab from "./comps/ShopHolidaysTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "branches", label: "Branches" },
  { key: "holidays", label: "Holidays" },
];

const ShopDetailView = ({ shop, loading, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const branches = shop?.branches || [];
    const linked = branches.filter((b) => !!b.marketplaceSettings).length;
    const live = branches.filter(
      (b) => b.marketplaceSettings?.marketplace_enabled === true,
    ).length;
    return { totalBranches: branches.length, linked, live };
  }, [shop]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-[#05015A] mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 font-medium">
            Loading shop details...
          </p>
        </div>
      </div>
    );
  }

  if (!shop) return null;

  const initials =
    shop.business_name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  const mpStatus = shop.marketplaceProfile?.marketplace_status;
  const isLive = shop.marketplaceProfile?.is_live;
  const isVerified = mpStatus === "LIVE";

  const mpStatusConfig = {
    LIVE: { label: "Verified", color: "emerald" },
    DRAFT: { label: "Draft", color: "amber" },
    SUSPENDED: { label: "Suspended", color: "red" },
    NOT_STARTED: { label: "Not Started", color: "gray" },
  }[mpStatus] || { label: "—", color: "gray" };

  const statusColors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        {/* Top bar */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>All Shops</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Link to main shop management page */}
            <button
              onClick={() =>
                navigate(
                  `/shops?search=${encodeURIComponent(shop.business_name)}`,
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <ExternalLink size={12} />
              Manage Shop
            </button>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* Shop identity + stats row */}
        <div className="px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#05015A] to-[#0a0280] flex items-center justify-center text-white text-base font-bold shadow">
                {initials}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {shop.business_name}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500">
                  {shop.city || "—"}
                  {shop.state ? `, ${shop.state}` : ""}
                </span>
                {shop.marketplaceProfile?.storefront_name && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400 truncate font-semibold">
                      {shop.marketplaceProfile.storefront_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status badges — marketplace only, no Active/Blocked */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[mpStatusConfig.color]}`}
              >
                {isVerified ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <XCircle size={11} />
                )}
                MP: {mpStatusConfig.label}
              </span>

              {isVerified &&
                (isLive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <Globe size={11} /> Visible on App
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 border border-orange-200 text-orange-600">
                    <EyeOff size={11} /> Hidden on App
                  </span>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <StatPill
              icon={Building2}
              label="Branches"
              value={stats.totalBranches}
            />
            <StatPill
              icon={Link2}
              label="Linked"
              value={stats.linked}
              color="amber"
            />
            <StatPill
              icon={Radio}
              label="Live"
              value={stats.live}
              color="emerald"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex items-center gap-1 border-t border-gray-100">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key ? "text-[#05015A]" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.key === "branches" && shop.branches?.length > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "branches" ? "bg-[#05015A] text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      {shop.branches.length}
                    </span>
                  )}
                </span>
                {activeTab === tab.key && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#05015A]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6">
            {activeTab === "overview" && (
              <ShopOverviewTab shop={shop} onUpdated={onRefresh} />
            )}
            {activeTab === "branches" && (
              <ShopBranchesTab
                branches={shop.branches || []}
                shop={shop}
                onUpdated={onRefresh}
              />
            )}
            {activeTab === "holidays" && (
              <ShopHolidaysTab shop={shop} onUpdated={onRefresh} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({ icon: Icon, label, value, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors[color]}`}
    >
      <Icon size={14} />
      <div className="text-left">
        <p className="text-[10px] font-semibold opacity-70 leading-none">
          {label}
        </p>
        <p className="text-sm font-bold leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default ShopDetailView;
