// pharmacy-web/src/pages/report/marketplace/PrescriptionRequestSummaryPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/marketplace/PrescriptionRequestSummaryPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
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
  { key: "branch_name", label: "Branch" },
  { key: "total_requests", label: "Requests Routed", align: "center" },
  { key: "quotes_sent", label: "Quotes Sent", align: "center" },
  { key: "accepted", label: "Accepted", align: "center" },
  { key: "converted", label: "Converted Orders", align: "center" },
  { key: "declined", label: "Declined", align: "center" },
  { key: "expired", label: "Expired", align: "center" },
  {
    key: "conversion_rate",
    label: "Quote Conversion %",
    align: "right",
    render: (v) => <span className="font-bold text-indigo-700">{v}%</span>,
  },
];

const EXPORT_COLUMNS = [
  { key: "branch_name", label: "Branch" },
  { key: "total_requests", label: "Requests Received" },
  { key: "quotes_sent", label: "Quotes Sent" },
  { key: "accepted", label: "Quotes Accepted" },
  { key: "converted", label: "Converted to Order" },
  { key: "declined", label: "Declined" },
  { key: "expired", label: "Expired" },
  { key: "conversion_rate", label: "Conversion %" },
];

const PrescriptionRequestSummaryPage = () => {
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
      const res = await reportsAPI.getPrescriptionSummary(filters);
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
      title="Prescription Requests Funnel"
      subtitle="Track quotes quoted, accepted, and converted into confirmed marketplace deliveries"
      icon={FileText}
      iconColor="text-blue-600"
      iconBg="bg-blue-100"
      isLoading={isLoading}
      exportData={data?.branch_breakdown || []}
      exportFilename="prescription_requests_summary"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="Total Requests Received" value={sm.total_requests} color="indigo" />
            <StatCard label="Quotes Sent Back" value={sm.quotes_sent} color="blue" />
            <StatCard label="Converted to Order" value={sm.converted} color="green" />
            <StatCard label="Quote Conversion Rate" value={`${sm.conversion_rate}%`} color="purple" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.branch_breakdown || []}
          emptyMessage="No prescription requests recorded under selection"
        />
      </div>
    </ReportPageWrapper>
  );
};

export default PrescriptionRequestSummaryPage;