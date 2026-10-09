// pharmacy-web/src/pages/marketplace-reports/components/tabs/CatalogHealthTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/CatalogHealthTab.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Layers, Eye, AlertTriangle, AlertCircle } from "lucide-react";
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

const COLUMNS = [
  { key: "branch_name", label: "Branch Storefront" },
  { key: "total_linked", label: "Catalog Linked", align: "center" },
  { key: "total_visible", label: "Visible Online", align: "center" },
  {
    key: "total_listed",
    label: "Live & Buyable",
    align: "center",
    render: (v) => <span className="font-semibold text-emerald-400">{v}</span>,
  },
  {
    key: "total_out_of_stock",
    label: "Out of Stock",
    align: "center",
    render: (v) => (
      <span className={v > 0 ? "text-amber-400 font-bold" : "text-white/40"}>{v}</span>
    ),
  },
  { key: "total_prescription_required", label: "Rx Required", align: "center" },
  {
    key: "total_zero_orders",
    label: "Zero Orders (Period)",
    align: "center",
    render: (v) => (
      <span className={v > 0 ? "text-rose-400 font-semibold" : "text-white/40"}>{v}</span>
    ),
  },
  {
    key: "visibility_rate",
    label: "Catalog Visibility %",
    align: "right",
    render: (v) => <span className="font-bold text-indigo-300 font-mono">{v}%</span>,
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_linked", label: "Catalog Linked" },
  { key: "total_visible", label: "Visible Online" },
  { key: "total_listed", label: "Live & Buyable" },
  { key: "total_out_of_stock", label: "Out of Stock" },
  { key: "total_prescription_required", label: "Rx Required" },
  { key: "total_zero_orders", label: "Zero Orders In Period" },
  { key: "visibility_rate", label: "Visibility Rate %" },
];

const CatalogHealthTab = () => {
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
      const res = await reportsAPI.getListingHealth(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load listing health");
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

  const totals = data?.totals;

  return (
    <MarketplaceReportLayout
      title="Storefront Catalog Health"
      subtitle="Audit linked medicine catalogs, unblock out-of-stock listings, and identify dormant catalog items"
      icon={Activity}
      exportData={data?.branch_health || []}
      exportFilename="marketplace_catalog_health"
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
            label="Linked Medicines"
            value={totals?.total_linked ?? "—"}
            subValue="SKUs linked to master catalog"
            color="indigo"
            icon={Layers}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Live Buyable Listings"
            value={totals?.total_listed ?? "—"}
            subValue="In stock & visible to users"
            color="emerald"
            icon={Eye}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Out of Stock Items"
            value={totals?.total_out_of_stock ?? "—"}
            subValue="Needs immediate restocking"
            color="amber"
            icon={AlertTriangle}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Zero Order Dormant"
            value={totals?.total_zero_orders ?? "—"}
            subValue="No sales in selected period"
            color="rose"
            icon={AlertCircle}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
            Branch Catalog Distribution & Visibility
          </h3>
        </div>
        <MarketplaceReportTable
          columns={COLUMNS}
          rows={data?.branch_health || []}
          isLoading={isLoading}
          emptyMessage="No catalog health data found"
        />
      </div>
    </MarketplaceReportLayout>
  );
};

export default CatalogHealthTab;