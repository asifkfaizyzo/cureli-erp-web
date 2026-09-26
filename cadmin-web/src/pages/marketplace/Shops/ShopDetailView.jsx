// cadmin-web/src/pages/marketplace/Shops/ShopDetailView.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/ShopDetailView.jsx

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Store,
  Building2,
  Link2,
  Radio,
} from "lucide-react";
import ShopOverviewTab from "./comps/ShopOverviewTab";
import ShopBranchesTab from "./comps/ShopBranchesTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "branches", label: "Branches" },
];

const ShopDetailView = ({ shop, loading, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = useMemo(() => {
    const branches = shop?.branches || [];
    const linkedBranches = branches.filter((b) => !!b.marketplaceSettings).length;
    const liveBranches = branches.filter(
      (b) => b.marketplaceSettings?.marketplace_enabled === true
    ).length;

    return {
      totalBranches: branches.length,
      linkedBranches,
      liveBranches,
      linkageRate: branches.length > 0 
        ? Math.round((linkedBranches / branches.length) * 100) 
        : 0,
    };
  }, [shop]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#05015A] mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading shop details...</p>
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
  const mpStatusConfig = {
    LIVE: { label: "Live", color: "emerald" },
    DRAFT: { label: "Draft", color: "amber" },
    SUSPENDED: { label: "Suspended", color: "red" },
    NOT_STARTED: { label: "Not Started", color: "gray" },
  }[mpStatus] || { label: "—", color: "gray" };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ═══ COMPACT HEADER ═══ */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        {/* Top bar */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>All Shops</span>
          </button>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {/* Shop identity + stats row */}
        <div className="px-6 py-4 flex items-center gap-6">
          {/* Left: Shop info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#05015A] to-[#0a0280] flex items-center justify-center text-white text-base font-bold shadow">
                {initials}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                shop.is_active ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {shop.business_name}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500">
                  {shop.city || "—"}{shop.state ? `, ${shop.state}` : ""}
                </span>
                {shop.marketplaceProfile?.storefront_name && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400 truncate">
                      {shop.marketplaceProfile.storefront_name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                shop.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {shop.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {shop.is_active ? "Active" : "Blocked"}
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                mpStatusConfig.color === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                mpStatusConfig.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
                mpStatusConfig.color === "red" ? "bg-red-50 text-red-700 border-red-200" :
                "bg-gray-50 text-gray-600 border-gray-200"
              }`}>
                MP: {mpStatusConfig.label}
              </span>
            </div>
          </div>

          {/* Right: Mini stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <StatPill icon={Building2} label="Branches" value={stats.totalBranches} />
            <StatPill icon={Link2} label="Linked" value={stats.linkedBranches} color="amber" />
            <StatPill icon={Radio} label="Live" value={stats.liveBranches} color="emerald" />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex items-center gap-1 border-t border-gray-100">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-[#05015A]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.key === "branches" && shop.branches?.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === "branches"
                        ? "bg-[#05015A] text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
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

      {/* ═══ CONTENT - Full height ═══ */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini stat pill component
const StatPill = ({ icon: Icon, label, value, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors[color]}`}>
      <Icon size={14} />
      <div className="text-left">
        <p className="text-[10px] font-medium opacity-70 leading-none">{label}</p>
        <p className="text-sm font-bold leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default ShopDetailView;