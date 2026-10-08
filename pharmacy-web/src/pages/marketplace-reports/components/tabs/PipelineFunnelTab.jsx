// pharmacy-web/src/pages/marketplace-reports/components/tabs/PipelineFunnelTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/PipelineFunnelTab.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Filter, CheckCircle2, AlertOctagon, XCircle, ChevronRight } from "lucide-react";
import reportsAPI from "../../../../api/reports";
import inventoryAPI from "../../../../api/inventory";
import { useToast } from "../../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../../store/useAuthStore";
import MarketplaceReportLayout from "../shared/MarketplaceReportLayout";
import MarketplaceFiltersBar from "../shared/MarketplaceFiltersBar";
import MarketplaceStatCard from "../shared/MarketplaceStatCard";
import MarketplaceReportTable from "../shared/MarketplaceReportTable";

const defaultFilters = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    branchId: "",
  };
};

const STAGE_CONFIG = {
  PLACED: { label: "1. Placed by Customer", barColor: "bg-blue-500", text: "text-blue-400" },
  ACCEPTED: { label: "2. Accepted & In Billed Queue", barColor: "bg-indigo-500", text: "text-indigo-400" },
  READY_FOR_PICKUP: { label: "3. Packed & Ready For Pickup", barColor: "bg-purple-500", text: "text-purple-400" },
  COMPLETED: { label: "4. Delivered & Settled", barColor: "bg-emerald-500", text: "text-emerald-400" },
  REJECTED: { label: "Rejected by Pharmacy", barColor: "bg-rose-500", text: "text-rose-400" },
  CANCELLED: { label: "Cancelled Drop-off", barColor: "bg-amber-500", text: "text-amber-400" },
};

const BRANCH_COLUMNS = [
  { key: "branch_name", label: "Branch Storefront" },
  { key: "total_orders", label: "Routed", align: "center" },
  { key: "accepted_count", label: "Accepted", align: "center" },
  {
    key: "rejected_count",
    label: "Rejected",
    align: "center",
    render: (v) => <span className={v > 0 ? "text-rose-400 font-semibold" : "text-white/40"}>{v}</span>,
  },
  {
    key: "cancelled_count",
    label: "Cancelled",
    align: "center",
    render: (v) => <span className={v > 0 ? "text-amber-400 font-semibold" : "text-white/40"}>{v}</span>,
  },
  {
    key: "acceptance_rate",
    label: "Acceptance Rate %",
    align: "right",
    render: (v) => {
      const isHigh = v >= 85;
      const isMed = v >= 60 && v < 85;
      return (
        <span className={`font-bold ${isHigh ? "text-emerald-400" : isMed ? "text-amber-400" : "text-rose-400"}`}>
          {v}%
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_orders", label: "Total Orders" },
  { key: "accepted_count", label: "Accepted Count" },
  { key: "rejected_count", label: "Rejected Count" },
  { key: "cancelled_count", label: "Cancelled Count" },
  { key: "acceptance_rate", label: "Acceptance Rate %" },
];

const PipelineFunnelTab = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [funnelData, setFunnelData] = useState(null);
  const [rateData, setRateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await inventoryAPI.getFacets();
        if (res?.success && res.data?.branches) {
          setBranches(res.data.branches.map((b) => ({ value: b.branch_id, label: b.branch_name })));
        }
      } catch (err) {
        console.error("Facets error:", err);
      }
    };
    fetchMetadata();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fRes, rRes] = await Promise.all([
        reportsAPI.getOrderStatusFunnel(filters),
        reportsAPI.getAcceptanceRate(filters),
      ]);
      setFunnelData(fRes.data);
      setRateData(rRes.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load pipeline funnel");
    } finally {
      setIsLoading(false);
    }
  }, [filters, branchContext]); // eslint-disable-line

  useEffect(() => {
    loadData();
  }, [branchContext, loadData]);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleReset = () => setFilters(defaultFilters());

  const filterConfig = [
    { key: "startDate", label: "From", type: "date" },
    { key: "endDate", label: "To", type: "date" },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const sm = rateData?.summary;
  const completedStage = funnelData?.funnel?.find((s) => s.status === "COMPLETED");

  return (
    <MarketplaceReportLayout
      title="Pipeline & Conversion Funnel"
      subtitle="Monitor order transition flow, drops at each fulfillment milestone, and branch response rates"
      icon={Filter}
      exportData={rateData?.branch_breakdown || []}
      exportFilename="marketplace_order_funnel"
      exportColumns={EXPORT_COLUMNS}
      filterBar={
        <MarketplaceFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
      }
      statCards={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MarketplaceStatCard
            label="Inflow Orders"
            value={funnelData?.total_orders ?? "—"}
            subValue="Orders received in window"
            color="indigo"
            icon={Filter}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Acceptance Reliability"
            value={sm ? `${sm.acceptance_rate}%` : "—"}
            subValue={sm ? `${sm.accepted_count} accepted` : "—"}
            color="emerald"
            icon={CheckCircle2}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Rejection Rate"
            value={sm ? `${sm.rejection_rate}%` : "—"}
            subValue={sm ? `${sm.rejected_count} shop declined` : "—"}
            color="rose"
            icon={XCircle}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Completion Rate"
            value={completedStage ? `${completedStage.percentage}%` : "—"}
            subValue={completedStage ? `${completedStage.count} fulfilled` : "—"}
            color="cyan"
            icon={AlertOctagon}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Consolidated Funnel Visual Bars */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.01] p-5 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-4">
            Consolidated Milestone Funnel
          </h3>

          <div className="space-y-4 flex-1">
            {funnelData?.funnel?.map((item) => {
              const conf = STAGE_CONFIG[item.status] || {
                label: item.status,
                barColor: "bg-indigo-400",
                text: "text-white/70",
              };
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60 font-medium">{conf.label}</span>
                    <span className={`${conf.text} font-bold font-mono`}>
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.04] rounded-full h-2 overflow-hidden border border-white/[0.06]">
                    <div
                      className={`${conf.barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(item.percentage, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Acceptance Table */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Branch Acceptance & Reliability
            </h3>
          </div>
          <MarketplaceReportTable
            columns={BRANCH_COLUMNS}
            rows={rateData?.branch_breakdown || []}
            isLoading={isLoading}
            emptyMessage="No branch telemetry logged"
          />
        </div>
      </div>
    </MarketplaceReportLayout>
  );
};

export default PipelineFunnelTab;