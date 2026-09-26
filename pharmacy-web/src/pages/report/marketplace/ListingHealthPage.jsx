// pharmacy-web/src/pages/report/marketplace/ListingHealthPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/marketplace/ListingHealthPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Activity } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import StatCard from "../shared/StatCard";

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
  { key: "branch_name", label: "Branch Name" },
  { key: "total_linked", label: "Catalog Linked", align: "center" },
  { key: "total_visible", label: "Visible Online", align: "center" },
  { key: "total_listed", label: "Live & Buyable", align: "center" },
  {
    key: "total_out_of_stock",
    label: "Out of Stock",
    align: "center",
    render: (v) => <span className={v > 0 ? "text-amber-600 font-bold" : "text-gray-600"}>{v}</span>,
  },
  { key: "total_prescription_required", label: "Rx Required", align: "center" },
  {
    key: "total_zero_orders",
    label: "Zero Order Inactive",
    align: "center",
    render: (v) => <span className={v > 0 ? "text-red-600 font-bold" : "text-gray-600"}>{v}</span>,
  },
  {
    key: "visibility_rate",
    label: "Catalog Visibility %",
    align: "right",
    render: (v) => <span className="font-semibold text-indigo-700">{v}%</span>,
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_linked", label: "Total Linked" },
  { key: "total_visible", label: "Total Visible" },
  { key: "total_listed", label: "Live & Buyable" },
  { key: "total_out_of_stock", label: "Out of Stock" },
  { key: "total_prescription_required", label: "Prescription Required" },
  { key: "total_zero_orders", label: "Zero Orders in Period" },
  { key: "visibility_rate", label: "Visibility Rate %" },
];

const ListingHealthPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await inventoryAPI.getFacets();
        if (res?.success && res.data) {
          setBranches(res.data.branches.map((b) => ({ value: b.branch_id, label: b.branch_name })));
        }
      } catch (err) {
        console.error("Facets error:", err);
      }
    };
    fetchMetadata();
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsAPI.getListingHealth(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, branchContext]); // eslint-disable-line

  useEffect(() => {
    load();
  }, [branchContext, load]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => setFilters(defaultFilters());

  const filterConfig = [
    { key: "startDate", label: "From Date", type: "date" },
    { key: "endDate", label: "To Date", type: "date" },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const totals = data?.totals;

  return (
    <ReportPageWrapper
      title="Storefront Listing Health"
      subtitle="Audit catalog presence and optimize active live items across branch storefronts"
      icon={Activity}
      iconColor="text-emerald-600"
      iconBg="bg-emerald-100"
      isLoading={isLoading}
      exportData={data?.branch_health || []}
      exportFilename="marketplace_listing_health"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />

        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="Total Linked Medicines" value={totals.total_linked} color="indigo" />
            <StatCard label="Live Buyable Listings" value={totals.total_listed} color="green" />
            <StatCard label="Out of Stock Items" value={totals.total_out_of_stock} color="amber" />
            <StatCard label="Zero Orders in Period" value={totals.total_zero_orders} color="red" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.branch_health || []}
          emptyMessage="No listing telemetry available"
        />
      </div>
    </ReportPageWrapper>
  );
};

export default ListingHealthPage;