// pharmacy-web/src/pages/marketplace-reports/components/tabs/FulfillmentSpeedTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/FulfillmentSpeedTab.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle2, Box, Gauge, Award } from "lucide-react";
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

const BRANCH_COLUMNS = [
  { key: "branch_name", label: "Branch Storefront" },
  { key: "total_measured", label: "Orders Measured", align: "center" },
  {
    key: "avg_acceptance_minutes",
    label: "Avg Acceptance",
    align: "right",
    render: (v) => <span className="font-mono text-indigo-300 font-semibold">{v} mins</span>,
  },
  {
    key: "avg_prep_minutes",
    label: "Avg Prep Time",
    align: "right",
    render: (v) => <span className="font-mono text-cyan-300 font-semibold">{v} mins</span>,
  },
  {
    key: "avg_tat_minutes",
    label: "Total Turnaround (TAT)",
    align: "right",
    render: (v) => {
      const isFast = v <= 15;
      const isOk = v <= 25;
      return (
        <span className={`font-mono font-bold ${isFast ? "text-emerald-400" : isOk ? "text-amber-400" : "text-rose-400"}`}>
          {v} mins
        </span>
      );
    },
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_measured", label: "Orders Measured" },
  { key: "avg_acceptance_minutes", label: "Avg Acceptance (Mins)" },
  { key: "avg_prep_minutes", label: "Avg Prep (Mins)" },
  { key: "avg_tat_minutes", label: "Avg TAT (Mins)" },
];

const FulfillmentSpeedTab = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
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
      const res = await reportsAPI.getFulfillmentSpeed(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load SLA speed analytics");
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

  const sm = data?.summary;
  const maxHourlyTat = Math.max(...(data?.hourly_distribution?.map((h) => h.avg_tat_minutes) || [1]), 10);

  return (
    <MarketplaceReportLayout
      title="Fulfillment Speed & SLAs"
      subtitle="Analyze order acceptance speed, packing readiness, and overall pharmacy turnaround time (TAT)"
      icon={Gauge}
      exportData={data?.branch_breakdown || []}
      exportFilename="marketplace_fulfillment_slas"
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
            label="Avg Acceptance Time"
            value={sm ? `${sm.avg_acceptance_minutes}m` : "—"}
            subValue={sm ? `${sm.sla_acceptance_compliance_pct}% under 5 mins` : "—"}
            color="indigo"
            icon={Clock}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Avg Prep / Packing"
            value={sm ? `${sm.avg_prep_minutes}m` : "—"}
            subValue={sm ? `${sm.sla_prep_compliance_pct}% under 15 mins` : "—"}
            color="cyan"
            icon={Box}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Avg Pharmacy TAT"
            value={sm ? `${sm.avg_pharmacy_tat_minutes}m` : "—"}
            subValue="From order placement to ready"
            color="emerald"
            icon={CheckCircle2}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="TAT SLA Compliance"
            value={sm ? `${sm.sla_tat_compliance_pct}%` : "—"}
            subValue={`${sm?.total_orders_measured || 0} orders evaluated`}
            color="purple"
            icon={Award}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Hourly Speed Distribution */}
        {data?.hourly_distribution?.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
                Hourly Turnaround Time (TAT) Trend
              </h3>
              <span className="text-[10px] text-white/40">Average minutes to pack by hour of placement</span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 h-24 items-end border-b border-white/[0.08] pb-1">
              {data.hourly_distribution.map((h) => {
                const heightPct = Math.max(8, Math.min(100, (h.avg_tat_minutes / maxHourlyTat) * 100));
                return (
                  <div key={h.hour} className="flex flex-col items-center gap-1 group h-full justify-end">
                    <div className="w-full relative rounded-t bg-white/[0.02] border border-white/[0.04] h-full flex items-end justify-center">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t bg-gradient-to-t from-indigo-500/30 to-indigo-400/80 group-hover:to-cyan-400 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 pt-2">
              {data.hourly_distribution.map((h) => (
                <div key={h.hour} className="text-center">
                  <span className="text-[9px] font-semibold text-white/50">{h.hour}:00</span>
                  <p className="text-[8px] text-indigo-300 font-mono font-bold mt-0.5">{h.avg_tat_minutes}m</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branch Speed Table */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Branch Speed & Milestone Performance
            </h3>
          </div>
          <MarketplaceReportTable
            columns={BRANCH_COLUMNS}
            rows={data?.branch_breakdown || []}
            isLoading={isLoading}
            emptyMessage="No fulfillment speed data recorded"
          />
        </div>
      </div>
    </MarketplaceReportLayout>
  );
};

export default FulfillmentSpeedTab;