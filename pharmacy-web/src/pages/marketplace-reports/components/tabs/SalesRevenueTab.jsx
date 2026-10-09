// pharmacy-web/src/pages/marketplace-reports/components/tabs/SalesRevenueTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/SalesRevenueTab.jsx

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingBag, DollarSign, ArrowUpRight, Percent, Store, Layers } from "lucide-react";
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
    status: "",
    paymentMethod: "",
    branchId: "",
  };
};

const BRANCH_COLUMNS = [
  { key: "branch_name", label: "Branch Storefront" },
  { key: "order_count", label: "Orders", align: "center" },
  {
    key: "gross_revenue",
    label: "Gross Sales (₹)",
    align: "right",
    render: (v) => <span className="font-semibold text-white/90">{fmt(v)}</span>,
  },
  {
    key: "commission_amount",
    label: "Commission (₹)",
    align: "right",
    render: (v) => <span className="text-rose-400 font-mono">-{fmt(v)}</span>,
  },
  {
    key: "net_earnings",
    label: "Your Net (₹)",
    align: "right",
    render: (v) => <span className="font-bold text-emerald-400 font-mono">{fmt(v)}</span>,
  },
];

const STATUS_COLUMNS = [
  {
    key: "status",
    label: "Order Status",
    render: (v) => (
      <span className="font-medium text-white/90 capitalize">{v?.replace(/_/g, " ").toLowerCase()}</span>
    ),
  },
  { key: "order_count", label: "Orders Count", align: "center" },
  {
    key: "revenue",
    label: "Gross Medicine Value",
    align: "right",
    render: (v) => fmt(v),
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "order_count", label: "Orders" },
  { key: "gross_revenue", label: "Gross Revenue (₹)" },
  { key: "commission_amount", label: "Commission (₹)" },
  { key: "net_earnings", label: "Net Earnings (₹)" },
];

const SalesRevenueTab = () => {
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
      const res = await reportsAPI.getMarketplaceSalesSummary(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load sales report");
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
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "PLACED", label: "Placed" },
        { value: "ACCEPTED", label: "Accepted" },
        { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
        { value: "COMPLETED", label: "Completed" },
        { value: "REJECTED", label: "Rejected" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
    {
      key: "paymentMethod",
      label: "Payment",
      type: "select",
      options: [
        { value: "COD", label: "Cash on Delivery" },
        { value: "ONLINE", label: "Prepaid Online" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const sm = data?.summary;
  const comp = data?.comparison;

  return (
    <MarketplaceReportLayout
      title="Sales & Revenue Analytics"
      subtitle="Examine your medicine order volumes, platform commission offsets, and true net earnings"
      icon={ShoppingBag}
      exportData={data?.branch_breakdown || []}
      exportFilename="marketplace_sales_revenue"
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
            label="Gross Sales"
            value={sm ? fmt(sm.total_gross_revenue) : "—"}
            subValue={`${sm?.total_orders || 0} total orders mapped`}
            color="indigo"
            icon={DollarSign}
            isLoading={isLoading}
            trend={comp?.growth_percent !== null && comp?.growth_percent !== undefined ? `${comp.growth_percent}%` : null}
            trendDirection={parseFloat(comp?.growth_percent || 0) >= 0 ? "up" : "down"}
          />
          <MarketplaceStatCard
            label="Net Pharmacy Earnings"
            value={sm ? fmt(sm.net_earnings) : "—"}
            subValue="After platform commission"
            color="emerald"
            icon={ArrowUpRight}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Avg Order Value (AOV)"
            value={sm ? fmt(sm.average_order_value) : "—"}
            subValue="Per customer ticket"
            color="cyan"
            icon={Store}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Effective Commission"
            value={sm ? `${sm.effective_commission_rate}%` : "—"}
            subValue={sm ? `Paid: -${fmt(sm.total_commission)}` : "—"}
            color="purple"
            icon={Percent}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1">
        {/* Branch-wise contribution */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Branch Revenue Share
            </h3>
          </div>
          <MarketplaceReportTable
            columns={BRANCH_COLUMNS}
            rows={data?.branch_breakdown || []}
            isLoading={isLoading}
            emptyMessage="No branch orders on record"
          />
        </div>

        {/* Pipeline status volume */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
              Orders by Status
            </h3>
          </div>
          <MarketplaceReportTable
            columns={STATUS_COLUMNS}
            rows={data?.status_breakdown || []}
            isLoading={isLoading}
            emptyMessage="No status transitions recorded"
          />
        </div>
      </div>
    </MarketplaceReportLayout>
  );
};

export default SalesRevenueTab;