// pharmacy-web/src/pages/marketplace-reports/components/tabs/RevenueLeakageTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/RevenueLeakageTab.jsx

import React, { useState, useEffect, useCallback } from "react";
import { AlertOctagon, XCircle, Ban, TrendingDown, UserX } from "lucide-react";
import reportsAPI from "../../../../api/reports";
import inventoryAPI from "../../../../api/inventory";
import { useToast } from "../../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../../store/useAuthStore";
import MarketplaceReportLayout from "../shared/MarketplaceReportLayout";
import MarketplaceFiltersBar from "../shared/MarketplaceFiltersBar";
import MarketplaceStatCard from "../shared/MarketplaceStatCard";
import MarketplaceReportTable from "../shared/MarketplaceReportTable";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  { key: "total_lost_orders", label: "Lost Orders", align: "center" },
  {
    key: "rejected_revenue",
    label: "Rejections (₹)",
    align: "right",
    render: (v, r) => (
      <span className="text-rose-400 font-mono">
        {fmt(v)} <span className="text-[10px] text-white/40">({r.rejected_count})</span>
      </span>
    ),
  },
  {
    key: "cancelled_revenue",
    label: "Cancellations (₹)",
    align: "right",
    render: (v, r) => (
      <span className="text-amber-400 font-mono">
        {fmt(v)} <span className="text-[10px] text-white/40">({r.cancelled_count})</span>
      </span>
    ),
  },
  {
    key: "total_lost_revenue",
    label: "Total Lost Medicine Value",
    align: "right",
    render: (v) => <span className="font-bold text-rose-400 font-mono">{fmt(v)}</span>,
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_lost_orders", label: "Lost Orders" },
  { key: "rejected_count", label: "Rejection Count" },
  { key: "rejected_revenue", label: "Rejected Value (₹)" },
  { key: "cancelled_count", label: "Cancelled Count" },
  { key: "cancelled_revenue", label: "Cancelled Value (₹)" },
  { key: "total_lost_revenue", label: "Total Lost Value (₹)" },
];

const RevenueLeakageTab = () => {
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
      const res = await reportsAPI.getRevenueLeakage(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load revenue leakage data");
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

  return (
    <MarketplaceReportLayout
      title="Revenue Leakage & Lost Sales"
      subtitle="Audit revenue lost through rejection reasons, customer cancellations, and system timeouts"
      icon={AlertOctagon}
      exportData={data?.branch_breakdown || []}
      exportFilename="marketplace_revenue_leakage"
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
            label="Total Lost Sales"
            value={sm ? fmt(sm.total_lost_revenue) : "—"}
            subValue={`${sm?.total_lost_orders || 0} drop-offs`}
            color="rose"
            icon={TrendingDown}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Rejected by Pharmacy"
            value={sm ? fmt(sm.rejected_revenue) : "—"}
            subValue={`${sm?.rejected_count || 0} orders declined`}
            color="red"
            icon={XCircle}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Cancelled Orders"
            value={sm ? fmt(sm.cancelled_revenue) : "—"}
            subValue={`${sm?.cancelled_count || 0} orders cancelled`}
            color="amber"
            icon={Ban}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Avg Lost Ticket"
            value={
              sm && sm.total_lost_orders > 0
                ? fmt(sm.total_lost_revenue / sm.total_lost_orders)
                : "₹0.00"
            }
            subValue="Per missed transaction"
            color="purple"
            icon={UserX}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Reasons & Cancellation Sources */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Rejection Reasons */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Top Rejection Reasons
            </h4>
            <div className="space-y-2">
              {data?.by_rejection_reason?.length > 0 ? (
                data.by_rejection_reason.map((r) => (
                  <div key={r.reason} className="flex justify-between items-center text-xs">
                    <span className="text-white/60 truncate max-w-[170px] capitalize">
                      {r.reason.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <div className="text-right font-mono">
                      <span className="text-rose-400 font-bold">{fmt(r.revenue)}</span>
                      <span className="text-[10px] text-white/30 ml-1.5">({r.count})</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30 py-2">No rejections recorded</p>
              )}
            </div>
          </div>

          {/* Cancellation Sources */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Cancellation By Origin
            </h4>
            <div className="space-y-2">
              {data?.by_cancellation_source?.length > 0 ? (
                data.by_cancellation_source.map((c) => (
                  <div key={c.source} className="flex justify-between items-center text-xs">
                    <span className="text-white/60 truncate max-w-[170px] capitalize">
                      {c.source.toLowerCase()}
                    </span>
                    <div className="text-right font-mono">
                      <span className="text-amber-400 font-bold">{fmt(c.revenue)}</span>
                      <span className="text-[10px] text-white/30 ml-1.5">({c.count})</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30 py-2">No cancellations recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Branch Leakage Breakdown Table */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Branch Revenue Loss Distribution
            </h3>
          </div>
          <MarketplaceReportTable
            columns={BRANCH_COLUMNS}
            rows={data?.branch_breakdown || []}
            isLoading={isLoading}
            emptyMessage="No revenue leakage recorded"
          />
        </div>
      </div>
    </MarketplaceReportLayout>
  );
};

export default RevenueLeakageTab;