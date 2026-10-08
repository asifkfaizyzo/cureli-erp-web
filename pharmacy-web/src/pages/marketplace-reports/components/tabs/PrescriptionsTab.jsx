// pharmacy-web/src/pages/marketplace-reports/components/tabs/PrescriptionsTab.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/tabs/PrescriptionsTab.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Send, CheckSquare, ShoppingCart, Percent } from "lucide-react";
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
  { key: "total_requests", label: "Rx Routed", align: "center" },
  { key: "quotes_sent", label: "Quotes Sent", align: "center" },
  { key: "accepted", label: "Accepted", align: "center" },
  {
    key: "converted",
    label: "Billed to Order",
    align: "center",
    render: (v) => <span className="font-bold text-emerald-400">{v}</span>,
  },
  { key: "declined", label: "Declined", align: "center" },
  { key: "expired", label: "Expired", align: "center" },
  {
    key: "conversion_rate",
    label: "Quote Conversion %",
    align: "right",
    render: (v) => (
      <span className="font-bold text-indigo-300 font-mono">
        {v}%
      </span>
    ),
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_requests", label: "Requests Routed" },
  { key: "quotes_sent", label: "Quotes Sent" },
  { key: "accepted", label: "Quotes Accepted" },
  { key: "converted", label: "Converted Orders" },
  { key: "declined", label: "Declined" },
  { key: "expired", label: "Expired" },
  { key: "conversion_rate", label: "Conversion %" },
];

const PrescriptionsTab = () => {
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
      const res = await reportsAPI.getPrescriptionSummary(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load prescription requests summary");
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
      title="Prescription Quotation Funnel"
      subtitle="Track quotes quoted, customer confirmations, and conversion to active deliveries"
      icon={FileText}
      exportData={data?.branch_breakdown || []}
      exportFilename="marketplace_prescription_requests"
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
            label="Rx Uploads Routed"
            value={sm?.total_requests ?? "—"}
            subValue="Requests sent to your branches"
            color="indigo"
            icon={FileText}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Quotes Dispatched"
            value={sm?.quotes_sent ?? "—"}
            subValue={sm ? `${sm.response_rate}% response rate` : "—"}
            color="blue"
            icon={Send}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Billed into Orders"
            value={sm?.converted ?? "—"}
            subValue="Customer completed payment"
            color="emerald"
            icon={ShoppingCart}
            isLoading={isLoading}
          />
          <MarketplaceStatCard
            label="Quote Conversion Rate"
            value={sm ? `${sm.conversion_rate}%` : "—"}
            subValue="From total received inquiries"
            color="purple"
            icon={Percent}
            isLoading={isLoading}
          />
        </div>
      }
    >
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
            Branch Quotation Performance
          </h3>
        </div>
        <MarketplaceReportTable
          columns={COLUMNS}
          rows={data?.branch_breakdown || []}
          isLoading={isLoading}
          emptyMessage="No prescription requests recorded in period"
        />
      </div>
    </MarketplaceReportLayout>
  );
};

export default PrescriptionsTab;