// pharmacy-web/src/pages/report/marketplace/AcceptanceRatePage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/marketplace/AcceptanceRatePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
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
  { key: "total_orders", label: "Orders Routed", align: "center" },
  { key: "accepted_count", label: "Accepted", align: "center" },
  { key: "rejected_count", label: "Rejected", align: "center" },
  { key: "cancelled_count", label: "Cancelled", align: "center" },
  {
    key: "acceptance_rate",
    label: "Acceptance Rate %",
    align: "right",
    render: (v) => {
      const isHigh = v >= 85;
      const isMedium = v >= 60 && v < 85;
      return (
        <span className={`font-bold ${isHigh ? "text-emerald-700" : isMedium ? "text-amber-600" : "text-red-600"}`}>
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

const AcceptanceRatePage = () => {
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
      const res = await reportsAPI.getAcceptanceRate(filters);
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

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="Branch Acceptance Rate"
      subtitle="Monitor order acceptance reliability and branch response efficiency"
      icon={CheckCircle2}
      iconColor="text-emerald-600"
      iconBg="bg-emerald-100"
      isLoading={isLoading}
      exportData={data?.branch_breakdown || []}
      exportFilename="acceptance_rate_report"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />

        {sm && (
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Overall Acceptance Rate" value={`${sm.acceptance_rate}%`} color="green" />
            <StatCard label="Accepted Orders" value={sm.accepted_count} color="blue" />
            <StatCard label="Rejected Orders" value={`${sm.rejected_count} (${sm.rejection_rate}%)`} color="red" />
            <StatCard label="Cancelled Orders" value={`${sm.cancelled_count} (${sm.cancellation_rate}%)`} color="amber" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.branch_breakdown || []}
          emptyMessage="No order acceptance telemetry recorded"
        />
      </div>
    </ReportPageWrapper>
  );
};

export default AcceptanceRatePage;