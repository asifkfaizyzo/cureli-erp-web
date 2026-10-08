// pharmacy-web/src/pages/marketplace-reports/MarketplaceReportsPage.jsx (do not remove this comment)
// src/pages/marketplace-reports/MarketplaceReportsPage.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PieChart } from "lucide-react";

import ReportTabBar, { REPORT_TABS } from "./components/ReportTabBar";
import SalesRevenueTab from "./components/tabs/SalesRevenueTab";
import PipelineFunnelTab from "./components/tabs/PipelineFunnelTab";
import PrescriptionsTab from "./components/tabs/PrescriptionsTab";
import CatalogHealthTab from "./components/tabs/CatalogHealthTab";
import RevenueLeakageTab from "./components/tabs/RevenueLeakageTab";
import FulfillmentSpeedTab from "./components/tabs/FulfillmentSpeedTab";
import EarningsTrendTab from "./components/tabs/EarningsTrendTab";

import BankingPendingBanner from "../../components/common/BankingPendingBanner";
import { useMarketplaceStore } from "../../store/useMarketplaceStore";
import { useAuthStore, selectIsSuperAdmin } from "../../store/useAuthStore";

const MarketplaceReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const banking = useMarketplaceStore((s) => s.banking);
  const isStatusLoaded = useMarketplaceStore((s) => s.isStatusLoaded);
  const isStatusLoading = useMarketplaceStore((s) => s.isStatusLoading);
  const loadStatus = useMarketplaceStore((s) => s.loadStatus);

  useEffect(() => {
    if (!isStatusLoaded && !isStatusLoading) loadStatus();
  }, [isStatusLoaded, isStatusLoading, loadStatus]);

  const urlTab = searchParams.get("tab");
  const initialTab = REPORT_TABS.some((t) => t.id === urlTab) ? urlTab : "sales";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const bankingPending = isSuperAdmin && !banking.bank_account_holder;

  return (
    <div className="h-screen flex flex-col bg-[#010015] overflow-hidden text-white">
      {/* ── Sticky Top Header ── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-white/[0.08] bg-[#010015] z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center flex-shrink-0">
            <PieChart size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Marketplace Reports & Analytics
            </h1>
            <p className="text-[11px] text-white/50 mt-0.5">
              Comprehensive telemetry across sales performance, fulfillment speeds, conversion funnels, and revenue leakage
            </p>
          </div>
        </div>
      </div>

      {bankingPending && (
        <div className="flex-shrink-0 px-6 pt-3">
          <BankingPendingBanner onAction={() => navigate("/marketplace/storefront")} />
        </div>
      )}

      {/* ── Sticky Sub-tab Navigation ── */}
      <div className="flex-shrink-0 bg-[#010015] z-10">
        <ReportTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* ── Active Tab View ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === "sales" && <SalesRevenueTab />}
        {activeTab === "pipeline" && <PipelineFunnelTab />}
        {activeTab === "prescriptions" && <PrescriptionsTab />}
        {activeTab === "catalog" && <CatalogHealthTab />}
        {activeTab === "leakage" && <RevenueLeakageTab />}
        {activeTab === "speed" && <FulfillmentSpeedTab />}
        {activeTab === "earnings" && <EarningsTrendTab />}
      </div>
    </div>
  );
};

export default MarketplaceReportsPage;